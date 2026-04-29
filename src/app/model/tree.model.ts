import {
  DatabaseRequestDto,
  DirectoryRequestDto,
  FtpRequestDto,
  MailRequestDto, MainSessionDto,
  RestRequestDto,
  RestSessionDto
} from "./request.model";
import mx from "../../mxgraph";

export interface SessionTree {
  os: string;
  re: string;
  address: string;
  restRequests?: RestRequestTree[];
  databaseRequests?: DatabaseRequestTree[];
  ftpRequests?: FtpRequestTree[];
  mailRequests?: MailRequestTree[];
  ldapRequests?: DirectoryRequestTree[];
}

export interface RestSessionTree extends SessionTree, RestSessionDto {

}

export interface MainSessionTree extends SessionTree, MainSessionDto {

}

export interface RestRequestTree extends RestRequestDto {
  remoteTrace: RestSessionTree
}

export interface DatabaseRequestTree extends DatabaseRequestDto {
  count: number;
}

export interface FtpRequestTree extends FtpRequestDto {
  commands: string[];
}

export interface MailRequestTree extends MailRequestDto {
  commands: string[];
  count: number;
}

export interface DirectoryRequestTree extends DirectoryRequestDto {
  commands: string[];
}

export interface Node<T> {
  formatNode(field: T): string;
}

export interface Link<T> {
  formatLink(field: T): string;
  getLinkStyle(): string;
}

export class RestServerNode implements Node<Label> {

  nodeObject: RestSessionTree;

  constructor(nodeObject: RestSessionTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.appName + " " /*+ this.nodeObject.version*/ //version
      case Label.OS_RE: return (this.nodeObject.os || "?") + " " + (this.nodeObject.re || '?');
      case Label.IP_PORT: return (this.nodeObject.address || "?") +  (this.nodeObject?.port < 0 ? '' : ":"+ this.nodeObject?.port.toString())
      case Label.BRANCH_COMMIT: return "" // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.STATUS_EXCEPTION: return (this.nodeObject.status!= null ? this.nodeObject.status.toString():"?")+ (this.nodeObject?.exception ? ': ' + (this.nodeObject?.exception?.type || this.nodeObject?.exception?.message ):'');
      default: return '';
    }
  }
}

export class MainServerNode implements Node<Label> {
  nodeObject: MainSessionTree;

  constructor(nodeObject: MainSessionTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.appName || '?'/*+ this.nodeObject.version*/ //version
      case Label.OS_RE: return (this.nodeObject.os || "?") + " " + (this.nodeObject.re || '?');
      case Label.IP_PORT: return (this.nodeObject.address || "?")
      case Label.BRANCH_COMMIT: return "?"  // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.STATUS_EXCEPTION: {
        if(this.nodeObject.exception != null) {
          return "KO: " + (this.nodeObject.exception.type || this.nodeObject.exception.message);
        }
        return "OK";
      }
      default: return '';
    }
  }

}

export class LinkRequestNode implements Link<Label> {
  nodeObject: RestSessionTree

  constructor(nodeObject: RestSessionTree) {
    this.nodeObject = nodeObject;
  }
  getLinkStyle(): string {
    if (this.nodeObject.end == null) return 'ONGOING';
    switch(true){
      case (this.nodeObject.status >= 200 && this.nodeObject.status < 300): return "SUCCES";
      case (this.nodeObject.status >= 400 && this.nodeObject.status < 500):  return "CLIENT_ERROR"
      case (this.nodeObject.status >=500):  return "ERROR";
      case (this.nodeObject.status == 0):   return "UNREACHABLE"
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.ELAPSED_LATENSE: return `${this.nodeObject.end - this.nodeObject.start ? (this.nodeObject.end - this.nodeObject.start).toFixed(3)+"s": "?"}`
      case Label.METHOD_RESOURCE: return `${this.nodeObject.method || "?"} ${this.nodeObject.path || "?"}`
      case Label.SIZE_COMPRESSION: return `${this.nodeObject.inDataSize < 0 ? 0 : sizeFormatter(this.nodeObject.inDataSize) } ↓↑ ${this.nodeObject.outDataSize < 0 ? 0 : sizeFormatter(this.nodeObject.outDataSize) }`
      case Label.PROTOCOL_SCHEME: return `${this.nodeObject.protocol || "?"}/${this.nodeObject.authScheme || "?"}`
      case Label.STATUS_EXCEPTION: return this.nodeObject.status.toString() +(this.nodeObject.exception && ': ' + this.nodeObject.exception?.type || '');
      case Label.USER: return `${this.nodeObject.user ?? "?"}`
      default: return '?';
    }
  }
}

