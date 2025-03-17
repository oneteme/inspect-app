import {Component, inject, Input} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ChartProvider, field} from "@oneteme/jquery-core";

@Component({
  selector: 'rest-repartition-type-card',
  templateUrl: './repartition-type-card.component.html',
  styleUrls: ['./repartition-type-card.component.scss']
})
export class RepartitionTypeCardComponent {
  private _decimalPipe: DecimalPipe = inject(DecimalPipe);

  readonly REPARTITION_TYPE_RESPONSE_BAR: ChartProvider<string, number> = {
    height: 200,
    series: [
      {data: {x: field('date'), y: field('countSucces')}, name: '2xx', color: '#33cc33'},
      {data: {x: field('date'), y: field('countErrorClient')}, name: '4xx', color: '#ffa31a'},
      {data: {x: field('date'), y: field('countErrorServer')}, name: '5xx', color: '#ff0000'}
    ],
    stacked: true,
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true,
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value);
          }
        }
      },
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => {
          return this._decimalPipe.transform(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  };

  _data: any[] = [];
  _stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number} = {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0};

  @Input() set data(objects: any[]) {
    this._data = objects;
    this._stats = this.calculateStats();
  }

  @Input() isLoading: boolean;

  calculateStats() {
    return this._data.reduce((acc: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number}, o) => {
      return {statCount: acc.statCount + o['countSucces'] + o['countErrorClient'] + o['countErrorServer'], statCountOk: acc.statCountOk + o['countSucces'], statCountErrClient: acc.statCountErrClient + o['countErrorClient'], statCountErrorServer: acc.statCountErrorServer + o['countErrorServer']};
    }, {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0});
  }
}