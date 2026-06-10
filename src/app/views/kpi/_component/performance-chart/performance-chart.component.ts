import {Component, EventEmitter, inject, Input, Output} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {ChartProvider} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {periodManagement2} from "../../../../shared/util";
import {SliceConfig} from "@oneteme/jquery-table";
import {buildSeries, ChartConfig, REST_PERFORMANCE_CHART_CONFIG, pivotByStack} from "../../kpi.config";

@Component({
  selector: 'performance-chart',
  templateUrl: './performance-chart.component.html',
  styleUrls: ['./performance-chart.component.scss']
})
export class PerformanceChartComponent {
  sliceConfigs: SliceConfig<any>[] = [];
  tasks: any[] = [];

  chartProvider: ChartProvider<string, number> = {
    stacked: true,
    series: [],
    options: {
      backgroundColor: 'transparent',
      grid: {
        top: 16,
        bottom: 48,
        left: 8,
        right: 16,
        containLabel: true
      },
      xAxis: {
        axisLine:  { show: false },
        axisTick:  { show: false },
        splitLine: { show: false },
        axisLabel: {
          rotate: 30,
          overflow: 'truncate',
          width: 120,
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      },
      yAxis: {
        axisLine:  { show: false },
        axisTick:  { show: false },
        splitLine: {
          lineStyle: { color: '#f1f5f9', type: 'dashed' }
        },
        axisLabel: {
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'Inter, system-ui, sans-serif',
          formatter: (value: number) => value?.toLocaleString('fr-FR')
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: { color: 'rgba(148,163,184,0.08)' }
        },
        borderRadius: 10,
        borderWidth: 0,
        backgroundColor: 'rgba(15,23,42,0.88)',
        textStyle: {
          color: '#f1f5f9',
          fontSize: 12,
          fontFamily: 'Inter, system-ui, sans-serif'
        },
        formatter: (params: any[]) => {
          if (!params?.length) return '';
          const total = params.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
          const rows = params
          .filter(p => (p.value ?? 0) > 0)
          .map(p =>
            `<div style="display:flex;align-items:center;gap:6px;margin-top:4px">` +
            `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>` +
            `<span style="color:#cbd5e1;font-size:11px;flex:1">${p.seriesName}</span>` +
            `<b style="color:#f8fafc">${(p.value ?? 0).toLocaleString('fr-FR')}</b>` +
            `</div>`
          ).join('');
          return `<div style="line-height:1.6;min-width:160px">` +
            `<span style="color:#94a3b8;font-size:11px">${params[0].axisValue}</span>` +
            `${rows}` +
            `<div style="border-top:1px solid rgba(148,163,184,0.2);margin-top:6px;padding-top:4px;display:flex;justify-content:space-between">` +
            `<span style="color:#94a3b8;font-size:11px">Total</span>` +
            `<b style="color:#f8fafc">${total.toLocaleString('fr-FR')}</b>` +
            `</div></div>`;
        }
      }
    }
  }
  _data: any = [];
  filteredTasks: any[] = [];
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
    this.filteredTasks = event == 'default' ? this.filteredTasks : [];
    this.onChartChange.emit({eventType: event, chartConfig: this.jqueryConfig, filteredTasks: this.filteredTasks});
  }

  onFilterChange(filterFn: (row: any) => boolean): void {
    this.filteredTasks = this.tasks.filter(filterFn).map(task => task[this.actualFilter.jquery.buildAlias()]);
    this.onChartChange.emit({eventType: 'default', chartConfig: this.jqueryConfig, filteredTasks: this.filteredTasks});
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
