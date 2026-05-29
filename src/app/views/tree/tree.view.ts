import {ChangeDetectorRef, Component, ElementRef, inject, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, finalize, forkJoin, Subscription} from 'rxjs';
import {Location} from '@angular/common';

import {TraceService} from 'src/app/service/trace.service';
import {app} from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";
import {TreeService} from 'src/app/service/tree.service';
import {FormGroup, FormControl} from '@angular/forms';
import {
  DatabaseRequestTree, DirectoryRequestTree, FtpRequestNode, FtpRequestTree,
  JdbcRequestNode, Label, LdapRequestNode, LinkConfig, LinkRequestNode,
  MailRequestNode, MailRequestTree, MainServerNode, MainSessionTree,
  RestRequestNode, RestServerNode, RestSessionTree,
  ServerConfig, ServerType, TreeGraph
} from '../../model/tree.model';
import {Constants} from "../constants";
import {PageTitleService} from '../../service/page-title.service';


@Component({
  selector: 'app-tree',
  templateUrl: './tree.view.html',
  styleUrls: ['./tree.view.scss'],
})
export class TreeView implements OnDestroy {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(EnvRouter);
  private _traceService = inject(TraceService);
  private _zone = inject(NgZone);
  private _location = inject(Location);
  private _treeService = inject(TreeService);
  private _cdr = inject(ChangeDetectorRef);
  private readonly _pageTitleService = inject(PageTitleService);
  subscriptions: Subscription[] = [];
  id: string;
  tree: any;
  env: any;
  isLoading: boolean;
  data: any;
  MAPPING_TYPE = Constants.MAPPING_TYPE;
  TreeObj: any;
  serverLbl: Label;
  linkLbl: Label;
  LabelIsLoaded: { [key: string]: boolean } = { "METHOD_RESOURCE": false, "STATUS_EXCEPTION": false, "SIZE_COMPRESSION": false }
  minimapVisible: boolean = JSON.parse(localStorage.getItem('tree_minimap') ?? 'true');
  isFullscreen: boolean = false;
  searchQuery: string = '';
  searchResults: any[] = [];
  currentSearchIndex: number = 0;
  searchVisible: boolean = false;

  // Évolution 6 — Detail panel
  selectedCell: any = null;
  detailPanelVisible: boolean = false;
  private _clickedCell: any = null;
  expandedDetailRows: boolean = false;  // Track if detail rows are expanded
  readonly MAX_VISIBLE_ROWS: number = 4; // Limit display to 4 items
  cachedCellDetails: { type: string; name: string; icon: string; rows: any[] } = { type: '', name: '', icon: '', rows: [] };
  private _lastDetailCell: any = null;

  @ViewChild('graphContainer') graphContainer: ElementRef;
  @ViewChild('outlineContainer') outlineContainer: ElementRef;
  @ViewChild('searchInput') searchInputRef: ElementRef;
  ViewForm = new FormGroup({
    nodeView: new FormControl(),
    linkView: new FormControl(),
  });
  ViewEvent: { [key: string]: (lbl: Label) => void } =
    {
      "SERVER_IDENTITY": (lbl: Label) => this.viewByServerLbl(lbl),
      "OS_RE": (lbl: Label) => this.viewByServerLbl(lbl),
      "IP_PORT": (lbl: Label) => this.viewByServerLbl(lbl),
      "ELAPSED_LATENSE": (lbl: Label) => this.viewByLinklbl(lbl),
      "METHOD_RESOURCE": (lbl: Label) => this.viewByLinklbl(lbl),
      "SIZE_COMPRESSION": () => this.viewSizeCompression(),
      "PROTOCOL_SCHEME": (lbl: Label) => this.viewByLinklbl(lbl),
      "STATUS_EXCEPTION": (lbl: Label) => this.viewByLinklbl(lbl),
      "USER": (lbl: Label) => this.viewByLinklbl(lbl),
    }


