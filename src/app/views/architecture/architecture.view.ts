import {Component, inject, OnInit} from "@angular/core";
import {buildChart, ChartProvider, field, XaxisType, YaxisType} from "@oneteme/jquery-core";
import {RestSessionService} from "../../service/jquery/rest-session.service";

@Component({
    templateUrl: './architecture.view.html',
    styleUrls: ['./architecture.view.scss'],
})
export class ArchitectureView implements OnInit {
    private _restSessionService = inject(RestSessionService);

    heatMapConfig: ChartProvider<XaxisType, YaxisType> = {
        series: [
            {
                data: {x: field('appNameJoin'), y: field('count')},
                name: field('appName')
            }
        ],
        height: 350,
        width: 750,
        options: {
            chart: {
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: ["#008FFB"],
            plotOptions: {
                heatmap: {
                    distributed: true,
                    shadeIntensity: 0,
                    colorScale: {
                        min: 0,
                        max: 10
                    }
                }
            }
        }
    };

    heatMapData: {count: number, appName: string, appNameJoin: string}[] = [];

    ngOnInit() {
        this._restSessionService.getArchitectureForHeatMap({start: new Date(2024, 9, 6), end: new Date(2024, 9, 8), env: 'dev'}).subscribe({
            next: res => {
                this.heatMapData = res;
                console.log(buildChart(this.heatMapData, { ...this.heatMapConfig, continue: true }, 0))
            }
        });
    }
}