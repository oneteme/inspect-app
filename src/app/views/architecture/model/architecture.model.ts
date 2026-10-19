import {mxCell, mxCellHighlight, mxGraph, mxOutline} from "mxgraph";
import mx from '../../../../mxgraph';

export interface ArchitectureTreeListeners {
    onVertexClick?: (vertex: mxCell) => void;
    onBackgroundClick?: () => void;
    onVertexHover?: (vertex: mxCell, event: MouseEvent) => void;
    onVertexHoverOut?: () => void;
}

export class ArchitectureTree {
    private _outline: mxOutline | null = null;
    private _focusHighlight: mxCellHighlight | null = null;
    private readonly _animatedEdges = new Set<mxCell>();
    private _hoveredVertex: mxCell | null = null;
    private _wheelListener?: (event: WheelEvent) => void;
    private _animationFrame?: number;

    private constructor(readonly _graph: mxGraph, readonly _parent: mxCell) { }

    static setup(elem: HTMLElement): ArchitectureTree {
        const graph: mxGraph = new mx.mxGraph(elem);
        graph.setCellsLocked(true);
        graph.setCellsSelectable(false);
        graph.setTooltips(false); // tooltip native mxGraph désactivée (tooltip Angular à la place)
        (graph as any).zoomWheel = false; // le zoom molette personnalisé est installé ci-dessous
        graph.setPanning(true);
        graph.panningHandler.useLeftButtonForPanning = true;
        graph.container.style.cursor = 'move';
        return new ArchitectureTree(graph, graph.getDefaultParent());
    }

    draw(fn: () => void) {
        this.clearAnimatedEdges();
        this.clearHighlight();
        this._hoveredVertex = null;
        const model = this._graph.getModel();
        model.beginUpdate();
        try {
            [...this.getEdges(), ...this.getVertices()].forEach(cell => model.remove(cell));
            fn();
        } finally {
            model.endUpdate();
            this.resizeAndCenter();
        }
    }

    setOutline(container: HTMLElement) {
        this._outline?.destroy();
        this._outline = new mx.mxOutline(this._graph, container);
    }

    getVertices(): mxCell[] {
        return this._graph.getChildVertices(this._parent);
    }

    getEdges(): mxCell[] {
        return this._graph.getChildEdges(this._parent);
    }

    getLabel(cell: mxCell): string {
        return this._graph.model.getValue(cell);
    }

    findVertex(label: string): mxCell | undefined {
        return this.getVertices().find(v => this.getLabel(v) === label);
    }

    resizeAndCenter() {
        const container = this._graph.container;
        const host = container.parentElement;
        if (!host) return;
        this._graph.doResizeContainer(host.clientWidth, host.clientHeight);

        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width <= 0 || height <= 0) return;

        const bounds = this._graph.getGraphBounds();
        const view = this._graph.view;
        const oldScale = view.scale;
        if (!Number.isFinite(oldScale) || oldScale <= 0 || bounds.width <= 0 || bounds.height <= 0) return;

        // getGraphBounds() est en coordonnées écran : retirer aussi l'ancienne
        // translation pour retrouver la position réelle du graphe.
        const graphX = bounds.x / oldScale - view.translate.x;
        const graphY = bounds.y / oldScale - view.translate.y;
        const graphWidth = bounds.width / oldScale;
        const graphHeight = bounds.height / oldScale;
        if (![graphX, graphY, graphWidth, graphHeight].every(Number.isFinite) || graphWidth <= 0 || graphHeight <= 0) return;

        const margin = 10;
        const availableWidth = Math.max(1, width - margin * 2);
        const availableHeight = Math.max(1, height - margin * 2);
        const scale = Math.min(3, availableWidth / graphWidth, availableHeight / graphHeight);
        if (!Number.isFinite(scale) || scale <= 0) return;