  constructor() {
    this._pageTitleService.set({
      icon: 'lan',
      iconOutlined: true,
      title: 'Arbre d\'Appels',
      subtitle: Constants.MAPPING_TYPE['tree']?.subtitle
    });
    this.subscriptions.push(combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.data,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, data, queryParams]) => {
        this.id = params['id_session'];
        this.env = queryParams.env || app.defaultEnv;
        this.serverLbl = Label[queryParams.server_lbl] || Label.SERVER_IDENTITY;
        this.linkLbl = Label[queryParams.link_lbl] || Label.ELAPSED_LATENSE;
        this.patchDataView(this.serverLbl, this.linkLbl);
        this.data = data;
        this.getTree(this.data, this.serverLbl, this.linkLbl);
        this.subscriptions.push(this.ViewForm.controls.nodeView.valueChanges.subscribe(v => {
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${v}&link_lbl=${this.linkLbl}`);
          this.ViewEvent[v](Label[v]);
        }));
        this.subscriptions.push(this.ViewForm.controls.linkView.valueChanges.subscribe(v => {
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${this.serverLbl}&link_lbl=${v}`);
          this.ViewEvent[v](Label[v]);
        }));
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${this.serverLbl}&link_lbl=${this.linkLbl}`);
      },
    }));
  }

  patchDataView(node: Label, link: Label){
    this.ViewForm.patchValue({
      nodeView: node,
      linkView: link
    },{ emitEvent: false })
  }

  getTree(data: any, serverlbl: Label, linklbl: Label) {
    this.isLoading = true;
    this.subscriptions.push(this._traceService.getTree(this.id, data['type']).pipe(finalize(() => this.isLoading = false)).subscribe((d: RestSessionTree) => {
      this.TreeObj = d;
      this.isLoading = false;
      this._cdr.detectChanges();
      this.tree = TreeGraph.setup(this.graphContainer.nativeElement, tg => {
        tg.draw(() => {});
        return tg;
      });
      this.ViewEvent[linklbl](Label[linklbl]);
      this.tree.setOutline(this.outlineContainer.nativeElement);
      this.registerCellClickListener();
    }));
  }

  registerCellClickListener() {
    const graph = this.tree._graph;
    let mouseDownX = 0;
    let mouseDownY = 0;
    graph.addMouseListener({
      mouseDown: (_s: any, me: any) => {
        mouseDownX = me.getX();
        mouseDownY = me.getY();
      },
      mouseMove: (_s: any, me: any) => {
        const cell = me.getCell();
        this._zone.run(() => {
          if (cell) {
            this.selectedCell = cell;
            this.expandedDetailRows = false; // Reset expansion on cell change
            this.detailPanelVisible = true;
          } else if (!this._clickedCell) {
            this.detailPanelVisible = false;
            this.selectedCell = null;
            this.expandedDetailRows = false;
          } else {
            // restore clicked cell when hovering empty space
            this.selectedCell = this._clickedCell;
            this.detailPanelVisible = true;
          }
        });
      },
      mouseUp: (_s: any, me: any) => {
        const dx = Math.abs(me.getX() - mouseDownX);
        const dy = Math.abs(me.getY() - mouseDownY);
        // Only treat as click if mouse didn't move much (not a pan)
        if (dx < 5 && dy < 5) {
          const cell = me.getCell();
          this._zone.run(() => {
            if (cell) {
              this._clickedCell = cell;
              this.selectedCell = cell;
              this.expandedDetailRows = false; // Reset expansion on new click
              this.detailPanelVisible = true;
              this.tree.highlightCell(cell);
            } else {
              this._clickedCell = null;
              this.tree.clearHighlight();
              this.closeDetailPanel();
            }
          });
        }
      }
    });
  }

  closeDetailPanel() {
    this.detailPanelVisible = false;
    this.selectedCell = null;
    this._clickedCell = null;
    this._lastDetailCell = null;
    this.expandedDetailRows = false;
  }

  private resetSelection() {
    this._clickedCell = null;
    this.selectedCell = null;
    this.detailPanelVisible = false;
    this._lastDetailCell = null;
    this.expandedDetailRows = false;
    this.tree?.clearHighlight();
  }

  getTypeIcon(type: string): string {
    const config = ServerConfig[type];
    if (!config) return '';
    const match = config.icon.match(/image=([^;]+)/);
    return match ? match[1] : '';
  }

  getCellDetails(): { type: string; name: string; icon: string; rows: any[] } {
    const cell = this.selectedCell;
    if (!cell) return { type: '', name: '', icon: '', rows: [] };

    // Return cached result if same cell
    if (cell === this._lastDetailCell) return this.cachedCellDetails;
    this._lastDetailCell = cell;

    if (cell.isEdge()) {
      const rows: any[] = [];
      let type = 'Lien';
      if (cell.value?.nodes) {
        const firstNode = cell.value.nodes[0];
        if (firstNode instanceof JdbcRequestNode) type = 'JDBC';
        else if (firstNode instanceof RestRequestNode) type = 'REST';
        else if (firstNode instanceof FtpRequestNode) type = 'FTP';
        else if (firstNode instanceof MailRequestNode) type = 'SMTP';
        else if (firstNode instanceof LdapRequestNode) type = 'LDAP';
        else if (firstNode instanceof LinkRequestNode) type = 'REST';

        cell.value.nodes.forEach((node: any) => {
          if (typeof node.linkInfo === 'function') {
             try {
               const info = node.linkInfo();
               rows.push(info);
             } catch (e) { /* linkInfo not implemented */ }
          }
        });
      } else {
        rows.push({ label: String(cell.value ?? ''), value: '', color: '#3b82f6' });
      }
      return this.cachedCellDetails = { type, name: '', icon: 'timeline', rows };
    }

    if (cell.isVertex() && cell.value?.requestType && cell.value?.node) {
      const node = cell.value.node;
      const type = cell.value.requestType.toUpperCase();
      const name = node.formatNode?.(Label.SERVER_IDENTITY) || '?';
      return this.cachedCellDetails = { type, name, icon: this.getTypeIcon(type), rows: node.nodeInfo() };
    }
    if (cell.isVertex() && cell.value?.node) {
      const node = cell.value.node;
      let type = 'REST';
      if (node instanceof MainServerNode) type = node.nodeObject?.type?.toUpperCase() || 'GHOST';
      const name = node.formatNode?.(Label.SERVER_IDENTITY) || node.nodeObject?.appName || '?';
      return this.cachedCellDetails = { type, name, icon: this.getTypeIcon(type), rows: node.nodeInfo() };
    }
    return this.cachedCellDetails = { type: '', name: '', icon: '', rows: [] };
  }

  navigateToRequest(item: any, event: MouseEvent) {
    event.stopPropagation();
    const path = `#/request/${item.type}/${item.value}`;
    if (event.ctrlKey) {
      this._router.open(`${path}?env=${this.env}`, '_blank',)
    } else {
      this._router.navigate(['/request', item.type, item.value], { queryParams: { env: this.env } });
    }
  }
  navigateToSession(item: any, event: MouseEvent) {
    event.stopPropagation();
    const path = `#/session/${item.type}/${item.value}`;
    if (event.ctrlKey) {
      this._router.open(`${path}?env=${this.env}`, '_blank',)
    } else {
      this._router.navigate(['/session', item.type, item.value], { queryParams: { env: this.env } });
    }
  }

  /**
   * Get visible rows limited to MAX_VISIBLE_ROWS when not expanded
   */
  getVisibleRows(allRows: any[]): any[] {
    if (this.expandedDetailRows) {
      return allRows;
    }
    return allRows.slice(0, this.MAX_VISIBLE_ROWS);
  }

  /**
   * Get count of hidden rows
   */
  getHiddenRowsCount(allRows: any[]): number {
    if (this.expandedDetailRows) {
      return 0;
    }
    return Math.max(0, allRows.length - this.MAX_VISIBLE_ROWS);
  }

  /**
   * Toggle expansion of detail rows
   */
  toggleDetailRowsExpansion(event: MouseEvent): void {
    event.stopPropagation();
    this.expandedDetailRows = !this.expandedDetailRows;
  }

  dr(tg: TreeGraph, data: any, serverlbl: Label, linklbl: Label) {

    let a = this.draw(tg, data, serverlbl, linklbl);
    if (this.data.type != 'main') {
      let linkRequestNode = new LinkRequestNode(data);
      let p = tg.insertServer("Client", 'LINK')
      let label:any = { linkLbl: linklbl, nodes: [linkRequestNode] };
      tg.insertLink(label, p, a, LinkConfig[linkRequestNode.getLinkStyle()]);
    }
  }

  mergeRestRequests(name: string, array: RestRequestNode[]): RestSessionTree {
    let remote = array[0].nodeObject.remoteTrace ? array[0].nodeObject.remoteTrace : { appName: name };
    let acc: any = { ...remote, 'restRequests': [], 'databaseRequests': [], 'ftpRequests': [], 'mailRequests': [], 'ldapRequests': [], 'remoteList': [] };
    array.forEach(o => {
      if (o.nodeObject.remoteTrace) {
        o.nodeObject.remoteTrace.restRequests && acc.restRequests.push(...o.nodeObject.remoteTrace.restRequests)
        o.nodeObject.remoteTrace.databaseRequests && acc.databaseRequests.push(...o.nodeObject.remoteTrace.databaseRequests)
        o.nodeObject.remoteTrace.ftpRequests && acc.ftpRequests.push(...o.nodeObject.remoteTrace.ftpRequests)
        o.nodeObject.remoteTrace.mailRequests && acc.mailRequests.push(...o.nodeObject.remoteTrace.mailRequests)
        o.nodeObject.remoteTrace.ldapRequests && acc.ldapRequests.push(...o.nodeObject.remoteTrace.ldapRequests)
        o.nodeObject.remoteTrace && acc.remoteList.push(('protocol' in o.nodeObject.remoteTrace ? new RestServerNode(o.nodeObject.remoteTrace) : new MainServerNode(o.nodeObject.remoteTrace)))
      }
    })
    return <RestSessionTree>acc;
  }

  draw(treeGraph: TreeGraph, server: RestSessionTree | MainSessionTree, serverlbl: Label, linklbl: Label) {

    let serverNode = ('protocol' in server ? new RestServerNode(server) : new MainServerNode(server)); // todo test if has remote returns icons style
    let icon: ServerType = this.getIcon(serverNode.nodeObject);
    let label :any = {
      serverlbl: serverlbl,
      linkLbl: linklbl,
      node: serverNode
    }
    let a = treeGraph.insertServer(label, icon)
    let linkStyle = '';
    let b;

    //restRequests
    if (server.restRequests) {
      let res = this.groupBy(server.restRequests, v => v.remoteTrace ? v.remoteTrace.appName : v.host, RestRequestNode) //instance
      Object.entries(res).forEach((v: any[]) => {//[key,[req1,req2,..]]
        if (v[1].length > 1) {
          b = this.draw(treeGraph, this.mergeRestRequests(v[0], v[1]), serverlbl, linklbl);
          linkStyle = LinkConfig[this.getGroupLinkStyle(v[1])] + "strokeWidth=1.5;"
        }
        else {
          let restRequestNode = v[1][0];
          b = this.draw(treeGraph, restRequestNode.nodeObject.remoteTrace ? restRequestNode.nodeObject.remoteTrace : <RestSessionTree>{ appName: v[1][0].nodeObject.host }, serverlbl, linklbl)
          linkStyle = LinkConfig[restRequestNode.getLinkStyle()];
        }
        label = { linkLbl: linklbl, nodes: v[1] };
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //databaseRequests
    if (server.databaseRequests) {
      let res = this.groupBy<DatabaseRequestTree, JdbcRequestNode>(server.databaseRequests, v => v.name, JdbcRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let jdbcRequestNode = v[1][0];
        b = treeGraph.insertServer({ serverlbl, node: jdbcRequestNode, requestType: 'jdbc' }, "JDBC"); // demon server
        if (v[1].length > 1) {
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          linkStyle = LinkConfig[jdbcRequestNode.getLinkStyle()];
        }
        label = { linkLbl: linklbl, nodes: v[1] };
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //ftpRequests
    if (server.ftpRequests) {
      let res = this.groupBy<FtpRequestTree, FtpRequestNode>(server.ftpRequests, v => v.host, FtpRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let ftpRequestNode = v[1][0];
        b = treeGraph.insertServer({ serverlbl, node: ftpRequestNode, requestType: 'ftp' }, "FTP"); // demon server
        if (v[1].length > 1) {
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          linkStyle = LinkConfig[ftpRequestNode.getLinkStyle()];
        }
        label = { linkLbl: linklbl, nodes: v[1] };
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //mailRequests
    if (server.mailRequests) {
      let res = this.groupBy<MailRequestTree, MailRequestNode>(server.mailRequests, v => v.host, MailRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let mailRequestNode = v[1][0];
        b = treeGraph.insertServer({ serverlbl, node: mailRequestNode, requestType: 'smtp' }, "SMTP"); // demon server
        if (v[1].length > 1) {
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          linkStyle = LinkConfig[mailRequestNode.getLinkStyle()];
        }
        label = { linkLbl: linklbl, nodes: v[1] };
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //ldapRequests
    if (server.ldapRequests) {
      let res = this.groupBy<DirectoryRequestTree, LdapRequestNode>(server.ldapRequests, v => v.host, LdapRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let ldapRequestNode = v[1][0];
        b = treeGraph.insertServer({ serverlbl, node: ldapRequestNode, requestType: 'ldap' }, "LDAP"); // demon server
        if (v[1].length > 1) {
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          linkStyle = LinkConfig[ldapRequestNode.getLinkStyle()];
        }
        label = { linkLbl: linklbl, nodes: v[1] };
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }
    return a;
  }

  groupBy<T, J>(array: T[], fn: (o: T) => any, type?: { new(o): J }): { [name: string]: T[] } {
    return array.reduce((acc: any, item: any) => {
      var id = fn(item);
      if (!acc[id]) {
        acc[id] = [];
      }
      type ? acc[id].push(new type(item)) : acc[id].push(item);
      return acc;
    }, {})
  }

  getGroupLinkStyle(nodes: RestRequestNode[]): string {
    if (nodes.some(n => n.nodeObject.end == null))                                             return 'ONGOING';
    if (nodes.some(n => n.nodeObject.status >= 500 || n.nodeObject.status === 0))              return 'ERROR';
    if (nodes.some(n => n.nodeObject.status >= 400 && n.nodeObject.status < 500))             return 'CLIENT_ERROR';
    return 'SUCCES';
  }

  getGroupFailedStyle(nodes: { nodeObject: { failed: boolean; end: any } }[]): string {
    if (nodes.some(n => n.nodeObject.end == null)) return 'ONGOING';
    return nodes.some(n => n.nodeObject.failed) ? 'ERROR' : 'SUCCES';
  }

  checkSome<T>(arr: T[], fn: (o: T) => any) {
    return arr.some(r => fn(r));
  }

  getIcon(obj: RestSessionTree | MainSessionTree): ServerType {
    if ("type" in obj) {
      return obj.type == 'VIEW' ? 'VIEW' : 'BATCH';
    }
    return ('id' in obj ? 'REST' : 'GHOST');
  }

   // ── Évolution 3 : Recherche de nœud ────────────────────────────────────────
   toggleSearch() {
     this.searchVisible = !this.searchVisible;
     if (this.searchVisible) {
       setTimeout(() => this.searchInputRef?.nativeElement?.focus(), 320);
     } else {
       this.clearSearch();
     }
   }

   onSearch() {
     if (!this.tree || !this.searchQuery.trim()) {
       this.clearSearch();
       return;
     }
     const q = this.searchQuery.toLowerCase();
     const vertices = this.tree.graph.getChildVertices(this.tree._parent);
     this.searchResults = vertices.filter((v: any) => {
       const label = this.tree.graph.getLabel(v);
       return label && String(label).toLowerCase().includes(q);
     });
     this.currentSearchIndex = 0;
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
     this.tree.graph.setSelectionCell(cell);
     this.tree.graph.scrollCellToVisible(cell, true);
   }

   clearSearch() {
     this.searchQuery = '';
     this.searchResults = [];
     this.currentSearchIndex = 0;
     this.clearSearchHighlight();
     this.tree?.graph.clearSelection();
   }

   /**
    * Applique le highlighting pour la recherche
    */
   applySearchHighlight() {
     this.clearSearchHighlight();
     if (!this.tree || this.searchResults.length === 0) return;

     const allVertices = this.tree.graph.getChildVertices(this.tree._parent);

     // Appliquer le style à tous les vertices
     allVertices.forEach((v: any) => {
       const state = this.tree.graph.view.getState(v);
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
     const allEdges = this.tree.graph.getEdges(this.tree._parent);
     allEdges.forEach((e: any) => {
       const state = this.tree.graph.view.getState(e);
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

     const allVertices = this.tree.graph.getChildVertices(this.tree._parent);
     allVertices.forEach((v: any) => {
       const state = this.tree.graph.view.getState(v);
       if (!state || !state.shape || !state.shape.node) return;
       const node: SVGElement = state.shape.node;
       node.style.filter = '';
       node.style.opacity = '';
     });

     // Restaurer les edges
     const allEdges = this.tree.graph.getEdges(this.tree._parent);
     allEdges.forEach((e: any) => {
       const state = this.tree.graph.view.getState(e);
       if (!state || !state.shape || !state.shape.node) return;
       const node: SVGElement = state.shape.node;
       const paths = node.querySelectorAll('path');
       paths.forEach((p: SVGPathElement) => {
         p.style.opacity = '';
       });
     });
   }

  // ── Évolution 5 : Export PNG ─────────────────────────────────────────────
  async exportPNG() {
    // Centre and resize the graph before exporting
    this.tree?.resizeAndCenter();
    // Small delay to let the view update before capturing
    await new Promise(resolve => setTimeout(resolve, 100));

    const container = this.graphContainer.nativeElement as HTMLElement;
    const svgEl = container.querySelector('svg');
    if (!svgEl) return;

    // 1. Clone the SVG
    const svgClone = svgEl.cloneNode(true) as SVGElement;
    const bbox = svgEl.getBoundingClientRect();
    svgClone.setAttribute('width',  String(bbox.width));
    svgClone.setAttribute('height', String(bbox.height));

    // 2. Inline all <image> href/xlink:href as base64 so canvas can render them
    const imageEls = Array.from(svgClone.querySelectorAll('image'));
    await Promise.all(imageEls.map(async (img) => {
      const href = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
      if (!href || href.startsWith('data:')) return;
      try {
        const response = await fetch(href);
        const blob     = await response.blob();
        const b64      = await new Promise<string>((resolve, reject) => {
          const reader  = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.setAttribute('href', b64);
        img.removeAttribute('xlink:href');
      } catch { /* skip unresolvable refs */ }
    }));

    // 3. Serialize & render to canvas
    const svgStr = new XMLSerializer().serializeToString(svgClone);
    const canvas  = document.createElement('canvas');
    const scale   = window.devicePixelRatio || 1;
    canvas.width  = bbox.width  * scale;
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

      // ── Badge "INSPECT by @ONETEME/JARVIS" + logo GitHub en bas à droite ─────
      const badgeText  = 'JARVIS - INSPECT';
      const badgeSubtext = '@ONETEME';
      const fontSize   = 12;
      const fontSizeSmall = 10;
      const padding    = 12;
      const iconSize   = 20;
      const gap        = 8;
      const borderRadius = 10;
      const borderWidth = 1.5;

      ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
      const textW = ctx.measureText(badgeText).width;
      ctx.font = `500 ${fontSizeSmall}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
      const subtextW = ctx.measureText(badgeSubtext).width;
      const maxTextW = Math.max(textW, subtextW);

      const badgeW = iconSize + gap + maxTextW + padding * 2;
      const badgeH = fontSize + fontSizeSmall + gap + padding * 2;
      const bx = bbox.width  - badgeW - 12;
      const by = bbox.height - badgeH - 12;

      ctx.save();

      // Ombre du badge
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      // Fond avec gradient
      const gradient = ctx.createLinearGradient(bx, by, bx, by + badgeH);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      (ctx as any).roundRect?.(bx, by, badgeW, badgeH, borderRadius) ?? ctx.rect(bx, by, badgeW, badgeH);
      ctx.fill();

      // Bordure avec gradient
      const borderGradient = ctx.createLinearGradient(bx, by, bx, by + badgeH);
      borderGradient.addColorStop(0, 'rgba(148, 163, 184, 0.5)');
      borderGradient.addColorStop(1, 'rgba(100, 116, 139, 0.3)');
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = borderWidth;
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      (ctx as any).roundRect?.(bx, by, badgeW, badgeH, borderRadius) ?? ctx.rect(bx, by, badgeW, badgeH);
      ctx.stroke();

      // Logo GitHub
      const ghImg = new Image();
      ghImg.onload = () => {
        const iy = by + (badgeH - iconSize) / 2;
        ctx.drawImage(ghImg, bx + padding, iy, iconSize, iconSize);

        // Texte principal (INSPECT)
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
        ctx.textBaseline = 'top';
        ctx.fillText(badgeText, bx + padding + iconSize + gap, by + padding - 1);

        // Texte secondaire (@ONETEME/JARVIS)
        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.font = `500 ${fontSizeSmall}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
        ctx.fillText(badgeSubtext, bx + padding + iconSize + gap, by + padding + fontSize + 2);

        ctx.restore();

        // Télécharger l'image
        URL.revokeObjectURL(url);
        const a = document.createElement('a');
        a.download = `graph-${this.id}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      ghImg.onerror = () => {
        // Si le logo ne charge pas, continuer sans lui
        ctx.fillStyle = '#ffffff';
        ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
        ctx.textBaseline = 'top';
        ctx.fillText(badgeText, bx + padding + iconSize + gap, by + padding - 1);

        ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.font = `500 ${fontSizeSmall}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial`;
        ctx.fillText(badgeSubtext, bx + padding + iconSize + gap, by + padding + fontSize + 2);

        ctx.restore();

        URL.revokeObjectURL(url);
        const a = document.createElement('a');
        a.download = `graph-${this.id}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };
      ghImg.src = 'assets/github.svg';
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }

  toggleMinimap() {
    this.minimapVisible = !this.minimapVisible;
    localStorage.setItem('tree_minimap', JSON.stringify(this.minimapVisible));
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

  ngOnDestroy() {
    this.tree?.disconnectObserver();
    this.subscriptions.forEach(s => s.unsubscribe());
    this._pageTitleService.clear();
  }


  viewByServerLbl(serverLbl: Label) {
    this.resetSelection();
    this.tree.clearCells();
    this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl = serverLbl, this.linkLbl))
  }
  viewByLinklbl(linkLbl: Label) {
    this.resetSelection();
    this.tree.clearCells();
    this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = linkLbl))
  }

  viewSizeCompression() {
    let reqOb: any = {}
    if (!this.LabelIsLoaded['SIZE_COMPRESSION']) {
      let jdbcParam = this.getRequestsIds(this.TreeObj, (s) => s.databaseRequests?.map(o => `${o.id}`));
      let mailParam = this.getRequestsIds(this.TreeObj, (s) => s.mailRequests?.map(o => `${o.id}`));
      jdbcParam.ids?.length && (reqOb.jdbc = this._treeService.getJdbcRequestCount(jdbcParam));
      mailParam.ids?.length && (reqOb.smtp = this._treeService.getSmtpRequestCount(mailParam));

    }
    this.subscriptions.push(forkJoin(
      reqOb
    ).pipe(finalize(() => {
      this.resetSelection();
      this.tree.clearCells();
      this.LabelIsLoaded['SIZE_COMPRESSION'] = true;
      this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = Label.SIZE_COMPRESSION))
    })).subscribe((res: { jdbc: {}, smtp: {} }) => {
      this.setRequestProperties(this.TreeObj, res.jdbc, (s, actionMap) => s.databaseRequests?.length && s.databaseRequests.forEach(r => r.count = actionMap[r.id]))
      this.setRequestProperties(this.TreeObj, res.smtp, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r.count = actionMap[r.id]))
    }))
  }



  getRequestsIds(treeObj: RestSessionTree | MainSessionTree, f?: (s: RestSessionTree | MainSessionTree) => string[]) {
    let arr: string[] = [];
    this.deepApply(treeObj, (s: RestSessionTree | MainSessionTree) => {
      let res = f(s);
      if (res && res.length) {
        arr = arr.concat(`${res}`);
      }
    });
    return { ids: arr.join(',') };
  }

  setRequestProperties<T>(treeObj: RestSessionTree | MainSessionTree, actionMap: T, pre: (s: RestSessionTree | MainSessionTree, actionMap: T) => void) {
    this.deepApply(treeObj, s => actionMap && pre(s, actionMap));
  }

  deepApply(treeObj: RestSessionTree | MainSessionTree, fn: (s: RestSessionTree | MainSessionTree) => void) {
    if (treeObj.restRequests) {
      treeObj.restRequests.forEach((e: any) => {
        if (e.remoteTrace) {
          this.deepApply(e.remoteTrace, fn);
        }
      })
    }
    fn(treeObj);
  }
}

