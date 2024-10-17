import { Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, finalize, forkJoin, fromEvent, Observable } from 'rxjs';
import { Location } from '@angular/common';
import mx from '../../../mxgraph';
import { Utils } from 'src/app/shared/util';
import { TraceService } from 'src/app/service/trace.service';
import { application } from 'src/environments/environment';
import { EnvRouter } from "../../service/router.service";
import { RestRequest, ServerMainSession, ServerRestSession, RestServerNode, Label, MainServerNode, JdbcRequestNode, FtpRequestNode, MailRequestNode, LdapRequestNode, RestRequestNode, ExceptionInfo, DatabaseRequest, MailRequest, NamingRequest, FtpRequest, SessionStage } from 'src/app/model/trace.model';
import { Q, R } from '@angular/cdk/keycodes';
import { TreeService } from 'src/app/service/tree.service';


@Component({
  selector: 'app-tree',
  templateUrl: './newtree.view.html',
  styleUrls: ['./newtree.view.scss'],

})
export class NewTreeView implements OnDestroy {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(EnvRouter);
  private _traceService = inject(TraceService);
  private _zone = inject(NgZone);
  private _location = inject(Location);
  private _treeService = inject(TreeService);

  id: string;
  groupedExchange: any;
  exchange: any;
  selectedExchange: any;
  selectedElemenet: number;
  currentState: any;
  graph: any
  parent: any;
  layout: any;
  highlighter: any;
  resizeSubscription: any;
  oldCellParent: any;
  highlightedCell: any;
  detailed: boolean = false;
  env: any;
  isLoading: boolean;
  data: any;

  TreeObj: any;
  serverLbl: Label;
  linkLbl: Label;
  LabelIsLoaded: { [key: string]: boolean } = { "METHOD_RESOURCE": false, "STATUS_EXCEPTION": false, "SIZE_COMPRESSION": false }
  @ViewChild('graphContainer') graphContainer: ElementRef;
  @ViewChild('outlineContainer') outlineContainer: ElementRef;

