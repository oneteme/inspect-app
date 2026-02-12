import {Component, inject, Input} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ChartProvider, field} from "@oneteme/jquery-core";

@Component({
  selector: 'performance-card',
  templateUrl: './performance-card.component.html',
  styleUrls: ['./performance-card.component.scss']
})
export class PerformanceCardComponent {
  private _decimalPipe: DecimalPipe = inject(DecimalPipe);
  readonly REPARTITION_SPEED_BAR: ChartProvider<string, number> = {
    height: 200,
    series: [
      {data: {x: field('date'), y: field('elapsedTimeFastest')}, name: '< 1', color: '#81D4FA'},
      {data: {x: field('date'), y: field('elapsedTimeFast')}, name: '1 <> 3', color: '#82C0DC'},
      {data: {x: field('date'), y: field('elapsedTimeMedium')}, name: '3 <> 5', color: '#83ACBF'},
      {data: {x: field('date'), y: field('elapsedTimeSlow')}, name: '5 <> 10', color: '#8397A1'},
      {data: {x: field('date'), y: field('elapsedTimeSlowest')}, name: '> 10', color: '#848383'},
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
        followCursor: true
      },
      legend: {
        position: 'bottom'
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
  _stats: {statCount: number, statCountElapsedTimeSlowest: number, statCountElapsedTimeSlow: number, statCountElapsedTimeMedium: number, statCountElapsedTimeFast: number, statCountElapsedTimeFastest: number} = {statCount: 0, statCountElapsedTimeSlowest: 0, statCountElapsedTimeSlow: 0, statCountElapsedTimeMedium: 0, statCountElapsedTimeFast: 0, statCountElapsedTimeFastest: 0};

  @Input() set data(objects: any[]) {
    this._data = objects;
    this._stats = this.calculateStats();
  }

  @Input() isLoading: boolean;


  @Input() set group(value: string) {
    this.REPARTITION_SPEED_BAR.series.map((s) => s.data.x = field(value));
  }

  calculateStats() {
    return this._data.reduce((acc: {statCount: number, statCountElapsedTimeSlowest: number, statCountElapsedTimeSlow: number, statCountElapsedTimeMedium: number, statCountElapsedTimeFast: number, statCountElapsedTimeFastest: number}, o) => {
      return {statCount: acc.statCount + o['elapsedTimeSlowest'] + o['elapsedTimeSlow'] + o['elapsedTimeMedium'] + o['elapsedTimeFast'] + o['elapsedTimeFastest'], statCountElapsedTimeSlowest: acc.statCountElapsedTimeSlowest + o['elapsedTimeSlowest'], statCountElapsedTimeSlow: acc.statCountElapsedTimeSlow + o['elapsedTimeSlow'], statCountElapsedTimeMedium: acc.statCountElapsedTimeMedium + o['elapsedTimeMedium'], statCountElapsedTimeFast: acc.statCountElapsedTimeFast + o['elapsedTimeFast'], statCountElapsedTimeFastest: acc.statCountElapsedTimeFastest + o['elapsedTimeFastest']};
    }, {statCount: 0, statCountElapsedTimeSlowest: 0, statCountElapsedTimeSlow: 0, statCountElapsedTimeMedium: 0, statCountElapsedTimeFast: 0, statCountElapsedTimeFastest: 0});
  }
}