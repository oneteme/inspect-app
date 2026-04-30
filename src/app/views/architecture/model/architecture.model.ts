import {mxCell, mxGraph, mxHierarchicalLayout, mxUtils, mxConstants} from "mxgraph";
import mx from '../../../../mxgraph';

export class ArchitectureTree {
    _graph: mxGraph;
    _parent: mxCell;
    _layout: mxHierarchicalLayout;

    constructor(
        private graph: mxGraph,
        private parent: mxCell,
        private layout: mxHierarchicalLayout) {
        this._graph = graph;
        this._parent = parent;
        this._layout = layout;
    }

    static setup(elem: HTMLElement) {
        let graph = new mx.mxGraph(elem); // create a graph inside a DOM node with an id of graph
        graph.setCellsLocked(true);
        graph.setCellsSelectable(false);
        graph.setTooltips(true);
        graph.getLabel = function(cell: any)
        {
            var label: string = (this.labelsVisible) ? this.convertValueToString(cell) : '';
            var geometry = this.model.getGeometry(cell);

            if (!this.model.isCollapsed(cell) && geometry != null && (geometry.offset == null ||
                    (geometry.offset.x == 0 && geometry.offset.y == 0)) && this.model.isVertex(cell) &&
                geometry.width >= 2)
            {
                var style = this.getCellStyle(cell);
                var fontSize = style[mx.mxConstants.STYLE_FONTSIZE] || mx.mxConstants.DEFAULT_FONTSIZE;
                var max = geometry.width / (fontSize * 0.625);
                if (max < label.length)
                {
                    return label.substring(0, max / 2) + '...' + label.substring(label.length - max / 2);
                }
            }

            return label;
        };
        graph.setPanning(true);
        graph.panningHandler.useLeftButtonForPanning = true;
        let parent = graph.getDefaultParent(); // Returns defaultParent or mxGraphView.currentRoot or the first child child
        let layout = new mx.mxHierarchicalLayout(graph); //Constructs a new hierarchical layout algorithm.
        let tg = new ArchitectureTree(graph, parent, layout);
        tg.setVertexDefaultStyle();

        return tg;
    }

    draw(fn: () => void) {
        this._graph.getModel().beginUpdate();
        try {
            fn();
        }
        finally {
            // Updates the display
            this._graph.getModel().endUpdate();
            this.resizeAndCenter();
        }
    }

    setOutline(container: HTMLElement) {
        const outline = new mx.mxOutline(this._graph, container);
        (this as any)._outline = outline;
    }

    setVertexDefaultStyle() {
        // no custom vertex style — keep the default transparent style
    }

    clearCells() {
        const model = this._graph.getModel();
        this._graph.getModel().beginUpdate();
        try {
            const cells =  this._graph.getModel().cells;
            for (const cellId in cells) {
                if (cells.hasOwnProperty(cellId) && cells[cellId].getGeometry() && cellId != '1') {
                    this._graph.getModel().remove(cells[cellId])
                }
            }
        }
        finally {
            this._graph.getModel().endUpdate()
        }
    }

    resizeAndCenter() {
        let availableWidth = document.getElementById("fixed-width-container")?.offsetWidth;
        let availableHeight = document.getElementById("fixed-width-container")?.offsetHeight;
        this._graph.doResizeContainer(availableWidth, availableHeight);
        this._graph.fit(10);;
        let margin = 10;
        let max = 3;
        let bounds = this._graph.getGraphBounds();
        let cw = this._graph.container.clientWidth - margin;
        let ch = this._graph.container.clientHeight - margin;
        let w = bounds.width / this._graph.view.scale;
        let h = bounds.height / this._graph.view.scale;
        let s = Math.min(max, Math.min(cw / w, ch / h));

        this._graph.view.scaleAndTranslate(s,
            (margin + cw - w * s) / (2 * s) - bounds.x / this._graph.view.scale,
            (margin + ch - h * s) / (2 * s) - bounds.y / this._graph.view.scale);
    }

    private _focusHighlight: any = null;
    private _animatedEdges: Map<any, string> = new Map(); // Stocke les edges animées et leurs styles originaux

    highlightFocusedNode(label: string) {
        this.clearHighlight();
        if (!label) return;
        const vertices = this._graph.getChildVertices(this._parent);
        const cell = vertices.find((v: any) => this._graph.model.getValue(v) === label);
        if (!cell) return;
        this._injectGlowStyle();
        this._focusHighlight = new mx.mxCellHighlight(this._graph, '#6366f1', 3, false);
        (this._focusHighlight as any).opacity = 80;
        this._focusHighlight.highlight(this._graph.view.getState(cell));
        setTimeout(() => {
            const node: SVGElement | null = (this._focusHighlight as any)?.shape?.node ?? null;
            if (node) {
                node.style.filter = 'drop-shadow(0 0 6px #6366f1cc)';
                node.style.animation = 'cellGlow 1.8s ease-in-out infinite';
            }
        }, 0);
    }

