import {ChangeDetectorRef, Component, ElementRef, inject, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, finalize, forkJoin, fromEvent, Subscription} from 'rxjs';
import {Location} from '@angular/common';

import {TraceService} from 'src/app/service/trace.service';
import {app} from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";
import {TreeService} from 'src/app/service/tree.service';
import {FormControl, FormGroup} from '@angular/forms';
import {LinkConfig, ServerType, TreeGraph} from '../../model/tree.model';
import {
  DatabaseRequestTree,
  DirectoryRequestTree, FtpRequestNode,
  FtpRequestTree, JdbcRequestNode, Label, LdapRequestNode, LinkRequestNode, MailRequestNode,
  MailRequestTree, MainServerNode,
  MainSessionTree, RestRequestNode, RestServerNode,
  RestSessionTree
} from "../../model/tree.model";
import {Constants} from "../constants";


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
  subscriptions: Subscription[] = [];
  id: string;
  tree: any
  resizeSubscription: any;
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
      "METHOD_RESOURCE": () => this.viewMethodResource(),
      "SIZE_COMPRESSION": () => this.viewSizeCompression(),
      "PROTOCOL_SCHEME": (lbl: Label) => this.viewByLinklbl(lbl),
      "STATUS_EXCEPTION": () => this.viewStatusException(),
      "USER": (lbl: Label) => this.viewByLinklbl(lbl),
    }


  constructor() {
    const self = this;
    this.subscriptions.push(combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.data,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, data, queryParams]) => {
        this.id = params['id_session'];
        this.env = queryParams.env || app.defaultEnv;
        this.serverLbl = Label[queryParams.server_lbl] || Label.SERVER_IDENTITY
        this.linkLbl = Label[queryParams.link_lbl] || Label.ELAPSED_LATENSE
        this.patchDataView(this.serverLbl,this.linkLbl)
        this.data = data
        this.getTree(this.data, this.serverLbl, this.linkLbl);
        this.subscriptions.push(this.ViewForm.controls.nodeView.valueChanges.subscribe(v => {
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${v}&link_lbl=${this.linkLbl}`);
          this.ViewEvent[v](Label[v])
        }))
        this.subscriptions.push(this.ViewForm.controls.linkView.valueChanges.subscribe(v => {
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${this.serverLbl}&link_lbl=${v}`);
          this.ViewEvent[v](Label[v])
        }))
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${this.serverLbl}&link_lbl=${this.linkLbl}`);
      },
    }))
  }

  patchDataView(node: Label, link: Label){
    this.ViewForm.patchValue({
      nodeView: node,
      linkView: link
    },{ emitEvent: false })
  }

  getTree(data: any, serverlbl: Label, linklbl: Label) {
    this.isLoading = true;
    this.subscriptions.push(this._traceService.getTree(this.id, data['type']).pipe(finalize(() => this.isLoading = false)).subscribe((d: RestSessionTree /*| ServerMainSession*/) => {
      this.TreeObj = d;
      this.isLoading = false;         // force à false avant d'accéder au ViewChild
      this._cdr.detectChanges();      // force le rendu du DOM pour que graphContainer existe
      let self = this;
      this.tree = TreeGraph.setup(this.graphContainer.nativeElement, tg => {
        tg.draw(() => {})//self.dr(tg, self.TreeObj, serverlbl, linklbl)) // refacto
        return tg;
      });
      this.ViewEvent[linklbl](Label[linklbl])// draw
      this.tree.setOutline(this.outlineContainer.nativeElement)
      this.registerCellClickListener();
    }))
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
            this.detailPanelVisible = true;
          } else if (!this._clickedCell) {
            this.detailPanelVisible = false;
            this.selectedCell = null;
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
  }

  private resetSelection() {
    this._clickedCell = null;
    this.selectedCell = null;
    this.detailPanelVisible = false;
    this.tree?.clearHighlight();
  }

  canNavigateToDetail(): boolean {
    const v = this.selectedCell?.value;
    if (!v || typeof v !== 'object') return false;
    if (v.node?.nodeObject?.id) return true;          // session REST/Main
    if (v.requestType && v.node?.nodeObject?.id) return true;  // requête feuille
    return false;
  }

  navigateToDetail(event: MouseEvent) {
    const v = this.selectedCell?.value;
    if (!v || typeof v !== 'object') return;
    const obj = v.node?.nodeObject;
    if (!obj?.id) return;

    let commands: any[];
    if (v.requestType) {
      // nœud feuille : JDBC, FTP, SMTP, LDAP
      commands = ['/request', v.requestType, obj.id];
    } else if ('protocol' in obj) {
      // session REST
      commands = ['/session', 'rest', obj.id];
    } else {
      // session Main (batch / view / ...)
      commands = ['/session', 'main', obj.type?.toLowerCase(), obj.id];
    }
    this._router.navigateOnClick(event, commands, { queryParams: { env: this.env } });
  }

  getCellDetails(): { type: string; rows: { icon: string; label: string; value: string; color?: string }[] } {
    const cell = this.selectedCell;
    if (!cell) return { type: '', rows: [] };

    if (cell.isEdge()) {
      const rows: any[] = [];
      if (cell.value?.nodes) {
        const grouped = this.groupBy(cell.value.nodes, (v: any) => v.formatLink(cell.value.linkLbl), undefined);
        Object.entries(grouped).forEach(([key, nodes]: any) => {
          const isError   = /red|error|KO|5[0-9]{2}/i.test(key);
          const isWarning = /4[0-9]{2}/i.test(key);
          rows.push({
            icon: isError ? 'error' : isWarning ? 'warning' : 'check_circle',
            label: key,
            value: nodes.length > 1 ? `×${nodes.length}` : '',
            color: isError ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e'
          });
        });
      } else {
        rows.push({ icon: 'timeline', label: String(cell.value ?? ''), value: '', color: '#3b82f6' });
      }
      return { type: 'Lien', rows };
    }

    if (cell.isVertex() && cell.value?.requestType && cell.value?.node) {
      const obj  = cell.value.node.nodeObject;
      const rows: any[] = [];
      const elapsed = obj?.end != null && obj?.start != null ? (obj.end - obj.start).toFixed(3) + ' s' : null;
      const status  = obj?.end == null ? 'En cours' : (obj?.failed ? 'Échec' : 'Succès');
      const statusColor = obj?.end == null ? '#f59e0b' : (obj?.failed ? '#ef4444' : '#22c55e');
      const statusIcon  = obj?.end == null ? 'schedule' : (obj?.failed ? 'error' : 'check_circle');

      // Champs communs
      if (obj?.host)     rows.push({ icon: 'dns',      label: 'Hôte',     value: obj.port && obj.port !== -1 ? `${obj.host}:${obj.port}` : obj.host, color: '#6366f1' });
      if (obj?.protocol) rows.push({ icon: 'lock',     label: 'Protocole',value: obj.protocol,   color: '#0ea5e9' });
      if (elapsed)       rows.push({ icon: 'timer',    label: 'Durée',    value: elapsed,        color: '#8b5cf6' });
                         rows.push({ icon: statusIcon, label: 'Statut',   value: status,         color: statusColor });
      if (obj?.user)     rows.push({ icon: 'person',   label: 'Utilisateur', value: obj.user,    color: '#64748b' });

      // Spécifique JDBC
      if (cell.value.requestType === 'jdbc') {
        if (obj?.name)        rows.push({ icon: 'storage',    label: 'Base',    value: obj.schema ? `${obj.name} / ${obj.schema}` : obj.name, color: '#059669' });
        if (obj?.productName) rows.push({ icon: 'inventory',  label: 'Produit', value: obj.productName + (obj.productVersion ? ' ' + obj.productVersion : ''), color: '#10b981' });
        if (obj?.command)     rows.push({ icon: 'code',       label: 'Commande',value: obj.command.length > 40 ? obj.command.substring(0, 40) + '…' : obj.command, color: '#6366f1' });
        if (obj?.count != null) rows.push({ icon: 'format_list_numbered', label: 'Requêtes SQL', value: String(obj.count), color: '#0284c7' });
      }
      // Spécifique FTP
      if (cell.value.requestType === 'ftp') {
        if (obj?.serverVersion) rows.push({ icon: 'computer',   label: 'Serveur', value: obj.serverVersion, color: '#0e7490' });
        if (obj?.clientVersion) rows.push({ icon: 'laptop',     label: 'Client',  value: obj.clientVersion, color: '#0891b2' });
        if (obj?.commands?.length) rows.push({ icon: 'terminal', label: 'Commandes', value: `${obj.commands.length} cmd(s)`, color: '#0e7490' });
      }
      // Spécifique SMTP
      if (cell.value.requestType === 'smtp') {
        if (obj?.mails?.length) rows.push({ icon: 'email',  label: 'Mails',   value: `${obj.mails.length} destinataire(s)`, color: '#f59e0b' });
        if (obj?.count != null) rows.push({ icon: 'format_list_numbered', label: 'Messages', value: String(obj.count), color: '#d97706' });
      }
      // Spécifique LDAP
      if (cell.value.requestType === 'ldap') {
        if (obj?.commands?.length) rows.push({ icon: 'manage_search', label: 'Requêtes', value: `${obj.commands.length} req(s)`, color: '#7c3aed' });
      }
      // Exception
      if (obj?.exception) rows.push({ icon: 'bug_report', label: obj.exception.type ?? 'Exception', value: obj.exception.message ?? '', color: '#ef4444' });

      return { type: cell.value.requestType.toUpperCase(), rows };
    }

    if (cell.isVertex() && cell.value?.node) {
      const node = cell.value.node;
      const obj  = node.nodeObject;
      const rows: any[] = [];
      if (obj?.appName)   rows.push({ icon: 'label',         label: 'Application', value: obj.appName,             color: '#3b82f6' });
      if (obj?.host)      rows.push({ icon: 'dns',           label: 'Hôte',        value: obj.host,                color: '#6366f1' });
      if (obj?.port)      rows.push({ icon: 'settings_ethernet', label: 'Port',    value: String(obj.port),        color: '#8b5cf6' });
      if (obj?.protocol)  rows.push({ icon: 'lock',          label: 'Protocole',   value: obj.protocol,            color: '#0ea5e9' });
      if (obj?.type)      rows.push({ icon: 'category',      label: 'Type',        value: obj.type,                color: '#f59e0b' });
      if (obj?.os)        rows.push({ icon: 'computer',      label: 'OS',          value: obj.os,                  color: '#64748b' });
      if (obj?.re)        rows.push({ icon: 'layers',        label: 'Env',         value: obj.re,                  color: '#10b981' });
      if (obj?.restRequests?.length)     rows.push({ icon: 'api',          label: 'REST',   value: `${obj.restRequests.length} appel(s)`,     color: '#6366f1' });
      if (obj?.databaseRequests?.length) rows.push({ icon: 'storage',      label: 'DB',     value: `${obj.databaseRequests.length} requête(s)`, color: '#059669' });
      if (obj?.ftpRequests?.length)      rows.push({ icon: 'folder',       label: 'FTP',    value: `${obj.ftpRequests.length} transfert(s)`,  color: '#0e7490' });
      if (obj?.mailRequests?.length)     rows.push({ icon: 'email',        label: 'SMTP',   value: `${obj.mailRequests.length} mail(s)`,      color: '#f59e0b' });
      if (obj?.ldapRequests?.length)     rows.push({ icon: 'badge',        label: 'LDAP',   value: `${obj.ldapRequests.length} requête(s)`,   color: '#7c3aed' });
      if (!rows.length)   rows.push({ icon: 'info', label: node.formatNode?.(this.serverLbl) ?? '', value: '', color: '#94a3b8' });
      return { type: 'Nœud', rows };
    }

      return { type: '', rows: [] };
  }

  dr(tg: TreeGraph, data: any, serverlbl: Label, linklbl: Label) {

    let a = this.draw(tg, data, serverlbl, linklbl);
    if (this.data.type != 'main') {
      let linkRequestNode = new LinkRequestNode(data);
      let p = tg.insertServer("Client", 'LINK')
      let label = linkRequestNode.formatLink(linklbl)
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
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.getGroupLinkStyle(v[1])] + "strokeWidth=1.5;"
        }
        else {
          let restRequestNode = v[1][0];
          b = this.draw(treeGraph, restRequestNode.nodeObject.remoteTrace ? restRequestNode.nodeObject.remoteTrace : <RestSessionTree>{ appName: v[1][0].nodeObject.host }, serverlbl, linklbl)
          label = restRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[restRequestNode.getLinkStyle()];

        }

        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //databaseRequests
    if (server.databaseRequests) {
      let res = this.groupBy<DatabaseRequestTree, JdbcRequestNode>(server.databaseRequests, v => v.name, JdbcRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let jdbcRequestNode = v[1][0];
        b = treeGraph.insertServer(v[1].length === 1 ? { serverlbl, node: jdbcRequestNode, requestType: 'jdbc' } : jdbcRequestNode.formatNode(serverlbl), "JDBC"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          label = jdbcRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[jdbcRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //ftpRequests
    if (server.ftpRequests) {
      let res = this.groupBy<FtpRequestTree, FtpRequestNode>(server.ftpRequests, v => v.host, FtpRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let ftpRequestNode = v[1][0];
        b = treeGraph.insertServer(v[1].length === 1 ? { serverlbl, node: ftpRequestNode, requestType: 'ftp' } : ftpRequestNode.formatNode(serverlbl), "FTP"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          label = ftpRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[ftpRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //mailRequests
    if (server.mailRequests) {
      let res = this.groupBy<MailRequestTree, MailRequestNode>(server.mailRequests, v => v.host, MailRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let mailRequestNode = v[1][0];
        b = treeGraph.insertServer(v[1].length === 1 ? { serverlbl, node: mailRequestNode, requestType: 'smtp' } : mailRequestNode.formatNode(serverlbl), "SMTP"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          label = mailRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[mailRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //ldapRequests
    if (server.ldapRequests) {
      let res = this.groupBy<DirectoryRequestTree, LdapRequestNode>(server.ldapRequests, v => v.host, LdapRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let ldapRequestNode = v[1][0];
        b = treeGraph.insertServer(v[1].length === 1 ? { serverlbl, node: ldapRequestNode, requestType: 'ldap' } : ldapRequestNode.formatNode(serverlbl), "LDAP"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.getGroupFailedStyle(v[1])] + "strokeWidth=1.5;"
        } else {
          label = ldapRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[ldapRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }
    return a;
  }

  createObj<T>(o: T[], fn: (o: T[]) => any): any {
    return fn(o);
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

  getIcon(obj: RestSessionTree | MainSessionTree) {
    if ("type" in obj) {
      return obj.type == 'VIEW' ? 'VIEW' : 'BATCH'
    }
    return ('id' in obj ? 'REST' : 'GHOST')
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
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `graph-${this.id}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
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

  ngAfterViewInit() {
    this._zone.runOutsideAngular(() => {
      this.resizeSubscription = fromEvent(window, 'resize').subscribe(() => {
        this._zone.run(() => {
          if (this.tree) this.tree.resizeAndCenter();
        });
      });

      fromEvent(document, 'fullscreenchange').subscribe(() => {
        this._zone.run(() => {
          this.isFullscreen = !!document.fullscreenElement;
          setTimeout(() => this.tree?.resizeAndCenter(), 200);
        });
      });
    });
  }

  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
    this.tree?.disconnectObserver();
    this.subscriptions.forEach(s => s.unsubscribe());
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
  viewMethodResource() {
    let reqOb: any = {}
    if (!this.LabelIsLoaded['METHOD_RESOURCE']) {
      let ftpParam = this.getRequestsIds(this.TreeObj, (s) => s.ftpRequests?.map(o => `${o.id}`));
      let mailParam = this.getRequestsIds(this.TreeObj, (s) => s.mailRequests?.map(o => `${o.id}`));
      let ldapParam = this.getRequestsIds(this.TreeObj, (s) => s.ldapRequests?.map(o => `${o.id}`));
      ftpParam.ids?.length && (reqOb.ftp = this._treeService.getFtpRequestStage(ftpParam));
      mailParam.ids?.length && (reqOb.mail = this._treeService.getMailRequestStage(mailParam));
      ldapParam.ids?.length && (reqOb.ldap = this._treeService.getLdapRequestStage(ldapParam));
    }
    this.subscriptions.push(forkJoin(
      reqOb
    ).pipe(finalize(() => {
      this.resetSelection();
      this.tree.clearCells();
      this.LabelIsLoaded['METHOD_RESOURCE'] = true;
      this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = Label.METHOD_RESOURCE))
    })).subscribe((res: { ftp: {}, mail: {}, ldap: {} }) => {
      this.setRequestProperties(this.TreeObj, res.ftp, (s, actionMap) => s.ftpRequests?.length && s.ftpRequests.forEach(r => r.commands = actionMap[r.id]))
      this.setRequestProperties(this.TreeObj, res.mail, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r.commands = actionMap[r.id]))
      this.setRequestProperties(this.TreeObj, res.ldap, (s, actionMap) => s.ldapRequests?.length && s.ldapRequests.forEach(r => r.commands = actionMap[r.id]))
    }))
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

  viewStatusException() {
    let reqOb: any = {};
    if (!this.LabelIsLoaded['STATUS_EXCEPTION']) {
      let jdbcParam = this.getRequestsIds(this.TreeObj, (s) => s.databaseRequests?.filter(o => o.failed).map(o => `${o.id}`));
      //let restParam = this.getRequestsIds(this.TreeObj, (s)=> s.restRequests?.filter(o=> o.status >=400).map(o=> o.idRequest));
      let ftpParam = this.getRequestsIds(this.TreeObj, (s) => s.ftpRequests?.filter(o => o.failed).map(o => `${o.id}`));
      let smtpParam = this.getRequestsIds(this.TreeObj, (s) => s.mailRequests?.filter(o => o.failed).map(o => `${o.id}`));
      let ldapParam = this.getRequestsIds(this.TreeObj, (s) => s.ldapRequests?.filter(o => o.failed).map(o => `${o.id}`));
      jdbcParam.ids?.length && (reqOb.jdbc = this._treeService.getJdbcExceptions(jdbcParam));
      ftpParam.ids?.length && (reqOb.ftp = this._treeService.getFtpExceptions(ftpParam));
      smtpParam.ids?.length && (reqOb.smtp = this._treeService.getSmtpExceptions(smtpParam));
      ldapParam.ids?.length && (reqOb.ldap = this._treeService.getLdapExceptions(ldapParam));
    }
    this.subscriptions.push(forkJoin(
      reqOb
    ).pipe(finalize(() => {
      this.resetSelection();
      this.tree.clearCells();
      this.LabelIsLoaded['STATUS_EXCEPTION'] = true;
      this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = Label.STATUS_EXCEPTION))
    })).subscribe((res: { jdbc: any, rest: any, ftp: any, smtp: any, ldap: any }) => {

      this.setRequestProperties(this.TreeObj, res.jdbc, (s, actionMap) => s.databaseRequests?.length && s.databaseRequests.forEach(r => r.exception = actionMap[r.id]))
      //this.setRequestProperties(this.TreeObj, res.rest, "restRequests", "exception", "idRequest" )
      this.setRequestProperties(this.TreeObj, res.ftp, (s, actionMap) => s.ftpRequests?.length && s.ftpRequests.forEach(r => r.exception = actionMap[r.id]))
      this.setRequestProperties(this.TreeObj, res.smtp, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r.exception = actionMap[r.id]))
      this.setRequestProperties(this.TreeObj, res.ldap, (s, actionMap) => s.ldapRequests?.length && s.ldapRequests.forEach(r => r.exception = actionMap[r.id]))
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



