export class JdbcRequestNode implements Node<Label>, Link<Label> {
  nodeObject: DatabaseRequestTree;

  constructor(nodeObject: DatabaseRequestTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.schema || this.nodeObject.name || '?'/*+ this.nodeObject.version*/ //version
      case Label.OS_RE: return this.nodeObject.productName || '?';
      case Label.IP_PORT: return (this.nodeObject.name || '?') + (this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '')
      case Label.BRANCH_COMMIT: return "?" // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.ELAPSED_LATENSE: return `${this.nodeObject.end - this.nodeObject.start ? (this.nodeObject.end - this.nodeObject.start).toFixed(3)+"s": "?"}`
      case Label.METHOD_RESOURCE: return `${this.nodeObject?.command || '?'}`;
      case Label.SIZE_COMPRESSION: return this.nodeObject?.count < 0 ? '0': this.nodeObject?.count!= undefined? this.nodeObject?.count.toString() : '?'; // remove undefined condition
      case Label.PROTOCOL_SCHEME: return "JDBC/Basic"
      case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'KO:' + this.nodeObject.exception?.type || 'OK'
      case Label.USER: return `${this.nodeObject.user || '?'}`;
      default: return '?';
    }
  }

  getLinkStyle(): string {
    if (this.nodeObject.end == null) return 'ONGOING';
    return this.nodeObject.failed ? 'ERROR' : 'SUCCES'
  }
}

export class FtpRequestNode implements Node<Label>, Link<Label> {

  nodeObject: FtpRequestTree;

  constructor(nodeObject: FtpRequestTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.host || '?'; //version
      case Label.IP_PORT: return (this.nodeObject.host || '?') + (this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '')
      case Label.BRANCH_COMMIT: return "?"  // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.ELAPSED_LATENSE: return `${this.nodeObject.end - this.nodeObject.start ? (this.nodeObject.end - this.nodeObject.start).toFixed(3)+"s": "?"}`
      case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, "SCRIPT")
      case Label.SIZE_COMPRESSION: return "?"
      case Label.PROTOCOL_SCHEME: return this.nodeObject.protocol + '/Basic'
      case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'KO:' + this.nodeObject.exception?.type || 'OK'
      case Label.USER: return `${this.nodeObject.user || '?'}`;
      default: return '?';
    }
  }

  getLinkStyle(): string {
    if (this.nodeObject.end == null) return 'ONGOING';
    return this.nodeObject.failed ? 'ERROR' : 'SUCCES';
  }
}

export class MailRequestNode implements Node<Label>, Link<Label> {
  nodeObject: MailRequestTree;

  constructor(nodeObject: MailRequestTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.host || '?' //version
      case Label.IP_PORT: return (this.nodeObject.host || '?') + (this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '')
      case Label.BRANCH_COMMIT: return "?" // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.ELAPSED_LATENSE: return `${this.nodeObject.end - this.nodeObject.start ? (this.nodeObject.end - this.nodeObject.start).toFixed(3)+"s": "?"}`
      case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, "SCRIPT")
      case Label.SIZE_COMPRESSION: return this.nodeObject?.count < 0 ? '0': this.nodeObject?.count!= undefined? this.nodeObject?.count.toString() : '?';
      case Label.PROTOCOL_SCHEME: return "SMTP/Basic"
      case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'KO:' + this.nodeObject.exception?.type || 'OK'
      case Label.USER: return `${this.nodeObject.user || '?'}`;
      default: return '?';
    }
  }

  getLinkStyle(): string {
    if (this.nodeObject.end == null) return 'ONGOING';
    return this.nodeObject.failed ? 'ERROR' : 'SUCCES';
  }
}

