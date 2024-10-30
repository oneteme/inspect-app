import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {buildChart, ChartProvider, field, XaxisType, YaxisType} from "@oneteme/jquery-core";
import {RestSessionService} from "../../service/jquery/rest-session.service";
import {groupingBy} from "../../shared/util";
import {FilterConstants} from "../constants";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {EnvRouter} from "../../service/router.service";
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, forkJoin, map, Subscription} from "rxjs";
import {application, makePeriod} from "../../../environments/environment";
import {Location} from "@angular/common";
import {TreeService} from "../../service/tree.service";
import { mxCell } from "mxgraph";
import {ArchitectureTree} from "./model/architecture.model";
import mx from "../../../mxgraph";
import {InstanceService} from "../../service/jquery/instance.service";

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit, OnDestroy {
    private _restSessionService = inject(RestSessionService);
    private _treeService = inject(TreeService);
    private _instanceService = inject(InstanceService);
    private _router = inject(EnvRouter);
    private _activatedRoute = inject(ActivatedRoute);
    private _location = inject(Location);

    heatMapConfig: ChartProvider<XaxisType, YaxisType> = {
        series: [
            {
                data: {x: field('target'), y: field('count')},
                name: field('origin')
            }
        ],
        height: 350,
        options: {
            chart: {
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            tooltip: {
                custom: function({ series, seriesIndex, dataPointIndex, w }) {
                    return (
                        '<div class="arrow_box">' +
                        "<span>" +
                        w.globals.labels[dataPointIndex] +
                        ": " +
                        series[seriesIndex][dataPointIndex] +
                        "</span>" +
                        "</div>"
                    );
                }
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.4,
                    radius: 0,
                    useFillColorAsStroke: true,
                    colorScale: {

                    }
                }
            }
        }
    };
    heatMapData: {count: number, origin: string, target: string}[] = [];

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    subscriptions: Subscription[] = [];
    params: Partial<{env: string, start: Date, end: Date}> = {};

    @ViewChild('graphContainer') graphContainer: ElementRef;

    ngOnInit() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || application.default_env;
                this.params.start = v.queryParams.start  ? new Date(v.queryParams.start) : (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6)).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`);
            }
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    patchDateValue(start: Date, end: Date) {
        this.serverFilterForm.patchValue({
            dateRangePicker: {
                start: start,
                end: end
            }
        }, { emitEvent: false });
    }

    search() {
        if (this.serverFilterForm.valid) {
            let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
            let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
            let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
            if (start.toISOString() != this.params.start.toISOString() || excludedEnd.toISOString() != this.params.end.toISOString()) {
                this._router.navigate([], {
                    relativeTo: this._activatedRoute,
                    queryParamsHandling: 'merge',
                    queryParams: { start: start.toISOString(), end: excludedEnd.toISOString() }
                });
            } else {
                this.init();
            }
        }
    }

    init() {
        this._restSessionService.getArchitectureForHeatMap({start: this.params.start, end: this.params.end, env: this.params.env}).subscribe({
            next: res => {
                let distinct = [...this.distinct(res, o => o.target)];
                let map: any = {};
                res.forEach(r => {
                    if(!map[r.origin]) {
                        map[r.origin] = {};
                        distinct.forEach(v=> map[r.origin][v] = 0);
                    }
                    map[r.origin][r.target] = r.count;
                });
                let arr: {count: number, origin: string, target: string}[] = [];
                Object.entries(map).forEach(e1=>{
                    Object.entries(e1[1]).forEach(e2=>{
                        arr.push({origin: e1[0], target: e2[0], count: e2[1]})
                    })
                });

                this.heatMapData = arr;
                console.log("heatMapData", this.heatMapData);
                console.log(buildChart(this.heatMapData, { ...this.heatMapConfig, continue: true }, 0))
            }
        });
        forkJoin({
            mainSession: this._instanceService.getMainSessionApplication(this.params.start, this.params.end, this.params.env),
            restSession: this._treeService.getArchitecture(this.params.start, this.params.end, this.params.env)
        }).pipe(map(res => {
            res.restSession.push(...res.mainSession.map(m => ({name: m.appName, schema: null, type: m.type, remoteServers: null})));
            return res.restSession;
        })).subscribe({
            next: res => {
                let self = this;
                ArchitectureTree.setup(this.graphContainer.nativeElement, tg => {
                    tg.draw(() => self.draw(tg, res))
                });
            }
        });
    }

    draw(tg: ArchitectureTree, architectures: Architecture[]) {
        let layout = new mx.mxHierarchicalLayout(tg._graph, mx.mxConstants.DIRECTION_WEST);
        console.log(architectures)
        let widthServerSl = architectures.reduce((acc, cur, index) => {
            if(index != architectures.length - 1) {
                return (acc + ServerConfig['REST'].width) - 40;
            } else {
                return acc + ServerConfig['REST'].width;
            }
        }, 38);
        let launchSwimlane = tg._graph.insertVertex(tg._parent, null, 'Clients', 0, 0, widthServerSl, 110, 'swimlane;fillColor=#66B922;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontStyle=bold;fontStyle=3');

        let serverSwimlane = tg._graph.insertVertex(tg._parent, 'server', 'Serveurs', 0, 190, widthServerSl, 110, 'swimlane;fillColor=#66B922;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontStyle=bold;fontStyle=3');
        //let testServ = tg._graph.insertVertex(serverSwimlane, null, 'TestServer', 50, 25, 100, 50);
        let databaseSwimlane = tg._graph.insertVertex(tg._parent, 'database', 'BDD', 0, 400, widthServerSl, 110, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontColor=white;fontStyle=3');
        //let testDb = tg._graph.insertVertex(DatabaseSwimlane, null, 'TestDb', 50, 25, 100, 50);
        let ftpSwimlane = tg._graph.insertVertex(tg._parent, null, 'FTP', widthServerSl + 100, 0, 80, 150, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontColor=white;fontStyle=3');
        let smtpSwimlane = tg._graph.insertVertex(tg._parent, null, 'SMTP', widthServerSl + 100, 190, 80, 150, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontColor=white;fontStyle=3');
        let ldapSwimlane = tg._graph.insertVertex(tg._parent, null, 'LDAP', widthServerSl + 100, 300, 80, 150, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontColor=white;fontStyle=3');

        tg._graph.insertEdge(tg._parent, null, null, launchSwimlane, serverSwimlane); // 'perimeterSpacing=10;strokeWidth=10;endArrow=block;endSize=2;endFill=1;strokeColor=#66B922;rounded=1;'


        tg._graph.insertEdge(tg._parent, null, null, serverSwimlane, ftpSwimlane);
        tg._graph.insertEdge(tg._parent, null, null, serverSwimlane, smtpSwimlane);
        tg._graph.insertEdge(tg._parent, null, null, serverSwimlane, ldapSwimlane);

        let initialX = 38;
        let initialY = 10;
        let x = initialX;
        let y = initialY;
        let height = ServerConfig['REST'].height;
        let width = ServerConfig['REST'].width;
        let heightDb = ServerConfig['JDBC'].height;
        let widthDb = ServerConfig['JDBC'].width;
        let xDb = initialX;
        let yDb = initialY;
        let xMain = initialX;
        let yMain = initialY;

        let mains: {[key: string]: mxCell} = {};
        let servers: {[key: string]: mxCell} = {};
        let databases: {[key: string]: mxCell} = {};
        let ftp: {[key: string]: mxCell} = {};
        let smtp: {[key: string]: mxCell} = {};
        let ldap: {[key: string]: mxCell} = {};
        architectures.forEach(a => {
            if(a.type == 'REST') {
                servers[a.name] = tg._graph.insertVertex(serverSwimlane, null, a.name, x, y, width, height, ServerConfig['REST'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                x += width - 40;
                if(y == initialY) {
                    y += 50;
                } else {
                    y = initialY;
                }
            } else {

                mains[a.name] = tg._graph.insertVertex(launchSwimlane, null, a.name, xMain, yMain, width, height, ServerConfig[a.type].icon + "verticalLabelPosition=bottom;verticalAlign=top");
                xMain += width - 40;
                if(yMain == initialY) {
                    yMain += 50;
                } else {
                    yMain = initialY;
                }
            }
            if(a.remoteServers != null) {
                a.remoteServers.forEach(r => {
                    console.log(r)
                    if(r.type == 'JDBC' && !databases[r.name]) {
                        databases[r.name] = tg._graph.insertVertex(databaseSwimlane, null, r.name, xDb, yDb, widthDb, heightDb, ServerConfig['JDBC'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                        xDb += widthDb - 40;
                        if(yDb == initialY) {
                            yDb += 50;
                        } else {
                            yDb = initialY;
                        }
                    }
                    if(r.type == 'FTP' && !ftp[r.name]) {
                        ftp[r.name] = tg._graph.insertVertex(ftpSwimlane, null, r.name, 0, 0, widthDb, heightDb, ServerConfig['FTP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    }
                    if(r.type == 'SMTP' && !smtp[r.name]) {
                        smtp[r.name] = tg._graph.insertVertex(smtpSwimlane, null, r.name, 0, 0, widthDb, heightDb, ServerConfig['SMTP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    }
                    if(r.type == 'LDAP' && !ldap[r.name]) {
                        ldap[r.name] = tg._graph.insertVertex(ldapSwimlane, null, r.name, 0, 0, widthDb, heightDb, ServerConfig['LDAP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    }
                    //tg._graph.insertEdge(serverSwimlane, null, null, servers[a.name], databases[r.name]);
                });
            }


        });
        layout.execute(tg._parent, [serverSwimlane]);
        tg._graph.insertEdge(tg._parent, null, null, serverSwimlane, databaseSwimlane);
        console.log(x);
    }

    setFtpVertex(ftpServers: Architecture[]) {
        let ftp: {[key: string]: mxCell} = {};
        ftpServers.forEach(f => {
            if(f.type == 'FTP' && !ftp[f.name]) {

            }
        })
    }

    distinct<T, U>(arr: Array<T>, mapper: (o: T) => U): Set<U> {
        return arr.reduce((set: Set<U>, cur) => {
            set.add(mapper(cur));
            return set;
        }, new Set<U>());
    }
}

export class Architecture {
    name: string;
    schema: string;
    type: string;
    remoteServers: Architecture[];
}

export const ServerConfig = {
    JDBC: { icon: "shape=image;image=assets/mxgraph/database.drawio.svg;", width: 80, height: 30 },
    REST: { icon: "shape=image;image=assets/mxgraph/microservice.drawio.svg;", width: 80, height: 30 },
    SMTP: { icon: "shape=image;image=assets/mxgraph/smtp.drawio.svg;", width: 80, height: 30 },
    FTP: { icon: "shape=image;image=assets/mxgraph/ftp.drawio.svg;", width: 80, height: 30 },
    LDAP: { icon: "shape=image;image=assets/mxgraph/ldap.drawio.svg;", width: 80, height: 30 },
    VIEW: { icon: "shape=image;image=assets/mxgraph/view.drawio.svg;", width: 80, height: 30 },
    BATCH: { icon: "shape=image;image=assets/mxgraph/batch.drawio.svg;", width: 80, height: 30 },
    LINK: { icon: "shape=image;image=assets/mxgraph/parent.drawio.svg;", width: 30, height: 30 },
    GHOST: { icon: "shape=image;image=assets/mxgraph/ghost.drawio.svg;", width: 30, height: 30 }
}