    clearHighlight() {
        if (this._focusHighlight) {
            this._focusHighlight.destroy();
            this._focusHighlight = null;
        }
    }

    /**
     * Anime les edges entrants (appelants) et sortants (appelés) d'un vertex
     * avec un effet de flux (tirets défilants) sans changer les couleurs d'origine.
     */
    animateIncomingEdges(vertex: any) {
        this.clearAnimatedEdges();
        if (!vertex) return;

        this._injectEdgeGlowStyle();

        const incoming = this._graph.getIncomingEdges(vertex);
        const outgoing = this._graph.getOutgoingEdges(vertex);

        if (!incoming.length && !outgoing.length) return;

        [...incoming, ...outgoing].forEach((edge: any) => {
            this._animatedEdges.set(edge, '');
        });

        this._applyFlowToAnimatedEdges();
    }

    private _applyFlowToAnimatedEdges() {
        this._animatedEdges.forEach((_, edge) => {
            const node: Element | null = this._graph.view.getState(edge)?.shape?.node ?? null;
            if (!node) return;
            node.querySelectorAll('path').forEach((p: SVGPathElement) => {
                p.style.strokeDasharray = '10 6';
                p.style.animation       = 'edgeFlowAnim 0.7s linear infinite';
                p.style.strokeWidth     = '3';
            });
        });
    }

    /**
     * Retire les animations de flux des edges et restaure leur état d'origine.
     */
    clearAnimatedEdges() {
        this._animatedEdges.forEach((_, edge) => {
            const node: Element | null = this._graph.view.getState(edge)?.shape?.node ?? null;
            if (!node) return;
            node.querySelectorAll('path').forEach((p: SVGPathElement) => {
                p.style.strokeDasharray = '';
                p.style.animation       = '';
                p.style.strokeWidth     = '';
            });
        });
        this._animatedEdges.clear();
    }

    /**
     * Configure l'écouteur de clic sur les vertices.
     * Ré-applique aussi les animations après zoom/pan (mxGraph repeint les SVG).
     */
    setupVertexClickListener(onVertexClick: (vertex: any) => void, onBackground?: () => void, onVertexDoubleClick?: (vertex: any) => void) {
        this._graph.addListener(mx.mxEvent.CLICK, (sender: any, evt: any) => {
            const cell = evt.getProperty('cell');
            if (cell && this._graph.model.isVertex(cell)) {
                onVertexClick(cell);
            } else if (!cell && onBackground) {
                onBackground();
            }
        });

        // Double-click listener pour le focus automatique
        this._graph.addListener(mx.mxEvent.DOUBLE_CLICK, (sender: any, evt: any) => {
            const cell = evt.getProperty('cell');
            if (cell && this._graph.model.isVertex(cell)) {
                onVertexDoubleClick?.(cell);
            }
        });

        // Écouteur de hover sur les vertices
        this._graph.addMouseListener({
            mouseDown: () => { },
            mouseMove: (sender: any, me: any) => {
                const vertex = me.getCell();
                if (vertex && this._graph.model.isVertex(vertex)) {
                    (this as any).onVertexHover?.(vertex, me.getEvent());
                } else {
                    (this as any).onVertexHoverOut?.();
                }
            },
            mouseUp: () => { }
        });

        // Ré-appliquer les animations après zoom/pan car mxGraph redessine les SVG
        const reapply = () => {
            if (!this._animatedEdges.size) return;
            setTimeout(() => this._applyFlowToAnimatedEdges(), 0);
        };
        this._graph.view.addListener(mx.mxEvent.SCALE,               reapply);
        this._graph.view.addListener(mx.mxEvent.TRANSLATE,           reapply);
        this._graph.view.addListener(mx.mxEvent.SCALE_AND_TRANSLATE, reapply);
    }

    private _injectEdgeGlowStyle() {
        if (!document.getElementById('arch-edge-glow-anim')) {
            const s = document.createElement('style');
            s.id = 'arch-edge-glow-anim';
            s.textContent = `@keyframes edgeFlowAnim { from { stroke-dashoffset: 16; } to { stroke-dashoffset: 0; } }`;
            document.head.appendChild(s);
        }
    }

    private _injectGlowStyle() {
        if (!document.getElementById('arch-cell-highlight-anim')) {
            const s = document.createElement('style');
            s.id = 'arch-cell-highlight-anim';
            s.textContent = `@keyframes cellGlow { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`;
            document.head.appendChild(s);
        }
    }
}
