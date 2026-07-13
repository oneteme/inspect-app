import {AfterViewChecked, Component, ElementRef, inject, OnInit, QueryList, ViewChildren} from '@angular/core';
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
  appName?: string;       // application appelante (caller)
  version?: string;
  os?: string;
  re?: string;            // environnement du caller
  address?: string;
  method?: string;
  path?: string;
  start?: number;
  end?: number;
  status?: number;
  inDataSize?: number;    // octets reçus par le caller
  outDataSize?: number;   // octets envoyés par le caller
  sessionId?: string;
  authScheme?: string;
  bodyContent?: string;
  branch?: string;
  hash?: string;
  environment?: string;
  exception?: { type?: string; message?: string } | string;
  remoteTrace?: RemoteTrace; // application appelée (callee)
}

@Component({
  selector: 'app-compare',
  templateUrl: './compare.view.html',
  styleUrls: ['./compare.view.scss'],
})
export class CompareView implements OnInit, AfterViewChecked {

  id: string;
  data: CompareItem[];
  isLoading = false;
  private _graphsDrawn = false;

  private readonly _pageTitleService = inject(PageTitleService);

  @ViewChildren('graphContainer') graphContainers: QueryList<ElementRef>;

  constructor(private readonly route: ActivatedRoute, private readonly traceService: TraceService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id_request');
    this.isLoading = true;
    this._pageTitleService.set({ icon: 'compare_arrows', iconOutlined: true, title: 'Comparaison', subtitle: this.id });

    this.traceService.getCompare(this.id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe((res: any) => {
        this.data = Array.isArray(res) ? res : (res ? [res] : []);
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
    if (!status && status != 0) return '#3b82f6';   // ongoing/unknown
    if (status >= 500 || status == 0 )           return '#ef4444';   // server error
    if (status >= 400)           return '#f9ad4e';   // client error
    return '#22c55e';                                // success
  }

  private drawGraph(container: HTMLElement, item: CompareItem): void {
    // ── Valeurs calculées depuis la structure RestRequestWrapper ─────
    const remote        = item.remoteTrace;
    const callerAppName = item.appName    || 'Caller';
    const calleeAppName = remote?.appName || 'Callee';
    const callerVersion = item.version;
    const calleeVersion = remote?.version;
    const calleeName    = remote?.name;
    const calleeThread  = remote?.threadName;
    const callerEnv     = item.re;
    const calleeEnv     = remote?.re;

    const callerElapsed = (item.end != null && item.start != null)    ? item.end    - item.start    : null;
    const calleeElapsed = (remote?.end != null && remote?.start != null) ? remote.end - remote.start : null;
    const networkLatency = (callerElapsed != null && calleeElapsed != null)
      ? callerElapsed - calleeElapsed : null;

    const status    = remote?.status ?? item.status;
    const colorItem   = this.getStatusColor(item?.status);    // couleur côté caller (gauche)
    const colorRemote = this.getStatusColor(remote?.status); // couleur côté callee (droite)
    const user      = remote?.user;
    const CalleeUser = remote?.user
    const method    = item.method;
    const calleeMethod = remote?.method; // todo remove post
    const path      = item.path;
    const calleePath    = remote?.path;
    const outSize   = Math.max(item.outDataSize, 0);   // envoyé par le caller
    const inSize    = Math.max(item.inDataSize, 0);   // reçu par le caller
    const calleeOutSize = Math.max(remote?.outDataSize, 0);
    const calleeInSize = remote?.inDataSize > 0   ? remote.inDataSize : 0;
    const exception = remote?.exception
      ? (typeof remote.exception === 'string' ? remote.exception : remote.exception.type || remote.exception.message)
      : null;
    const itemException = item.exception
      ? (typeof item.exception === 'string' ? item.exception : item.exception.type || item.exception.message)
      : null;

    // ── Champs branch / hash / environment / bodyContent ─────────────
    const callerBranch      = item.branch;
    const callerHash        = item.hash ? item.hash.substring(0, 7) : null;
    const callerEnvironment = item.environment;
    const callerBodyContent = item.bodyContent;

    const calleeBranch      = remote?.branch;
    const calleeHash        = remote?.hash ? remote.hash.substring(0, 7) : null;
    const calleeEnvironment = remote?.environment;
    const color = this.getStatusColor(status);

    const graph = new mx.mxGraph(container);
    graph.setCellsLocked(true);
    graph.setCellsMovable(false);
    graph.setCellsSelectable(false);
    graph.setTooltips(true);
    graph.foldingEnabled = false;
    graph.isCellFoldable = () => false;
    mx.mxEvent.disableContextMenu(container);

    // ── Default vertex style ──────────────────────────────
    const vStyle = graph.getStylesheet().getDefaultVertexStyle();
    vStyle[mx.mxConstants.STYLE_FONTCOLOR]    = '#1e293b';
    vStyle[mx.mxConstants.STYLE_FONTSIZE]     = 12;
    vStyle[mx.mxConstants.STYLE_FONTFAMILY]   = 'Inter, system-ui, sans-serif';
    vStyle[mx.mxConstants.STYLE_FONTSTYLE]    = mx.mxConstants.FONT_BOLD;
    vStyle[mx.mxConstants.STYLE_ROUNDED]      = 1;
    vStyle[mx.mxConstants.STYLE_ARCSIZE]      = 10;
    vStyle[mx.mxConstants.STYLE_VERTICAL_LABEL_POSITION] = 'middle';
    vStyle[mx.mxConstants.STYLE_VERTICAL_ALIGN]          = 'middle';

    // ── Default edge style ────────────────────────────────
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
    eStyle[mx.mxConstants.STYLE_EDGESTYLE]             = mx.mxConstants.NONE; // flèches droites

    const parent = graph.getDefaultParent();
    const NODE_W  = 250;
    const NODE_H  = 250;
    const H_SPACE = 800;
    const NODE_Y  = 60;

    let bodyCell: any = null;
    const tooltipMap = new Map<any, string>();

    // Helper: child label sur un vertex avec auto-troncature si availableWidthPx > 0
    const addVertexLabel = (vertex: any, text: string, x: number, y: number, extraStyle: string = '', availableWidthPx: number = 0) => {
      if (!text) return;
      let displayText = text;
      if (availableWidthPx > 0) {
        const fsMatch = /fontSize=(\d+)/.exec(extraStyle);
        const fs = fsMatch ? Number.parseInt(fsMatch[1]) : 10;
        const maxLen = Math.floor(availableWidthPx / (fs * 0.6));
        if (text.length > maxLen) {
          displayText = text.substring(0, maxLen) + '…';
        }
      }
      const geo = new mx.mxGeometry(x, y, 0, 0);
      geo.relative = true;
      const cell = new mx.mxCell(displayText, geo,
        `resizable=0;html=0;align=center;verticalAlign=middle;` +
        `fontFamily=Inter,system-ui,sans-serif;strokeColor=none;fillColor=none;${extraStyle}`);
      cell.vertex = true;
      graph.getModel().add(vertex, cell);
      if (displayText !== text) tooltipMap.set(cell, text);
    };

    // Helper: child label sur une arête avec auto-troncature si availableWidthPx > 0
    // La fontSize est extraite de extraStyle (défaut 10). ~0.6px par char par pt de fontSize.
    const addEdgeLabel = (edge: any, text: string, x: number, yOff: number, align: string = 'center', extraStyle: string = '', availableWidthPx: number = 0): any => {
      if (!text) return null;
      let displayText = text;
      if (availableWidthPx > 0) {
        const fsMatch = /fontSize=(\d+)/.exec(extraStyle);
        const fs = fsMatch ? Number.parseInt(fsMatch[1]) : 10;
        const maxLen = Math.floor(availableWidthPx / (fs * 0.6));
        if (text.length > maxLen) {
          displayText = text.substring(0, maxLen) + '…';
        }
      }
      const geo = new mx.mxGeometry(x, yOff, 0, 0);
      geo.relative = true;
      const cell = new mx.mxCell(displayText, geo,
        `resizable=0;html=0;align=${align};verticalAlign=middle;` +
        `fontSize=10;fontFamily=Inter,system-ui,sans-serif;` +
        `labelBackgroundColor=#f8fafc;labelBorderColor=#e2e8f0;labelPadding=3;` +
        `strokeColor=none;fillColor=none;${extraStyle}`);
      cell.vertex = true;
      graph.getModel().add(edge, cell);
      if (displayText !== text) tooltipMap.set(cell, text);
      return cell;
    };
    graph.getModel().beginUpdate();
    try {
      // ── Caller node (left) ───────────────────────────────
      const caller = graph.insertVertex(parent, null, '',
        40, NODE_Y, NODE_W, NODE_H,
        `fillColor=#dbeafe;strokeColor=#3b82f6;`);
      addVertexLabel(caller, callerAppName, 0.5, 0.05, `fontSize=11;fontStyle=1;fontColor=#1e293b;`, NODE_W);
      addVertexLabel(caller, callerVersion, 0.5, 0.12, `fontSize=8;fontColor=#64748b;`, NODE_W);
      addVertexLabel(caller, user,                                               0.99, 0.27, `fontSize=6;fontStyle=1;fontColor=#f59e0b;align=right;`, NODE_W * 0.5);
      addVertexLabel(caller, [callerBranch, callerHash].filter(Boolean).join('@'), 0.5, 0.95, `fontSize=8;fontColor=#64748b;fontStyle=2;`, NODE_W);
      addVertexLabel(caller, callerEnvironment,                                  0.9, -0.05, `fontSize=8;fontColor=#0369a1;`, NODE_W * 0.5);
      addVertexLabel(caller, item.address,                                       0.5, 1.05, `fontSize=8;fontColor=#0369a1;`, NODE_W);
      addVertexLabel(caller, [item.os, callerEnv].filter(Boolean).join('  '),    0.5, 1.11, `fontSize=7;fontColor=#94a3b8;`, NODE_W);

      // ── Callee node (right) ──────────────────────────────
      const callee = graph.insertVertex(parent, null, '',
        40 + NODE_W + H_SPACE, NODE_Y, NODE_W, NODE_H,
        `fillColor=#ede9fe;strokeColor=#6366f1;`);
      addVertexLabel(callee, calleeAppName, 0.5, 0.05, `fontSize=11;fontStyle=1;fontColor=#1e293b;`, NODE_W);
      addVertexLabel(callee, calleeVersion, 0.5, 0.12, `fontSize=8;fontColor=#64748b;`, NODE_W);
      addVertexLabel(callee, user,                                                 0.01, 0.27, `fontSize=6;fontStyle=1;fontColor=#f59e0b;align=left;`, NODE_W * 0.5);
      addVertexLabel(callee, [calleeBranch, calleeHash].filter(Boolean).join('@'), 0.5, 0.95, `fontSize=8;fontColor=#64748b;fontStyle=2;`, NODE_W);
      addVertexLabel(callee, calleeEnvironment,                                    0.1, -0.05, `fontSize=8;fontColor=#4338ca;`, NODE_W * 0.5);
      addVertexLabel(callee, remote?.address,                                      0.5, 1.05, `fontSize=8;fontColor=#4338ca;`, NODE_W);
      addVertexLabel(callee, [remote?.os,calleeEnv].filter(Boolean).join('  '),    0.5, 1.11, `fontSize=7;fontColor=#94a3b8;`, NODE_W);
      addVertexLabel(callee, [remote?.status?.toString(), exception].filter(Boolean).join('  '), 0.5, 0.7, `fontSize=9;fontColor=${colorRemote};fontStyle=1;`, NODE_W);
      // ── Vertex enfant : traitement effectué par le caller ────────
      if (callerElapsed || item.sessionId) {
        const callerDurationStr = callerElapsed ? formatDuration(callerElapsed, 2) : null;
        const callerProcW = Math.round(0.54 * NODE_W);
        const callerProcH = Math.round(0.28 * NODE_H);
        const callerProcX = (NODE_W - callerProcW) / 2;
        const callerProcY = (NODE_H - callerProcH) / 2;
        const callerProcGeo = new mx.mxGeometry(callerProcX, callerProcY, callerProcW, callerProcH);
        const callerProcCell = new mx.mxCell('', callerProcGeo,
          `fillColor=#eff6ff;strokeColor=#3b82f6;strokeWidth=1.5;rounded=1;arcSize=12;whiteSpace=wrap;`);
        callerProcCell.vertex = true;
        graph.getModel().add(caller, callerProcCell);
        addVertexLabel(callerProcCell, callerDurationStr, 0.99, 0.1, `fontSize=8;fontColor=#1e3a5f;fontStyle=1;align=right;`);
        addVertexLabel(callerProcCell, item.sessionId,    0.5, 0.7, `fontSize=7;fontColor=#1e3a5f;fontStyle=0;`);
      }

      // ── Vertex enfant : traitement effectué par le callee ────────
      if (calleeName || calleeElapsed || calleeThread) {
        const durationStr = calleeElapsed ? formatDuration(calleeElapsed, 2) : null;
        const procW = Math.round(0.54 * NODE_W);
        const procH = Math.round(0.28 * NODE_H);
        const procX = (NODE_W - procW) / 2;
        const procY = (NODE_H - procH) / 2;
        const procGeo = new mx.mxGeometry(procX, procY, procW, procH);
        const procCell = new mx.mxCell('', procGeo,
          `fillColor=#f5f3ff;strokeColor=#6366f1;strokeWidth=1.5;rounded=1;arcSize=12;whiteSpace=wrap;`);
        procCell.vertex = true;
        graph.getModel().add(callee, procCell);
        addVertexLabel(procCell, durationStr,  0.99, 0.1, `fontSize=8;fontColor=#3b0764;fontStyle=1;align=right;`);
        addVertexLabel(procCell, calleeName,   0.5, 0.3, `fontSize=8;fontColor=#3b0764;fontStyle=1;`);
        addVertexLabel(procCell, calleeThread, 0.5, 0.9, `fontSize=7;fontColor=#3b0764;fontStyle=0;`);
      }

      // ── Request arrow → (tiers supérieur du nœud, sortie à 28%) ─────
      const reqEdge = graph.insertEdge(parent, null, '', caller, callee,
        `strokeColor=#22c55e;exitX=1;exitY=0.28;exitDx=0;exitDy=0;entryX=0;entryY=0.28;entryDx=0;entryDy=0;edgeStyle=none;`);

      // Labels flèche requête (au-dessus)
      addEdgeLabel(reqEdge, [new Date(item.start*1000).toISOString()].filter(Boolean).join('  '), -0.95, 10, 'left', 'fontSize=6;', NODE_W);
      addEdgeLabel(reqEdge, [outSize != null ? `${outSize}o` : null].filter(Boolean).join('  '), -0.95, -10, 'left', 'fontSize=6;', NODE_W);
      const scheme = item.authScheme ?? null;
      addEdgeLabel(reqEdge, [scheme != null ? '🔒' : null, method, path].filter(Boolean).join('  '), 0, 10, 'center', 'fontSize=9;', H_SPACE * 0.55);
      if(method != calleeMethod || path != calleePath) {
        addEdgeLabel(reqEdge, [calleeMethod, calleePath].filter(Boolean).join('  '), 0, -10, 'center', 'fontSize=9;', H_SPACE * 0.55);
      }

      addEdgeLabel(reqEdge, [
        //callerElapsed != null ? formatDuration(callerElapsed, 2) : null,
        //networkLatency != null && networkLatency > 0 ? `~${formatDuration(networkLatency, 2)}` : null,
        //status != null ? String(status) : null,
      ].filter(Boolean).join('  '), 0.95, -10, 'right');
      addEdgeLabel(reqEdge, [new Date(remote.start*1000).toISOString(), `~${formatDuration(remote?.start - item?.start, 2)}`].filter(Boolean).join('  '), 0.95, 10, 'right', 'fontSize=6;', NODE_W);
      addEdgeLabel(reqEdge, [calleeInSize != null ? `${calleeInSize}o` : null].filter(Boolean).join('  '), 0.95, -10, 'right', 'fontSize=6;', NODE_W);

      // ── Response arrow ← split en 2 couleurs ────────────────────────
      // Calcul du point de jonction au centre horizontal entre les deux nœuds
      const midX = 40 + NODE_W + H_SPACE / 2;
      const midY = NODE_Y + Math.round(NODE_H * 0.72);

      // Demi-arête DROITE : callee → midpoint  (colorRemote = remote.status)
      const resHalf1 = graph.insertEdge(parent, null, '', callee, null,
        `strokeColor=${colorRemote};strokeWidth=2;exitX=0;exitY=0.72;exitDx=0;exitDy=0;edgeStyle=none;endArrow=none;`);
      const resGeo1 = graph.getCellGeometry(resHalf1).clone();
      resGeo1.setTerminalPoint(new mx.mxPoint(midX, midY), false);
      graph.getModel().setGeometry(resHalf1, resGeo1);

      // Demi-arête GAUCHE : midpoint → caller  (colorItem = item.status)
      const resHalf2 = graph.insertEdge(parent, null, '', null, caller,
        `strokeColor=${colorItem};strokeWidth=2;entryX=1;entryY=0.72;entryDx=0;entryDy=0;edgeStyle=none;endArrow=block;endFill=1;endSize=8;`);
      const resGeo2 = graph.getCellGeometry(resHalf2).clone();
      resGeo2.setTerminalPoint(new mx.mxPoint(midX, midY), true);
      graph.getModel().setGeometry(resHalf2, resGeo2);

      // Labels flèche réponse — distribués sur les deux demi-arêtes
      // ⚠ resHalf1 source=callee(droite) → x=-0.9 près callee
      // ⚠ resHalf2 target=caller(gauche) → x=+0.9 près caller
      addEdgeLabel(resHalf1, [new Date(remote.end*1000).toISOString()].filter(Boolean).join(''), -0.9, -10, 'right', 'fontSize=6;', NODE_W);
      addEdgeLabel(resHalf1, [`${calleeOutSize}o`].filter(Boolean).join(''), -0.9, 10, 'right', 'fontSize=6;', NODE_W);
      // Au-dessus : remote.status + exception callee (colorRemote)
      const remoteLabel = [remote?.status.toString(), exception].filter(Boolean).join('  ');
      // En-dessous : item.status + (exception caller OU bodyContent) (colorItem)
      if (remote?.status != item.status){
        const itemSuffix = itemException || callerBodyContent || '';
        bodyCell = addEdgeLabel(resHalf1, [item.status.toString(), itemSuffix].filter(Boolean).join('  '), 0.9, 10, 'center', `fontSize=9;fontColor=${colorItem};`, H_SPACE * 0.3);
      }

      addEdgeLabel(resHalf2, [`${inSize}o`].filter(Boolean).join(''), 0.9, 10, 'left', 'fontSize=6;', NODE_W);
      addEdgeLabel(resHalf2, [new Date(item.end*1000).toISOString(),  `~${formatDuration(item?.end - remote?.end, 2)}`].filter(Boolean).join('  '), 0.9, -10, 'left', 'fontSize=6;', NODE_W);
    } finally {
      graph.getModel().endUpdate();
    }

    // ── Tooltip sur les textes tronqués ─────────────────────────────
    graph.getTooltipForCell = (cell: any): string => {
      return tooltipMap.get(cell) ?? '';
    };

    // ── Resize & center ──────────────────────────────────────────────
    this.resizeAndCenter(graph, container);
  }

  /** Inspiré de TreeGraph.resizeAndCenter — adapte le conteneur aux vraies bounds du graphe */
  private resizeAndCenter(graph: any, container: HTMLElement): void {
    const margin     = 20;
    const maxScale   = 1.0;
    const labelExtra = 35; // espace pour les labels enfants au-dessus/en-dessous des flèches

    // 1. Reset à l'échelle 1 → bounds en vrais pixels (non scalées)
    graph.view.scaleAndTranslate(1, 0, 0);

    const bounds = graph.getGraphBounds();
    if (!bounds || bounds.width === 0) return;

    // 2. Largeur = parent (.compare-item) ; hauteur calculée depuis les vraies bounds
    //    + labelExtra × 2 car les labels d'arêtes débordent au-dessus et en-dessous des nœuds
    const availW = container.parentElement?.clientWidth ?? 800;
    const totalH = Math.max(180, Math.ceil(bounds.height) + labelExtra * 2 + margin * 2);

    container.style.width  = availW + 'px';
    container.style.height = totalH + 'px';
    graph.doResizeContainer(availW, totalH);

    // 3. Échelle : on cherche à faire tenir le contenu (hors labelExtra) dans la zone utile
    const w  = bounds.width;
    const h  = bounds.height;
    const cw = availW - margin * 2;
    const ch = totalH - (margin + labelExtra) * 2;
    const s  = Math.min(maxScale, Math.min(cw / w, ch / h));

    // 4. Centrage — labelExtra réservé en haut pour les labels au-dessus de la flèche requête
    graph.view.scaleAndTranslate(
      s,
      (margin + cw - w * s) / (2 * s) - bounds.x,
      (margin + labelExtra) / s + (ch - h * s) / (2 * s) - bounds.y
    );
  }
}
