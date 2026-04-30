import {AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ChartProvider, field, XaxisType, YaxisType} from "@oneteme/jquery-core";
import {RestSessionService} from "../../service/jquery/rest-session.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {EnvRouter} from "../../service/router.service";
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, finalize, forkJoin, fromEvent, map, Subscription} from "rxjs";
import {app, makeDatePeriod} from "../../../environments/environment";
import {Location} from "@angular/common";
import {TreeService} from "../../service/tree.service";
import {mxGraph, mxHierarchicalLayout, mxUtils, mxConstants} from "mxgraph";
import {ArchitectureTree} from "./model/architecture.model";
import mx from "../../../mxgraph";
import {InstanceService} from "../../service/jquery/instance.service";
import {MainSessionService} from "../../service/jquery/main-session.service";
import {NumberFormatterPipe} from "src/app/shared/pipe/number.pipe";
import {SizePipe} from "../../shared/pipe/size.pipe";

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit, AfterViewInit, OnDestroy {
    private _restSessionService = inject(RestSessionService);
    private _mainSessionService = inject(MainSessionService);
    private _treeService = inject(TreeService);
    private _instanceService = inject(InstanceService);
    private _router = inject(EnvRouter);
    private _activatedRoute = inject(ActivatedRoute);
    private _location = inject(Location);
    private _numberFormatter = inject(NumberFormatterPipe);
    private _sizeFormatter = inject(SizePipe);
    private _zone = inject(NgZone);

    rangesColorConfig = [ '#E9E9E9', '#AFB3EF', '#757DF4', '#3A47FA', '#0011FF' ]
    tree: ArchitectureTree;
    resizeSubscription: any;
    treeMapConfig: ChartProvider<XaxisType, YaxisType> = {
        series: [
            {
                data: { x: field('origin'), y: field('count')},
                name: field('name'),
                color: field('color')

            }
        ],
        options: {
            chart: {
                height: '100%',
                toolbar: {
                    show: false
                },
                events: {// fix bug in treemap jquerychart
                    mouseMove: function (e, c, config) { },
                    mouseLeave: function (e, c, config) { }
                }
            },
            tooltip: {

            },
            legend: {
                show:true,
                position: 'top',
                horizontalAlign: 'right',
                markers: {
                    strokeWidth: 1,
                    offsetX: 0,
                    offsetY: 4
                },
            },
            colors:[

            ],
            plotOptions: {
                treemap: {
                    enableShades: false,
                }
              }
        }
    };
    heatMapConfig: ChartProvider<XaxisType, YaxisType> = {
        series: [
            {
                data: { x: field('target'), y: field('count') },
                name: field('origin')
            }
        ],
        options: {
            chart: {
                height: '100%',
                toolbar: {
                    show: false
                },
                events: {// fix bug in treemap jquerychart
                    mouseMove: function (e, c, config) { },
                    mouseLeave: function (e, c, config) { }
                }
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 5
            },
            xaxis: {
                title: {
                    text: 'Serveur appelé',
                },
                labels: {
                    rotate: -35,
                    hideOverlappingLabels: false
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                title: {
                    text: 'Serveur appelant'
                },
                labels: {
                    show: true,
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                markers: {
                    strokeWidth: 1,
                    offsetX: 0,
                    offsetY: 4
                }
            },
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    return (
                        `
                            <div class="arrow_box"> 
                                <div style="align-self:flex-end; font-weight:bold;font-size:18px"> ${series[seriesIndex][dataPointIndex]}</div>
                                <div> Appelant : ${w.config.series[seriesIndex].name} </div>
                                <div> Appelé   : ${w.globals.labels[dataPointIndex]} </div>
                            </div>
                        `

                    );
                },

                x: {
                    show: false
                }
            },
            plotOptions: {
                heatmap: {
                    enableShades: false,
                    radius: 0,
                    colorScale: {

                    }
                }
            }
        }
    };
    trafficIsloading:boolean;
    syntheseIsLoading: boolean;
    heatMapData: { count: number, origin: string, target: string }[] = [];

    treeMapData: { count: number, origin: string, name: string, color: string }[] = [];

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    heatMapControl: FormControl = new FormControl<boolean>(false);
    treeMapControl: FormControl = new FormControl<boolean>(false);
    focusControl:   FormControl = new FormControl<string | null>(null);
    depthControl:   FormControl = new FormControl<number>(1);
    edgeTypeFilters: { [key: string]: boolean } = { 'REST': true, 'JDBC': true, 'FTP': true, 'SMTP': true, 'LDAP': true, 'MAIN': true };

    subscriptions: Subscription[] = [];
    params: Partial<{ env: string, start: Date, end: Date }> = {};
    private _architectures: Architecture[] = [];   // données brutes conservées pour le filtre
    appNames: string[] = [];                       // liste des microservices disponibles

    @ViewChild('graphContainer') graphContainer: ElementRef;
    @ViewChild('outlineContainer') outlineContainer: ElementRef;
    @ViewChild('searchInput') searchInputRef: ElementRef;

    minimapVisible: boolean = JSON.parse(localStorage.getItem('arch_minimap') ?? 'true');
    isFullscreen: boolean = false;
    searchQuery: string = '';
    searchResults: any[] = [];
    currentSearchIndex: number = 0;
    searchVisible: boolean = false;

    selectedVertex: { name: string; type: string; incomingCount: number; outgoingCount: number; incomingNames: string[]; outgoingNames: string[] } | null = null;
    hoveredVertex: { name: string; type: string; incomingCount: number; outgoingCount: number; x: number; y: number } | null = null;
    searchHighlightedNodes: any[] = [];  // Nodes trouvés lors de la recherche

    statsCards: { type: string; label: string; count: number; icon: string; color: string }[] = [];

    ngOnInit() {
        this.subscriptions.push(combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || app.defaultEnv;
                this.params.start = v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(6).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(6, 1).end;
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`);
            }
        }));

        this.subscriptions.push(this.treeMapControl.valueChanges.subscribe({
            next: res => {
                let _field = res ? 'sum': 'count';
                let d  = this.heatMapData.reduce((acc:any,cur:any) => {
                    let i = acc.findIndex(a => a.origin === cur.origin)
                    if(i == -1){
                        acc.push({origin: cur.origin, count: 0})
                    }else {
                        acc[i].count += cur[_field];
                    }
                    return acc;
                },[]).sort((a,b)=>(a.count-b.count))

                const treeRanges = this.createRanges(d, 'count', res);
                this.treeMapData = d.map(t => {
                    let r = treeRanges.find(r=> t.count >= r.from && t.count <= r.to)
                    if(r){
                        t.name = r.name
                        t.color = r.color
                    }
                    return t
                });
            }
        }));

        this.subscriptions.push(this.heatMapControl.valueChanges.subscribe({
            next: res => {
                let _field = res ? 'sum': 'count';
                const ranges = this.createRanges(this.heatMapData, _field, res);
                let newConfig = this.heatMapConfig;
                newConfig.options.plotOptions.heatmap.colorScale.ranges = ranges;
                newConfig.series = [
                    {
                        data: { x: field('target'), y: field(_field) },
                        name: field('origin')
                    }
                ];
                this.heatMapConfig = { ...newConfig };
            }
        }));

        this.subscriptions.push(this.focusControl.valueChanges.subscribe(name => {
            if (!this.tree || !this._architectures.length) return;
            this.tree.clearAnimatedEdges(); // Nettoyer les animations quand le filtre change
            this.depthControl.setValue(1, { emitEvent: false }); // reset profondeur
            this.tree.clearCells();
            this.tree.draw(() => this.draw(this.tree, this._architectures, name, 1));
            if (name) {
                setTimeout(() => this.tree.highlightFocusedNode(name), 100);
            } else {
                this.tree.clearHighlight();
            }
        }));

        this.subscriptions.push(this.depthControl.valueChanges.subscribe(depth => {
            const name = this.focusControl.value;
            if (!this.tree || !this._architectures.length || !name) return;
            this.tree.clearAnimatedEdges();
            this.tree.clearCells();
            this.tree.draw(() => this.draw(this.tree, this._architectures, name, depth));
            setTimeout(() => this.tree.highlightFocusedNode(name), 100);
        }));
    }

    ngAfterViewInit() {
        this.tree = ArchitectureTree.setup(this.graphContainer.nativeElement);
        this.tree.setOutline(this.outlineContainer.nativeElement);

        // Configure l'écouteur de click sur les vertices pour animer les edges des appelants
        this.tree.setupVertexClickListener(
            (vertex: any) => {
                // Single-click : afficher la card
                const vertexName = this.tree._graph.model.getValue(vertex);
                const architecture = this._architectures.find(a => a.name === vertexName);
                const incomingEdges = this.tree._graph.getIncomingEdges(vertex);
                const outgoingEdges = this.tree._graph.getOutgoingEdges(vertex);
                
                // Récupérer les noms des nodes appelants
                const incomingNames = incomingEdges.map((edge: any) => {
                    const source = edge.getTerminal(true);
                    return this.tree._graph.model.getValue(source);
                }).sort();
                
                // Récupérer les noms des nodes appelés
                const outgoingNames = outgoingEdges.map((edge: any) => {
                    const target = edge.getTerminal(false);
                    return this.tree._graph.model.getValue(target);
                }).sort();
                
                this.selectedVertex = {
                    name: vertexName,
                    type: architecture?.type ?? 'UNKNOWN',
                    incomingCount: incomingEdges.length,
                    outgoingCount: outgoingEdges.length,
                    incomingNames: incomingNames,
                    outgoingNames: outgoingNames
                };
                
                // N'animer que si aucun microservice n'est sélectionné dans le filtre
                if (this.focusControl.value === null) {
                    this.tree.animateIncomingEdges(vertex);
                }
            },
            () => {
                // Clic sur le fond : nettoyer les animations et la card
                this.selectedVertex = null;
                if (this.focusControl.value === null) {
                    this.tree.clearAnimatedEdges();
                }
            },
            (vertex: any) => {
                // Double-click : focus automatique SEULEMENT pour REST et MAIN
                const vertexName = this.tree._graph.model.getValue(vertex);
                const architecture = this._architectures.find(a => a.name === vertexName);
                
                // Vérifier que c'est un type focalisable (REST ou MAIN)
                if (architecture && (architecture.type === 'REST' || architecture.type === 'MAIN')) {
                    this.focusControl.setValue(vertexName);
                    this.depthControl.setValue(1, { emitEvent: false });
                }
                // Sinon, le double-click n'a aucun effet sur les ressources
            }
        );

        // Écouteurs de hover pour le tooltip
        (this.tree as any).onVertexHover = (vertex: any, event: MouseEvent) => {
            const vertexName = this.tree._graph.model.getValue(vertex);
            const architecture = this._architectures.find(a => a.name === vertexName);
            const incomingEdges = this.tree._graph.getIncomingEdges(vertex);
            const outgoingEdges = this.tree._graph.getOutgoingEdges(vertex);
            
            this._zone.run(() => {
                this.hoveredVertex = {
                    name: vertexName,
                    type: architecture?.type ?? 'UNKNOWN',
                    incomingCount: incomingEdges.length,
                    outgoingCount: outgoingEdges.length,
                    x: event.clientX,
                    y: event.clientY
                };
            });
        };

        (this.tree as any).onVertexHoverOut = () => {
            this._zone.run(() => {
                this.hoveredVertex = null;
            });
        };

        this._zone.runOutsideAngular(() => {
            this.resizeSubscription = fromEvent(window, 'resize').subscribe(() => {
                this._zone.run(() => {
                    if (this.tree) {
                        this.tree.resizeAndCenter()
                    }
                })

            });

            fromEvent(document, 'fullscreenchange').subscribe(() => {
                this._zone.run(() => {
                    this.isFullscreen = !!document.fullscreenElement;
                    setTimeout(() => this.tree?.resizeAndCenter(), 200);
                });
            });
        });

    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        if (this.resizeSubscription) {
            this.resizeSubscription.unsubscribe();
        }
    }

    patchDateValue(start: Date, end: Date) {
        this.serverFilterForm.patchValue({
            dateRangePicker: {
                start: start,
                end: end
            }
        }, { emitEvent: false });
    }

    search() {
        if (this.serverFilterForm.valid) {
            let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
            let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
            let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
            if (start.toISOString() != this.params.start.toISOString() || excludedEnd.toISOString() != this.params.end.toISOString()) {
                this._router.navigate([], {
                    relativeTo: this._activatedRoute,
                    queryParamsHandling: 'merge',
                    queryParams: { start: start.toISOString(), end: excludedEnd.toISOString() }
                });
            } else {
                this.init();
            }
        }
    }

    init() {
        this.trafficIsloading = true;
        this.syntheseIsLoading = true;
        this.heatMapData = [];
        this.treeMapData = [];
        this.subscriptions.push(forkJoin(
            {
                rest: this._restSessionService.getArchitectureForHeatMap({ start: this.params.start, end: this.params.end, env: this.params.env }),
                main: this._mainSessionService.getMainSessionArchitectureForHeatMap({ start: this.params.start, end: this.params.end, env: this.params.env }),
            }
        ).pipe(finalize(()=>  this.trafficIsloading = false)).subscribe({
            next: (result: {rest: any[], main: any[]})  => {
                let res = [...result.rest, ...result.main];
                this.buildHeatMapCharts(res);
                this.treeMapControl.updateValueAndValidity();
                this.heatMapControl.updateValueAndValidity();
            }
        }));

        this.subscriptions.push(forkJoin({
            mainSession: this._instanceService.getMainSessionApplication(this.params.start, this.params.end, this.params.env),
            restSession: this._treeService.getArchitecture(this.params.start, this.params.end, this.params.env)
        }).pipe(map(res => {
            res.restSession.push(...res.mainSession.map(m => ({name: m.appName, schema: null, type: m.type, remoteServers: null})));
            return res.restSession;
        }), finalize(() => this.syntheseIsLoading = false)).subscribe({
            next: res => {
                this._architectures = res;
                this.appNames = [...new Set(res.map((a: Architecture) => a.name))].sort();
                this.focusControl.setValue(null, { emitEvent: false }); // reset filtre
                this.tree.clearCells();
                this.tree.draw(() => this.draw(this.tree, res));
                this.computeStats(res);
            }
        }));
    }

    computeStats(architectures: Architecture[]) {
        const appCounts: { [type: string]: Set<string> } = {};
        const resCounts: { [type: string]: Set<string> } = {};

        architectures.forEach(a => {
            if (!appCounts[a.type]) appCounts[a.type] = new Set();
            appCounts[a.type].add(a.name);
            (a.remoteServers ?? []).forEach(r => {
                if (!resCounts[r.type]) resCounts[r.type] = new Set();
                resCounts[r.type].add(r.schema ?? r.name);
            });
        });

        const typeConfig: { [t: string]: { label: string; icon: string; color: string } } = {
            REST:  { label: 'Microservices',  icon: 'assets/mxgraph/microservice.drawio.svg', color: '#3b82f6' },
            BATCH: { label: 'Batchs',         icon: 'assets/mxgraph/batch.drawio.svg',        color: '#8b5cf6' },
            VIEW:  { label: 'Vues',           icon: 'assets/mxgraph/view.drawio.svg',         color: '#06b6d4' },
            JDBC:  { label: 'Bases de données', icon: 'assets/mxgraph/database.drawio.svg',   color: '#f97316' },
            FTP:   { label: 'Serveurs FTP',   icon: 'assets/mxgraph/ftp.drawio.svg',          color: '#0e7490' },
            SMTP:  { label: 'Serveurs SMTP',  icon: 'assets/mxgraph/smtp.drawio.svg',         color: '#f59e0b' },
            LDAP:  { label: 'Annuaires LDAP', icon: 'assets/mxgraph/ldap.drawio.svg',         color: '#7c3aed' },
        };

        const cards: typeof this.statsCards = [];
        [...Object.entries(appCounts), ...Object.entries(resCounts)].forEach(([type, set]) => {
            const existing = cards.find(c => c.type === type);
            if (existing) { existing.count = set.size; return; }
            const tc = typeConfig[type];
            if (tc) cards.push({ type, label: tc.label, count: set.size, icon: tc.icon, color: tc.color });
        });

        // Ordre d'affichage
        const order = ['REST', 'BATCH', 'VIEW', 'JDBC', 'FTP', 'SMTP', 'LDAP'];
        this.statsCards = cards.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    }

    buildHeatMapCharts(res: {count: number, sum: number, origin: string, target: string}[]) {
        let orders  = res.reduce((acc, cur) => {
            if(!acc[cur.target]) {
                acc[cur.target] = 0;
            }
            acc[cur.target] += 1;
            return acc;
        }, {});
        let distinct = Object.entries(orders).map((e1: [string, number]) => ({name: e1[0], count: e1[1]})).sort((a1, a2) => a2.count - a1.count);
        let map: any = {};
        res.forEach(r => {
            if (!map[r.origin]) {
                map[r.origin] = {};
                distinct.forEach(v => map[r.origin][v.name] = {count: 0, sum: 0});
            }
            map[r.origin][r.target] = {count: r.count, sum: r.sum};
        });
        let arr: { count: number, sum: number, origin: string, target: string, targetSum: number }[] = [];
        Object.entries(map).forEach(e1 => {
            let sum = Object.values(e1[1]).filter(v => v.count > 0).length;
            Object.entries(e1[1]).forEach(e2 => {
                arr.push({ origin: e1[0], target: e2[0], count: e2[1].count, sum: e2[1].sum < 0 ? 0 : e2[1].sum, targetSum: sum})
            });
        });
        this.heatMapData = arr.sort((a1, a2) => a2.targetSum - a1.targetSum);
    }

    createRanges(arr: any[], field: string, isSize: boolean) {
        const ranges: any[] = [{ from: 0, to: 0, name: `0`, color: this.rangesColorConfig[0] }];
        if(arr.length){
            let max = arr.reduce((acc: any, cur: any) => {
                return cur[field] > acc ? cur[field] : acc
            }, arr[0][field]);
            const range = max / 4;
            const parts = range != 0 ? 4 : 1;

            for (let i = 0; i < parts; i++) {
                const start = i * range != 0 ? Math.floor(i * range+1) : 1;
                const end = Math.floor((i + 1) * range);
                let name = isSize ?`${this._sizeFormatter.transform(start)} - ${this._sizeFormatter.transform(end)}`: `${this._numberFormatter.transform(start)} - ${this._numberFormatter.transform(end)}`;
                ranges.push({ from: start, to: end, name: name, color: this.rangesColorConfig[i + 1] })
            }
        }
        return ranges;
    }


    /**
     * Calcul BFS des nœuds à inclure à partir de focusedApp sur `depth` niveaux
     * dans les deux directions (appelants + appelés).
     */
    private getIncludedNodes(architectures: Architecture[], focusedApp: string, depth: number): Set<string> {
        const included = new Set<string>([focusedApp]);
        let frontier = new Set<string>([focusedApp]);

        for (let d = 0; d < depth; d++) {
            const next = new Set<string>();
            frontier.forEach(node => {
                // Appelants : apps qui ont `node` dans leurs remoteServers
                architectures.forEach(a => {
                    if (!included.has(a.name) && a.remoteServers?.some(r => (r.schema ?? r.name) === node)) {
                        included.add(a.name);
                        next.add(a.name);
                    }
                });
                // Appelés : remoteServers de `node`
                architectures.find(a => a.name === node)?.remoteServers?.forEach(r => {
                    const key = r.schema ?? r.name;
                    if (!included.has(key)) {
                        included.add(key);
                        next.add(key);
                    }
                });
            });
            frontier = next;
            if (!frontier.size) break;
        }
        return included;
    }

    draw(tree: ArchitectureTree, architectures: Architecture[], focusedApp?: string | null, depth: number = 1) {
        const cfg = ServerConfig;
        const W = cfg['REST'].width, H = cfg['REST'].height;
        const nodeStyle = 'verticalLabelPosition=bottom;verticalAlign=top;fontSize=10;';
        const edgeStyle = 'rounded=1;curved=1;orthogonalLoop=1;jettySize=auto;fontSize=9;fontColor=#555;strokeWidth=1.5;endArrow=block;endFill=1;endSize=6;startArrow=none;sourcePerimeterSpacing=12;';

        // ── Filtrage BFS selon profondeur ─────────────────────────────────────
        let includedNodes: Set<string> | null = null;
        if (focusedApp) {
            includedNodes = depth >= 99
                ? null  // ∞ = tout afficher
                : this.getIncludedNodes(architectures, focusedApp, depth);
        }

        const filtered = focusedApp && includedNodes
            ? architectures.filter(a => includedNodes!.has(a.name))
            : architectures;

        // ── Déduplication : une seule map pour éviter tout doublon ──────────────
        const allNodes: { [k: string]: { type: string; vertex: any } } = {};

        // Calculer AVANT quels nœuds seront utilisés selon le filtre
        const enabledTypes = this.edgeTypeFilters;
        const usedApps = new Set<string>();
        const usedResources = new Set<string>();
        
        // Parcourir les edges et tracker les apps et ressources utilisées
        filtered.forEach(a => {
            (a.remoteServers ?? []).forEach(r => {
                // Vérifier si ce type est actif dans le filtre
                if (enabledTypes[r.type]) {
                    usedApps.add(a.name); // L'app a au moins une edge active
                    const key = r.schema ?? r.name;
                    usedResources.add(key); // La ressource a une edge active
                }
            });
        });

        // 1. Créer SEULEMENT les nœuds applicatifs qui ont des edges actives
        filtered.forEach(a => {
            if (usedApps.has(a.name) && !allNodes[a.name] && cfg[a.type]) {
                allNodes[a.name] = { type: a.type, vertex: null };
            }
        });

        // 2. Créer SEULEMENT les ressources utilisées
        filtered.forEach(a => {
            (a.remoteServers ?? []).forEach(r => {
                const key = r.schema ?? r.name;
                if (!focusedApp || !includedNodes || includedNodes.has(key)) {
                    if (usedResources.has(key) && !allNodes[key] && cfg[r.type]) {
                        allNodes[key] = { type: r.type, vertex: null };
                    }
                }
            });
        });

        // ── Insertion des nœuds (sans coords — laissées au layout) ───────────
        const focusedStyle = 'verticalLabelPosition=bottom;verticalAlign=top;fontSize=10;strokeColor=#f97316;strokeWidth=3;fillColor=#fff7ed;';
        const cycleStyle = 'verticalLabelPosition=bottom;verticalAlign=top;fontSize=10;strokeColor=#ef4444;strokeWidth=3;fillColor=#fee2e2;'; // Rouge pour les cycles
        Object.entries(allNodes).forEach(([k, info]) => {
            const icon = cfg[info.type]?.icon ?? cfg['REST'].icon;
            const style = (focusedApp && k === focusedApp) ? icon + focusedStyle : icon + nodeStyle;
            info.vertex = tree._graph.insertVertex(tree._parent, null, k, 0, 0, W, H, style);
        });

        // ── Edges : tous les liens entre nœuds inclus ─────────────────────────
        filtered.forEach(a => {
            const src = allNodes[a.name]?.vertex;
            if (!src || !a.remoteServers) return;
            a.remoteServers.forEach(r => {
                // Filtrer par type d'edge
                if (!enabledTypes[r.type]) return;
                
                const key = r.schema ?? r.name;
                if (!allNodes[key]) return; // cible non incluse
                const tgt = allNodes[key]?.vertex;
                if (!tgt || src === tgt) return;
                if (tree._graph.getEdgesBetween(src, tgt).length === 0) {
                    const edgeColor = r.type === 'JDBC' ? 'strokeColor=#FF7F00;'
                                    : r.type === 'FTP'  ? 'strokeColor=#0d9488;'
                                    : r.type === 'SMTP' ? 'strokeColor=#f97316;'
                                    : r.type === 'LDAP' ? 'strokeColor=#8b5cf6;'
                                    : r.type === 'REST' ? 'strokeColor=#2563eb;'
                                    : r.type === 'MAIN' ? 'strokeColor=#16a34a;'
                                    : 'strokeColor=#78716c;';
                    tree._graph.insertEdge(tree._parent, null, '', src, tgt, edgeStyle + edgeColor);
                }
            });
        });

        // ── Layout hiérarchique automatique (minimise les croisements) ────────
        const layout = new mx.mxHierarchicalLayout(tree._graph);
        (layout as any).orientation           = mx.mxConstants.DIRECTION_NORTH;
        (layout as any).intraCellSpacing      = 40;
        (layout as any).interRankCellSpacing  = 100;
        (layout as any).interHierarchySpacing = 40;
        (layout as any).disableEdgeStyle      = false;
        layout.execute(tree._parent);
    }

    // ── Toolbar controls ─────────────────────────────────────────────────────
    toggleMinimap() {
        this.minimapVisible = !this.minimapVisible;
        localStorage.setItem('arch_minimap', JSON.stringify(this.minimapVisible));
    }


    toggleFullscreen() {
        const el = document.getElementById('fixed-width-container');
        if (!this.isFullscreen) {
            el?.requestFullscreen().then(() => {
                this.isFullscreen = true;
                setTimeout(() => this.tree?.resizeAndCenter(), 200);
            });
        } else {
            document.exitFullscreen().then(() => {
                this.isFullscreen = false;
                setTimeout(() => this.tree?.resizeAndCenter(), 200);
            });
        }
    }

    async exportPNG() {
        const container = this.graphContainer.nativeElement as HTMLElement;
        const svgEl = container.querySelector('svg');
        if (!svgEl) return;
        const svgClone = svgEl.cloneNode(true) as SVGElement;
        const bbox = svgEl.getBoundingClientRect();
        svgClone.setAttribute('width', String(bbox.width));
        svgClone.setAttribute('height', String(bbox.height));
        const imageEls = Array.from(svgClone.querySelectorAll('image'));
        await Promise.all(imageEls.map(async (img) => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
            if (!href || href.startsWith('data:')) return;
            try {
                const response = await fetch(href);
                const blob = await response.blob();
                const b64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                img.setAttribute('href', b64);
                img.removeAttribute('xlink:href');
            } catch { }
        }));
        const svgStr = new XMLSerializer().serializeToString(svgClone);
        const canvas = document.createElement('canvas');
        const scale = window.devicePixelRatio || 1;
        canvas.width = bbox.width * scale;
        canvas.height = bbox.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, bbox.width, bbox.height);
        const img = new Image();
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const a = document.createElement('a');
            a.download = `architecture.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
    }

    toggleSearch() {
        this.searchVisible = !this.searchVisible;
        if (this.searchVisible) {
            setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 320);
        } else {
            this.clearSearch();
        }
    }

    onSearch() {
        if (!this.tree || !this.searchQuery.trim()) { this.clearSearch(); return; }
        const q = this.searchQuery.toLowerCase();
        const vertices = this.tree._graph.getChildVertices(this.tree._parent);
        this.searchResults = vertices.filter((v: any) => {
            const label = this.tree._graph.getLabel(v);
            return label && String(label).toLowerCase().includes(q);
        });
        this.currentSearchIndex = 0;
        this.searchHighlightedNodes = this.searchResults;
        this.applySearchHighlight();
        this.focusSearchResult();
    }

    navigateSearch(direction: 1 | -1) {
        if (!this.searchResults.length) return;
        this.currentSearchIndex = (this.currentSearchIndex + direction + this.searchResults.length) % this.searchResults.length;
        this.applySearchHighlight();
        this.focusSearchResult();
    }

    focusSearchResult() {
        if (!this.searchResults.length) return;
        const cell = this.searchResults[this.currentSearchIndex];
        this.tree._graph.setSelectionCell(cell);
        this.tree._graph.scrollCellToVisible(cell, true);
    }

    clearSearch() {
        this.searchQuery = '';
        this.searchResults = [];
        this.searchHighlightedNodes = [];
        this.currentSearchIndex = 0;
        this.clearSearchHighlight();
        this.tree?._graph.clearSelection();
    }

    distinct<T, U>(arr: Array<T>, mapper: (o: T) => U): Set<U> {
        return arr.reduce((set: Set<U>, cur) => {
            set.add(mapper(cur));
            return set;
        }, new Set<U>());
    }

    toggleEdgeTypeFilter(type: string) {
        this.edgeTypeFilters[type] = !this.edgeTypeFilters[type];
        if (!this.tree || !this._architectures.length) return;
        const name = this.focusControl.value;
        const depth = this.depthControl.value;
        this.tree.clearAnimatedEdges();
        this.tree.clearCells();
        this.tree.draw(() => this.draw(this.tree, this._architectures, name, depth));
        if (name) {
            setTimeout(() => this.tree.highlightFocusedNode(name), 100);
        }
    }

    /**
     * Applique le highlighting pour la recherche
     */
    applySearchHighlight() {
        this.clearSearchHighlight();
        if (!this.tree || this.searchResults.length === 0) return;

        const allVertices = this.tree._graph.getChildVertices(this.tree._parent);

        // Appliquer le style à tous les vertices
        allVertices.forEach((v: any) => {
            const state = this.tree._graph.view.getState(v);
            if (!state || !state.shape || !state.shape.node) return;

            const node: SVGElement = state.shape.node;
            const isHighlighted = this.searchResults.includes(v);
            const isCurrent = v === this.searchResults[this.currentSearchIndex];

            if (isCurrent) {
                // Node courant: glow vert intensif
                node.style.filter = 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.8))';
                node.style.opacity = '1';
            } else if (isHighlighted) {
                // Autres résultats: glow vert léger
                node.style.filter = 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))';
                node.style.opacity = '0.9';
            } else {
                // Non trouvés: estompés
                node.style.opacity = '0.2';
                node.style.filter = 'grayscale(100%)';
            }
        });

        // Estomper aussi les edges
        const allEdges = this.tree._graph.getEdges(this.tree._parent);
        allEdges.forEach((e: any) => {
            const state = this.tree._graph.view.getState(e);
            if (!state || !state.shape || !state.shape.node) return;
            const node: SVGElement = state.shape.node;
            const paths = node.querySelectorAll('path');
            paths.forEach((p: SVGPathElement) => {
                p.style.opacity = '0.1';
            });
        });
    }

    /**
     * Nettoie le highlighting de la recherche
     */
    clearSearchHighlight() {
        if (!this.tree) return;

        const allVertices = this.tree._graph.getChildVertices(this.tree._parent);
        allVertices.forEach((v: any) => {
            const state = this.tree._graph.view.getState(v);
            if (!state || !state.shape || !state.shape.node) return;
            const node: SVGElement = state.shape.node;
            node.style.filter = '';
            node.style.opacity = '';
        });

        // Restaurer les edges
        const allEdges = this.tree._graph.getEdges(this.tree._parent);
        allEdges.forEach((e: any) => {
            const state = this.tree._graph.view.getState(e);
            if (!state || !state.shape || !state.shape.node) return;
            const node: SVGElement = state.shape.node;
            const paths = node.querySelectorAll('path');
            paths.forEach((p: SVGPathElement) => {
                p.style.opacity = '';
            });
        });
    }
}

export class Architecture {
    name: string;
    schema: string;
    type: string;
    remoteServers: Architecture[];
}

export const ServerConfig = {
    JDBC: { icon: "shape=image;image=assets/mxgraph/database.drawio.svg;", width: 80, height: 30 },
    REST: { icon: "shape=image;image=assets/mxgraph/microservice.drawio.svg;", width: 80, height: 30 },
    SMTP: { icon: "shape=image;image=assets/mxgraph/smtp.drawio.svg;", width: 80, height: 30 },
    FTP: { icon: "shape=image;image=assets/mxgraph/ftp.drawio.svg;", width: 80, height: 30 },
    LDAP: { icon: "shape=image;image=assets/mxgraph/ldap.drawio.svg;", width: 80, height: 30 },
    VIEW: { icon: "shape=image;image=assets/mxgraph/view.drawio.svg;", width: 80, height: 30 },
    BATCH: { icon: "shape=image;image=assets/mxgraph/batch.drawio.svg;", width: 80, height: 30 },
    LINK: { icon: "shape=image;image=assets/mxgraph/parent.drawio.svg;", width: 30, height: 30 },
    GHOST: { icon: "shape=image;image=assets/mxgraph/ghost.drawio.svg;", width: 30, height: 30 }
}

