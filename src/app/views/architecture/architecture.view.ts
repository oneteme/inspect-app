import {Component, inject, OnInit} from "@angular/core";
import {buildChart, ChartProvider, field, XaxisType, YaxisType} from "@oneteme/jquery-core";
import {RestSessionService} from "../../service/jquery/rest-session.service";
import {groupingBy} from "../../shared/util";

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit {
    private _restSessionService = inject(RestSessionService);

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
            colors: ["#008FFB"],
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0,
                    useFillColorAsStroke: true,
                    colorScale: {
                        min: 0,
                        max: 1000
                    }
                }
            }
        }
    };

    heatMapData: {count: number, origin: string, target: string}[] = [];

    ngOnInit() {
        this._restSessionService.getArchitectureForHeatMap({start: new Date(2024, 9, 1), end: new Date(2024, 9, 11), env: 'dev'}).subscribe({
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
    }

    distinct<T, U>(arr: Array<T>, mapper: (o: T) => U): Set<U> {
        return arr.reduce((set: Set<U>, cur) => {
            set.add(mapper(cur));
            return set;
        }, new Set<U>());
    }
}