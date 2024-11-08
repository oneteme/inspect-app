import { Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, finalize, forkJoin, fromEvent, Observable } from 'rxjs';
import { Location } from '@angular/common';

import { TraceService } from 'src/app/service/trace.service';
import { application } from 'src/environments/environment';
import { EnvRouter } from "../../service/router.service";
import { RestRequest, ServerMainSession, ServerRestSession, RestServerNode, Label, MainServerNode, JdbcRequestNode, FtpRequestNode, MailRequestNode, LdapRequestNode, RestRequestNode, ExceptionInfo, DatabaseRequest, MailRequest, NamingRequest, FtpRequest, SessionStage, LinkRequestNode } from 'src/app/model/trace.model';
import { TreeService } from 'src/app/service/tree.service';
import { FormControl, FormGroup } from '@angular/forms';
import { LinkConfig, ServerType, TreeGraph } from 'src/app/model/tree.model';


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

  id: string;
  tree: any
  resizeSubscription: any;
  env: any;
  isLoading: boolean;
  data: any;

  TreeObj: any;
  serverLbl: Label;
  linkLbl: Label;
  LabelIsLoaded: { [key: string]: boolean } = { "METHOD_RESOURCE": false, "STATUS_EXCEPTION": false, "SIZE_COMPRESSION": false }
  @ViewChild('graphContainer') graphContainer: ElementRef;
  @ViewChild('outlineContainer') outlineContainer: ElementRef;
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
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.data,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, data, queryParams]) => {
        this.id = params['id_session'];
        this.env = queryParams.env || application.default_env;
        this.serverLbl = Label[queryParams.server_lbl] || Label.SERVER_IDENTITY
        this.linkLbl = Label[queryParams.link_lbl] || Label.ELAPSED_LATENSE
        this.patchDataView(this.serverLbl,this.linkLbl)
        this.data = data
        this.getTree(this.data, this.serverLbl, this.linkLbl);
        this.ViewForm.controls.nodeView.valueChanges.subscribe(v => {
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${v}&link_lbl=${this.linkLbl}`);
          this.ViewEvent[v](Label[v])
        })
        this.ViewForm.controls.linkView.valueChanges.subscribe(v => {
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${this.serverLbl}&link_lbl=${v}`);
          this.ViewEvent[v](Label[v])
        })
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&server_lbl=${this.serverLbl}&link_lbl=${this.linkLbl}`);
      },
    })
  }

  patchDataView(node: Label, link: Label){
    this.ViewForm.patchValue({
      nodeView: node,
      linkView: link
    },{ emitEvent: false })
  }

  getTree(data: any, serverlbl: Label, linklbl: Label) {
    this.isLoading = true;
    this._traceService.getTree(this.id, data['type']).pipe(finalize(() => this.isLoading = false)).subscribe((d: ServerRestSession /*| ServerMainSession*/) => {
      this.TreeObj = d;
      let self = this;
      this.tree = TreeGraph.setup(this.graphContainer.nativeElement, tg => {
        tg.draw(() => {})//self.dr(tg, self.TreeObj, serverlbl, linklbl)) // refacto
        return tg;
      });
      this.ViewEvent[linklbl](Label[linklbl])// draw
      this.tree.setOutline(this.outlineContainer.nativeElement)
    })
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

  mergeRestRequests(name: string, array: RestRequestNode[]): ServerRestSession {
    let remote = array[0].nodeObject.remoteTrace ? array[0].nodeObject.remoteTrace : { appName: name };
    let acc: any = { ...remote, 'restRequests': [], 'databaseRequests': [], 'ftpRequests': [], 'mailRequests': [], 'ldapRequests': [] };
    array.forEach(o => {
      if (o.nodeObject.remoteTrace) {
        o.nodeObject.remoteTrace.restRequests && acc.restRequests.push(...o.nodeObject.remoteTrace.restRequests)
        o.nodeObject.remoteTrace.databaseRequests && acc.databaseRequests.push(...o.nodeObject.remoteTrace.databaseRequests)
        o.nodeObject.remoteTrace.ftpRequests && acc.ftpRequests.push(...o.nodeObject.remoteTrace.ftpRequests)
        o.nodeObject.remoteTrace.mailRequests && acc.mailRequests.push(...o.nodeObject.remoteTrace.mailRequests)
        o.nodeObject.remoteTrace.ldapRequests && acc.ldapRequests.push(...o.nodeObject.remoteTrace.ldapRequests)
      }
    })
    return <ServerRestSession>acc;
  }

  draw(treeGraph: TreeGraph, server: ServerRestSession | ServerMainSession, serverlbl: Label, linklbl: Label) {

    let serverNode = ('protocol' in server ? new RestServerNode(server) : new MainServerNode(server)); // todo test if has remote returns icons style 
    let icon: ServerType = this.getIcon(serverNode.nodeObject);
    let a = treeGraph.insertServer(serverNode.formatNode(serverlbl), icon)
    let label: any = '';
    let linkStyle = '';
    let b;

    //restRequests 
    if (server.restRequests) {
      let res = this.groupBy(server.restRequests, v => v.remoteTrace ? v.remoteTrace.appName : v.host, RestRequestNode) //instance
      Object.entries(res).forEach((v: any[]) => {//[key,[req1,req2,..]]
        if (v[1].length > 1) {
          b = this.draw(treeGraph, this.mergeRestRequests(v[0], v[1]), serverlbl, linklbl);
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.checkSome<RestRequestNode>(v[1], v => { return v.nodeObject.status > 400 || v.nodeObject.status == 0 }) ? 'FAILURE' : 'SUCCES'] + "strokeWidth=1.5;"
        }
        else {
          let restRequestNode = v[1][0];
          b = this.draw(treeGraph, restRequestNode.nodeObject.remoteTrace ? restRequestNode.nodeObject.remoteTrace : <ServerRestSession>{ appName: v[1][0].nodeObject.host }, serverlbl, linklbl)
          label = restRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[restRequestNode.getLinkStyle()];
        }

        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //databaseRequests
    if (server.databaseRequests) {
      let res = this.groupBy<DatabaseRequest, JdbcRequestNode>(server.databaseRequests, v => v.name, JdbcRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let jdbcRequestNode = v[1][0];
        b = treeGraph.insertServer(jdbcRequestNode.formatNode(serverlbl), "JDBC"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.checkSome<JdbcRequestNode>(v[1], v => { return !v.nodeObject.status }) ? 'FAILURE' : 'SUCCES'] + "strokeWidth=1.5;"
        } else {
          label = jdbcRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[jdbcRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //ftpRequests
    if (server.ftpRequests) {
      let res = this.groupBy<FtpRequest, FtpRequestNode>(server.ftpRequests, v => v.host, FtpRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let ftpRequestNode = v[1][0];
        b = treeGraph.insertServer(ftpRequestNode.formatNode(serverlbl), "FTP"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.checkSome<FtpRequestNode>(v[1], v => { return !v.nodeObject.status }) ? 'FAILURE' : 'SUCCES'] + "strokeWidth=1.5;"
        } else {
          label = ftpRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[ftpRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //mailRequests
    if (server.mailRequests) {
      let res = this.groupBy<MailRequest, MailRequestNode>(server.mailRequests, v => v.host, MailRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let mailRequestNode = v[1][0];
        b = treeGraph.insertServer(mailRequestNode.formatNode(serverlbl), "SMTP"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.checkSome<MailRequestNode>(v[1], v => { return !v.nodeObject.status }) ? 'FAILURE' : 'SUCCES'] + "strokeWidth=1.5;"
        } else {
          label = mailRequestNode.formatLink(linklbl);
          linkStyle = LinkConfig[mailRequestNode.getLinkStyle()];
        }
        treeGraph.insertLink(label, a, b, linkStyle);
      })
    }

    //ldapRequests
    if (server.ldapRequests) {
      let res = this.groupBy<NamingRequest, LdapRequestNode>(server.ldapRequests, v => v.host, LdapRequestNode)
      Object.entries(res).forEach((v: any[]) => {
        let ldapRequestNode = v[1][0];
        b = treeGraph.insertServer(ldapRequestNode.formatNode(serverlbl), "LDAP"); // demon server
        if (v[1].length > 1) {
          label = { linkLbl: linklbl, nodes: v[1] };
          linkStyle = LinkConfig[this.checkSome<MailRequestNode>(v[1], v => { return !v.nodeObject.status }) ? 'FAILURE' : 'SUCCES'] + "strokeWidth=1.5;"
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

  checkSome<T>(arr: T[], fn: (o: T) => any) {
    return arr.some(r => fn(r));
  }

  getIcon(obj: ServerRestSession | ServerMainSession) {
    if ("type" in obj) {
      return obj.type == 'VIEW' ? 'VIEW' : 'BATCH'
    }
    return ('id' in obj ? 'REST' : 'GHOST')
  }

  ngAfterViewInit() {
    this._zone.runOutsideAngular(() => {
      this.resizeSubscription = fromEvent(window, 'resize').subscribe(() => {
        this._zone.run(() => {
          if (this.tree) {
            this.tree.resizeAndCenter()
          }
        })

      });
    });
  }

  ngOnDestroy() {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
    //destroy graph
  }


  viewByServerLbl(serverLbl: Label) {
    this.tree.clearCells();
    this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl = serverLbl, this.linkLbl))
  }
  viewByLinklbl(linkLbl: Label) {
    this.tree.clearCells();
    this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = linkLbl))
  }
  viewMethodResource() {
    let reqOb: any = {}
    if (!this.LabelIsLoaded['METHOD_RESOURCE']) {
      let ftpParam = this.getRequestsIds(this.TreeObj, (s) => s.ftpRequests?.map(o => o.id));
      let mailParam = this.getRequestsIds(this.TreeObj, (s) => s.mailRequests?.map(o => o.id));
      let ldapParam = this.getRequestsIds(this.TreeObj, (s) => s.ldapRequests?.map(o => o.id));
      ftpParam.ids?.length && (reqOb.ftp = this._treeService.getFtpRequestStage(ftpParam));
      mailParam.ids?.length && (reqOb.mail = this._treeService.getMailRequestStage(mailParam));
      ldapParam.ids?.length && (reqOb.ldap = this._treeService.getLdapRequestStage(ldapParam));
    }
    forkJoin(
      reqOb
    ).pipe(finalize(() => {
      this.tree.clearCells();
      this.LabelIsLoaded['METHOD_RESOURCE'] = true;
      this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = Label.METHOD_RESOURCE))
    })).subscribe((res: { ftp: {}, mail: {}, ldap: {} }) => {
      this.setRequestProperties(this.TreeObj, res.ftp, (s, actionMap) => s.ftpRequests?.length && s.ftpRequests.forEach(r => r["commands"] = actionMap[r['id']]))
      this.setRequestProperties(this.TreeObj, res.mail, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r["commands"] = actionMap[r['id']]))
      this.setRequestProperties(this.TreeObj, res.ldap, (s, actionMap) => s.ldapRequests?.length && s.ldapRequests.forEach(r => r["commands"] = actionMap[r['id']]))
    })
  }

  viewSizeCompression() {
    let reqOb: any = {}
    if (!this.LabelIsLoaded['SIZE_COMPRESSION']) {
      let jdbcParam = this.getRequestsIds(this.TreeObj, (s) => s.databaseRequests?.map(o => o.id));
      let mailParam = this.getRequestsIds(this.TreeObj, (s) => s.mailRequests?.map(o => o.id));
      jdbcParam.ids?.length && (reqOb.jdbc = this._treeService.getJdbcRequestCount(jdbcParam));
      mailParam.ids?.length && (reqOb.smtp = this._treeService.getSmtpRequestCount(mailParam));

    }
    forkJoin(
      reqOb
    ).pipe(finalize(() => {
      this.tree.clearCells();
      this.LabelIsLoaded['SIZE_COMPRESSION'] = true;
      this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = Label.SIZE_COMPRESSION))
    })).subscribe((res: { jdbc: {}, smtp: {} }) => {
      this.setRequestProperties(this.TreeObj, res.jdbc, (s, actionMap) => s.databaseRequests?.length && s.databaseRequests.forEach(r => r["count"] = actionMap[r['id']]))
      this.setRequestProperties(this.TreeObj, res.smtp, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r["count"] = actionMap[r['id']]))
    })
  }

  viewStatusException() {
    let reqOb: any = {};
    if (!this.LabelIsLoaded['STATUS_EXCEPTION']) {
      let jdbcParam = this.getRequestsIds(this.TreeObj, (s) => s.databaseRequests?.filter(o => !o.status).map(o => o.id));
      //let restParam = this.getRequestsIds(this.TreeObj, (s)=> s.restRequests?.filter(o=> o.status >=400).map(o=> o.idRequest));
      let ftpParam = this.getRequestsIds(this.TreeObj, (s) => s.ftpRequests?.filter(o => !o.status).map(o => o.id));
      let smtpParam = this.getRequestsIds(this.TreeObj, (s) => s.mailRequests?.filter(o => !o.status).map(o => o.id));
      let ldapParam = this.getRequestsIds(this.TreeObj, (s) => s.ldapRequests?.filter(o => !o.status).map(o => o.id));
      jdbcParam.ids?.length && (reqOb.jdbc = this._treeService.getJdbcExceptions(jdbcParam));
      ftpParam.ids?.length && (reqOb.ftp = this._treeService.getFtpExceptions(ftpParam));
      smtpParam.ids?.length && (reqOb.smtp = this._treeService.getSmtpExceptions(smtpParam));
      ldapParam.ids?.length && (reqOb.ldap = this._treeService.getLdapExceptions(ldapParam));
    }
    forkJoin(
      reqOb
    ).pipe(finalize(() => {
      this.tree.clearCells();
      this.LabelIsLoaded['STATUS_EXCEPTION'] = true;
      this.tree.draw(() => this.dr(this.tree, this.TreeObj, this.serverLbl, this.linkLbl = Label.STATUS_EXCEPTION))
    })).subscribe((res: { jdbc: any, rest: any, ftp: any, smtp: any, ldap: any }) => {

      this.setRequestProperties(this.TreeObj, res.jdbc, (s, actionMap) => s.databaseRequests?.length && s.databaseRequests.forEach(r => r["exception"] = actionMap[r['id']]))
      //this.setRequestProperties(this.TreeObj, res.rest, "restRequests", "exception", "idRequest" )
      this.setRequestProperties(this.TreeObj, res.ftp, (s, actionMap) => s.ftpRequests?.length && s.ftpRequests.forEach(r => r["exception"] = actionMap[r['id']]))
      this.setRequestProperties(this.TreeObj, res.smtp, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r["exception"] = actionMap[r['id']]))
      this.setRequestProperties(this.TreeObj, res.ldap, (s, actionMap) => s.ldapRequests?.length && s.ldapRequests.forEach(r => r["exception"] = actionMap[r['id']]))
    })
  }

  getRequestsIds(treeObj: ServerRestSession | ServerMainSession, f?: (s: ServerRestSession | ServerMainSession) => number[]) {
    let arr: number[] = [];
    this.deepApply(treeObj, (s: ServerRestSession | ServerMainSession) => {
      let res = f(s);
      if (res) {
        arr = arr.concat(res);
      }
    });
    return { ids: arr };
  }

  setRequestProperties<T>(treeObj: ServerRestSession | ServerMainSession, actionMap: T, pre: (s: ServerRestSession | ServerMainSession, actionMap: T) => void) {
    this.deepApply(treeObj, s => actionMap && pre(s, actionMap));
  }

  deepApply(treeObj: ServerRestSession | ServerMainSession, fn: (s: ServerRestSession | ServerMainSession) => void) {
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