export class LdapRequestNode implements Node<Label>, Link<Label> {
  nodeObject: DirectoryRequestTree;

  constructor(nodeObject: DirectoryRequestTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.host || '?'/*+ this.nodeObject.version*/ //version
      case Label.IP_PORT: return (this.nodeObject.host || '?') +(this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '')
      case Label.BRANCH_COMMIT: return "?"  // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.ELAPSED_LATENSE: return `${this.nodeObject.end - this.nodeObject.start ? (this.nodeObject.end - this.nodeObject.start).toFixed(3)+"s": "?"}`
      case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, "SCRIPT") || '?'
      case Label.SIZE_COMPRESSION: return "?"
      case Label.PROTOCOL_SCHEME: return this.nodeObject.protocol ?? "LDAP/Basic" // wait for fix backend
      case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'KO:' + this.nodeObject.exception?.type || 'OK'
      case Label.USER: return `${this.nodeObject.user || '?'}`;
      default: return '?';
    }
  }

  getLinkStyle(): string {
    if (this.nodeObject.end == null) return 'ONGOING';
    return this.nodeObject.failed ? 'ERROR' : 'SUCCES';
  }
}

export class RestRequestNode implements Node<Label> {
  nodeObject: RestRequestTree;
  constructor(nodeObject: RestRequestTree) {
    this.nodeObject = nodeObject;
  }

  formatNode(field: Label): string {
    switch (field) {
      case Label.SERVER_IDENTITY: return this.nodeObject.host || '?' //version
      case Label.IP_PORT: return this.nodeObject?.port < 0 ? '' : this.nodeObject?.port.toString()
      case Label.BRANCH_COMMIT: return "?" // soon
      default: return '?';
    }
  }

  formatLink(field: Label): string {
    switch (field) {
      case Label.ELAPSED_LATENSE: {
        let e1 = this.nodeObject.end - this.nodeObject.start;
        if(!e1){
          return "?";
        }
        let e2 = 0;
        if (this.nodeObject.remoteTrace) {
          let e3 = this.nodeObject.remoteTrace.end - this.nodeObject.remoteTrace.start;
          if(e3){
            e2 = e1 - e3;
          }
        }
        return `${e1.toFixed(3)}s` + (e2 >= 1 ? `~${e2.toFixed(3)}s` : '');
      }
      case Label.METHOD_RESOURCE: return `${this.nodeObject.method || "?"} ${this.nodeObject.path || "?"}`
      case Label.SIZE_COMPRESSION: return `${this.nodeObject.inDataSize < 0 ? 0 : sizeFormatter(this.nodeObject.inDataSize) } ↓↑ ${this.nodeObject.outDataSize < 0 ? 0 :sizeFormatter(this.nodeObject.outDataSize) }`
      case Label.PROTOCOL_SCHEME: return `${this.nodeObject.protocol || "?"}/${this.nodeObject.authScheme || "?"}`
      case Label.STATUS_EXCEPTION: return (this.nodeObject.status!= null ? this.nodeObject.status.toString():"?")+ (this.nodeObject?.exception ? ': ' + (this.nodeObject?.exception?.type || this.nodeObject?.exception?.message ):'');
      case Label.USER: return `${this.nodeObject.remoteTrace?.user ?? "?"}`
      default: return '?';
    }
  }

