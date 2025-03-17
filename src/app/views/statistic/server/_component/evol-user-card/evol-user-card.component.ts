import {ChartProvider, field} from "../../../../../../../../../jarvis/jquery-charts/dist/oneteme/jquery-core";
import {Component, Input} from "@angular/core";

@Component({
  selector: 'evol-user-card',
  templateUrl: './evol-user-card.component.html',
  styleUrls: ['./evol-user-card.component.scss']
})
export class EvolUserCardComponent {
  readonly EVOL_USER_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 200,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('count')}, name: 'Utilisateur', color: '#FF9B00'}
    ],
    options: {
      chart: {
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      grid: {
        padding: {
          left: 30,
          right: 30
        }
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        stepSize: 1
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: [4]
      }
    }
  };

  _data: any[] = [];

  @Input() set data(objects: any[]) {
    this._data = objects;
  }

  @Input() isLoading: boolean;
}