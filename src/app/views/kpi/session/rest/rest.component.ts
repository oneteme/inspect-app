import {Component, inject, Input, OnInit} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {finalize} from "rxjs";
import {
  ChartConfig,
  REST_SESSION_PERFORMANCE_CHART_CONFIG,
  REST_SESSION_STATUS_CHART_CONFIG,
  REST_SESSION_VOLUMETRY_CHART_CONFIG
} from "../../kpi.config";
import {periodManagement} from "../../../../shared/util";
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
    ],
    options: {
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center'
      },
      series: [{
        label: {
          show: false             // pas de datalabels sur les slices
        },
        labelLine: {
          show: false             // pas de lignes de labels non plus
        }
      }],
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
      }
    }
  }

  readonly USER_AGENT_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('user_agt'), y: field('count') } }
    ],
    options: {
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center'
      },
      series: [{
        label: {
          show: false             // pas de datalabels sur les slices
        },
        labelLine: {
          show: false             // pas de lignes de labels non plus
        }
      }],
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
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
  $dependencyRepartition: {data: any[], loading: boolean} = {data: [], loading: true};
  $dependentRepartition: {data: any[], loading: boolean} = {data: [], loading: true};
  $mediaRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $userRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $globalStatistic: {totalRequest: number, percentError: number, totalRequestError: number, elapsedPercentile: number, totalUser: number} = {totalRequest: 0, totalRequestError: 0, percentError: 0, elapsedPercentile: 0, totalUser: 0};

  groupedBy: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement(this.params.period.start, this.params.period.end);
      this.$statusRepartition.chartConfig = REST_SESSION_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = REST_SESSION_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.$volumetryRepartition.chartConfig = REST_SESSION_VOLUMETRY_CHART_CONFIG(this.groupedBy);
      this.getMethods();
      this.getUser();
      this.getUserAgents();
      this.getMediaType();
      this.getDependencies();
      this.getDependents();
      this.getGlobalStatistics();
    }
  };

  ngOnInit() {

  }

  onStatusChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]}) {
    this.getCustom(event, this.$statusRepartition, this.$statusRepartitionSlice);
  }

  onPerformanceChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]}) {
    this.getCustom(event, this.$performanceRepartition, this.$performanceRepartitionSlice);
  }

  onVolumetryChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig}) {
    this.getSizeCustom(event, this.$volumetryRepartition, this.$volumetryRepartitionSlice);
  }

  getCustom(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]},
            arr: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}>,
            slice: {data: any[], loading: boolean}) {
    console.log("getCustom", event)
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

  getSizeCustom(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig, filteredTasks?: any[]},
                arr: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}>,
                slice: {data: any[], loading: boolean}) {
    let actualIndicator = this.getActualIndicator(arr.chartConfig);
    let actualGroup = this.getActualGroup(arr.chartConfig);
    let actualStack = this.getActualStack(arr.chartConfig);
    let actualFilter = this.getActualFilter(arr.chartConfig);
    if(event.eventType === 'default') {
      arr.loading = true;
      arr.data = [];
      this._restSessionService.getSizeCustom({series: arr.chartConfig.series.items, indicator: actualIndicator, group: actualGroup, stack: actualStack, filter: actualFilter}, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: event.filteredTasks})
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

  getUser() {
    let args: any = {
      'column': `count(user.distinct):count,start.${this.groupedBy}.varchar:date`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': `start.${this.groupedBy}.asc`
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$userRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$userRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userRepartition.data = res;
      }
    });
  }

  getMediaType() {
    let args: any = {
      'column': `count:count,media.coalesce("Non renseigné"):media`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$mediaRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$mediaRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$mediaRepartition.data = res;
      }
    });
  }

  getMethods() {
    let args: any = {
      'column': `count:count,method:method`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
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
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$userAgentRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$userAgentRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userAgentRepartition.data = res.map(r => ({
          ...r,
          user_agt: r.user_agt ? r.user_agt.split('/')[0].trim() : 'N/A'
        }));
      }
    });
  }

  getDependencies() {
    this.$dependencyRepartition.loading = true;
    this.$dependencyRepartition.data = [];
    this._restSessionService.getDependencies({env: this.params.env, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts})
      .pipe(finalize(() => this.$dependencyRepartition.loading = false))
      .subscribe({
        next: (res: any[]) => {this.$dependencyRepartition.data = res}
      })
  }

  getDependents() {
    this.$dependentRepartition.loading = true;
    this.$dependentRepartition.data = [];
    this._restSessionService.getDependents({env: this.params.env, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts})
    .pipe(finalize(() => this.$dependentRepartition.loading = false))
    .subscribe({
      next: (res: any[]) => {this.$dependentRepartition.data = res}
    })
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `percentileDisc(0.95).within(group.order(elapsed_time)):elapsedPercentile,count:count_request,count_error:count_error,count(user.distinct):count_user`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this._restSessionService.getRestSession(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0].count_request;
        this.$globalStatistic.totalRequestError = res[0].count_error;
        this.$globalStatistic.percentError = (res[0].count_error / res[0].count_request) * 100 || 0;
        this.$globalStatistic.elapsedPercentile = res[0].elapsedPercentile;
        this.$globalStatistic.totalUser = res[0].count_user;
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