  getLinkStyle(): string {
    if (this.nodeObject.end == null) return 'ONGOING';
    switch(true){
      case (this.nodeObject.status >= 200 && this.nodeObject.status < 300): return "SUCCES";
      case (this.nodeObject.status >= 400 && this.nodeObject.status < 500):  return "CLIENT_ERROR"
      case (this.nodeObject.status >=500):  return "ERROR";
      case (this.nodeObject.status == 0):   return "UNREACHABLE"
    }
  }
}

export enum Label {
  SERVER_IDENTITY = "SERVER_IDENTITY",
  OS_RE = "OS_RE",
  IP_PORT = "IP_PORT",
  BRANCH_COMMIT = "BRANCH_COMMIT",
  ELAPSED_LATENSE = "ELAPSED_LATENSE",
  METHOD_RESOURCE = "METHOD_RESOURCE",
  SIZE_COMPRESSION = "SIZE_COMPRESSION",
  PROTOCOL_SCHEME = "PROTOCOL_SCHEME",
  STATUS_EXCEPTION = "STATUS_EXCEPTION",
  USER = "USER"
}

function getCommand<T>(arr: T[], multiple: string) {
  if (arr) {
    let r = arr.reduce((acc: any, item: any) => {
      if (!acc[item]) {
        acc[item] = 0
      }
      return acc;
    }, {});
    return Object.keys(r).length == 1
      ? Object.keys(r)[0]
      : multiple;
  }
  return '?';
}

