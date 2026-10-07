import {AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute} from "@angular/router";
import {Location} from "@angular/common";
import {debounceTime, finalize, forkJoin, fromEvent, map, Subscription} from "rxjs";
import {mxCell} from "mxgraph";
import mx from "../../../mxgraph";
import {app, makeDatePeriod} from "../../../environments/environment";
import {EnvRouter} from "../../service/router.service";
import {TreeService} from "../../service/tree.service";
import {InstanceService} from "../../service/jquery/instance.service";
import {PageTitleService} from '../../service/page-title.service';
import {ArchitectureTree} from "./model/architecture.model";
import {Constants} from "../constants";

export class Architecture {
    name: string;
    type: string;
    remoteServers?: RemoteServer[];
}

export class RemoteServer {
    name: string;
    type: string;
    schema?: string;
}

interface TypeConfig { label: string; legend: string; icon: string; color: string; edgeColor: string; }

/** Source unique de vérité : icônes, couleurs (cartes / edges / légende) par type. */
export const ARCHITECTURE_TYPES: Record<string, TypeConfig> = {
    REST: { label: 'Microservices',    legend: 'Serveur applicatif (REST)', icon: 'assets/mxgraph/microservice.drawio.svg', color: '#3b82f6', edgeColor: '#2563eb' },
    VIEW: { label: 'Vues',             legend: 'Vue (VIEW)',                icon: 'assets/mxgraph/view.drawio.svg',         color: '#06b6d4', edgeColor: '#06b6d4' },
    JDBC: { label: 'Bases de données', legend: 'Base de données (JDBC)',    icon: 'assets/mxgraph/database.drawio.svg',     color: '#f97316', edgeColor: '#FF7F00' },
    FTP:  { label: 'Serveurs FTP',     legend: 'Serveur FTP',               icon: 'assets/mxgraph/ftp.drawio.svg',          color: '#0e7490', edgeColor: '#0d9488' },
    SMTP: { label: 'Serveurs SMTP',    legend: 'Serveur SMTP',              icon: 'assets/mxgraph/smtp.drawio.svg',         color: '#f59e0b', edgeColor: '#f97316' },
    LDAP: { label: 'Annuaires LDAP',   legend: 'Annuaire LDAP',             icon: 'assets/mxgraph/ldap.drawio.svg',         color: '#7c3aed', edgeColor: '#8b5cf6' },
};
export const ARCHITECTURE_TYPE_ORDER = ['REST', 'VIEW', 'JDBC', 'FTP', 'SMTP', 'LDAP'];

const NODE_W = 80;
const NODE_H = 30;
const NODE_STYLE = 'verticalLabelPosition=bottom;verticalAlign=top;fontSize=10;labelWidth=200;overflow=visible;whiteSpace=nowrap;';
const FOCUSED_NODE_STYLE = NODE_STYLE + 'strokeColor=#f97316;strokeWidth=3;fillColor=#fff7ed;';
//const EDGE_STYLE ='sourcePerimeterSpacing=12;'
const EDGE_STYLE = 'rounded=1;curved=1;orthogonalLoop=1;jettySize=auto;fontSize=9;fontColor=#555;strokeWidth=1.5;endArrow=block;endFill=1;endSize=6;startArrow=none;sourcePerimeterSpacing=12;';
//const EDGE_STYLE = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;parallelEdgeSpacing=14;fontSize=9;fontColor=#555;strokeWidth=1.25;endArrow=block;endFill=1;endSize=6;startArrow=none;exitPerimeter=1;entryPerimeter=1;sourcePerimeterSpacing=10;targetPerimeterSpacing=10;';
//const EDGE_STYLE = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;parallelEdgeSpacing=14;fontSize=9;fontColor=#555;strokeWidth=1.25;endArrow=block;endFill=1;endSize=6;startArrow=none;sourcePerimeterSpacing=10;targetPerimeterSpacing=10;';
const DEFAULT_EDGE_COLOR = '#78716c';

