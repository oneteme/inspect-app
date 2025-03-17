import {Component, inject, Input} from "@angular/core";
import {ChartProvider, field} from "../../../../../../../../../jarvis/jquery-charts/dist/oneteme/jquery-core";
import {DecimalPipe} from "@angular/common";

@Component({
  selector: 'performance-card',
  templateUrl: './performance-card.component.html',
  styleUrls: ['./performance-card.component.scss']
})
export class PerformanceCardComponent {
  private _decimalPipe: DecimalPipe = inject(DecimalPipe);
  readonly REPARTITION_SPEED_BAR: ChartProvider<string, number> = {
    height: 400,
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
  readonly REPARTITION_MAX_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 200,
    ytitle: 'Temps (s)',
    series: [
      {data: {x: field('date'), y: field('max')}, name: 'Temps max', color: '#FF0000'}
    ],
    options: {
      chart: {
        id: 'c',
        group: 'A',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        padding: {
          left: 30,
          right: 30
        }
      },
      stroke: {
        width: [4]
      },
      yaxis: {
        decimalsInFloat: 2,
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value, '1.0-2');
          }
        }
      },
      legend: {
        showForSingleSeries: true
      }
    }
  };
  readonly REPARTITION_AVG_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 200,
    ytitle: 'Temps (s)',
    series: [
      {data: {x: field('date'), y: field('avg')}, name: 'Temps moyen', color: '#FF9B00'}
    ],
    options: {
      chart: {
        id: 'b',
        group: 'A',
        toolbar: {
          show: false
        }
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        padding: {
          left: 30,
          right: 30
        }
      },
      stroke: {
        width: [4]
      },
      yaxis: {
        decimalsInFloat: 3,
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value, '1.0-3');
          }
        }
      },
      legend: {
        showForSingleSeries: true
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

  calculateStats() {
    return this._data.reduce((acc: {statCount: number, statCountElapsedTimeSlowest: number, statCountElapsedTimeSlow: number, statCountElapsedTimeMedium: number, statCountElapsedTimeFast: number, statCountElapsedTimeFastest: number}, o) => {
      return {statCount: acc.statCount + o['elapsedTimeSlowest'] + o['elapsedTimeSlow'] + o['elapsedTimeMedium'] + o['elapsedTimeFast'] + o['elapsedTimeFastest'], statCountElapsedTimeSlowest: acc.statCountElapsedTimeSlowest + o['elapsedTimeSlowest'], statCountElapsedTimeSlow: acc.statCountElapsedTimeSlow + o['elapsedTimeSlow'], statCountElapsedTimeMedium: acc.statCountElapsedTimeMedium + o['elapsedTimeMedium'], statCountElapsedTimeFast: acc.statCountElapsedTimeFast + o['elapsedTimeFast'], statCountElapsedTimeFastest: acc.statCountElapsedTimeFastest + o['elapsedTimeFastest']};
    }, {statCount: 0, statCountElapsedTimeSlowest: 0, statCountElapsedTimeSlow: 0, statCountElapsedTimeMedium: 0, statCountElapsedTimeFast: 0, statCountElapsedTimeFastest: 0});
  }
}