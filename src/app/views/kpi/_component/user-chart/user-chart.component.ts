import {Component, Input} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";

@Component({
  selector: 'user-chart',
  templateUrl: './user-chart.component.html',
  styleUrls: ['./user-chart.component.scss']
})
export class UserChartComponent {
  chartProvider: ChartProvider<string, number> = {
    series: [
      { data: { x: field('date'), y: field('count') } }
    ]
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