        const translateX = (width / 2 - (graphX + graphWidth / 2) * scale) / scale;
        const translateY = (height / 2 - (graphY + graphHeight / 2) * scale) / scale;
        view.scaleAndTranslate(scale, translateX, translateY);
    }

    highlightFocusedNode(label: string | null) {
        this.clearHighlight();
        if (!label) return;
        const cell = this.findVertex(label);
        const state = cell && this._graph.view.getState(cell);
        if (!state) return;
        ArchitectureTree.injectStyle('arch-cell-highlight-anim', `@keyframes cellGlow { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`);
        this._focusHighlight = new mx.mxCellHighlight(this._graph, '#6366f1', 3, false);
        (this._focusHighlight as any).opacity = 80;
        this._focusHighlight.highlight(state);
        const node: SVGElement | null = (this._focusHighlight as any).shape?.node ?? null;
        if (node) {
            node.style.filter = 'drop-shadow(0 0 6px #6366f1cc)';
            node.style.animation = 'cellGlow 1.8s ease-in-out infinite';
        }
    }

    clearHighlight() {
        this._focusHighlight?.destroy();
        this._focusHighlight = null;
    }

    /**
     * Anime les edges entrants (appelants) et sortants (appelés) d'un vertex
     * avec un effet de flux (tirets défilants) sans changer les couleurs d'origine.
     */
    animateEdgesOf(vertex: mxCell) {
        this.clearAnimatedEdges();
        if (!vertex) return;
        ArchitectureTree.injectStyle('arch-edge-glow-anim', `@keyframes edgeFlowAnim { from { stroke-dashoffset: 16; } to { stroke-dashoffset: 0; } }`);
        [...this._graph.getIncomingEdges(vertex, null), ...this._graph.getOutgoingEdges(vertex, null)]
            .forEach(e => this._animatedEdges.add(e));
        this.applyFlowToAnimatedEdges();
    }

    /**
     * Retire les animations de flux des edges et restaure leur état d'origine.
     */
    clearAnimatedEdges() {
        this._animatedEdges.forEach(edge => this.setEdgePathStyle(edge, '', '', ''));
        this._animatedEdges.clear();
    }

    private applyFlowToAnimatedEdges() {
        this._animatedEdges.forEach(edge => this.setEdgePathStyle(edge, '10 6', 'edgeFlowAnim 0.7s linear infinite', '2'));
    }

    private setEdgePathStyle(edge: mxCell, dash: string, animation: string, width: string) {
        const node: Element | null = this._graph.view.getState(edge)?.shape?.node ?? null;
        node?.querySelectorAll('path').forEach((p: SVGPathElement) => {
            p.style.strokeDasharray = dash;
            p.style.animation = animation;
            p.style.strokeWidth = width;
        });
    }

    /**
     * Configure les écouteurs click / double-click / hover.
     * Ré-applique aussi les animations après zoom/pan (mxGraph repeint les SVG).
     */
    setupListeners(l: ArchitectureTreeListeners) {
        this._wheelListener = (event: WheelEvent) => {
            const view = this._graph.view;
            const oldScale = view.scale;
            if (!Number.isFinite(oldScale) || oldScale <= 0 || event.deltaY === 0) return;

            event.preventDefault();
            const containerBounds = this._graph.container.getBoundingClientRect();
            const pointerX = event.clientX - containerBounds.left;
            const pointerY = event.clientY - containerBounds.top;
            let deltaMultiplier = 1;
            if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) deltaMultiplier = 16;
            else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) deltaMultiplier = containerBounds.height;
            const delta = event.deltaY * deltaMultiplier;
            const factor = Math.exp(Math.max(-1, Math.min(1, -delta * 0.0015)));
            const newScale = Math.max(0.1, Math.min(3, oldScale * factor));
            if (newScale === oldScale) return;

            // Conserve sous le curseur le même point du graphe pendant le zoom.
            const graphX = pointerX / oldScale - view.translate.x;
            const graphY = pointerY / oldScale - view.translate.y;
            view.scaleAndTranslate(newScale, pointerX / newScale - graphX, pointerY / newScale - graphY);
        };
        this._graph.container.addEventListener('wheel', this._wheelListener, { passive: false });

        this._graph.addListener(mx.mxEvent.CLICK, (_: any, evt: any) => {
            const cell = evt.getProperty('cell');
            if (cell && this._graph.model.isVertex(cell)) l.onVertexClick?.(cell);
            else if (!cell) l.onBackgroundClick?.();
        });


        this._graph.addMouseListener({
            mouseDown: () => { },
            mouseMove: (_: any, me: any) => {
                const cell = me.getCell();
                if (cell && this._graph.model.isVertex(cell)) {
                    this._hoveredVertex = cell;
                    l.onVertexHover?.(cell, me.getEvent());
                } else if (this._hoveredVertex) {
                    // notifie une seule fois à la sortie (et non à chaque mousemove sur le fond)
                    this._hoveredVertex = null;
                    l.onVertexHoverOut?.();
                }
            },
            mouseUp: () => { }
        });

        const reapply = () => {
            if (this._animatedEdges.size && this._animationFrame === undefined) {
                this._animationFrame = requestAnimationFrame(() => {
                    this._animationFrame = undefined;
                    this.applyFlowToAnimatedEdges();
                });
            }
        };
        this._graph.view.addListener(mx.mxEvent.SCALE, reapply);
        this._graph.view.addListener(mx.mxEvent.TRANSLATE, reapply);
        this._graph.view.addListener(mx.mxEvent.SCALE_AND_TRANSLATE, reapply);
    }

    destroy() {
        if (this._wheelListener) this._graph.container.removeEventListener('wheel', this._wheelListener);
        this._wheelListener = undefined;
        if (this._animationFrame !== undefined) cancelAnimationFrame(this._animationFrame);
        this._animationFrame = undefined;
        this.clearAnimatedEdges();
        this.clearHighlight();
        this._outline?.destroy();
        this._outline = null;
        this._graph.destroy();
    }

    private static injectStyle(id: string, css: string) {
        if (document.getElementById(id)) return;
        const s = document.createElement('style');
        s.id = id;
        s.textContent = css;
        document.head.appendChild(s);
    }
}
