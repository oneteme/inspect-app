import {Component, inject, Input, OnInit} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {finalize} from "rxjs";
import {BATCH_SESSION_STATUS_CHART_CONFIG, ChartConfig, STARTUP_SESSION_STATUS_CHART_CONFIG} from "../../kpi.config";
import {periodManagement2} from "../../../../shared/util";
import {MainSessionService} from "../../../../service/jquery/main-session.service";

@Component({
  templateUrl: './startup.component.html',
  styleUrls: ['./startup.component.scss']
})
export class StartupComponent implements OnInit {
  private readonly _mainSessionService = inject(MainSessionService);

  $statusRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = { data: [], loading: true};
  $statusRepartitionSlice: {data: any[], loading: boolean} = { data: [], loading: true};
  $userRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $dependentChart: {data: any[], loading: boolean} = {data: [], loading: true};
  $globalStatistic: {totalRequest: number, totalRequestError: number, percentError: number,  totalHost: number, totalName: number} = {totalRequest: 0, totalRequestError: 0, percentError: 0, totalHost: 0, totalName: 0};

  groupedBy: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement2(this.params.period.start, this.params.period.end);
      this.$statusRepartition.chartConfig = STARTUP_SESSION_STATUS_CHART_CONFIG(this.groupedBy);
      this.getDependents();
      this.getUser();
      this.getGlobalStatistics();
    }
  };

  ngOnInit() {

  }

  onStatusChartChange(event: {eventType: 'default' | 'filter', chartConfig: ChartConfig}) {
    this.getCustom(event, this.$statusRepartition, this.$statusRepartitionSlice);
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
      this._mainSessionService.getCustom({series: arr.chartConfig.series.items, indicator: actualIndicator, group: actualGroup, stack: actualStack, filter: actualFilter}, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: event.filteredTasks, type: 'STARTUP'})
      .pipe(finalize(() => arr.loading = false))
      .subscribe(data => {
        arr.data = data;
      });
    } else if(event.eventType === 'filter') {
      if(actualFilter) {
        this._mainSessionService.getFilters(actualFilter, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, type: 'STARTUP'}).subscribe({
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
      'instance_env': 'instance.id',
      'instance.environement': this.params.env,
      'instance.type': 'SERVER',
      'type': 'STARTUP',
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': `start.${this.groupedBy}.asc`
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$userRepartition.loading = true;
    this._mainSessionService.getMainSession(args).pipe(finalize(() => this.$userRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userRepartition.data = res;
      }
    });
  }

  getDependents() {
    this.$dependentChart.loading = true;
    this.$dependentChart.data = [];
    this._mainSessionService.getDependentsNew2({env: this.params.env, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts, type: 'STARTUP'})
    .pipe(finalize(() => this.$dependentChart.loading = false))
    .subscribe({
      next: (res: any[]) => {this.$dependentChart.data = res}
    })
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `count(instance.app_name.distinct):count_host,count:count_request,count_exception:count_error`,
      'instance_env': 'instance.id',
      'instance.environement': this.params.env,
      'instance.type': 'SERVER',
      'type': 'STARTUP',
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this._mainSessionService.getMainSession(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0].count_request;
        this.$globalStatistic.totalRequestError = res[0].count_error;
        this.$globalStatistic.percentError = (res[0].count_error / res[0].count_request) * 100 || 0;
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
