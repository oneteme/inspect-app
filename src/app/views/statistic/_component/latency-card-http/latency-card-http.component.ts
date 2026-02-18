import {Component, inject, Input} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";

@Component({
  selector: 'latency-card-http',
  templateUrl: './latency-card-http.component.html',
  styleUrls: ['./latency-card-http.component.scss']
})
export class LatencyCardHttpComponent {
  private readonly _decimalPipe: DecimalPipe = inject(DecimalPipe);

  LATENCY_BAR: ChartProvider<string, number> = {
    height: 200,
    stacked: false,
    series: [
      {data: {x: field('date'), y: field('avg')}, name: 'Avg', color: '#2196F3'},
      {data: {x: field('date'), y: field('max')}, name: 'Max', color: '#FF5722'}
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
            return this._decimalPipe.transform(value, '1.0-0') + ' ms';
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
              enabled: false
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      }
    }
  };

  _data: any[] = [];

  @Input() set seriesProvider(objects: SerieProvider<string, number>[]) {
    this.LATENCY_BAR.series = objects;
  }

  @Input() set data(objects: any[]) {
    this._data = objects;
  }

  @Input() isLoading: boolean;

  @Input() set group(value: string) {
    this.LATENCY_BAR.series.map((s) => s.data.x = field(value));
  }
}

