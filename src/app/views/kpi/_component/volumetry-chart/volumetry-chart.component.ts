import {Component, EventEmitter, inject, Input, Output} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {ChartProvider} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {periodManagement2} from "../../../../shared/util";
import {SliceConfig} from "@oneteme/jquery-table";
import {finalize} from "rxjs";
import {
  buildSeries,
  ChartConfig,
  REST_PERFORMANCE_CHART_CONFIG,
  pivotByStack,
  REST_VOLUMETRY_CHART_CONFIG
} from "../../kpi.config";

@Component({
  selector: 'volumetry-chart',
  templateUrl: './volumetry-chart.component.html',
  styleUrls: ['./volumetry-chart.component.scss']
})
export class VolumetryChartComponent {
  private readonly _decimalPipe = inject(DecimalPipe);

  sliceConfigs: SliceConfig<any>[] = [];
  tasks: any[] = [];

  chartProvider: ChartProvider<string, number> = {
    stacked: true,
    series: [],
    options: {
      chart: {
        toolbar: {
          show: false
        }
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
        position: 'bottom',
        showForSingleSeries: true
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: false,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false,
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
  }
  _data: any = [];
  jqueryConfig: ChartConfig;

  @Input() queryParams: QueryParams;

  @Input() set chartConfig(value: ChartConfig) {
    if(value) {
      this.jqueryConfig = value;
      this.onChartChange.emit({eventType: 'default', chartConfig: this.jqueryConfig});
      if(this.actualFilter) {
        this.onChartChange.emit({eventType: 'filter', chartConfig: this.jqueryConfig});
      }
    }
  };

  @Input() set data(value: any[]) {
    if(value && this.jqueryConfig) {
      this.chartProvider = {
        ...this.chartProvider,
        series: buildSeries(this.jqueryConfig.series.items, this.actualIndicator, this.actualGroup, this.actualStack, value)
      };
      this._data = this.actualStack ? pivotByStack(this.jqueryConfig.series.items, this.actualIndicator, this.actualGroup, this.actualStack, value) : value;
    }
  }

  @Input() set sliceData(value: any[]) {
    if(value && this.actualFilter) {
      this.sliceConfigs = [{ title: this.actualFilter.menu.label, columnKey: this.actualFilter.jquery.buildAlias()   }]
      this.tasks = value;
    } else {
      this.sliceConfigs = [];
      this.tasks = [];
    }
  }

  @Input() loading: boolean;

  @Output() onChartChange: EventEmitter<{eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]}> = new EventEmitter();

  onMenuChange(event: 'default' | 'filter') {
    this.onChartChange.emit({eventType: event, chartConfig: this.jqueryConfig});
  }

  onFilterChange(filterFn: (row: any) => boolean): void {
    let filteredTasks = this.tasks.filter(filterFn).map(task => task[this.actualFilter.jquery.buildAlias()]);
    this.onChartChange.emit({eventType: 'default', chartConfig: this.jqueryConfig, filteredTasks: filteredTasks});
  }

  get actualIndicator() {
    return this.jqueryConfig?.indicators?.items.find(g => g.selected);
  }

  get actualGroup() {
    return this.jqueryConfig?.groups?.items.find(g => g.selected);
  }

  get actualStack() {
    return this.actualIndicator?.extra?.stacks?.items.find(g => g.selected);
  }

  get actualFilter() {
    return this.jqueryConfig?.filters?.items.find(g => g.selected);
  }
}