  constructor() {
    const self = this;
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.data,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, data, queryParams]) => {
        console.log(data)
        this.id = params['id_session'];
        this.env = queryParams.env || application.default_env;
        this.data = data
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
        this.getTree(this.data, this.serverLbl = Label.SERVER_IDENTITY, this.linkLbl = Label.ELAPSED_LATENSE);


      },
    })
  }

  getTree(data: any, serverlbl: Label, linklbl: Label) {

    this.isLoading = true;
    this._traceService.getTree(this.id, data['type']).pipe(finalize(() => this.isLoading = false)).subscribe((d: ServerRestSession /*| ServerMainSession*/) => {
      this.TreeObj = d;
      let self = this;
      TreeGraph.setup(this.graphContainer.nativeElement, tg => {
        tg.createPopupMenu((menu, cell, evt) => {
          self.createPopupMenu(tg, menu, cell, evt);
        })
        tg.draw(() => self.dr(tg, d, serverlbl, linklbl))
      });
    })
  }

  dr(tg: TreeGraph, data: any, serverlbl: Label, linklbl: Label) {
    let p = tg.insertServer("parent", 'LINK')
    let a = this.draw(tg, data, serverlbl, linklbl);
    let label = `${this.getElapsedTime(data.end, data.start)}s` // edit 
    tg.insertEdge(label, p, a);
  }

  mergeRestRequests(name: string, array: RestRequest[]): ServerRestSession {
    var remote = array[0].remoteTrace ? array[0].remoteTrace : { appName: name };
    let acc: any = { ...remote, 'restRequests': [], 'databaseRequests': [], 'ftpRequests': [], 'mailRequests': [], 'ldapRequests': [] };
    array.forEach(o => {
      if (o.remoteTrace) {
        o.remoteTrace.restRequests && acc.restRequests.push(...o.remoteTrace.restRequests)
        o.remoteTrace.databaseRequests && acc.databaseRequests.push(...o.remoteTrace.databaseRequests)
        o.remoteTrace.ftpRequests && acc.ftpRequests.push(...o.remoteTrace.ftpRequests)
        o.remoteTrace.mailRequests && acc.mailRequests.push(...o.remoteTrace.mailRequests)
        o.remoteTrace.ldapRequests && acc.ldapRequests.push(...o.remoteTrace.ldapRequests)
      }
    })
    return <ServerRestSession>acc;
  }

  draw(treeGraph: TreeGraph, server: ServerRestSession | ServerMainSession, serverlbl: Label, linklbl: Label) {

    let serverNode = ('protocol' in server ? new RestServerNode(server) : new MainServerNode(server)); // todo test if has remote returns icons style 
    let icon: ServerType = ('id' in serverNode.nodeObject ? 'REST' : 'GHOST')
    let a = treeGraph.insertServer(serverNode.formatNode(serverlbl), icon)
    let label = '';
    let b;

    //restRequests 
    if (server.restRequests) {
      let res = this.groupBy(server.restRequests, v => v.remoteTrace ? v.remoteTrace.appName : v.host) //instance

      Object.entries(res).forEach((v: any[]) => {//[key,[req1,req2,..]]
        if (v[1].length > 1) {
          b = this.draw(treeGraph, this.mergeRestRequests(v[0], v[1]), serverlbl, null);
          label = `${v[1].length}` // edit 
        }
        else {
          let restRequestNode = new RestRequestNode(v[1][0]);
          b = this.draw(treeGraph, restRequestNode.nodeObject.remoteTrace ? restRequestNode.nodeObject.remoteTrace : <ServerRestSession>{ appName: v[1][0].host }, serverlbl, linklbl)
          label = restRequestNode.formatLink(linklbl);
        }
        treeGraph.insertEdge(label, a, b);
      })
    }

    //databaseRequests
    if (server.databaseRequests) {
      let res = this.groupBy(server.databaseRequests, v => v.name)
      Object.entries(res).forEach((v: any[]) => {
        let jdbcRequestNode = new JdbcRequestNode(v[1][0]);
        b = treeGraph.insertServer(jdbcRequestNode.formatNode(serverlbl), "JDBC"); // demon server
        if (v[1].length > 1) {
          label = `${v[1].length}` // edit 
        } else {
          label = jdbcRequestNode.formatLink(linklbl);
        }
        treeGraph.insertEdge(label, a, b);
      })
    }

    //ftpRequests
    if (server.ftpRequests) {
      let res = this.groupBy(server.ftpRequests, v => v.host)
      Object.entries(res).forEach((v: any[]) => {
        let ftpRequestNode = new FtpRequestNode(v[1][0]);
        b = treeGraph.insertServer(ftpRequestNode.formatNode(serverlbl), "FTP"); // demon server
        if (v[1].length > 1) {
          label = `${v[1].length}` // edit 
        } else {
          label = ftpRequestNode.formatLink(linklbl);
        }
        treeGraph.insertEdge(label, a, b);
      })
    }

    //mailRequests
    if (server.mailRequests) {
      let res = this.groupBy(server.mailRequests, v => v.host)
      Object.entries(res).forEach((v: any[]) => {
        let mailRequestNode = new MailRequestNode(v[1][0]);
        b = treeGraph.insertServer(mailRequestNode.formatNode(serverlbl), "SMTP"); // demon server
        if (v[1].length > 1) {
          label = `${v[1].length}` // edit 
        } else {
          label = mailRequestNode.formatLink(linklbl);
        }
        treeGraph.insertEdge(label, a, b);
      })
    }

    //ldapRequests
    if (server.ldapRequests) {
      let res = this.groupBy(server.ldapRequests, v => v.host)
      Object.entries(res).forEach((v: any[]) => {
        let ldapRequestNode = new LdapRequestNode(v[1][0]);
        b = treeGraph.insertServer(ldapRequestNode.formatNode(serverlbl), "LDAP"); // demon server
        if (v[1].length > 1) {
          label = `${v[1].length}` // edit 
        } else {
          label = ldapRequestNode.formatLink(linklbl);

        }
        treeGraph.insertEdge(label, a, b);
      })
    }
    return a;
  }

  groupBy<T>(array: T[], fn: (o: T) => string): { [name: string]: T[] } {
    return array.reduce((acc: any, item: any) => {
      var id = fn(item);
      if (!acc[id]) {
        acc[id] = [];
      }
      acc[id].push(item);
      return acc;
    }, {})
  }


  getTreeold(data: any) {
    this.isLoading = true;
    this._traceService.getTree(this.id, data['type']).pipe(finalize(() => this.isLoading = false)).subscribe(d => {
      this.exchange = {};
      this.exchange['remoteTrace'] = d;



      /* let mxGraphViewGetPerimeterPoint = mx.mxGraphView.prototype.getPerimeterPoint;
       mx.mxGraphView.prototype.getPerimeterPoint = function(terminal:any, next:any, orthogonal:any, border:any)
       {
         var point = mxGraphViewGetPerimeterPoint.apply(this, arguments);
         
         if (point != null)
         {
           var perimeter = this.getPerimeterFunction(terminal);

           if (terminal.text != null && terminal.text.boundingBox != null)
           {
             // Adds a small border to the label bounds
             var b = terminal.text.boundingBox.clone();
             b.grow(6)

             if (mx.mxUtils.rectangleIntersectsSegment(b, point, next))
             {
               point = perimeter(b, terminal, next, orthogonal);
             }
           }
         }
         
         return point;
       };*/
      // Disables built-in context menu


      // mx.mxEvent.disableContextMenu(this.graphContainer.nativeElement); // Disables the context menu for the given element.
      this.graph = new mx.mxGraph(this.graphContainer.nativeElement); // create a graph inside a DOM node with an id of graph

      // this.graph.setCellsLocked(true); //Sets if any cell may be moved, sized, bended, disconnected, edited or selected.
      /*this.graph.popupMenuHandler.factoryMethod = function (menu: any, cell: any, evt: any) { //Function that is used to create the popup menu.
          return self.createPopupMenu(this.graph, menu, cell, evt);
        };*/

      /*var outln = new mx.mxOutline(this.graph, this.outlineContainer.nativeElement) //Constructs a new outline for the specified graph inside the given container.
        var originalUpdate = outln.update;
        outln.update = function () {
          originalUpdate.apply(this, arguments);
         // self.animateEdges();
        }*/

      //this.graph.setResizeContainer(true);
      //  new mx.mxCellTracker(this.graph, "lightGray"); // Constructs an event handler that highlights cells.
      //  this.highlighter = new mx.mxCellHighlight(self.graph, '#ff0000', 3); // Constructs a cell highlight.
      this.parent = this.graph.getDefaultParent(); // Returns defaultParent or mxGraphView.currentRoot or the first child child 
      // this.setEdgeDefaultStyle()
      // this.setVertexDefaultStyle()
      this.layout = new mx.mxHierarchicalLayout(this.graph); //Constructs a new hierarchical layout algorithm.
      // this.layout.intraCellSpacing = 120; //The spacing buffer added between cells on the same layer. 


      //redefine getLabel function 
      /* this.graph.getLabel = function (cell: any) {
         if (cell?.isVertex() && cell.value && typeof cell.value === 'object') {
           if (cell.value.hasOwnProperty('data')) {
             return cell.value.data[0].remoteTrace.appName; //
           }
           return cell.value.remoteTrace.appName;
         }
         return mx.mxGraph.prototype.getLabel.apply(this, arguments);
       }*/


      this.graph.getModel().beginUpdate();
      try {
        if (this.exchange) {
          // start drawing the graph
          //this.groupedExchange = this.groupRequestsByProperty([this.exchange]);
          console.log(this.groupedExchange)

          let a = this.graph.insertVertex(this.parent, null, 'a', 0, 0, 80, 30, 'shape=image;image=assets/mxgraph/MICROSERVICE.drawio.svg;') //Adds a new vertex into the given parent mxCell using value as the user object and the given coordinates as the mxGeometry of the new vertex.
          let b = this.graph.insertVertex(this.parent, null, 'b', 0, 0, 80, 30, "shape=image;image=assets/mxgraph/MICROSERVICE.drawio.svg;");
          this.graph.insertEdge(this.parent, null, 'link', a, b) //Adds a new edge into the given parent mxCell using value as the user object and the given source and target as the terminals of the new edge.
          //this.setnode(this.groupedExchange[Object.keys(this.groupedExchange)[0]], this.detailed = false, false)
        }
        this.layout.execute(this.parent)
      }
      finally {
        // Updates the display
        this.graph.getModel().endUpdate();
        this.resizeAndCenter(this);
        //this.animateEdges();
      }



      // new tings
      // this.graph.centerZoom = false;
      // this.graph.setTooltips(true);
      // this.graph.setEnabled(false);  // Specifies if the graph should allow any interactions.
      // this.graph.panningHandler.useLeftButtonForPanning = true; // Specifies if panning should be active for the left mouse button. 
      // this.graph.panningHandler.ignoreCell = true; // Specifies if panning should be active even if there is a cell under the mousepointer.
      // this.graph.container.style.cursor = 'move'
      // this.graph.setPanning(true); // Specifies if panning should be enabled.
    });
  }


  setnode(exchange: any, parentBefore: any, detailed: boolean) {
    let ex = exchange;
    let i
    if (detailed)
      i = ex;
    else
      i = ex.data[0];
    let vertexIcon = this.getVertexIconType(i)
    let exParent = this.graph.insertVertex(this.parent, null, exchange, 0, 0, 80, 30, 'shape=image;image=assets/mxgraph/' + vertexIcon + '.drawio.svg;')
    if (exchange) {

      let edgeLabel = '', edgeStyle = '', vertexStyle = '', bdd: any, req;
      //setting querries nodes
      if (ex.remoteTrace.databaseRequests) {
        if (detailed) {
          ex.remoteTrace.databaseRequests.forEach((q: any, i: any) => {
            vertexIcon = this.getVertexIconType(q)
            bdd = this.graph.insertVertex(this.parent, null, { data: [q] }, 0, 0, 80, 30, "shape=image;image=assets/mxgraph/" + vertexIcon + ".drawio.svg;");
            edgeStyle = this.checkQueryStatus(q.completed);
            edgeLabel = this.getElapsedTime(q.end, q.start) + "s"
            this.graph.insertEdge(this.parent, null, edgeLabel, exParent, bdd, edgeStyle)
          });
        } else {

          let groupedItems = this.groupByProperty(ex.remoteTrace.databaseRequests, 'name');
          Object.keys(groupedItems).forEach((i) => {
            vertexIcon = this.getVertexIconType(groupedItems[i].data[0])
            bdd = this.graph.insertVertex(this.parent, null, groupedItems[i], 0, 0, 80, 30, "shape=image;image=assets/mxgraph/" + vertexIcon + ".drawio.svg;")
            edgeStyle = "", edgeLabel = ""
            if (groupedItems[i].data.length > 1) {
              if (groupedItems[i].succesCalls == groupedItems[i].data.length)
                edgeLabel = `${groupedItems[i].succesCalls}  / ${groupedItems[i].data.length}`;
              else
                edgeLabel = `${groupedItems[i].data.length - groupedItems[i].succesCalls} / ${groupedItems[i].data.length}`;
            } else {
              edgeLabel = edgeLabel = this.getElapsedTime(groupedItems[i].data[0].end, groupedItems[i].data[0].start) + "s"
            }
            edgeStyle = groupedItems[i].succesCalls == groupedItems[i].data.length ? "strokeColor=green;" : "strokeColor=red;"
            this.graph.insertEdge(this.parent, null, edgeLabel, exParent, bdd, edgeStyle)
          })

        }

      }

      //setting child requests
      if (ex.remoteTrace.restRequests) {
        if (detailed) {

          ex.remoteTrace.restRequests.forEach((r: any) => {
            edgeStyle = "";
            if (r.remoteTrace.unknown) {
              r.remoteTrace = this.setUnknowHost(r);
              vertexStyle = r.remoteTrace.vertexStyle;
            }
            vertexIcon = this.getVertexIconType(r)
            r.appName = r.remoteTrace.name;
            req = this.graph.insertVertex(this.parent, null, { data: [r] }, 0, 0, 80, 30, 'shape=image;image=assets/mxgraph/api.drawio.svg;fillColor=#81D060;')
            edgeStyle += `strokeColor=${Utils.getStateColor(r.status)};`;
            edgeLabel = this.getElapsedTime(r.end, r.start) + "s"
            this.graph.insertEdge(this.parent, null, edgeLabel, exParent, req, edgeStyle)
          })
        } else {
          let groupedItems = this.groupRequestsByProperty(ex.remoteTrace.restRequests);
          if (groupedItems) {
            Object.keys(groupedItems).forEach((i) => {
              req = JSON.parse(JSON.stringify(groupedItems[i]));
              req.remoteTrace.succesCalls = groupedItems[i].succesCalls;
              req.remoteTrace.parentCallCount = groupedItems[i].data.length; // number of calls
              req.remoteTrace.isRequest = true;
              this.setnode(req, exParent, detailed)
            });
          }
        }
      }


      //setting edge between parent and current exanchge if parent exist
      if (parentBefore) {
        let edgeLabel = "", edgeStyle = "";
        if (ex?.remoteTrace.parentCallCount > 1) {
          edgeStyle += ex?.remoteTrace.parentCallCount == ex?.remoteTrace.succesCalls ? "strokeColor=green;" : "strokeColor=red;"
          if (ex?.remoteTrace.succesCalls == ex?.remoteTrace.parentCallCount)
            edgeLabel = `${ex?.remoteTrace.succesCalls} / ${ex?.remoteTrace.parentCallCount}`;
          else
            edgeLabel = `${ex?.remoteTrace.parentCallCount - ex?.remoteTrace.succesCalls} / ${ex?.remoteTrace.parentCallCount}`;
        } else {
          edgeStyle += "strokeColor=" + Utils.getStateColor(exchange.data[0].status)
          edgeLabel = `${this.getElapsedTime(exchange.data[0].end, exchange.data[0].start)}s`
        }

        //edgeStyle += exchange?.remoteTrace.protocol == 'http' ? "dashed=1;" : ""
        this.graph.insertEdge(this.parent, null, edgeLabel, parentBefore, exParent, edgeStyle);
      }

    }
  }

  groupByProperty(array: any, property: string) {
    let groupedItems = array.reduce((acc: any, item: any) => {
      if (!acc[item[property]]) {
        acc[item[property]] = {}
        acc[item[property]].succesCalls = 0
        acc[item[property]].data = []
      }
      if (item.completed) {
        acc[item[property]].succesCalls += 1
      }
      item.remoteTrace = { "@type": 'db', 'appName': item[property] };
      acc[item[property]].data.push(item);

      return acc;
    }, {});
    return groupedItems;
  }

  groupRequestsByProperty(array: any) {
    let groupedItems = array.reduce((acc: any, item: any) => {
      let property;
      if (item.remoteTrace) {
        property = item.remoteTrace.appName;

      } else {
        property = item.host
        item['remoteTrace'] = this.setUnknowHost(item);
      }
      if (!acc[property]) {
        acc[property] = {};
        acc[property].data = [];
        acc[property].succesCalls = 0;
        acc[property].remoteTrace = { "application": { "name": property } }; // maybe revert
        acc[property].remoteTrace.restRequests = [];
        acc[property].remoteTrace.databaseRequests = [];
      }

      if (item.status >= 200 && item.status < 300)
        acc[property].succesCalls += 1;


      acc[property].data.push(item)
      if (item.remoteTrace['@type'] != "unknown") {
        if (item.remoteTrace.restRequests) {
          acc[property].remoteTrace?.restRequests.push(...item.remoteTrace.restRequests);
        }
        if (item.remoteTrace.databaseRequests) {
          acc[property].remoteTrace?.databaseRequests.push(...item.remoteTrace?.databaseRequests);
        }
      }

      return acc;
    }, {});
    return groupedItems;
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

  ngAfterViewInit() {
    this._zone.runOutsideAngular(() => {
      this.resizeSubscription = fromEvent(window, 'resize').subscribe(() => {
        this._zone.run(() => {
          if (this.graph) {

            this.resizeAndCenter(this);
            this.animateEdges();
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

  checkRequestStatus(status: number): string {
    if (status >= 200 && status < 300)
      return "strokeColor=green;"
    else {
      return "strokeColor=red;"
    }
  }

  checkQueryStatus(completed: boolean) {
    if (completed)
      return "strokeColor=green;"
    else {
      return "strokeColor=red;"
    }
  }

  setUnknowHost(item: any) {
    return {
      "@type": "unknown",
      "unknown": true,
      "application": { "name": item.host },
      "name": item.host,
      "start": item.start,
      "end": item.end
    }
  }

  getElapsedTime(end: number, start: number) {
    return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
  }

  getVertexIconType(exchange: any) {
    console.log(exchange);
    if (exchange.hasOwnProperty('productName'))
      return this.vertexIcons['DATABASE'][exchange.completed];

    if (exchange.remoteTrace["@type"] == "main")
      return this.vertexIcons[exchange.remoteTrace.type]

    if (exchange.remoteTrace['@type'] == "unknown")
      return this.vertexIcons["unknown"][exchange["status"]];

    //return this.vertexIcons[exchange.remoteTrace["@type"]][exchange.remoteTrace["status"]];
    return this.vertexIcons[exchange.remoteTrace["@type"]];
  }

  overrideSetLabel() { // remove
    mx.mxStyleRegistry.putValue('customEdgeStyle', function (state: any, source: any, target: any, points: any, result: any) {
      if (source != null) {
        const y = source.getCenterY() + source.height / 2;
        result.push(new mx.mxPoint(source.getCenterW(), y + 20));
      }

      if (target != null) {
        const y = target.getCenterY() + target.height / 2;
        result.push(new mx.mxPoint(target.getCenterX(), y + 20))
      }
    });
  }

  setVertexDefaultStyle() {
    let style = this.graph.getStylesheet().getDefaultVertexStyle();
    style[mx.mxConstants.STYLE_VERTICAL_LABEL_POSITION] = "bottom"
    style[mx.mxConstants.STYLE_VERTICAL_ALIGN] = "top"
    style[mx.mxConstants.STYLE_FONTCOLOR] = '#446299'
    //style[mx.mxConstants.STYLE_IMAGE_BORDER] = "black";
  }

  setEdgeDefaultStyle() {
    let style = this.graph.getStylesheet().getDefaultEdgeStyle();
    style[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
    style[mx.mxConstants.EDGE_SELECTION_STROKEWIDTH] = 10;
    style[mx.mxConstants.STYLE_STROKEWIDTH] = 1.5;
    style[mx.mxConstants.STYLE_ENDARROW] = "blockThin";
    style[mx.mxConstants.STYLE_ENDSIZE] = 2;
    style[mx.mxConstants.STYLE_ENDFILL] = 1;

    style[mx.mxConstants.STYLE_SOURCE_PERIMETER_SPACING] = 12;
    //style[mx.mxConstants.STYLE_ROUNDED] = 1;
    //style[mx.mxConstants.STYLE_PERIMETER_SPACING] = 12
    //style[mx.mxConstants.STYLE_STROKE_OPACITY] = 50
    //style[mx.mxConstants.STYLE_FILL_OPACITY] = 50
    //style[mx.mxConstants.STYLE_EXIT_X] = 0.5
    //style[mx.mxConstants.STYLE_EXIT_Y] = 10
  }

  animateEdges() {
    let state;
    let allEdges = this.graph.getChildEdges(this.parent);
    allEdges.forEach((edge: any) => {
      state = this.graph.view.getState(edge);

      if (state) {
        state.shape.node.getElementsByTagName('path')[0].setAttribute('stroke-width', '4'); // link it to size in size out
        state.shape.node.getElementsByTagName('path')[0].setAttribute('stroke', 'lightGray');
        if (!edge.style.includes("strokeColor=red;") && !edge.style.includes("strokeColor=orange;")) {
          state.shape.node.getElementsByTagName('path')[0].removeAttribute('visibility');
          state.shape.node.getElementsByTagName('path')[1].setAttribute('class', 'flow');
        }

      }
    });
  }

  resetOriginalTree() {
    if (this.oldCellParent) {
      this.graph.getModel().beginUpdate()
      try {
        //console.log(this.oldCellParent)
        this.clearCells();
        this.setnode(this.oldCellParent, null, this.detailed = false)
        this.layout = new mx.mxHierarchicalLayout(this.graph);
        this.layout.intraCellSpacing = 120;
        this.layout.execute(this.parent);


      } finally {
        this.graph.getModel().endUpdate()
        this.resizeAndCenter(this);
        this.animateEdges();
        this.oldCellParent = null;
      }


    }
  }

  resizeAndCenter(self: any) { // todo: remove 
    let availableWidth = document.getElementById("fixed-width-container")?.offsetWidth;
    let availableHeight = document.getElementById("fixed-width-container")?.offsetHeight;
    self.graph.doResizeContainer(availableWidth, availableHeight);
    self.graph.fit()
    var margin = 2;
    var max = 3;
    var bounds = self.graph.getGraphBounds();
    var cw = self.graph.container.clientWidth - margin;
    var ch = self.graph.container.clientHeight - margin;
    var w = bounds.width / self.graph.view.scale;
    var h = bounds.height / self.graph.view.scale;
    var s = Math.min(max, Math.min(cw / w, ch / h));

    self.graph.view.scaleAndTranslate(s,
      (margin + cw - w * s) / (2 * s) - bounds.x / self.graph.view.scale,
      (margin + ch - h * s) / (2 * s) - bounds.y / self.graph.view.scale);
  }

  getActionsCount(actionsList: any) {
    let e = actionsList.reduce((acc: any, item: any) => {
      let key = item.type + "_succes"
      if (item?.exception?.classname || item?.exception?.message)
        key = item.type + "_failure";

      if (!acc[key]) {
        acc[key] = {}
        acc[key].failed = !!(item?.exception?.classname || item?.exception?.message)
        acc[key].name = item.type;
        acc[key].count = 0
      }
      acc[key].count++;
      return acc;
    }, {})

    return e;
  }

  /*createPopupMenu(graph: any, menu: any, cell: any, evt: any) {
    let self = this;
    if (cell != null) {

      if (cell.isEdge() && cell.target.value.data.length == 1) {
        let callType = "";
        let mainType = "";
        let target = cell.target.value.data[0];
        let targetId = "";
        if (!target.hasOwnProperty('name')) {
          if (target.remoteTrace['@type'] == "rest") {
            callType = "rest";

          } else if (target.remoteTrace['@type'] == 'main') {
            callType = "main";
            mainType = target.remoteTrace.type;
          }
          targetId = target.remoteTrace.id
        } else {
          callType = "rest"
          targetId = cell.source.value.data[0].remoteTrace.id
        }

        menu.addItem('Détails de l\'appel ', 'editors/images/image.gif', function () {
          if (mainType != "") {
            self._router.navigate(['/session', callType, mainType, targetId]);
          } else {
            self._router.navigate(['/session', callType, targetId]);
          }
        });



      }
      if (cell.isVertex()) {
        let target = cell.value.data[0];
        if (target.remoteTrace.hasOwnProperty('@type')) {
          if (target.remoteTrace['@type'] == "rest") {
            menu.addItem('Statistique ', '../src/images/warning.gif', function () {
              self._router.navigate(['/statistic', 'rest', target.appName]);
            });
          }
        }

      }
      menu.addSeparator();
    }


  };*/



  vertexIcons: any = {
    "VIEW": "BROWSER",
    "BATCH": "MICROSERVICE",
    /* "api": {
       "200": "MICROSERVICE200",
       "202": "MICROSERVICE202",
       "400": "MICROSERVICE400",
       "401": "MICROSERVICE401",
       "402": "MICROSERVICE402",
       "404": "MICROSERVICE404",
       "500": "MICROSERVICE500",
     },*/
    "rest": "MICROSERVICE",
    "endpoint": "api",
    "unknown":
    {
      "200": "UNKNOWN_SUCCES",
      "500": "UNKNOWN_FAIL",
      "404": "UNKNOWN_FAIL",
      "0": "UNKNOWN_FAIL"
    },
    "DATABASE": {
      'true': "DATABASE",
      'false': "DATABASE"
    }
  }

  createPopupMenu(tg: TreeGraph, menu: any, cell: any, evt: any) {
    let self = this;
    menu.addItem('Identité ', null/*, 'editors/images/image.gif'*/, function () {
      tg.clearCells();
      tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl = Label.SERVER_IDENTITY, self.linkLbl))
    });
    menu.addItem('OS/RE', null/*, 'editors/images/image.gif'*/, function () {
      tg.clearCells();
      tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl = Label.OS_RE, self.linkLbl))
    },);
    menu.addItem('IP/Port', null/*, 'editors/images/image.gif'*/, function () {
      tg.clearCells();
      tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl = Label.IP_PORT, self.linkLbl))
    });
    //menu.addItem('Branche - Commit', null/*, 'editors/images/image.gif'*/, function () {
    //  tg.clearCells();
    //  tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl = Label.BRANCH_COMMIT, self.linkLbl))
    //});
    menu.addItem('ELAPSED_LATENSE', null/*, 'editors/images/image.gif'*/, function () {
      tg.clearCells();
      tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl, self.linkLbl = Label.ELAPSED_LATENSE))
    });
    menu.addItem('METHOD_RESOURCE', null/*, 'editors/images/image.gif'*/, function () {

      let reqOb: any = {}
      if (!self.LabelIsLoaded['METHOD_RESOURCE']) {
        let ftpParam = self.getRequestsIds(self.TreeObj, (s) => s.ftpRequests?.map(o => o.id));
        let mailParam = self.getRequestsIds(self.TreeObj, (s) => s.mailRequests?.map(o => o.id));
        let ldapParam = self.getRequestsIds(self.TreeObj, (s) => s.ldapRequests?.map(o => o.id));
        ftpParam.ids?.length && (reqOb.ftp = self._treeService.getFtpRequestStage(ftpParam));
        mailParam.ids?.length && (reqOb.mail = self._treeService.getMailRequestStage(mailParam));
        ldapParam.ids?.length && (reqOb.ldap = self._treeService.getLdapRequestStage(ldapParam));
      }
      forkJoin(
        reqOb
      ).pipe(finalize(() => {
        tg.clearCells();
        self.LabelIsLoaded['METHOD_RESOURCE'] = true;
        tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl, self.linkLbl = Label.METHOD_RESOURCE))
      
      })).subscribe((res: { ftp: {}, mail: {}, ldap: {} }) => {
        self.setRequestProperties(self.TreeObj, res.ftp, (s, actionMap) => s.ftpRequests?.length && s.ftpRequests.forEach(r => r["commands"] = actionMap[r['id']]))
        self.setRequestProperties(self.TreeObj, res.mail, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r["commands"] = actionMap[r['id']]))
        self.setRequestProperties(self.TreeObj, res.ldap, (s, actionMap) => s.ldapRequests?.length && s.ldapRequests.forEach(r => r["commands"] = actionMap[r['id']]))
      })

    });

    menu.addItem('SIZE_COMPRESSION', null/*, 'editors/images/image.gif'*/, function () {

      let reqOb: any = {}
      if (!self.LabelIsLoaded['SIZE_COMPRESSION']) {
        let jdbcParam = self.getRequestsIds(self.TreeObj, (s) => s.databaseRequests?.map(o => o.id));
        let mailParam = self.getRequestsIds(self.TreeObj, (s) => s.mailRequests?.map(o => o.id));
        jdbcParam.ids?.length && (reqOb.jdbc = self._treeService.getJdbcRequestCount(jdbcParam));
        mailParam.ids?.length && (reqOb.smtp = self._treeService.getSmtpRequestCount(mailParam));
      }

      forkJoin(
        reqOb
      ).pipe(finalize(() => {
        tg.clearCells();
        self.LabelIsLoaded['SIZE_COMPRESSION'] = true;
        tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl, self.linkLbl = Label.SIZE_COMPRESSION))
      })).subscribe((res: { jdbc: {}, mail: {} }) => {
        self.setRequestProperties(self.TreeObj, res.jdbc, (s, actionMap) => s.databaseRequests?.length && s.databaseRequests.forEach(r => r["count"] = actionMap[r['id']]))
        self.setRequestProperties(self.TreeObj, res.mail, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r["count"] = actionMap[r['id']]))

      })

    });
    menu.addItem('SCHEME_PROTOCOL', null/*, 'editors/images/image.gif'*/, function () {
      tg.clearCells();
      tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl, self.linkLbl = Label.SCHEME_PROTOCOL))
    });
    menu.addItem('STATUS_EXCEPTION', null/*, 'editors/images/image.gif'*/, function () {


      let reqOb: any = {};
      if (!self.LabelIsLoaded['STATUS_EXCEPTION']) {
        let jdbcParam = self.getRequestsIds(self.TreeObj, (s) => s.databaseRequests?.filter(o => !o.status).map(o => o.id));
        //let restParam = self.getRequestsIds(self.TreeObj, (s)=> s.restRequests?.filter(o=> o.status >=400).map(o=> o.idRequest));
        let ftpParam = self.getRequestsIds(self.TreeObj, (s) => s.ftpRequests?.filter(o => !o.status).map(o => o.id));
        let smtpParam = self.getRequestsIds(self.TreeObj, (s) => s.mailRequests?.filter(o => !o.status).map(o => o.id));
        let ldapParam = self.getRequestsIds(self.TreeObj, (s) => s.ldapRequests?.filter(o => !o.status).map(o => o.id));
        jdbcParam.ids?.length && (reqOb.jdbc = self._treeService.getJdbcExceptions(jdbcParam));
        ftpParam.ids?.length && (reqOb.ftp = self._treeService.getFtpExceptions(ftpParam));
        smtpParam.ids?.length && (reqOb.smtp = self._treeService.getSmtpExceptions(smtpParam));
        ldapParam.ids?.length && (reqOb.ldap = self._treeService.getLdapExceptions(ldapParam));
      }
      /*if (restParam.ids?.length) {
        reqOb.rest = self._treeService.getRestExceptions(restParam)
      }*/

      forkJoin(
        reqOb
      ).pipe(finalize(() => {
        tg.clearCells();
        self.LabelIsLoaded['STATUS_EXCEPTION'] = true;
        tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl, self.linkLbl = Label.STATUS_EXCEPTION))
      })).subscribe((res: { jdbc: any, rest: any, ftp: any, smtp: any, ldap: any }) => {
        self.setRequestProperties(self.TreeObj, res.jdbc, (s, actionMap) => s.databaseRequests?.length && s.databaseRequests.forEach(r => r["exception"] = actionMap[r['id']]))
        //self.setRequestProperties(self.TreeObj, res.rest, "restRequests", "exception", "idRequest" )
        self.setRequestProperties(self.TreeObj, res.ftp, (s, actionMap) => s.ftpRequests?.length && s.ftpRequests.forEach(r => r["exception"] = actionMap[r['id']]))
        self.setRequestProperties(self.TreeObj, res.smtp, (s, actionMap) => s.mailRequests?.length && s.mailRequests.forEach(r => r["exception"] = actionMap[r['id']]))
        self.setRequestProperties(self.TreeObj, res.ldap, (s, actionMap) => s.ldapRequests?.length && s.ldapRequests.forEach(r => r["exception"] = actionMap[r['id']]))
      })

    });
    menu.addItem('USER', null/*, 'editors/images/image.gif'*/, function () {
      tg.clearCells();
      tg.draw(() => self.dr(tg, self.TreeObj, self.serverLbl, self.linkLbl = Label.USER))
    });
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
    this.deepApply(treeObj, s => pre(s, actionMap));
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







