import {AfterViewChecked, Component, ElementRef, OnInit, QueryList, ViewChildren} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {TraceService} from '../../service/trace.service';
import {formatDuration} from '../../shared/pipe/duration.pipe';
import mx from 'src/mxgraph';

export interface RemoteTrace {
  appName?: string;
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
  exception?: { type?: string; message?: string } | string;
}

/** Correspond au type RestRequestWrapper retourné par getCompare() */
export interface CompareItem {
  '@type'?: string;
  appName?: string;       // application appelante (caller)
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
  private _graphsDrawn = false;

  @ViewChildren('graphContainer') graphContainers: QueryList<ElementRef>;

  constructor(private readonly route: ActivatedRoute, private readonly traceService: TraceService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id_request');
    this.traceService.getCompare(this.id).subscribe((res: any) => {
      this.data = Array.isArray(res) ? res : [res];
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
    if (!status || status === 0) return '#3b82f6';   // ongoing/unknown
    if (status >= 500)           return '#ef4444';   // server error
    if (status >= 400)           return '#f9ad4e';   // client error
    return '#22c55e';                                // success
  }

  private drawGraph(container: HTMLElement, item: CompareItem): void {
    // ── Valeurs calculées depuis la structure RestRequestWrapper ─────
    const remote        = item.remoteTrace;
    const callerAppName = item.appName    || 'Caller';
    const calleeAppName = remote?.appName || 'Callee';
    const callerEnv     = item.re;
    const calleeEnv     = remote?.re;

    const callerElapsed = (item.end != null && item.start != null)    ? item.end    - item.start    : null;
    const calleeElapsed = (remote?.end != null && remote?.start != null) ? remote.end - remote.start : null;
    const networkLatency = (callerElapsed != null && calleeElapsed != null)
      ? callerElapsed - calleeElapsed : null;

    const status    = remote?.status ?? item.status;
    const user      = remote?.user;
    const method    = item.method;
    const path      = item.path;
    const outSize   = item.outDataSize > 0   ? item.outDataSize   : null;   // envoyé par le caller
    const inSize    = item.inDataSize  > 0   ? item.inDataSize    : null;   // reçu par le caller
    const exception = remote?.exception
      ? (typeof remote.exception === 'string' ? remote.exception : remote.exception.type || remote.exception.message)
      : null;

    const color = this.getStatusColor(status);

    const graph = new mx.mxGraph(container);
    graph.setCellsLocked(true);
    graph.setCellsMovable(false);
    graph.setEnabled(false);
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
    const NODE_W  = 150;   // largeur du nœud
    const NODE_H  = 100;   // hauteur du nœud — plus grand pour bien séparer les flèches
    const H_SPACE = 440;   // espace horizontal entre les deux nœuds
    const NODE_Y  = 60;    // marge haute (laisse de la place pour les labels au-dessus)

    // Helper: child label sur un vertex
    // x: 0=gauche, 0.5=centre, 1=droite | y: 0=haut, 0.5=centre, 1=bas (relatif aux dimensions du vertex)
    const addVertexLabel = (vertex: any, text: string, x: number, y: number, extraStyle: string = '') => {
      if (!text) return;
      const geo = new mx.mxGeometry(x, y, 0, 0);
      geo.relative = true;
      const cell = new mx.mxCell(text, geo,
        `resizable=0;html=0;align=center;verticalAlign=middle;` +
        `fontFamily=Inter,system-ui,sans-serif;strokeColor=none;fillColor=none;${extraStyle}`);
      cell.vertex = true;
      graph.getModel().add(vertex, cell);
    };

    // Helper: child label sur une arête
    // x: -1=source, 0=centre, 1=cible | yOff: pixels au-dessus(<0)/en-dessous(>0) de l'arête
    const addEdgeLabel = (edge: any, text: string, x: number, yOff: number, align: string = 'center') => {
      if (!text) return;
      const geo = new mx.mxGeometry(x, yOff, 0, 0);
      geo.relative = true;
      const cell = new mx.mxCell(text, geo,
        `resizable=0;html=0;align=${align};verticalAlign=middle;` +
        `fontSize=10;fontFamily=Inter,system-ui,sans-serif;` +
        `labelBackgroundColor=#f8fafc;labelBorderColor=#e2e8f0;labelPadding=3;` +
        `strokeColor=none;fillColor=none;`);
      cell.vertex = true;
      graph.getModel().add(edge, cell);
    };

    graph.getModel().beginUpdate();
    try {
      // ── Caller node (left) ───────────────────────────────
      const caller = graph.insertVertex(parent, null, '',
        40, NODE_Y, NODE_W, NODE_H,
        `fillColor=#dbeafe;strokeColor=#3b82f6;`);
      addVertexLabel(caller, callerAppName, 0.5, callerEnv ? 0.32 : 0.5,
        `fontSize=12;fontStyle=1;fontColor=#1e293b;`);
      addVertexLabel(caller, callerEnv, 0.5, 0.75,
        `fontSize=9;fontStyle=1;fontColor=#0369a1;labelBackgroundColor=#e0f2fe;labelBorderColor=#bae6fd;labelPadding=3;`);

      // ── Callee node (right) ──────────────────────────────
      const callee = graph.insertVertex(parent, null, '',
        40 + NODE_W + H_SPACE, NODE_Y, NODE_W, NODE_H,
        `fillColor=#ede9fe;strokeColor=#6366f1;`);
      addVertexLabel(callee, calleeAppName, 0.5, calleeEnv ? 0.32 : 0.5,
        `fontSize=12;fontStyle=1;fontColor=#1e293b;`);
      addVertexLabel(callee, calleeEnv, 0.5, 0.75,
        `fontSize=9;fontStyle=1;fontColor=#4338ca;labelBackgroundColor=#ede9fe;labelBorderColor=#a5b4fc;labelPadding=3;`);

      // ── Request arrow → (tiers supérieur du nœud, sortie à 28%) ─────
      const reqEdge = graph.insertEdge(parent, null, '', caller, callee,
        `strokeColor=${color};exitX=1;exitY=0.28;exitDx=0;exitDy=0;entryX=0;entryY=0.28;entryDx=0;entryDy=0;edgeStyle=none;`);

      // Labels flèche requête (au-dessus)
      addEdgeLabel(reqEdge, [user, outSize != null ? `${outSize}o` : null].filter(Boolean).join('  '), -0.95, -10, 'left');
      addEdgeLabel(reqEdge, [method, path].filter(Boolean).join('  '), 0, -10, 'center');
      addEdgeLabel(reqEdge, [
        callerElapsed != null ? formatDuration(callerElapsed, 2) : null,
        networkLatency != null && networkLatency > 0 ? `~${formatDuration(networkLatency, 2)}` : null,
        status != null ? String(status) : null,
      ].filter(Boolean).join('  '), 0.95, -10, 'right');

      // ── Response arrow ← (tiers inférieur du nœud, sortie à 72%) ────
      const resEdge = graph.insertEdge(parent, null, '', callee, caller,
        `strokeColor=${color};exitX=0;exitY=0.72;exitDx=0;exitDy=0;entryX=1;entryY=0.72;entryDx=0;entryDy=0;edgeStyle=none;`);

      // Labels flèche réponse (en-dessous)
      addEdgeLabel(resEdge, [status != null ? String(status) : null, calleeElapsed != null ? formatDuration(calleeElapsed, 2) : null].filter(Boolean).join('  '), -0.95, 10, 'left');
      addEdgeLabel(resEdge, exception || '', 0, 10, 'center');
      addEdgeLabel(resEdge, [user, inSize != null ? `${inSize}o` : null].filter(Boolean).join('  '), 0.95, 10, 'right');

    } finally {
      graph.getModel().endUpdate();
    }

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
