
import mx from '../../mxgraph';
import { DatabaseRequest, JdbcRequestNode, Label } from './trace.model';

export class TreeGraph {


    constructor(
        private graph: any,
        private parent: any,
        private layout: any) { }


    public get _graph() {
        return this.graph;
    }

    public get _layout() {
        return this.layout;
    }

    public get _parent() {
        return this.parent
    }


    static setup(elem: HTMLElement, fn: (tg: TreeGraph) => void) {
        let graph = new mx.mxGraph(elem); // create a graph inside a DOM node with an id of graph
        graph.getLabel = function (cell: any) {
            if (cell?.isEdge() && cell.value && typeof cell.value === 'object') {
                let compare = cell.value.nodes[0].formatLink(cell.value.linkLbl)
                return tg.checkSome(cell.value.nodes, x => x.formatLink(cell.value.linkLbl) != compare) ? `... ×${cell.value.nodes.length}` : `${compare} ×${cell.value.nodes.length}`
            }
            return mx.mxGraph.prototype.getLabel.apply(this, arguments);
        }

        mx.mxEvent.disableContextMenu(elem);
        let parent = graph.getDefaultParent(); // Returns defaultParent or mxGraphView.currentRoot or the first child child 
        let layout = new mx.mxHierarchicalLayout(graph); //Constructs a new hierarchical layout algorithm.
        layout.intraCellSpacing = 120;
        let tg = new TreeGraph(graph, parent, layout);
        tg.setEdgeDefaultStyle()
        tg.setVertexDefaultStyle()
        fn(tg);
        graph.setCellsLocked(true);
        graph.panningHandler.useLeftButtonForPanning = true; // Specifies if panning should be active for the left mouse button. 
        graph.panningHandler.ignoreCell = true; // Specifies if panning should be active even if there is a cell under the mousepointer.
        graph.container.style.cursor = 'move'
        graph.setPanning(true);
        new mx.mxTooltipHandler(graph, 1);
        mx.mxGraph.prototype.getTooltipForCell = function (cell: any) { //tooltip 
            let modal = ""
            if (cell.isEdge()) {
                if (cell.value.nodes) {
                    let res = tg.groupBy(cell.value.nodes, (v: any) => v.formatLink(cell.value.linkLbl))
                    let entries = Object.entries(res)

                    let max; 
                    let count = 0;
                    if (entries.length > 5) {
                        max = 5;
                        
                    } else {
                        max = entries.length;
                    }

                    for (let i = 0; i < max; i++) {
                        modal += `<b>${entries[i][0]}</b>${entries[i][1].length>1 ?' ×'+entries[i][1].length: ''}<br>`
                        count +=entries[i][1].length;
                    }
                    if(entries.length> 5){
                        modal += `...<b>${cell.value.nodes.length - count} Autres</b>`
                    }
                   
                }
                else {
                    modal += `<b>${cell.value}</b>`
                }
                return modal;
            }
            return '';
        }
        return tg
    }