function sizeFormatter(value:any){
  if(!value && value!= 0) return '';
  if(value < 1024){
    return `${value}o`;
  }
  const units= ['ko','Mo' ];
  let size = value / 1024;
  let ui = 0;

  while( size>= 1024 && ui < units.length -1){
    size /= 1024;
    ui++;
  }

  return `${size.toFixed(2)} ${units[ui]}`;
}

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
      if (cell?.isEdge() && cell.value && typeof cell.value === 'object' && cell.value.hasOwnProperty('linkLbl')) {
        let compare = cell.value.nodes[0].formatLink(cell.value.linkLbl)
        return tg.checkSome(cell.value.nodes, x => x.formatLink(cell.value.linkLbl) != compare) ? `... ×${cell.value.nodes.length}` : `${compare} ×${cell.value.nodes.length}`
      }else if(cell?.isVertex() && cell.value && typeof cell.value === 'object'){
        const lbl: string = cell.value.node.formatNode(cell.value.serverlbl) ?? '';
        return lbl.length > 22 ? lbl.substring(0, 22) + '…' : lbl;
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

    // Highlight vertices and edges on hover
    const cellTracker = new mx.mxCellTracker(graph, '#dbeafe'); // blue-100 tint
    cellTracker.highlight.opacity = 30; // subtle — 0-100

    graph.setTooltips(false); // tooltip désactivée — remplacée par la detail card
    mx.mxGraph.prototype.getTooltipForCell = function (cell: any) { //tooltip (kept for API compatibility)

      if (cell.isEdge()) {
        let modal;
        if (cell.value.nodes) {
          let res = tg.groupBy(cell.value.nodes, (v: any) => v.formatLink(cell.value.linkLbl))
          let entries = Object.entries(res)
          if(cell.value.linkLbl =="ELAPSED_LATENSE"){
            entries = entries.sort((a,b) => (+b[0].substring(0,b[0].length -1) - +a[0].substring(0,a[0].length -1) ))
          }
          modal = tg.getModal(entries, cell.value.nodes.length);
        }
        else {
          modal = `<b>${cell.value}</b>`
        }
        return modal;
      }
      if(cell.isVertex()){
        if(cell.value.node){
          if(cell.value.node.nodeObject ){
            if(cell.value.node.nodeObject.remoteList){
              let res = tg.groupBy(cell.value.node.nodeObject.remoteList, (v: any) => v.formatLink(cell.value.linkLbl))
              if(res){
                let entries = Object.entries(res);
                return tg.getModal(entries, cell.value.node.nodeObject.remoteList.length);
              }
            }
            const fullLbl = cell.value.node.formatNode(cell.value.serverlbl);
            const linkLbl = cell.value.node.formatLink(cell.value.linkLbl);
            const parts: string[] = [];
            if (fullLbl) parts.push(`<b>${fullLbl}</b>`);
            if (linkLbl) parts.push(`<span>${linkLbl}</span>`);
            return parts.length ? parts.join('<br>') : '';
          }
        }
      }
      return '';
    }
    return tg
  }

  getModal(entries: any[], nodesLength: number){
    let modal = "";
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
      modal += `...<b>${nodesLength - count} Autres</b>`
    }
    return modal;
  }

  groupBy<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } {
    return array.reduce((acc: any, item: any) => {
      var id = fn(item);
      if(id){
        if (!acc[id]) {
          acc[id] = [];
        }
        acc[id].push(item);
        return acc;
      }
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
      this.animateOngoingEdges();
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
    style[mx.mxConstants.STYLE_VERTICAL_LABEL_POSITION] = 'bottom';
    style[mx.mxConstants.STYLE_VERTICAL_ALIGN]          = 'top';
    style[mx.mxConstants.STYLE_FONTCOLOR]               = '#1e293b';
    style[mx.mxConstants.STYLE_FONTSIZE]                = 9;
    style[mx.mxConstants.STYLE_FONTFAMILY]              = 'Inter, system-ui, sans-serif';
  }

  setEdgeDefaultStyle() {
    let style = this.graph.getStylesheet().getDefaultEdgeStyle();
    style[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#f1f5f9';     // light slate pill
    style[mx.mxConstants.STYLE_LABEL_BORDERCOLOR]     = '#cbd5e1';     // subtle border
    style[mx.mxConstants.STYLE_ROUNDED]       = 1;     // subtle border
    style[mx.mxConstants.STYLE_CURVED]       = 1;     // subtle border// subtle border
    style[mx.mxConstants.STYLE_LABEL_PADDING]         = 4;
    style[mx.mxConstants.EDGE_SELECTION_STROKEWIDTH]  = 10;
    style[mx.mxConstants.STYLE_STROKEWIDTH]           = 0.5;
    style[mx.mxConstants.STYLE_ENDARROW] = "none";
    style[mx.mxConstants.STYLE_ENDSIZE]               = 2;
    style[mx.mxConstants.STYLE_ENDFILL]               = 1;
    style[mx.mxConstants.STYLE_SOURCE_PERIMETER_SPACING] = 12;
    style[mx.mxConstants.STYLE_FONTSIZE]              = 8;
    style[mx.mxConstants.STYLE_FONTCOLOR]             = '#334155';     // slate-700
    style[mx.mxConstants.STYLE_FONTFAMILY]            = 'Inter, system-ui, sans-serif';
  }

  clearCells() {
    this.disconnectObserver(); // clean up observer before full redraw
    this.clearHighlight();
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

  private _ongoingObserver: MutationObserver | null = null;

  animateOngoingEdges() {
    if (!document.getElementById('ongoing-edge-anim')) {
      const style = document.createElement('style');
      style.id = 'ongoing-edge-anim';
      style.textContent = `
        @keyframes dashFlow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -18; }
        }
        path[stroke="#3b82f6"] {
          stroke-dasharray: 12 6;
          animation: dashFlow 1.2s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private _applyOngoingAnimation() {}

  disconnectObserver() {
    this._ongoingObserver?.disconnect();
    this._ongoingObserver = null;
  }

  private _clickHighlight: any = null;
  private _pathHighlights: any[] = [];

  /** Highlight a single cell (kept for hover use) */
  highlightCell(cell: any) {
    if (this._clickHighlight) {
      this._clickHighlight.destroy();
      this._clickHighlight = null;
    }
    if (cell) {
      this._injectGlowStyle();
      this._clickHighlight = new mx.mxCellHighlight(this.graph, '#6366f1', 2.5, false);
      this._clickHighlight.opacity = 80;
      this._clickHighlight.highlight(this.graph.view.getState(cell));
      const hl = this._clickHighlight as any;
      setTimeout(() => {
        const node: SVGElement | null = hl?.shape?.node ?? null;
        if (node) {
          node.style.filter = 'drop-shadow(0 0 6px #6366f1cc)';
          node.style.animation = 'cellGlow 1.8s ease-in-out infinite';
        }
      }, 0);
    }
  }

  /**
   * Path Highlighting — highlight the full path from root to the clicked cell
   * and all its descendants, including every traversed edge.
   */
  highlightPath(cell: any) {
    this.clearHighlight();
    if (!cell) return;

    this._injectGlowStyle();

    const toHighlight: any[] = [];

    if (cell.isVertex()) {
      toHighlight.push(cell);
      this._collectAncestors(cell, toHighlight);
      this._collectDescendants(cell, toHighlight);
    } else if (cell.isEdge()) {
      toHighlight.push(cell);
      if (cell.source && !toHighlight.includes(cell.source)) {
        toHighlight.push(cell.source);
        this._collectAncestors(cell.source, toHighlight);
      }
      if (cell.target && !toHighlight.includes(cell.target)) {
        toHighlight.push(cell.target);
        this._collectDescendants(cell.target, toHighlight);
      }
    }

    this._pathHighlights = toHighlight.map(c => {
      const color  = c.isEdge() ? '#f59e0b' : '#6366f1';
      const width  = c.isEdge() ? 2 : 2.5;
      const hl = new mx.mxCellHighlight(this.graph, color, width, false);
      hl.opacity = 80;
      hl.highlight(this.graph.view.getState(c));
      setTimeout(() => {
        const node: SVGElement | null = (hl as any)?.shape?.node ?? null;
        if (node) {
          node.style.filter = `drop-shadow(0 0 5px ${color}cc)`;
          node.style.animation = 'cellGlow 1.8s ease-in-out infinite';
        }
      }, 0);
      return hl;
    });
  }

  private _collectAncestors(cell: any, result: any[]) {
    const incoming: any[] = this.graph.getEdges(cell, this.parent, true, false, false);
    incoming.forEach((e: any) => {
      if (!result.includes(e)) {
        result.push(e);
        const src = e.source;
        if (src && !result.includes(src)) {
          result.push(src);
          this._collectAncestors(src, result);
        }
      }
    });
  }

  private _collectDescendants(cell: any, result: any[]) {
    const outgoing: any[] = this.graph.getEdges(cell, this.parent, false, true, false);
    outgoing.forEach((e: any) => {
      if (!result.includes(e)) {
        result.push(e);
        const tgt = e.target;
        if (tgt && !result.includes(tgt)) {
          result.push(tgt);
          this._collectDescendants(tgt, result);
        }
      }
    });
  }

  private _injectGlowStyle() {
    if (!document.getElementById('cell-highlight-anim')) {
      const s = document.createElement('style');
      s.id = 'cell-highlight-anim';
      s.textContent = `
        @keyframes cellGlow {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.5; }
        }
      `;
      document.head.appendChild(s);
    }
  }

  clearHighlight() {
    if (this._clickHighlight) {
      this._clickHighlight.destroy();
      this._clickHighlight = null;
    }
    this._pathHighlights.forEach(hl => hl.destroy());
    this._pathHighlights = [];
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
  BATCH: { icon: "shape=image;image=assets/mxgraph/batch.drawio.svg;", width: 30, height: 30 },
}

export const LinkConfig = {
  SUCCES:       "strokeColor=#22c55e;",
  CLIENT_ERROR: "strokeColor=#f9ad4e;",
  ERROR:        "strokeColor=#ef4444;",
  UNREACHABLE:  "strokeColor=#ef4444;",
  ONGOING:      "strokeColor=#3b82f6;dashed=1;ongoing=1;"
}
