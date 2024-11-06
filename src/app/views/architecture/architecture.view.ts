import {AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ChartProvider, field, XaxisType, YaxisType} from "@oneteme/jquery-core";
import {RestSessionService} from "../../service/jquery/rest-session.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {EnvRouter} from "../../service/router.service";
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, finalize, forkJoin, map, Subscription} from "rxjs";
import {application, makePeriod} from "../../../environments/environment";
import {Location} from "@angular/common";
import {TreeService} from "../../service/tree.service";
import {mxCell} from "mxgraph";
import {ArchitectureTree} from "./model/architecture.model";
import mx from "../../../mxgraph";
import {InstanceService} from "../../service/jquery/instance.service";
import {MainSessionService} from "../../service/jquery/main-session.service";
import { NumberFormatterPipe } from "src/app/shared/pipe/number.pipe";

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit, AfterViewInit, OnDestroy {
    private _restSessionService = inject(RestSessionService);
    private _mainSessionService = inject(MainSessionService);
    private _treeService = inject(TreeService);
    private _instanceService = inject(InstanceService);
    private _router = inject(EnvRouter);
    private _activatedRoute = inject(ActivatedRoute);
    private _location = inject(Location);
    private _numberFormatter = inject(NumberFormatterPipe);

    rangesColorConfig = [ '#E9E9E9', '#AFB3EF', '#757DF4', '#3A47FA', '#0011FF' ]
    tree: ArchitectureTree;
    treeMapConfig: ChartProvider<XaxisType, YaxisType> = {
        series: [
            {
                data: { x: field('origin'), y: field('count')},
                name: field('name'),
                color: field('color')

            }
        ],
        height: 450,
        options: {
            chart: {
                toolbar: {
                    show: false
                },
                events: {// fix bug in treemap jquerychart
                    mouseMove: function (e, c, config) { },
                    mouseLeave: function (e, c, config) { }
                }
            },
            tooltip: {

            },
            legend: {
                show:true,
                position: 'top',
                horizontalAlign: 'right',
                markers: {
                    strokeWidth: 1,
                    offsetX: 0,
                    offsetY: 4
                },
            },
            colors:[

            ],
            plotOptions: {
                treemap: {
                    enableShades: false,
                }
              }
        }
    };

    heatMapConfig: ChartProvider<XaxisType, YaxisType> = {
        series: [
            {
                data: { x: field('target'), y: field('count') },
                name: field('origin')
            }
        ],
        height: 450,
        options: {
            chart: {
                toolbar: {
                    show: false
                },
                events: {// fix bug in treemap jquerychart
                    mouseMove: function (e, c, config) { },
                    mouseLeave: function (e, c, config) { }
                }
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                width: 5
            },
            xaxis: {
                title: {
                    text: 'Serveur appelé',
                },
                labels: {
                    rotate: -35,
                    hideOverlappingLabels: false
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                title: {
                    text: 'Serveur appelant'
                },
                labels: {
                    show: true,
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                markers: {
                    strokeWidth: 1,
                    offsetX: 0,
                    offsetY: 4
                }
            },
            tooltip: {
                custom: function ({ series, seriesIndex, dataPointIndex, w }) {
                    return (
                        `
                            <div class="arrow_box"> 
                                <div style="align-self:flex-end; font-weight:bold;font-size:18px"> ${series[seriesIndex][dataPointIndex]}</div>
                                <div> Appelant : ${w.config.series[seriesIndex].name} </div>
                                <div> Appelé   : ${w.globals.labels[dataPointIndex]} </div>
                            </div>
                        `

                    );
                },

                x: {
                    show: false
                }
            },
            plotOptions: {
                heatmap: {
                    enableShades: false,
                    radius: 0,
                    colorScale: {

                    }
                }
            }
        }
    };
    trafficIsloading:boolean;
    heatMapData: { count: number, origin: string, target: string }[] = [];

    treeMapData: { count: number, origin: string, name: string, color: string }[] = [];

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    heatMapControl: FormControl = new FormControl<boolean>(false);
    treeMapControl: FormControl = new FormControl<boolean>(false);

    subscriptions: Subscription[] = [];
    params: Partial<{ env: string, start: Date, end: Date }> = {};

    @ViewChild('graphContainer') graphContainer: ElementRef;

    ngOnInit() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || application.default_env;
                this.params.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6)).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`);
            }
        });

        this.treeMapControl.valueChanges.subscribe({
            next: res => {
                let _field = res ? 'sum': 'count';
                let d  = this.heatMapData.reduce((acc:any,cur:any) => {
                    let i = acc.findIndex(a => a.origin === cur.origin)
                    if(i == -1){
                        acc.push({origin: cur.origin, count: 0})
                    }else {
                        acc[i].count += cur[_field];
                    }
                    return acc;
                },[]).sort((a,b)=>(a.count-b.count))

                const treeRanges = this.createRanges(d, 'count');
                this.treeMapData = d.map(t => {
                    let r = treeRanges.find(r=> t.count >= r.from && t.count <= r.to)
                    if(r){
                        t.name = r.name
                        t.color = r.color
                    }
                    return t
                });
            }
        });

        this.heatMapControl.valueChanges.subscribe({
            next: res => {
                let _field = res ? 'sum': 'count';
                const ranges = this.createRanges(this.heatMapData, _field);
                let newConfig = this.heatMapConfig;
                newConfig.options.plotOptions.heatmap.colorScale.ranges = ranges;
                newConfig.series = [
                    {
                        data: { x: field('target'), y: field(_field) },
                        name: field('origin')
                    }
                ];
                this.heatMapConfig = { ...newConfig };
            }
        })
    }

    ngAfterViewInit() {
        this.tree = ArchitectureTree.setup(this.graphContainer.nativeElement);
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
        this.trafficIsloading = true;
        this.heatMapData = [];
        this.treeMapData = [];
        forkJoin(
            {
                rest: this._restSessionService.getArchitectureForHeatMap({ start: this.params.start, end: this.params.end, env: this.params.env }),
                main: this._mainSessionService.getMainSessionArchitectureForHeatMap({ start: this.params.start, end: this.params.end, env: this.params.env }),
            }
        ).pipe(finalize(()=>  this.trafficIsloading = false)).subscribe({
            next: (result: {rest: any[], main: any[]})  => {
                let res = [...result.rest, ...result.main];
                this.buildHeatMapCharts(res);
                this.treeMapControl.updateValueAndValidity();
                this.heatMapControl.updateValueAndValidity();
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
                this.tree.clearCells();
                this.tree.draw(() => this.draw(this.tree, res));
            }
        });
    }

    buildHeatMapCharts(res: {count: number, sum: number, origin: string, target: string}[]) {
        let distinct = [...this.distinct(res, o => o.target)];
        let map: any = {};
        res.forEach(r => {
            if (!map[r.origin]) {
                map[r.origin] = {};
                distinct.forEach(v => map[r.origin][v] = {count: 0, sum: 0});
            }
            map[r.origin][r.target] = {count: r.count, sum: r.sum};
        });
        let arr: { count: number, sum: number, origin: string, target: string }[] = [];
        Object.entries(map).forEach(e1 => {
            Object.entries(e1[1]).forEach(e2 => {
                arr.push({ origin: e1[0], target: e2[0], count: e2[1].count, sum: e2[1].sum})
            });
        });
        this.heatMapData = arr;
    }

    createRanges(arr: any[], field: string) {
        const ranges: any[] = [{ from: 0, to: 0, name: `0`, color: this.rangesColorConfig[0] }];
        if(arr.length){
            let max = arr.reduce((acc: any, cur: any) => {
                return cur[field] > acc ? cur[field] : acc
            }, arr[0][field]);
            const range = max / 4;
            const parts = range != 0 ? 4 : 1;

            for (let i = 0; i < parts; i++) {
                const start = i * range != 0 ? Math.floor(i * range+1) : 1;
                const end = Math.floor((i + 1) * range);
                ranges.push({ from: start, to: end, name: `${this._numberFormatter.transform(start)} - ${this._numberFormatter.transform(end)}`, color: this.rangesColorConfig[i + 1] })
            }
        }
        return ranges;
    }

    draw(tree: ArchitectureTree, architectures: Architecture[]) {

        let layout = new mx.mxHierarchicalLayout(tree._graph, mx.mxConstants.DIRECTION_WEST);
        let widthServerSl = architectures.reduce((acc, cur, index) => {
            if(index != architectures.length - 1) {
                return (acc + ServerConfig['REST'].width) - 30;
            } else {
                return acc + ServerConfig['REST'].width;
            }
        }, 38);
        let launchSwimlane = tree._graph.insertVertex(tree._parent, null, 'Clients', 0, 0, widthServerSl, 110, 'swimlane;fillColor=#ECB390;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontStyle=3');

        let serverSwimlane = tree._graph.insertVertex(tree._parent, null, 'Serveurs', 0, 190, widthServerSl, 110, 'swimlane;fillColor=#7FC7D9;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontStyle=3');
        //let testServ = tg._graph.insertVertex(serverSwimlane, null, 'TestServer', 50, 25, 100, 50);
        let databaseSwimlane = tree._graph.insertVertex(tree._parent, null, 'BDD', 0, 400, widthServerSl, 110, 'swimlane;fillColor=#FFB200;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontStyle=3');
        //let testDb = tg._graph.insertVertex(DatabaseSwimlane, null, 'TestDb', 50, 25, 100, 50);
        let ftpSwimlane = tree._graph.insertVertex(tree._parent, null, 'FTP', widthServerSl + 100, 0, 80, 150, 'swimlane;fillColor=#BFEA7C;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontStyle=3');
        let smtpSwimlane = tree._graph.insertVertex(tree._parent, null, 'SMTP', widthServerSl + 100, 190, 80, 150, 'swimlane;fillColor=#BFEA7C;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontStyle=3');
        let ldapSwimlane = tree._graph.insertVertex(tree._parent, null, 'LDAP', widthServerSl + 100, 300, 80, 150, 'swimlane;fillColor=#BFEA7C;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontStyle=3');

        tree._graph.insertEdge(tree._parent, null, null, launchSwimlane, serverSwimlane); // 'perimeterSpacing=10;strokeWidth=10;endArrow=block;endSize=2;endFill=1;strokeColor=#66B922;rounded=1;'


        tree._graph.insertEdge(tree._parent, null, null, serverSwimlane, ftpSwimlane);
        tree._graph.insertEdge(tree._parent, null, null, serverSwimlane, smtpSwimlane);
        tree._graph.insertEdge(tree._parent, null, null, serverSwimlane, ldapSwimlane);

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
                servers[a.name] = tree._graph.insertVertex(serverSwimlane, null, a.name, x, y, width, height, ServerConfig['REST'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                x += width - 30;
                if(y == initialY) {
                    y += 50;
                } else {
                    y = initialY;
                }
            } else {

                mains[a.name] = tree._graph.insertVertex(launchSwimlane, null, a.name, xMain, yMain, width, height, ServerConfig[a.type].icon + "verticalLabelPosition=bottom;verticalAlign=top");
                xMain += width - 30;
                if(yMain == initialY) {
                    yMain += 50;
                } else {
                    yMain = initialY;
                }
            }
            if(a.remoteServers != null) {
                a.remoteServers.forEach(r => {
                    let name = r.schema ? r.schema : r.name;
                    if(r.type == 'JDBC' && !databases[name]) {
                        databases[name] = tree._graph.insertVertex(databaseSwimlane, null, name, xDb, yDb, widthDb, heightDb, ServerConfig['JDBC'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                        xDb += widthDb - 30;
                        if(yDb == initialY) {
                            yDb += 50;
                        } else {
                            yDb = initialY;
                        }
                    }
                    if(r.type == 'FTP' && !ftp[name]) {
                        ftp[name] = tree._graph.insertVertex(ftpSwimlane, null, name, 0, 0, widthDb, heightDb, ServerConfig['FTP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    }
                    if(r.type == 'SMTP' && !smtp[name]) {
                        smtp[name] = tree._graph.insertVertex(smtpSwimlane, null, name, 0, 0, widthDb, heightDb, ServerConfig['SMTP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    }
                    if(r.type == 'LDAP' && !ldap[name]) {
                        ldap[name] = tree._graph.insertVertex(ldapSwimlane, null, name, 0, 0, widthDb, heightDb, ServerConfig['LDAP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    }
                    //tg._graph.insertEdge(serverSwimlane, null, null, servers[a.name], databases[r.name]);
                });
            }


        });
        layout.execute(tree._parent, [serverSwimlane]);
        tree._graph.insertEdge(tree._parent, null, null, serverSwimlane, databaseSwimlane);
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

