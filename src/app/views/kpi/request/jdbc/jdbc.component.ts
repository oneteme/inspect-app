import {Component, inject, Input, OnInit} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {DatabaseRequestService} from "../../../../service/jquery/database-request.service";
import {ChartConfig, JDBC_PERFORMANCE_CHART_CONFIG, JDBC_STATUS_CHART_CONFIG} from "../../kpi.config";
import {finalize} from "rxjs";
import {periodManagement} from "../../../../shared/util";

@Component({
  templateUrl: './jdbc.component.html',
  styleUrls: ['./jdbc.component.scss']
})
export class JdbcComponent implements OnInit {
  private readonly _jdbcRequestService = inject(DatabaseRequestService);

  $statusRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = { data: [], loading: true};
  $statusRepartitionSlice: {data: any[], loading: boolean} = { data: [], loading: true};
  $performanceRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig}> = {data: [], loading: true};
  $performanceRepartitionSlice: {data: any[], loading: boolean} = {data: [], loading: true};
  $globalStatistic: {totalRequest: number, totalRequestError: number, percentError: number, elapsedPercentile: number} = {totalRequest: 0, totalRequestError: 0, percentError: 0, elapsedPercentile: 0};
  $methodRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $commandRepartition: Partial<{data: any[], loading: boolean}> = { data: [], loading: true};
  $dependencyRepartition: {data: any[], loading: boolean} = {data: [], loading: true};
  $userRepartition: {data: any[], loading: boolean} = { data: [], loading: true};

  readonly DATABASE_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('db_name'), y: field('count') } }
    ],
    options: {
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center'
      },
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
      }
    }
  }

  groupedBy: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement(this.params.period.start, this.params.period.end);
      this.$statusRepartition.chartConfig = JDBC_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = JDBC_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.getGlobalStatistics();
      this.getCommands();
      this.getDatabases();
      this.getUser();
      this.getDependencies();
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
      this._jdbcRequestService.getCustom({series: arr.chartConfig.series.items, indicator: actualIndicator, group: actualGroup, stack: actualStack, filter: actualFilter}, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: event.filteredTasks})
      .pipe(finalize(() => arr.loading = false))
      .subscribe(data => {
        arr.data = data;
      });
    } else if(event.eventType === 'filter') {
      if(actualFilter) {
        this._jdbcRequestService.getFilters(actualFilter, {env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts}).subscribe({
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
      args['host.in'] = this.params.hosts.join(',');
    }
    this.$userRepartition.loading = true;
    this._jdbcRequestService.getDatabaseRequest(args).pipe(finalize(() => this.$userRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userRepartition.data = res;
      }
    });
  }

  getCommands() {
    let args: any = {
      'column': `count:count,command.coalesce("Non renseigné"):command`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['host.in'] = this.params.hosts.join(',');
    }
    this.$commandRepartition.loading = true;
    this._jdbcRequestService.getDatabaseRequest(args).pipe(finalize(() => this.$commandRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$commandRepartition.data = res;
      }
    });
  }

  getDatabases() {
    let args: any = {
      'column': `count:count,db_name:db_name`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['host.in'] = this.params.hosts.join(',');
    }
    this.$methodRepartition.loading = true;
    this._jdbcRequestService.getDatabaseRequest(args).pipe(finalize(() => this.$methodRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$methodRepartition.data = res;
      }
    });
  }

  getDependencies() {
    let args: any = {
      'column': `instance.app_name:origin,host:target,count:count`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.asc'
    }
    if(this.params.hosts?.length){
      args['host.in'] = this.params.hosts.join(',');
    }
    this.$dependencyRepartition.loading = true;
    this._jdbcRequestService.getDatabaseRequest(args).pipe(finalize(() => this.$dependencyRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$dependencyRepartition.data = res;
      }
    });
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `percentileDisc(0.95).within(group.order(elapsed_time)):elapsedPercentile,count:count_request,count_request_error:count_error`,
      'join': 'instance',
      'instance.environement': this.params.env,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['host.in'] = this.params.hosts.join(',');
    }
    this._jdbcRequestService.getDatabaseRequest(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0].count_request;
        this.$globalStatistic.totalRequestError = res[0].count_error;
        this.$globalStatistic.percentError = (res[0].count_error / res[0].count_request) * 100 || 0;
        this.$globalStatistic.elapsedPercentile = res[0].elapsedPercentile;
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
