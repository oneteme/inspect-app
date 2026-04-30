import {Component, inject, Input, OnInit} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {finalize} from "rxjs";
import {
  ChartConfig,
  REST_LATENCY_CHART_CONFIG,
  REST_PERFORMANCE_CHART_CONFIG,
  REST_STATUS_CHART_CONFIG,
  REST_VOLUMETRY_CHART_CONFIG
} from "../../kpi.config";
import {periodManagement2} from "../../../../shared/util";
import {ChartProvider, field} from "@oneteme/jquery-core";

@Component({
  templateUrl: './rest.component.html',
  styleUrls: ['./rest.component.scss']
})
export class RestComponent implements OnInit {
  private readonly _httpRequestService = inject(RestRequestService);

  readonly METHOD_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('method'), y: field('count') } }
    ]
  }

  $statusRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = { data: [], loading: true};
  $statusRepartitionSlice: {data: any[], loading: boolean} = { data: [], loading: true};
  $performanceRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = {data: [], loading: true};
  $performanceRepartitionSlice: { data: any[], loading: boolean } = {data: [], loading: true};
  $volumetryRepartition : Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = {data: [], loading: true};
  $volumetryRepartitionSlice : {data: any[], loading: boolean} = {data: [], loading: true};
  $latencyRepartition : Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = {data: [], loading: true};
  $latencyRepartitionSlice : {data: any[], loading: boolean} = {data: [], loading: true};
  $methodRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $globalStatistic: {totalRequest: number, totalRequestError: number, percentSuccess: number, totalHost: number} = {totalRequest: 0, totalRequestError: 0, percentSuccess: 0, totalHost: 0};

  groupedBy: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement2(this.params.period.start, this.params.period.end);
      this.$statusRepartition.chartConfig = REST_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = REST_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.$volumetryRepartition.chartConfig = REST_VOLUMETRY_CHART_CONFIG(this.groupedBy);
      this.$latencyRepartition.chartConfig = REST_LATENCY_CHART_CONFIG(this.groupedBy);
      this.getMethods();
      this.getGlobalStatistics();
    }
  };

  ngOnInit() {

  }

  onStatusChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig}) {
    this.getCustom(event, this.$statusRepartition, this.$statusRepartitionSlice);
  }

  onPerformanceChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]}) {
    this.getCustom(event, this.$performanceRepartition, this.$performanceRepartitionSlice);
  }

  onVolumetryChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig}) {
    this.getCustom(event, this.$volumetryRepartition, this.$volumetryRepartitionSlice);
  }

  onLatencyChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig}) {
    this.getLatency(event, this.$latencyRepartition, this.$latencyRepartitionSlice);
  }

  getCustom(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]},
            arr: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}>,
            slice: {data: any[], loading: boolean}) {
    let actualIndicator = this.getActualIndicator(arr.chartConfig);
    let actualGroup = this.getActualGroup(arr.chartConfig);
    let actualStack = this.getActualStack(arr.chartConfig);
    let actualFilter = this.getActualFilter(arr.chartConfig);
    if(event.eventType === 'default') {
      arr.loading = true;
      arr.data = [];
      this._httpRequestService.getCustom2({series: arr.chartConfig.series.items, indicator: actualIndicator, group: actualGroup, stack: actualStack, filter: actualFilter}, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: event.filteredTasks})
      .pipe(finalize(() => arr.loading = false))
      .subscribe(data => {
        arr.data = data;
      });
    } else if(event.eventType === 'filter') {
      if(actualFilter) {
        this._httpRequestService.getFilters(actualFilter, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts}).subscribe({
          next: (res: any[]) => {
            slice.data = res;
          }
        });
      } else {
        slice.data = [];
      }
    }
  }

  getLatency(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]},
            arr: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}>,
            slice: {data: any[], loading: boolean}) {
    let actualIndicator = this.getActualIndicator(event.chartConfig);
    let actualGroup = this.getActualGroup(event.chartConfig);
    let actualStack = this.getActualStack(event.chartConfig);
    let actualFilter = this.getActualFilter(event.chartConfig);
    if(event.eventType === 'default') {
      arr.loading = true;
      arr.data = [];
      this._httpRequestService.getLatency2({serie: event.chartConfig.series.items[0], indicator: actualIndicator, group: actualGroup, stack: actualStack, filter: actualFilter}, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, filters: event.filteredTasks})
      .pipe(finalize(() => arr.loading = false))
      .subscribe(data => {
        arr.data = data;
      });
    } else if(event.eventType === 'filter') {
      if(actualFilter) {
        this._httpRequestService.getFilters(actualFilter, {env: this.params.env, start: this.params.period.start, end: this.params.period.end}).subscribe({
          next: (res: any[]) => {
            slice.data = res;
          }
        });
      } else {
        slice.data = [];
      }
    }
  }

  getMethods() {
    let args: any = {
      'column': `count:count,method:method`,
      'instance_env': 'instance.id',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$methodRepartition.loading = true;
    this._httpRequestService.getRestRequest(args).pipe(finalize(() => this.$methodRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$methodRepartition.data = res;
      }
    });
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `count(host.distinct):count_host,count:count_request,count_succes:count_success,count_error:count_error`,
      'instance_env': 'instance.id',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this._httpRequestService.getRestRequest(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0].count_request;
        this.$globalStatistic.percentSuccess = (res[0].count_success / res[0].count_request) * 100;
        this.$globalStatistic.totalRequestError = res[0].count_error;
        this.$globalStatistic.totalHost = res[0].count_host;
      }
    });
  }

  getActualIndicator(chartConfig: ChartConfig) {
    return chartConfig.indicators.items.find(g => g.selected);
  }

  getActualGroup(chartConfig: ChartConfig) {
    return chartConfig.groups.items.find(g => g.selected);
  }

  getActualFilter(chartConfig: ChartConfig) {
    return chartConfig.filters.items.find(g => g.selected);
  }

  getActualStack(chartConfig: ChartConfig) {
    return this.getActualIndicator(chartConfig).extra?.stacks?.items.find(g => g.selected);
  }
}