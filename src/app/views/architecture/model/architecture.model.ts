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

    setVertexDefaultStyle() {
        let style = this._graph.getStylesheet().getDefaultVertexStyle();
        style = mx.mxUtils.clone(style);
        style[mx.mxConstants.STYLE_SHAPE] = mx.mxConstants.SHAPE_SWIMLANE;
        style[mx.mxConstants.STYLE_SWIMLANE_LINE] = 0;
        this._graph.getStylesheet().putCellStyle("swimlane", style);
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
        this._graph.fit()
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
}