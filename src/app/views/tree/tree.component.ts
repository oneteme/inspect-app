import { Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, finalize, fromEvent } from 'rxjs';
import { Location } from '@angular/common';
import mx from '../../../mxgraph';
import { Utils } from 'src/app/shared/util';
import { TraceService } from 'src/app/service/trace.service';
import { application } from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";


@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],

})
export class TreeComponent implements OnDestroy {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(EnvRouter);
  private _traceService = inject(TraceService);
  private _zone = inject(NgZone);
  private _location = inject(Location);

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

  @ViewChild('graphContainer') graphContainer: ElementRef;
  @ViewChild('outlineContainer') outlineContainer: ElementRef;

  constructor() {
    const self = this;
    combineLatest({
      paramsList: this._activatedRoute.paramMap,
      queryParams: this._activatedRoute.queryParams
    }).subscribe({
      next: (v: { paramsList: Params, queryParams: Params }) => {
        this.id = v.paramsList.params['id_session'];
        this.env = v.queryParams.env || application.default_env;
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
        this.isLoading = true;
        this._traceService.getTree(this.id, v.paramsList.params['type_session']).pipe(finalize(() => this.isLoading = false)).subscribe(d => {

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


          mx.mxEvent.disableContextMenu(this.graphContainer.nativeElement);
          this.graph = new mx.mxGraph(this.graphContainer.nativeElement);

          this.graph.setCellsLocked(true);
          this.graph.popupMenuHandler.factoryMethod = function (menu: any, cell: any, evt: any) {
            return self.createPopupMenu(this.graph, menu, cell, evt);
          };
          var outln = new mx.mxOutline(this.graph, this.outlineContainer.nativeElement)
          var originalUpdate = outln.update;
          outln.update = function () {
            originalUpdate.apply(this, arguments);
            self.animateEdges();
          }

          // this.graph.setResizeContainer(true);
          new mx.mxCellTracker(this.graph, "lightGray");
          this.highlighter = new mx.mxCellHighlight(self.graph, '#ff0000', 3);

          this.parent = this.graph.getDefaultParent();
          this.setEdgeDefaultStyle()
          this.setVertexDefaultStyle()
          this.layout = new mx.mxHierarchicalLayout(this.graph);
          this.layout.intraCellSpacing = 120;


          //redefine getLabel function 
          this.graph.getLabel = function (cell: any) {
            if (cell?.isVertex() && cell.value && typeof cell.value === 'object') {
              if (cell.value.hasOwnProperty('data')) {
                return cell.value.data[0].remoteTrace.appName; //
              }
              return cell.value.remoteTrace.appName;
            }
            return mx.mxGraph.prototype.getLabel.apply(this, arguments);
          }


          this.graph.getModel().beginUpdate();
          try {
            if (this.exchange) {
              // start drawing the graph
              this.groupedExchange = this.groupRequestsByProperty([this.exchange]);
              this.setnode(this.groupedExchange[Object.keys(this.groupedExchange)[0]], this.detailed = false, false)
            }
            this.layout.execute(this.parent)


          }
          finally {
            // Updates the display
            this.graph.getModel().endUpdate();

            this.resizeAndCenter(this);
            this.animateEdges();
          }



          // new tings
          this.graph.centerZoom = false;
          // this.graph.setTooltips(true);
          this.graph.setEnabled(false);
          this.graph.panningHandler.useLeftButtonForPanning = true;
          this.graph.panningHandler.ignoreCell = true;
          //this.graph.container.style.cursor = 'move'
          this.graph.setPanning(true);

          //this.graph.border =20;
          //this.graph.resizeContainer = false; // to remove





          // listners

          this.graph.addListener(mx.mxEvent.DOUBLE_CLICK, function (sender: any, evt: any) {

          })

          this.graph.addListener(mx.mxEvent.CLICK, function (sender: any, evt: any) {
            const cell = evt.getProperty('cell');

            if (cell?.isEdge() && !self.detailed) {

              self.graph.getModel().beginUpdate()
              try { // remove unused variables
                const cellOldValue = JSON.parse(JSON.stringify(self.groupedExchange[Object.keys(self.groupedExchange)[0]]));
                const cellCopy = JSON.parse(JSON.stringify(cell.source.value));
                self.clearCells();
                self.detailed = true
                cellCopy.data.forEach((s: any) => {


                  if (!cell.target.value.data[0].hasOwnProperty('name')) {

                    s.remoteTrace.restRequests = s.remoteTrace.restRequests.filter((r: any) => { if (r) return (r?.remoteTrace?.application?.name == cell.target.value.data[0].appName || r?.remoteTrace?.name == cell.target.value.data[0].remoteTrace.name) })
                    s.remoteTrace.databaseRequests = []
                  } else {
                    // to be changed
                    if (s.remoteTrace.databaseRequests.length >= 1) {
                      s.remoteTrace.databaseRequests = cell.target.value.data
                    } else {
                      s.remoteTrace.databaseRequests = [];
                    }
                    s.remoteTrace.restRequests = []
                  }

                  if ((s.remoteTrace.databaseRequests.length >= 1 || s.remoteTrace.restRequests.length >= 1)) {
                    s.remoteTrace.oldName = s.remoteTrace.appName;
                    s.remoteTrace.appName = s.remoteTrace.name;
                    if (s.remoteTrace["@type"] == "rest")
                      s.remoteTrace["@type"] = "endpoint"
                    self.selectedExchange = cellCopy
                    self.setnode(s, null, self.detailed)
                  }
                });
                self.layout = new mx.mxHierarchicalLayout(self.graph);
                self.layout.intraCellSpacing = 120
                self.layout.execute(self.parent);
                self.oldCellParent = cellOldValue;

                /// to be fixedmxgr


              } catch (er) {
                console.log(er)
              } finally {
                self.graph.getModel().endUpdate()
                self.resizeAndCenter(self);
                self.animateEdges();
              }

            }

          })

          this.graph.addMouseListener({

            mouseMove: (sender: any, evt: any) => {


              const cellState = evt.getState();
              /*if (cellState) {
               this.selectedElemenet = cellState.cell.id;
                if (cellState.cell.isEdge()) {
                  this.selectedExchange = {
                    source: cellState.cell.source.value.data[0],
                    target: cellState.cell.target.value.data[0],
                    isEdge: cellState.cell.isEdge(),
                    isMultiplecall: false
                  }*/
              //  if (cellState.cell.value.match(/\d* \OK / \d*/)) {
              /*     this.selectedExchange.isMultiplecall = true;
                   this.selectedExchange.target = cellState.cell.target.value.data;
                 }
                 // console.log(cellState.cell)
               }

             } else {
               //   this.selectedExchange = undefined;
             }*/
            },
            mouseUp: (sender: any, evt: any) => {

            },
            mouseDown: (sender: any, evt: any) => {

            }
          })
          new mx.mxTooltipHandler(this.graph, 1);
          mx.mxGraph.prototype.getTooltipForCell = function (cell: any) {

            let modal = "", value;

            if (cell.isEdge()) {
              // console.log(cell)
              if (cell.target.value.hasOwnProperty('data')) {
                if (cell.target.value.data.length > 1)
                  return '';
                value = cell.target.value.data[0]
              }
              else
                value = cell.target.value

              switch (value.remoteTrace['@type']) {
                case 'main':
                  break;

                case 'db':
                  modal += `<span style="color:${Utils.getStateColorBool(value.completed)}">●</span> <span>${value.completed ? "réussi" : "échoué"}</span><br>`
                  modal += `<b>Thread :</b> ${value.threadName || 'N/A'}<br>`
                  modal += `<b>name :</b> ${value.name || 'N/A'}<br>`
                  modal += `<b>Hôte   :</b> ${value.host || 'N/A'}<br>`
                  /*value.actions.forEach((action: any) => {
                    if (action.exception) {
                      modal += `<span style="color:red">${action.exception.classname || ''} ${action.exception.message || ''}</span>`
                    }
                  });*/  // removed this since we dont get the actions from the back
                  break;

                case 'rest':
                  modal += `<span style="color:${Utils.getStateColor(value.remoteTrace.status)}">●</span> <span>${value.remoteTrace.status}&nbsp;&nbsp;&nbsp;&nbsp; <span style="float:right">${value.remoteTrace.path}</span></span><br>`
                  modal += `<b>Thread :</b> ${value.threadName || 'N/A'}<br>`
                  modal += `<b>Latence:</b> ${Utils.getElapsedTime(value.remoteTrace?.start, value.start)}s<br>`;
                  modal += `<span style="color:red">${value.remoteTrace?.exception?.classname || ''} ${value.remoteTrace?.exception?.message || ''}</span><br>`
                  //   modal += `<span style="float:right;"> ${self.UtilInstance.getElapsedTime(value.remoteTrace.end, value.remoteTrace.start)}s</span>`;
                  break;

                case 'unknown':
                  modal += `<b>Thread :</b> ${value.threadName || 'N/A'}<br>`
                  modal += `<span style="color:red">${cell.source.value.data[0]?.exception?.classname || ''} ${cell.source.value.data[0]?.exception?.message || ''}</span>`
                  break;

                default:
                  break;
              }

              return modal;
            }

            return '';
          }

          /*this.graph.getTooltipForCell = function (cell: any) {
            console.log(cell)
            return `<b>Status :</b> ${cell.value.data[0].status}<br>
                    <b>Thread :</b> ${cell.value.data[0].threadName} `
          }*/


        });
      }, error: (err) => {
        console.log(err)
      }
    })
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
      item.remoteTrace = { "@type": 'db','appName': item[property] };
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
        if(item.remoteTrace.restRequests){
          acc[property].remoteTrace?.restRequests.push(...item.remoteTrace.restRequests);
        }
        if(item.remoteTrace.databaseRequests){
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

  getElapsedTime(end: number, start: number,) {
    return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
  }

  getVertexIconType(exchange: any) {
    if (exchange.hasOwnProperty('productName'))
      return this.vertexIcons['DATABASE'][exchange.completed];

    if (exchange.remoteTrace["@type"] == "main")
      return this.vertexIcons[exchange.remoteTrace.launchMode]

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

  resizeAndCenter(self: any) {
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

  createPopupMenu(graph: any, menu: any, cell: any, evt: any) {
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
          if(mainType != "") {
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


  };



  vertexIcons: any = {
    "WEBAPP": "BROWSER",
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

}


