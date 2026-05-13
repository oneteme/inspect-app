import {Component, Input} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";

@Component({
  selector: 'media-type-chart',
  templateUrl: './media-type-chart.component.html',
  styleUrls: ['./media-type-chart.component.scss']
})
export class MediaTypeChartComponent {
  chartProvider: ChartProvider<string, number> = {
    series: [
      { data: { x: field('media'), y: field('count') } }
    ],
    options: {
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center'
      },
      series: [{
        label: {
          show: false             // pas de datalabels sur les slices
        },
        labelLine: {
          show: false             // pas de lignes de labels non plus
        }
      }],
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
      }
    }
  }
  _data: any = [];

  @Input() queryParams: QueryParams;

  @Input() set data(value: any[]) {
    if(value) {
      this._data = value
    }
  }

  @Input() loading: boolean;
}
