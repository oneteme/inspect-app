import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {buildChart, ChartProvider, field, XaxisType, YaxisType} from "@oneteme/jquery-core";
import {RestSessionService} from "../../service/jquery/rest-session.service";
import {groupingBy} from "../../shared/util";
import {FilterConstants} from "../constants";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {EnvRouter} from "../../service/router.service";
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, Subscription} from "rxjs";
import {application, makePeriod} from "../../../environments/environment";
import {Location} from "@angular/common";
import {TreeService} from "../../service/tree.service";
import { mxCell } from "mxgraph";
import {ServerConfig, TreeGraph} from "../newtree/newtree.view";

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit, OnDestroy {
    private _restSessionService = inject(RestSessionService);
    private _treeService = inject(TreeService);
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
        this._treeService.getArchitecture(this.params.start, this.params.end, this.params.env).subscribe({
            next: res => {
                let self = this;
                TreeGraph.setup(this.graphContainer.nativeElement, tg => {
                    tg.draw(() => self.draw(tg, res))
                });
            }
        })
    }

    draw(tg: TreeGraph, architectures: Architecture[]) {
        let widthServerSl = architectures.reduce((acc, cur, index) => {
            if(index != architectures.length - 1) {
                return (acc + ServerConfig['REST'].width) - 50;
            } else {
                return acc + ServerConfig['REST'].width;
            }
        }, 38);
        let serverSwimlane = tg._graph.insertVertex(tg._parent, null, 'REST', 0, 150, widthServerSl, 100, 'swimlane;fillColor=#66B922;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontStyle=bold;fontStyle=3');
        //let testServ = tg._graph.insertVertex(serverSwimlane, null, 'TestServer', 50, 25, 100, 50);
        let databaseSwimlane = tg._graph.insertVertex(tg._parent, null, 'JDBC', 0, 260, widthServerSl, 100, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=east;dashed=1;rounded=1;startSize=38;horizontal=0;fontColor=white;fontStyle=3');
        //let testDb = tg._graph.insertVertex(DatabaseSwimlane, null, 'TestDb', 50, 25, 100, 50);
        let ftpSwimlane = tg._graph.insertVertex(tg._parent, null, 'FTP', widthServerSl + 10, 0, 100, 150, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontColor=white;fontStyle=3');
        let smtpSwimlane = tg._graph.insertVertex(tg._parent, null, 'SMTP', widthServerSl + 120, 0, 100, 150, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontColor=white;fontStyle=3');
        let ldapSwimlane = tg._graph.insertVertex(tg._parent, null, 'LDAP', widthServerSl + 230, 0, 100, 150, 'swimlane;fillColor=#CF0056;gradientColor=white;gradientDirection=south;dashed=1;rounded=1;startSize=38;horizontal=1;fontColor=white;fontStyle=3');

        tg._graph.insertEdge(tg._parent, null, null, serverSwimlane, databaseSwimlane);
        tg._graph.insertEdge(tg._parent, null, null, serverSwimlane, ftpSwimlane, "");
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

        let servers: {[key: string]: mxCell} = {};
        let databases: {[key: string]: mxCell} = {};
        let ftp: {[key: string]: mxCell} = {};
        let smtp: {[key: string]: mxCell} = {};
        let ldap: {[key: string]: mxCell} = {};
        architectures.forEach(a => {
            servers[a.name] = tg._graph.insertVertex(serverSwimlane, null, null, x, y, width, height, ServerConfig['REST'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
            a.remoteServers.forEach(r => {
                console.log(r)
                if(r.type == 'JDBC' && !databases[r.name]) {
                    databases[r.name] = tg._graph.insertVertex(databaseSwimlane, null, null, xDb, yDb, widthDb, heightDb, ServerConfig['JDBC'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                    xDb += widthDb - 50;
                    if(yDb == initialY) {
                        yDb += 50;
                    } else {
                        yDb = initialY;
                    }
                }
                if(r.type == 'FTP' && !ftp[r.name]) {
                    ftp[r.name] = tg._graph.insertVertex(ftpSwimlane, null, null, 0, 0, widthDb, heightDb, ServerConfig['FTP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                }
                if(r.type == 'SMTP' && !smtp[r.name]) {
                    smtp[r.name] = tg._graph.insertVertex(smtpSwimlane, null, null, 0, 0, widthDb, heightDb, ServerConfig['SMTP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                }
                if(r.type == 'LDAP' && !ldap[r.name]) {
                    ldap[r.name] = tg._graph.insertVertex(ldapSwimlane, null, null, 0, 0, widthDb, heightDb, ServerConfig['LDAP'].icon + "verticalLabelPosition=bottom;verticalAlign=top;");
                }
                //tg._graph.insertEdge(serverSwimlane, null, null, servers[a.name], databases[r.name]);
            });
            x += width - 50;
            if(y == initialY) {
                y += 50;
            } else {
                y = initialY;
            }
        });
        console.log(x);
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

