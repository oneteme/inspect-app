import {Component, inject, Input} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";

@Component({
  selector: 'repartition-type-card',
  templateUrl: './repartition-type-card.component.html',
  styleUrls: ['./repartition-type-card.component.scss']
})
export class RepartitionTypeCardComponent {
  private readonly _decimalPipe: DecimalPipe = inject(DecimalPipe);

  REPARTITION_TYPE_RESPONSE_BAR: ChartProvider<string, number> = {
    height: 200,
    stacked: true,
    series: [
      {data: {x: field('date'), y: field('countSuccess')}, name: '2xx', color: '#33cc33'},
      {data: {x: field('date'), y: field('countErrorClient')}, name: '4xx', color: '#ffa31a'},
      {data: {x: field('date'), y: field('countErrorServer')}, name: '5xx', color: '#ff0000'}
    ],
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

  @Input() set seriesProvider(objects: SerieProvider<string, number>[]) {
    this.REPARTITION_TYPE_RESPONSE_BAR.series = objects;
  }

  @Input() set data(objects: any[]) {
    this._data = objects;
  }

  @Input() isLoading: boolean;
}