class TreeGraph {


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

    mx.mxEvent.disableContextMenu(elem);
    let parent = graph.getDefaultParent(); // Returns defaultParent or mxGraphView.currentRoot or the first child child 
    let layout = new mx.mxHierarchicalLayout(graph); //Constructs a new hierarchical layout algorithm.
    layout.intraCellSpacing = 120;
    let tg = new TreeGraph(graph, parent, layout);
    tg.setEdgeDefaultStyle()
    tg.setVertexDefaultStyle()
    fn(tg);
  }

  draw(fn: () => void) {
    let layout = new mx.mxHierarchicalLayout(this.graph);
    layout.intraCellSpacing = 120;
    this.graph.getModel().beginUpdate();
    try {
      fn();
      layout.execute(this.parent);
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

  insertEdge(name: string, sender: any, receiver: any) {
    return this.graph.insertEdge(this.parent, null, name, sender, receiver)
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
    //style[mx.mxConstants.STYLE_IMAGE_BORDER] = "black";
  }

  setEdgeDefaultStyle() {
    let style = this.graph.getStylesheet().getDefaultEdgeStyle();
    style[mx.mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
    style[mx.mxConstants.EDGE_SELECTION_STROKEWIDTH] = 10;
    style[mx.mxConstants.STYLE_STROKEWIDTH] = 1.5;
    style[mx.mxConstants.STYLE_ENDARROW] = "blockThin";
    style[mx.mxConstants.STYLE_ENDSIZE] = 2;
    style[mx.mxConstants.STYLE_ENDFILL] = 1;
    style[mx.mxConstants.STYLE_SOURCE_PERIMETER_SPACING] = 12;
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

  private resizeAndCenter() {
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

export type ServerType = 'REST' | 'JDBC' | 'FTP' | 'SMTP' | 'LDAP' | 'LINK' | 'GHOST';
export const ServerConfig = {
  JDBC: { icon: "shape=image;image=assets/mxgraph/database.drawio.svg;", width: 80, height: 30 },
  REST: { icon: "shape=image;image=assets/mxgraph/microservice.drawio.svg;", width: 80, height: 30 },
  SMTP: { icon: "shape=image;image=assets/mxgraph/smtp.drawio.svg;", width: 80, height: 30 },
  FTP: { icon: "shape=image;image=assets/mxgraph/ftp.drawio.svg;", width: 80, height: 30 },
  LDAP: { icon: "shape=image;image=assets/mxgraph/ldap.drawio.svg;", width: 80, height: 30 },
  LINK: { icon: "shape=image;image=assets/mxgraph/parent.drawio.svg;", width: 30, height: 30 },
  GHOST: { icon: "shape=image;image=assets/mxgraph/ghost.drawio.svg;", width: 30, height: 30 }
}

