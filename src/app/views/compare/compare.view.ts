import {AfterViewChecked, Component, ElementRef, inject, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {finalize} from 'rxjs';
import {TraceService} from '../../service/trace.service';
import {PageTitleService} from '../../service/page-title.service';
import {formatDuration} from '../../shared/pipe/duration.pipe';
import mx from 'src/mxgraph';

export interface RemoteTrace {
  appName?: string;
  version?: string;
  name?: string;
  threadName?: string;
  os?: string;
  re?: string;
  address?: string;
  method?: string;
  path?: string;
  start?: number;
  end?: number;
  status?: number;
  inDataSize?: number;
  outDataSize?: number;
  user?: string;
  branch?: string;
  hash?: string;
  environment?: string;
  exception?: { type?: string; message?: string } | string;
}

/** Correspond au type RestRequestWrapper retourné par getCompare() */
export interface CompareItem {
  '@type'?: string;
  appName?: string;
  version?: string;
  os?: string;
  re?: string;
  address?: string;
  method?: string;
  path?: string;
  start?: number;
  end?: number;
  status?: number;
  inDataSize?: number;
  outDataSize?: number;
  sessionId?: string;
  authScheme?: string;
  bodyContent?: string;
  branch?: string;
  hash?: string;
  environment?: string;
  exception?: { type?: string; message?: string } | string;
  remoteTrace?: RemoteTrace;
}

type LabelFn = (vertex: any, text: string, x: number, y: number, style?: string, width?: number) => void;

@Component({
  selector: 'app-compare',
  templateUrl: './compare.view.html',
  styleUrls: ['./compare.view.scss'],
})
export class CompareView implements OnInit, AfterViewChecked, OnDestroy {

  id: string;
  data: CompareItem[];
  isLoading = false;
  private _graphsDrawn = false;
  private _graphs: any[] = [];
  private _resizeObservers: ResizeObserver[] = [];

  private readonly _pageTitleService = inject(PageTitleService);

  @ViewChildren('graphContainer') graphContainers: QueryList<ElementRef>;

  constructor(private readonly route: ActivatedRoute, private readonly traceService: TraceService) {}

  ngOnDestroy(): void {
    this._destroyGraphs();
  }

  private _destroyGraphs(): void {
    this._resizeObservers.forEach(ro => ro.disconnect());
    this._resizeObservers = [];
    this._graphs.forEach(g => { try { g.destroy(); } catch { /* ignore */ } });
    this._graphs = [];
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id_request');
    this.isLoading = true;
    this._pageTitleService.set({ icon: 'compare_arrows', iconOutlined: true, title: 'Comparaison', subtitle: this.id });

    this.traceService.getCompare(this.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe((res: any) => {
        this._destroyGraphs();
        if (Array.isArray(res)) {
          this.data = res;
        } else {
          this.data = res ? [res] : [];
        }
        this._graphsDrawn = false;
      });
  }

  ngAfterViewChecked(): void {
    if (this.data && !this._graphsDrawn && this.graphContainers?.length === this.data.length) {
      this._graphsDrawn = true;
      this.graphContainers.forEach((containerRef, index) => {
        this.drawGraph(containerRef.nativeElement, this.data[index]);
      });
    }
  }

  private getStatusColor(status: number): string {
    if (status == null) return '#3b82f6';            // ongoing/unknown
    if (status >= 500 || status === 0) return '#ef4444'; // server error
    if (status >= 400) return '#f9ad4e';             // client error
    return '#22c55e';                                 // success
  }

  private extractException(ex: { type?: string; message?: string } | string | undefined): string | null {
    if (!ex) return null;
    if (typeof ex === 'string') return ex;
    return ex.type || ex.message || null;
  }

  private applyDefaultStyles(graph: any): void {
    const vStyle = graph.getStylesheet().getDefaultVertexStyle();
    vStyle[mx.mxConstants.STYLE_FONTCOLOR]               = '#1e293b';
    vStyle[mx.mxConstants.STYLE_FONTSIZE]                = 12;
    vStyle[mx.mxConstants.STYLE_FONTFAMILY]              = 'Inter, system-ui, sans-serif';
    vStyle[mx.mxConstants.STYLE_FONTSTYLE]               = mx.mxConstants.FONT_BOLD;
    vStyle[mx.mxConstants.STYLE_ROUNDED]                 = 1;
    vStyle[mx.mxConstants.STYLE_ARCSIZE]                 = 10;
    vStyle[mx.mxConstants.STYLE_VERTICAL_LABEL_POSITION] = 'middle';
    vStyle[mx.mxConstants.STYLE_VERTICAL_ALIGN]          = 'middle';

    const eStyle = graph.getStylesheet().getDefaultEdgeStyle();
    eStyle[mx.mxConstants.STYLE_STROKEWIDTH]           = 2;
    eStyle[mx.mxConstants.STYLE_FONTCOLOR]             = '#1e293b';
    eStyle[mx.mxConstants.STYLE_FONTSIZE]              = 10;
    eStyle[mx.mxConstants.STYLE_FONTFAMILY]            = 'Inter, system-ui, sans-serif';
    eStyle[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = '#f8fafc';
    eStyle[mx.mxConstants.STYLE_LABEL_BORDERCOLOR]     = '#e2e8f0';
    eStyle[mx.mxConstants.STYLE_LABEL_PADDING]         = 4;
    eStyle[mx.mxConstants.STYLE_ENDARROW]              = mx.mxConstants.ARROW_BLOCK;
    eStyle[mx.mxConstants.STYLE_ENDSIZE]               = 8;
    eStyle[mx.mxConstants.STYLE_ENDFILL]               = 1;
    eStyle[mx.mxConstants.STYLE_EDGESTYLE]             = mx.mxConstants.NONE;
  }

  private populateCallerNode(caller: any, item: CompareItem, user: string, addLabel: LabelFn, NODE_W: number): void {
    const hash = item.hash ? item.hash.substring(0, 7) : null;
    addLabel(caller, item.appName || 'Caller',                           0.5,  0.05, `fontSize=11;fontStyle=1;fontColor=#1e293b;`, NODE_W);
    addLabel(caller, item.version,                                       0.5,  0.12, `fontSize=8;fontColor=#64748b;`, NODE_W);
    addLabel(caller, user,                                               0.99, 0.27, `fontSize=6;fontStyle=1;fontColor=#f59e0b;align=right;`, NODE_W * 0.5);
    addLabel(caller, [item.branch, hash].filter(Boolean).join('@'),      0.5,  0.95, `fontSize=8;fontColor=#64748b;fontStyle=2;`, NODE_W);
    addLabel(caller, item.environment,                                   0.9, -0.05, `fontSize=9;fontColor=#0369a1;`, NODE_W * 0.5);
    addLabel(caller, item.address,                                       0.5,  1.05, `fontSize=8;fontColor=#0369a1;`, NODE_W);
    addLabel(caller, [item.os, item.re].filter(Boolean).join('  '),      0.5,  1.11, `fontSize=7;fontColor=#94a3b8;`, NODE_W);
  }

  private populateCalleeNode(callee: any, remote: RemoteTrace, exception: string | null, colorRemote: string, addLabel: LabelFn, NODE_W: number): void {
    const hash = remote?.hash ? remote.hash.substring(0, 7) : null;
    addLabel(callee, remote?.appName || 'Callee',                          0.5,  0.05, `fontSize=11;fontStyle=1;fontColor=#1e293b;`, NODE_W);
    addLabel(callee, remote?.version,                                      0.5,  0.12, `fontSize=8;fontColor=#64748b;`, NODE_W);
    addLabel(callee, remote?.user,                                         0.01, 0.27, `fontSize=6;fontStyle=1;fontColor=#f59e0b;align=left;`, NODE_W * 0.5);
    addLabel(callee, [remote?.branch, hash].filter(Boolean).join('@'),     0.5,  0.95, `fontSize=8;fontColor=#64748b;fontStyle=2;`, NODE_W);
    addLabel(callee, remote?.environment,                                  0.1, -0.05, `fontSize=9;fontColor=#4338ca;`, NODE_W * 0.5);
    addLabel(callee, remote?.address,                                      0.5,  1.05, `fontSize=8;fontColor=#4338ca;`, NODE_W);
    addLabel(callee, [remote?.os, remote?.re].filter(Boolean).join('  '), 0.5,  1.11, `fontSize=7;fontColor=#94a3b8;`, NODE_W);
    addLabel(callee, [remote?.status?.toString(), exception].filter(Boolean).join('  '), 0.5, 0.7, `fontSize=9;fontColor=${colorRemote};fontStyle=1;`, NODE_W);
  }

  private drawGraph(container: HTMLElement, item: CompareItem): void {
    const remote = item.remoteTrace;

    if (!remote) {
      container.style.cssText = `display:flex;align-items:center;justify-content:center;height:80px;color:#94a3b8;font-family:Inter,system-ui,sans-serif;font-size:13px;`;
      container.textContent = 'Aucune trace distante disponible pour cet élément.';
      return;
    }
    const callerElapsed = item.end != null && item.start != null ? item.end - item.start : null;
    const calleeElapsed = remote?.end != null && remote?.start != null ? remote.end - remote.start : null;
    const colorItem     = this.getStatusColor(item.status);
    const colorRemote   = this.getStatusColor(remote?.status);
    const exception     = this.extractException(remote?.exception);
    const itemException = this.extractException(item.exception);

    const graph = new mx.mxGraph(container);
    graph.setCellsLocked(true);
    graph.setCellsMovable(false);
    graph.setCellsSelectable(false);
    graph.setTooltips(true);
    graph.foldingEnabled = false;
    graph.isCellFoldable = () => false;
    graph.getCursorForCell = () => 'default';
    mx.mxEvent.disableContextMenu(container);
    this.applyDefaultStyles(graph);
    this._graphs.push(graph);

    const parent  = graph.getDefaultParent();
    const NODE_W  = 250;
    const NODE_H  = 250;
    const H_SPACE = 800;
    const NODE_Y  = 60;

    const tooltipMap = new Map<any, string>();

    const autoTruncate = (text: string, style: string, widthPx: number): string => {
      const fsMatch = /fontSize=(\d+)/.exec(style);
      const fs = fsMatch ? Number.parseInt(fsMatch[1]) : 10;
      const maxLen = Math.floor(widthPx / (fs * 0.6));
      return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
    };

    const addVertexLabel: LabelFn = (vertex, text, x, y, extraStyle = '', widthPx = 0) => {
      if (!text) return;
      const display = widthPx > 0 ? autoTruncate(text, extraStyle, widthPx) : text;
      const geo = new mx.mxGeometry(x, y, 0, 0);
      geo.relative = true;
      const cell = new mx.mxCell(display, geo,
        `resizable=0;html=0;align=center;verticalAlign=middle;fontFamily=Inter,system-ui,sans-serif;strokeColor=none;fillColor=none;${extraStyle}`);
      cell.vertex = true;
      graph.getModel().add(vertex, cell);
      if (display !== text) tooltipMap.set(cell, text);
    };

    const addEdgeLabel = (edge: any, text: string, x: number, yOff: number, align = 'center', extraStyle = '', widthPx = 0): any => {
      if (!text) return null;
      const display = widthPx > 0 ? autoTruncate(text, extraStyle, widthPx) : text;
      const geo = new mx.mxGeometry(x, yOff, 0, 0);
      geo.relative = true;
      const cell = new mx.mxCell(display, geo,
        `resizable=0;html=0;align=${align};verticalAlign=middle;fontSize=10;fontFamily=Inter,system-ui,sans-serif;` +
        `labelBackgroundColor=#f8fafc;labelBorderColor=#e2e8f0;labelPadding=3;strokeColor=none;fillColor=none;${extraStyle}`);
      cell.vertex = true;
      graph.getModel().add(edge, cell);
      if (display !== text) tooltipMap.set(cell, text);
      return cell;
    };

    const addChildBox = (parentCell: any, fillColor: string, strokeColor: string): any => {
      const w   = Math.round(0.54 * NODE_W);
      const h   = Math.round(0.28 * NODE_H);
      const geo = new mx.mxGeometry((NODE_W - w) / 2, (NODE_H - h) / 2, w, h);
      const cell = new mx.mxCell('', geo,
        `fillColor=${fillColor};strokeColor=${strokeColor};strokeWidth=1.5;rounded=1;arcSize=12;whiteSpace=wrap;`);
      cell.vertex = true;
      graph.getModel().add(parentCell, cell);
      return cell;
    };

    graph.getModel().beginUpdate();
    try {
      // ── Nodes ────────────────────────────────────────────────────────
      const caller = graph.insertVertex(parent, null, '', 40, NODE_Y, NODE_W, NODE_H, `fillColor=#dbeafe;strokeColor=#3b82f6;`);
      this.populateCallerNode(caller, item, remote?.user, addVertexLabel, NODE_W);

      const callee = graph.insertVertex(parent, null, '', 40 + NODE_W + H_SPACE, NODE_Y, NODE_W, NODE_H, `fillColor=#ede9fe;strokeColor=#6366f1;`);
      this.populateCalleeNode(callee, remote, exception, colorRemote, addVertexLabel, NODE_W);

      // ── Child boxes ──────────────────────────────────────────────────
      if (callerElapsed || item.sessionId) {
        const box = addChildBox(caller, '#eff6ff', '#3b82f6');
        addVertexLabel(box, callerElapsed ? formatDuration(callerElapsed, 2) : null, 0.99, 0.1, `fontSize=8;fontColor=#1e3a5f;fontStyle=1;align=right;`);

      }
      if (remote?.name || calleeElapsed || remote?.threadName) {
        const box = addChildBox(callee, '#f5f3ff', '#6366f1');
        addVertexLabel(box, calleeElapsed ? formatDuration(calleeElapsed, 2) : null, 0.99, 0.1, `fontSize=8;fontColor=#3b0764;fontStyle=1;align=right;`);
        addVertexLabel(box, remote?.name,       0.5, 0.3, `fontSize=8;fontColor=#3b0764;fontStyle=1;`);
        addVertexLabel(box, remote?.threadName, 0.5, 0.9, `fontSize=7;fontColor=#3b0764;`);
      }

      // ── Request arrow ─────────────────────────────────────────────────
      const reqEdge = graph.insertEdge(parent, null, '', caller, callee,
        `strokeColor=#22c55e;exitX=1;exitY=0.28;exitDx=0;exitDy=0;entryX=0;entryY=0.28;entryDx=0;entryDy=0;edgeStyle=none;`);

      addEdgeLabel(reqEdge, new Date(item.start * 1000).toISOString(), -0.95, 10, 'left', 'fontSize=6;', NODE_W);
      addEdgeLabel(reqEdge, `${Math.max(item.outDataSize, 0)}o`,       -0.95, -10, 'left', 'fontSize=6;', NODE_W);
      addEdgeLabel(reqEdge, [item.authScheme ? '🔒' : null, item.method, item.path].filter(Boolean).join('  '), 0, 10, 'center', 'fontSize=9;', H_SPACE * 0.55);
      if (item.method !== remote?.method || item.path !== remote?.path) {
        addEdgeLabel(reqEdge, [remote?.method, remote?.path].filter(Boolean).join('  '), 0, -10, 'center', 'fontSize=9;', H_SPACE * 0.55);
      }
      addEdgeLabel(reqEdge, `${new Date(remote.start * 1000).toISOString()}  ~${formatDuration(remote.start - item.start, 2)}`, 0.95, 10, 'right', 'fontSize=6;', NODE_W);
      addEdgeLabel(reqEdge, remote?.inDataSize > 0 ? `${remote.inDataSize}o` : null, 0.95, -10, 'right', 'fontSize=6;', NODE_W);

      // ── Response arrow (split at midpoint) ───────────────────────────
      const midX = 40 + NODE_W + H_SPACE / 2;
      const midY = NODE_Y + Math.round(NODE_H * 0.72);

      const resHalf1 = graph.insertEdge(parent, null, '', callee, null,
        `strokeColor=${colorRemote};strokeWidth=2;exitX=0;exitY=0.72;exitDx=0;exitDy=0;edgeStyle=none;endArrow=none;`);
      const resGeo1 = graph.getCellGeometry(resHalf1).clone();
      resGeo1.setTerminalPoint(new mx.mxPoint(midX, midY), false);
      graph.getModel().setGeometry(resHalf1, resGeo1);

      const resHalf2 = graph.insertEdge(parent, null, '', null, caller,
        `strokeColor=${colorItem};strokeWidth=2;entryX=1;entryY=0.72;entryDx=0;entryDy=0;edgeStyle=none;endArrow=block;endFill=1;endSize=8;`);
      const resGeo2 = graph.getCellGeometry(resHalf2).clone();
      resGeo2.setTerminalPoint(new mx.mxPoint(midX, midY), true);
      graph.getModel().setGeometry(resHalf2, resGeo2);

      // Labels côté callee
      addEdgeLabel(resHalf1, new Date(remote.end * 1000).toISOString(), -0.9, -10, 'right', 'fontSize=6;', NODE_W);
      addEdgeLabel(resHalf1, `${Math.max(remote?.outDataSize, 0)}o`,    -0.9,  10, 'right', 'fontSize=6;', NODE_W);


      if (remote.status !== item.status) {
        const bodySuffix = item.bodyContent ? item.bodyContent.substring(0, 60) + (item.bodyContent.length > 60 ? '…' : '') : '';
        const suffix = itemException || bodySuffix;
        addEdgeLabel(resHalf1, [item.status?.toString(), suffix].filter(Boolean).join('  '), 0.9, 10, 'center', `fontSize=9;fontColor=${colorItem};`, H_SPACE * 0.3);
      }

      // Labels côté caller
      addEdgeLabel(resHalf2, `${Math.max(item.inDataSize, 0)}o`, 0.9, 10, 'left', 'fontSize=6;', NODE_W);
      addEdgeLabel(resHalf2, `${new Date(item.end * 1000).toISOString()}  ~${formatDuration(item.end - remote.end, 2)}`, 0.9, -10, 'left', 'fontSize=6;', NODE_W);
    } finally {
      graph.getModel().endUpdate();
    }

    graph.getTooltipForCell = (cell: any): string => tooltipMap.get(cell) ?? '';
    this.resizeAndCenter(graph, container);

    // ── ResizeObserver : re-centre le graphe si le container change de taille ──
    const ro = new ResizeObserver(() => this.resizeAndCenter(graph, container));
    ro.observe(container.parentElement ?? container);
    this._resizeObservers.push(ro);
  }

  private resizeAndCenter(graph: any, container: HTMLElement): void {
    const margin     = 20;
    const maxScale   = 1;
    const labelExtra = 35;

    graph.view.scaleAndTranslate(1, 0, 0);
    const bounds = graph.getGraphBounds();
    if (!bounds || bounds.width === 0) return;

    const availW = container.parentElement?.clientWidth ?? 800;
    const totalH = Math.max(180, Math.ceil(bounds.height) + labelExtra * 2 + margin * 2);

    container.style.width  = `${availW}px`;
    container.style.height = `${totalH}px`;
    graph.doResizeContainer(availW, totalH);

    const { width: w, height: h, x, y } = bounds;
    const cw = availW - margin * 2;
    const ch = totalH - (margin + labelExtra) * 2;
    const s  = Math.min(maxScale, cw / w, ch / h);

    graph.view.scaleAndTranslate(
      s,
      (margin + cw - w * s) / (2 * s) - x,
      (margin + labelExtra) / s + (ch - h * s) / (2 * s) - y
    );
  }
}