    groupBy<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } {
        return array.reduce((acc: any, item: any) => {
            var id = fn(item);
            if (!acc[id]) {
                acc[id] = [];
            }
            acc[id].push(item);
            return acc;
        }, {})
    }

    checkSome(arr: any[], fn: (o: any) => any) {
        return arr.some(r => fn(r));
    }


    draw(fn: () => void) {
        let layout = new mx.mxHierarchicalLayout(this.graph); // todo: use layout of treegraph 
        layout.intraCellSpacing = 120;
        this.graph.getModel().beginUpdate();
        try {
            fn();
            layout.execute(this.parent);

            /*const vertices = this.graph.getChildVertices(this.parent)
            const adjustedVertices = new Set();
      
            vertices.forEach((vertex, index) => {
              let v =this.graph.view
              let state = v.getState(vertex)
      
              if(state && state.labelBounds){
          
                const labelBounds1 = state.labelBounds
                for(let i = 0 ; i< index; i++){
                  let otherVertex = vertices[i];
                  let otherState = this.graph.view.getState(otherVertex);
                  if(otherState && otherState.labelBounds){
                    
                    const labelBounds2 = otherState.labelBounds;
                  
                    if(mx.mxUtils.intersects(labelBounds1,labelBounds2)){
                      console.log('tue')
                      let geometry = vertex.geometry.clone();
                      if(geometry != null){
                        geometry.offset = geometry.offset ||new mx.mxPoint(0,0);
                        geometry.offset = new mx.mxPoint(geometry.offset.x +20, geometry.offset.y + 20);
                        this.graph.getModel().setGeometry(vertex,geometry);
                      }
                    }
                  }
                }
                adjustedVertices.add(vertex)
              }
            });*/
        }
        finally {
            // Updates the display
            this.graph.getModel().endUpdate();
            this.resizeAndCenter();
        }
    }

    insertServer(name: string, serverType: ServerType) {
        return this.insertVertex(name, ServerConfig[serverType].width, ServerConfig[serverType].height, ServerConfig[serverType].icon);
    }

    insertVertex(name: string, width: number, height: number, icon: string,) {
        return this.graph.insertVertex(this.parent, null, name, 0, 0, width, height, icon);
    }

    insertLink(name: string, sender: any, reciever: any, style: string) {

        return this.graph.insertEdge(this.parent, null, name, sender, reciever, style);
    }

    insertEdge(name: string, sender: any, receiver: any) {
        return this.graph.insertEdge(this.parent, null, name, sender, receiver)
    }

    setOutline(elem: HTMLElement) {
        new mx.mxOutline(this.graph, elem) //Constructs a new outline for the specified graph inside the given container.
    }

    createPopupMenu(fn: (menu: any, cell: any, evt: any) => void) {
        this.graph.popupMenuHandler.autoExpand = true
        this.graph.popupMenuHandler.factoryMethod = function (menu: any, cell: any, evt: any) {
            fn(menu, cell, evt);
        }
    }

    setVertexDefaultStyle() {
        let style = this.graph.getStylesheet().getDefaultVertexStyle();
        style[mx.mxConstants.STYLE_VERTICAL_LABEL_POSITION] = "bottom"
        style[mx.mxConstants.STYLE_VERTICAL_ALIGN] = "top"
        style[mx.mxConstants.STYLE_FONTCOLOR] = '#446299'
        style[mx.mxConstants.STYLE_FONTSIZE] = 8
        //style[mx.mxConstants.STYLE_IMAGE_BORDER] = "black";
    }

    setEdgeDefaultStyle() {
        let style = this.graph.getStylesheet().getDefaultEdgeStyle();
        style[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
        style[mx.mxConstants.EDGE_SELECTION_STROKEWIDTH] = 10;
        style[mx.mxConstants.STYLE_STROKEWIDTH] = 0.5;
        style[mx.mxConstants.STYLE_ENDARROW] = "none";
        style[mx.mxConstants.STYLE_ENDSIZE] = 2;
        style[mx.mxConstants.STYLE_ENDFILL] = 1;
        style[mx.mxConstants.STYLE_SOURCE_PERIMETER_SPACING] = 12;
        style[mx.mxConstants.STYLE_FONTSIZE] = 8
    }

    clearCells() {
        const model = this.graph.getModel();
        model.beginUpdate();
        try {
            const cells = model.cells;
            for (const cellId in cells) {
                if (cells.hasOwnProperty(cellId) && cells[cellId].getGeometry() && cellId != '1') {
                    model.remove(cells[cellId])
                }
            }
        } finally {
            model.endUpdate()
        }
    }

    resizeAndCenter() {
        let availableWidth = document.getElementById("fixed-width-container")?.offsetWidth;
        let availableHeight = document.getElementById("fixed-width-container")?.offsetHeight;
        this.graph.doResizeContainer(availableWidth, availableHeight);
        this.graph.fit()
        let margin = 2;
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


export type ServerType = 'REST' | 'JDBC' | 'FTP' | 'SMTP' | 'LDAP' | 'LINK' | 'GHOST' | 'VIEW' | 'BATCH';
export type linkType = 'SINGLE' | 'MULTIPLE';
export const ServerConfig = {
    JDBC: { icon: "shape=image;image=assets/mxgraph/database.drawio.svg;", width: 80, height: 30 },
    REST: { icon: "shape=image;image=assets/mxgraph/microservice.drawio.svg;", width: 80, height: 30 },
    SMTP: { icon: "shape=image;image=assets/mxgraph/smtp.drawio.svg;", width: 80, height: 30 },
    FTP: { icon: "shape=image;image=assets/mxgraph/ftp.drawio.svg;", width: 80, height: 30 },
    LDAP: { icon: "shape=image;image=assets/mxgraph/ldap.drawio.svg;", width: 80, height: 30 },
    LINK: { icon: "shape=image;image=assets/mxgraph/parent.drawio.svg;", width: 30, height: 30 },
    GHOST: { icon: "shape=image;image=assets/mxgraph/ghost.drawio.svg;", width: 30, height: 30 },
    VIEW: { icon: "shape=image;image=assets/mxgraph/view.drawio.svg;", width: 30, height: 30 },
    BATCH: { icon: "shape=image;image=assets/mxgraph/microservice.drawio.svg;", width: 30, height: 30 },
}
export const LinkConfig = {
    SUCCES: "strokeColor=green;",
    CLIENT_ERROR: "strokeColor=#f9ad4e;",
    SERVER_ERROR: "strokeColor=red;",
    UNREACHABLE: "strokeColor=red;"
}

