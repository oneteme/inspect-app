import {mxCell, mxGraph, mxHierarchicalLayout, mxUtils, mxConstants} from "mxgraph";
import mx from '../../../../mxgraph';

export class ArchitectureTree {
    constructor(
        private graph: mxGraph,
        private parent: mxCell,
        private layout: mxHierarchicalLayout) { }

    public get _graph() {
        return this.graph;
    }

    public get _parent() {
        return this.parent
    }

    public get _layout() {
        return this.layout;
    }

    static setup(elem: HTMLElement, fn: (tg: ArchitectureTree) => void) {
        let graph = new mx.mxGraph(elem); // create a graph inside a DOM node with an id of graph


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
                    return label.substring(0, max) + '...';
                }
            }

            return label;
        };
        let parent = graph.getDefaultParent(); // Returns defaultParent or mxGraphView.currentRoot or the first child child
        let layout = new mx.mxHierarchicalLayout(graph); //Constructs a new hierarchical layout algorithm.
        let tg = new ArchitectureTree(graph, parent, layout);
        tg.setVertexDefaultStyle()
        fn(tg);
    }

    draw(fn: () => void) {
        this.graph.getModel().beginUpdate();
        try {
            fn();
        }
        finally {
            // Updates the display
            this.graph.getModel().endUpdate();
            this.resizeAndCenter();
        }
    }

    setVertexDefaultStyle() {
        let style = this.graph.getStylesheet().getDefaultVertexStyle();
        style = mx.mxUtils.clone(style);
        style[mx.mxConstants.STYLE_SHAPE] = mx.mxConstants.SHAPE_SWIMLANE;
        style[mx.mxConstants.STYLE_SWIMLANE_LINE] = 0;
        this.graph.getStylesheet().putCellStyle("swimlane", style);
    }


    private resizeAndCenter() {
        let availableWidth = document.getElementById("fixed-width-container")?.offsetWidth;
        let availableHeight = document.getElementById("fixed-width-container")?.offsetHeight;
        this.graph.doResizeContainer(availableWidth, availableHeight);
        this.graph.fit()
        let margin = 10;
        let max = 3;
        let bounds = this.graph.getGraphBounds();
        let cw = this.graph.container.clientWidth - margin;
        let ch = this.graph.container.clientHeight - margin;
        let w = bounds.width / this.graph.view.scale;
        let h = bounds.height / this.graph.view.scale;
        let s = Math.min(max, Math.min(cw / w, ch / h));

        this.graph.view.scaleAndTranslate(s,
            (margin + cw - w * s) / (2 * s) - bounds.x / this.graph.view.scale,
            (margin + ch - h * s) / (2 * s) - bounds.y / this.graph.view.scale);
    }
}