import {Component, inject, Input, OnInit} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {finalize} from "rxjs";
import {
  ChartConfig,
  REST_SESSION_PERFORMANCE_CHART_CONFIG,
  REST_SESSION_STATUS_CHART_CONFIG,
  REST_SESSION_VOLUMETRY_CHART_CONFIG
} from "../../kpi.config";
import {periodManagement2} from "../../../../shared/util";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {RestSessionService} from "../../../../service/jquery/rest-session.service";
import {EnvRouter} from "../../../../service/router.service";

@Component({
  templateUrl: './rest.component.html',
  styleUrls: ['./rest.component.scss']
})
export class RestComponent implements OnInit {
  private readonly _restSessionService = inject(RestSessionService);
  private readonly _router = inject(EnvRouter);

  readonly METHOD_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('method'), y: field('count') } }
    ]
  }

  readonly USER_AGENT_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('user_agt'), y: field('count') } }
    ],
    options: {
      legend: {
        formatter: (value: string) => value?.length > 6 ? value.substring(0, 6) + '…' : value
      }
    }
  }

  $statusRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = { data: [], loading: true};
  $statusRepartitionSlice: {data: any[], loading: boolean} = { data: [], loading: true};
  $performanceRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = {data: [], loading: true};
  $performanceRepartitionSlice: { data: any[], loading: boolean } = {data: [], loading: true};
  $volumetryRepartition : Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = {data: [], loading: true};
  $volumetryRepartitionSlice : {data: any[], loading: boolean} = {data: [], loading: true};
  $methodRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $userAgentRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $dependencyTable: {data: any[], loading: boolean} = {data: [], loading: true};
  $dependentTable: {data: any[], loading: boolean} = {data: [], loading: true};
  $globalStatistic: {totalRequest: number, totalRequestError: number, percentSuccess: number, totalHost: number, totalUser: number} = {totalRequest: 0, totalRequestError: 0, percentSuccess: 0, totalHost: 0, totalUser: 0};

  groupedBy: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement2(this.params.period.start, this.params.period.end);
      this.$statusRepartition.chartConfig = REST_SESSION_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = REST_SESSION_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.$volumetryRepartition.chartConfig = REST_SESSION_VOLUMETRY_CHART_CONFIG(this.groupedBy);
      this.getMethods();
      this.getUserAgents();
      this.getDependencies();
      this.getDependents();
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
      this._restSessionService.getCustom({series: arr.chartConfig.series.items, indicator: actualIndicator, group: actualGroup, stack: actualStack, filter: actualFilter}, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: event.filteredTasks})
      .pipe(finalize(() => arr.loading = false))
      .subscribe(data => {
        arr.data = data;
      });
    } else if(event.eventType === 'filter') {
      if(actualFilter) {
        this._restSessionService.getFilters(actualFilter, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts}).subscribe({
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
      args['instance.app_name.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$methodRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$methodRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$methodRepartition.data = res;
      }
    });
  }

  getUserAgents() {
    let args: any = {
      'column': `count:count,user_agt:user_agt`,
      'instance_env': 'instance.id',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$userAgentRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$userAgentRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userAgentRepartition.data = res;
      }
    });
  }

  getDependencies() {
    if(this.params.hosts?.length){
      this.$dependencyTable.loading = true;
      this.$dependencyTable.data = [];
      this._restSessionService.getDependenciesNew({env: this.params.env, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts})
        .pipe(finalize(() => this.$dependencyTable.loading = false))
        .subscribe({
          next: (res: any[]) => {this.$dependencyTable.data = res}
        })
    }
  }

  getDependents() {
    if(this.params.hosts?.length){
      this.$dependentTable.loading = true;
      this.$dependentTable.data = [];
      this._restSessionService.getDependentsNew({env: this.params.env, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts})
      .pipe(finalize(() => this.$dependentTable.loading = false))
      .subscribe({
        next: (res: any[]) => {this.$dependentTable.data = res}
      })
    }
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `count(instance.app_name.distinct):count_host,count:count_request,count_succes:count_success,count_error:count_error,count(user.distinct):count_user`,
      'instance_env': 'instance.id',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this._restSessionService.getRestSession(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0].count_request;
        this.$globalStatistic.percentSuccess = (res[0].count_success / res[0].count_request) * 100 || 0;
        this.$globalStatistic.totalRequestError = res[0].count_error;
        this.$globalStatistic.totalHost = res[0].count_host;
        this.$globalStatistic.totalUser = res[0].count_user;
      }
    });
  }

  onRowSelected(event: {row, event}) {
    this._router.navigateOnClick(event.event, ['/kpi/session/rest'], { queryParams: {env: this.params.env, host: event.row.dep}});
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