interface SelectedVertex { name: string; type: string; incomingNames: string[]; outgoingNames: string[]; }
interface HoveredVertex { name: string; type: string; incomingCount: number; outgoingCount: number; x: number; y: number; }
interface StatsCard { type: string; label: string; count: number; icon: string; color: string; }

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit, AfterViewInit, OnDestroy {
    private readonly _treeService = inject(TreeService);
    private readonly _instanceService = inject(InstanceService);
    private readonly _router = inject(EnvRouter);
    private readonly _pageTitleService = inject(PageTitleService);
    private readonly _activatedRoute = inject(ActivatedRoute);
    private readonly _location = inject(Location);
    private readonly _zone = inject(NgZone);

    @ViewChild('graphContainer') graphContainer: ElementRef<HTMLElement>;
    @ViewChild('outlineContainer') outlineContainer: ElementRef<HTMLElement>;
    @ViewChild('searchInput') searchInputRef: ElementRef<HTMLInputElement>;

    readonly types = ARCHITECTURE_TYPES;
    readonly typeOrder = ARCHITECTURE_TYPE_ORDER;

    tree: ArchitectureTree;
    syntheseIsLoading = false;

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });
    focusControl = new FormControl<string | null>(null);
    /** Types sélectionnés : vide = tout afficher, sinon uniquement les nœuds de ces types (et les liens entre eux). */
    typeFilters = new Set<string>();

    params: { namespace?: string, start?: Date, end?: Date } = {};
    appNames: string[] = [];
    statsCards: StatsCard[] = [];

    minimapVisible: boolean = JSON.parse(localStorage.getItem('arch_minimap') ?? 'true');
    isFullscreen = false;

    searchVisible = false;
    searchQuery = '';
    searchResults: mxCell[] = [];
    currentSearchIndex = 0;

    selectedVertex: SelectedVertex | null = null;
    hoveredVertex: HoveredVertex | null = null;

    private _architectures: Architecture[] = [];
    private _nodeTypes = new Map<string, string>();   // label du vertex -> type affiché
    private readonly _subscriptions = new Subscription();
    private _loadSubscription?: Subscription;
    private _hoverFrame?: number;
    private _pendingHover?: { vertex: mxCell; event: MouseEvent };

    ngOnInit() {
        this._pageTitleService.set({
            icon: Constants.MAPPING_TYPE['architecture'].icon,
            title: Constants.MAPPING_TYPE['architecture'].title
        });

        this._subscriptions.add(this._activatedRoute.queryParams.subscribe(qp => {
            const start = qp.start ? new Date(qp.start) : makeDatePeriod(6).start;
            const end = qp.end ? new Date(qp.end) : makeDatePeriod(6, 1).end;
            this.params = { namespace: qp.namespace || app.defaultNamespace, start, end };
            // la date de fin affichée est inclusive, celle des params est exclusive
            this.patchDateValue(start, new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1));
            this.load();
            this._location.replaceState(this._router.url.split('?')[0],
                `namespace=${encodeURIComponent(this.params.namespace)}&start=${start.toISOString()}&end=${end.toISOString()}`);
        }));

        this._subscriptions.add(this.focusControl.valueChanges.subscribe(() => this.redraw()));
    }

    ngAfterViewInit() {
        // mxGraph enregistre de nombreux listeners DOM (mousemove...) : on les sort de la zone
        // Angular pour éviter une détection de changement à chaque événement.
        this._zone.runOutsideAngular(() => {
            this.tree = ArchitectureTree.setup(this.graphContainer.nativeElement);
            this.tree.setOutline(this.outlineContainer.nativeElement);
            this.tree.setupListeners({
                onVertexClick: v => this._zone.run(() => this.onVertexClick(v)),
                onBackgroundClick: () => this._zone.run(() => this.onBackgroundClick()),
                onVertexHover: (v, e) => {
                    this._pendingHover = { vertex: v, event: e };
                    if (this._hoverFrame !== undefined) return;
                    this._hoverFrame = requestAnimationFrame(() => {
                        this._hoverFrame = undefined;
                        const hover = this._pendingHover;
                        this._pendingHover = undefined;
                        if (hover) this._zone.run(() => this.onVertexHover(hover.vertex, hover.event));
                    });
                },
                onVertexHoverOut: () => {
                    this._pendingHover = undefined;
                    if (this._hoverFrame !== undefined) cancelAnimationFrame(this._hoverFrame);
                    this._hoverFrame = undefined;
                    this._zone.run(() => this.hoveredVertex = null);
                }
            });

            this._subscriptions.add(fromEvent(window, 'resize').pipe(debounceTime(100))
                .subscribe(() => this.tree.resizeAndCenter()));

            this._subscriptions.add(fromEvent(document, 'fullscreenchange').subscribe(() => {
                this._zone.run(() => this.isFullscreen = !!document.fullscreenElement);
                setTimeout(() => this.tree.resizeAndCenter(), 200);
            }));
        });

        // données éventuellement reçues avant l'initialisation de la vue
        if (this._architectures.length) {
            this.redraw();
        }
    }

    ngOnDestroy(): void {
        this._subscriptions.unsubscribe();
        this._loadSubscription?.unsubscribe();
        if (this._hoverFrame !== undefined) cancelAnimationFrame(this._hoverFrame);
        this.tree?.destroy();
        this._pageTitleService.clear();
    }

    patchDateValue(start: Date, end: Date) {
        this.serverFilterForm.patchValue({ dateRangePicker: { start, end } }, { emitEvent: false });
    }

    search() {
        if (!this.serverFilterForm.valid) return;
        const { start, end } = this.serverFilterForm.getRawValue().dateRangePicker;
        const excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
        if (start.getTime() !== this.params.start.getTime() || excludedEnd.getTime() !== this.params.end.getTime()) {
            this._router.navigate([], {
                relativeTo: this._activatedRoute,
                queryParamsHandling: 'merge',
                queryParams: { start: start.toISOString(), end: excludedEnd.toISOString() }
            });
        } else {
            this.load();
        }
    }

    private load() {
        // annule la requête précédente : évite qu'une réponse lente écrase une plus récente
        this._loadSubscription?.unsubscribe();
        this.syntheseIsLoading = true;
        const { start, end, namespace } = this.params;
        this._loadSubscription = forkJoin({
            mainSession: this._instanceService.getMainSessionApplication(start, end, namespace),
            restSession: this._treeService.getArchitecture(start, end, namespace)
        }).pipe(
            map(({ mainSession, restSession }) => [
                ...restSession,
                ...mainSession.map(m => ({ name: m.appName, type: m.type } as Architecture))
            ]),
            finalize(() => this.syntheseIsLoading = false)
        ).subscribe(architectures => {
            this._architectures = architectures;
            this.appNames = [...new Set(architectures.map(a => a.name))].sort((a, b) => a.localeCompare(b));
            this.statsCards = this.computeStats(architectures);
            this.selectedVertex = null;
            this.focusControl.setValue(null, { emitEvent: false });
            this.redraw();
        });
    }

    /** Redessine entièrement le graphe en conservant focus / recherche / sélection. */
    private redraw() {
        if (!this.tree) return;
        const focused = this.focusControl.value;
        this.tree.draw(() => this.draw(this._architectures, focused));
        this.tree.highlightFocusedNode(focused);

        this.hoveredVertex = null;
        if (this.selectedVertex) {
            const v = this.tree.findVertex(this.selectedVertex.name);
            this.selectedVertex = v ? this.describeVertex(v) : null;
        }
        // les cellules précédentes n'existent plus : on relance la recherche sur le nouveau graphe
        if (this.searchQuery.trim()) this.onSearch();
        else this.searchResults = [];
    }

    private computeStats(architectures: Architecture[]): StatsCard[] {
        // union apps + ressources par type (un microservice appelé ET déclaré ne compte qu'une fois)
        const byType = new Map<string, Set<string>>();
        const add = (type: string, name: string) => {
            if (!ARCHITECTURE_TYPES[type]) return;
            if (!byType.has(type)) byType.set(type, new Set());
            byType.get(type).add(name);
        };
        architectures.forEach(a => {
            add(a.type, a.name);
            a.remoteServers?.forEach(r => add(r.type, r.schema ?? r.name));
        });
        return ARCHITECTURE_TYPE_ORDER
            .filter(t => byType.has(t))
            .map(t => ({ type: t, label: this.types[t].label, count: byType.get(t).size, icon: this.types[t].icon, color: this.types[t].color }));
    }

    // ── Interactions graphe ──────────────────────────────────────────────────
    private describeVertex(vertex: mxCell): SelectedVertex {
        const graph = this.tree._graph;
        const name = this.tree.getLabel(vertex);
        return {
            name,
            type: this._nodeTypes.get(name) ?? 'UNKNOWN',
            incomingNames: graph.getIncomingEdges(vertex, null).map(e => this.tree.getLabel(e.getTerminal(true))).sort(),
            outgoingNames: graph.getOutgoingEdges(vertex, null).map(e => this.tree.getLabel(e.getTerminal(false))).sort()
        };
    }

    private onVertexClick(vertex: mxCell) {
        this.selectedVertex = this.describeVertex(vertex);
        // n'animer que si aucun microservice n'est focalisé
        if (!this.focusControl.value) this.tree.animateEdgesOf(vertex);
    }

    private onBackgroundClick() {
        this.selectedVertex = null;
        if (!this.focusControl.value) this.tree.clearAnimatedEdges();
    }


    private onVertexHover(vertex: mxCell, event: MouseEvent) {
        const name = this.tree.getLabel(vertex);
        this.hoveredVertex = {
            name,
            type: this._nodeTypes.get(name) ?? 'UNKNOWN',
            incomingCount: this.tree._graph.getIncomingEdges(vertex, null).length,
            outgoingCount: this.tree._graph.getOutgoingEdges(vertex, null).length,
            x: event.clientX,
            y: event.clientY
        };
    }


    // ── Construction du graphe ───────────────────────────────────────────────
    private draw(architectures: Architecture[], focusedApp: string | null) {
        const graph = this.tree._graph;
        const parent = this.tree._parent;

        const byName = new Map<string, Architecture>();
        architectures.forEach(a => { if (!byName.has(a.name)) byName.set(a.name, a); });

        // ── 1. Collecte de tous les nœuds / edges candidats ─────────────────
        const allNodes = new Map<string, string>();                  // nom -> type
        const allEdges = new Map<string, { src: string; tgt: string; type: string }>();
        architectures.forEach(a => {
            if (!ARCHITECTURE_TYPES[a.type]) return;
            a.remoteServers?.forEach(r => {
                const type = this.effectiveType(a, r, byName);
                const key = r.schema ?? r.name;
                if (key === a.name) return;
                const targetType = (type === 'REST' || type === 'VIEW') ? (byName.get(r.name)?.type ?? type) : type;
                if (!ARCHITECTURE_TYPES[targetType]) return;
                if (!allNodes.has(a.name)) allNodes.set(a.name, a.type);
                if (!allNodes.has(key)) allNodes.set(key, targetType);
                allEdges.set(`${a.name}\u0000${key}`, { src: a.name, tgt: key, type }); // dédoublonnage orienté
            });
        });
        const focusedType = focusedApp && byName.get(focusedApp)?.type;
        if (focusedType && ARCHITECTURE_TYPES[focusedType] && !allNodes.has(focusedApp)) {
            allNodes.set(focusedApp, focusedType);
        }

        // Les pastilles comptent les sommets globaux dédupliqués, indépendamment des filtres actifs.
        const globalCounts = new Map<string, number>();
        allNodes.forEach(type => globalCounts.set(type, (globalCounts.get(type) ?? 0) + 1));
        this.statsCards = this.statsCards.map(card => ({ ...card, count: globalCounts.get(card.type) ?? 0 }));

        // ── 2. Filtre par type : uniquement les nœuds des types sélectionnés,
        //       et uniquement les liens entre deux nœuds visibles ────────────
        const filtering = this.typeFilters.size > 0;
        const typeVisible = (name: string) => !filtering || this.typeFilters.has(allNodes.get(name));
        let edges = [...allEdges.values()].filter(e => typeVisible(e.src) && typeVisible(e.tgt));
        let nodes = new Map<string, string>();
        if (filtering) {
            allNodes.forEach((type, name) => { if (this.typeFilters.has(type)) nodes.set(name, type); });
        } else {
            nodes = allNodes;
        }

        // ── 3. Focus : nœud focalisé + voisins directs (1 niveau) ───────────
        if (focusedApp) {
            const included = new Set<string>([focusedApp]);
            edges.forEach(e => {
                if (e.src === focusedApp) included.add(e.tgt);   // appelé
                if (e.tgt === focusedApp) included.add(e.src);   // appelant
            });
            edges = edges.filter(e => included.has(e.src) && included.has(e.tgt));
            const focusedNodes = new Map<string, string>();
            included.forEach(name => {
                const type = nodes.get(name) ?? (name === focusedApp ? allNodes.get(name) : undefined);
                if (type) focusedNodes.set(name, type);   // le nœud focalisé reste toujours visible
            });
            nodes = focusedNodes;
        }
        this._nodeTypes = nodes;

        // ── Insertion (coordonnées laissées au layout) ──────────────────────
        const vertices = new Map<string, mxCell>();
        nodes.forEach((type, name) => {
            const style = `shape=image;image=${ARCHITECTURE_TYPES[type].icon};` + (name === focusedApp ? FOCUSED_NODE_STYLE : NODE_STYLE);
            vertices.set(name, graph.insertVertex(parent, null, name, 0, 0, NODE_W, NODE_H, style));
        });
        edges.forEach(({ src, tgt, type }) => {
            const color = ARCHITECTURE_TYPES[type]?.edgeColor ?? DEFAULT_EDGE_COLOR;
            graph.insertEdge(parent, null, '', vertices.get(src), vertices.get(tgt), `${EDGE_STYLE}strokeColor=${color};`);
        });

        // ── Layout hiérarchique ─────────────────────────────────────────────
        const layout = new mx.mxHierarchicalLayout(graph, mx.mxConstants.DIRECTION_NORTH);
        Object.assign(layout, { intraCellSpacing: 40, interRankCellSpacing: 100, interHierarchySpacing: 40, disableEdgeStyle: false });
        layout.execute(parent);
    }

    private effectiveType(a: Architecture, r: RemoteServer, byName: Map<string, Architecture>): string {
        if (r.type !== 'MAIN') return r.type;
        if (a.type === 'VIEW' || byName.get(r.name)?.type === 'VIEW') return 'VIEW';
        return 'REST';
    }

    // ── Toolbar ──────────────────────────────────────────────────────────────
    toggleMinimap() {
        this.minimapVisible = !this.minimapVisible;
        localStorage.setItem('arch_minimap', JSON.stringify(this.minimapVisible));
    }

    toggleFullscreen() {
        // l'état isFullscreen est mis à jour par l'écouteur 'fullscreenchange' (gère aussi la touche Échap)
        const host = this.graphContainer.nativeElement.parentElement;
        const request = document.fullscreenElement ? document.exitFullscreen() : host?.requestFullscreen();
        request?.catch(() => { /* refusé par le navigateur */ });
    }

    toggleTypeFilter(type: string) {
        if (this.typeFilters.has(type)) this.typeFilters.delete(type);
        else this.typeFilters.add(type);
        this.redraw();
    }

    clearTypeFilters() {
        if (!this.typeFilters.size) return;
        this.typeFilters.clear();
        this.redraw();
    }

    getIconForType(type: string): string {
        return this.types[type]?.icon ?? '';
    }

    async exportPNG() {
        const svgEl = this.graphContainer.nativeElement.querySelector('svg');
        if (!svgEl) return;
        const { width, height } = svgEl.getBoundingClientRect();
        const svgClone = svgEl.cloneNode(true) as SVGElement;
        svgClone.setAttribute('width', String(width));
        svgClone.setAttribute('height', String(height));

        // les images doivent être inlinées sinon elles ne sont pas rendues dans le canvas
        await Promise.all(Array.from(svgClone.querySelectorAll('image')).map(async img => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
            if (!href || href.startsWith('data:')) return;
            try {
                img.setAttribute('href', await this.toDataUrl(href));
                img.removeAttribute('xlink:href');
            } catch { /* image ignorée */ }
        }));

        const scale = window.devicePixelRatio || 1;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, width, height);

        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svgClone)], { type: 'image/svg+xml;charset=utf-8' }));
        try {
            ctx.drawImage(await this.loadImage(url), 0, 0);
        } catch {
            return;
        } finally {
            URL.revokeObjectURL(url);
        }
        await this.drawBadge(ctx, width, height);

        const a = document.createElement('a');
        a.download = 'architecture.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
    }

    /** Badge "INSPECT @ONETEME/JARVIS" + logo GitHub en bas à droite. */
    private async drawBadge(ctx: CanvasRenderingContext2D, width: number, height: number) {
        const title = 'INSPECT', subtitle = '@ONETEME/JARVIS';
        const fontSize = 12, fontSizeSmall = 10, padding = 12, iconSize = 20, gap = 8, radius = 10;
        const titleFont = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
        const subtitleFont = `500 ${fontSizeSmall}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;

        ctx.font = titleFont;
        const titleW = ctx.measureText(title).width;
        ctx.font = subtitleFont;
        const textW = Math.max(titleW, ctx.measureText(subtitle).width);

        const w = iconSize + gap + textW + padding * 2;
        const h = fontSize + fontSizeSmall + gap + padding * 2;
        const x = width - w - 12;
        const y = height - h - 12;
        const path = () => {
            ctx.beginPath();
            // roundRect n'existe pas sur tous les navigateurs (et retourne undefined : pas de `??`)
            if (typeof (ctx as any).roundRect === 'function') (ctx as any).roundRect(x, y, w, h, radius);
            else ctx.rect(x, y, w, h);
        };

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 4;
        const bg = ctx.createLinearGradient(x, y, x, y + h);
        bg.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
        bg.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
        ctx.fillStyle = bg;
        path();
        ctx.fill();

        ctx.shadowColor = 'transparent';
        const border = ctx.createLinearGradient(x, y, x, y + h);
        border.addColorStop(0, 'rgba(148, 163, 184, 0.5)');
        border.addColorStop(1, 'rgba(100, 116, 139, 0.3)');
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        path();
        ctx.stroke();

        try {
            ctx.drawImage(await this.loadImage('assets/github.svg'), x + padding, y + (h - iconSize) / 2, iconSize, iconSize);
        } catch { /* logo indisponible */ }

        const textX = x + padding + iconSize + gap;
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#ffffff';
        ctx.font = titleFont;
        ctx.fillText(title, textX, y + padding - 1);
        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.font = subtitleFont;
        ctx.fillText(subtitle, textX, y + padding + fontSize + 2);
        ctx.restore();
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    private async toDataUrl(href: string): Promise<string> {
        const blob = await (await fetch(href)).blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ── Recherche ────────────────────────────────────────────────────────────
    toggleSearch() {
        this.searchVisible = !this.searchVisible;
        if (this.searchVisible) {
            setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 320);
        } else {
            this.clearSearch();
        }
    }

    onSearch() {
        const q = this.searchQuery.trim().toLowerCase();
        if (!this.tree || !q) {
            this.resetSearchResults();
            return;
        }
        this.searchResults = this.tree.getVertices().filter(v => String(this.tree.getLabel(v) ?? '').toLowerCase().includes(q));
        this.currentSearchIndex = 0;
        this.applySearchHighlight();
        this.focusSearchResult();
    }

    navigateSearch(direction: 1 | -1) {
        if (!this.searchResults.length) return;
        this.currentSearchIndex = (this.currentSearchIndex + direction + this.searchResults.length) % this.searchResults.length;
        this.applySearchHighlight();
        this.focusSearchResult();
    }

    clearSearch() {
        this.searchQuery = '';
        this.resetSearchResults();
    }

    private resetSearchResults() {
        this.searchResults = [];
        this.currentSearchIndex = 0;
        this.applySearchHighlight();
    }

    private focusSearchResult() {
        const cell = this.searchResults[this.currentSearchIndex];
        if (cell) this.tree._graph.scrollCellToVisible(cell, true);
    }

    /** Met en évidence les résultats (courant en vert vif), estompe le reste. Sans résultat : restaure. */
    private applySearchHighlight() {
        if (!this.tree) return;
        const active = this.searchResults.length > 0;
        const current = this.searchResults[this.currentSearchIndex];
        const matches = new Set(this.searchResults);

        this.tree.getVertices().forEach(v => {
            const node: HTMLElement | undefined = this.tree._graph.view.getState(v)?.shape?.node;
            if (!node) return;
            if (!active)             { node.style.filter = '';                                             node.style.opacity = ''; }
            else if (v === current)  { node.style.filter = 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))'; node.style.opacity = '1'; }
            else if (matches.has(v)) { node.style.filter = 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))';  node.style.opacity = '0.9'; }
            else                     { node.style.filter = 'grayscale(100%)';                              node.style.opacity = '0.2'; }
        });

        this.tree.getEdges().forEach(e => {
            const node: Element | undefined = this.tree._graph.view.getState(e)?.shape?.node;
            node?.querySelectorAll('path').forEach((p: SVGPathElement) => p.style.opacity = active ? '0.1' : '');
        });
    }
}
