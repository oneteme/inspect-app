import {Component, inject, Input, OnDestroy} from "@angular/core";
import {finalize, map, Subscription} from "rxjs";
import {RestSessionService} from "../../../../../service/jquery/rest-session.service";
import {formatters, groupByField, periodManagement} from "../../../../../shared/util";
import {DatePipe, DecimalPipe} from "@angular/common";
import {QueryParams} from "../../../../../model/conf.model";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";

export interface HttpParams {
  server: string;
  params: Partial<QueryParams>;
}

@Component({
  selector: 'rest-tab',
  templateUrl: './rest-tab.component.html',
  styleUrls: ['./rest-tab.component.scss']
})
export class RestTabComponent implements OnDestroy {
  private _restSessionService = inject(RestSessionService);
  private _datePipe = inject(DatePipe);
  private subscriptions: Subscription[] = [];

  seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: '2xx', color: '#33cc33'},
    {data: {x: field('date'), y: field('countErrorClient')}, name: '4xx', color: '#ffa31a'},
    {data: {x: field('date'), y: field('countErrorServer')}, name: '5xx', color: '#ff0000'}
  ];

  $timeAndTypeResponse: { bar: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number} } = { bar: [], loading: true, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0} };
  $evolUserResponse: { line: any[], loading: boolean } = { line: [], loading: true };
  $dependenciesResponse: { table: any[], loading: boolean } = {table: [], loading: true};
  $dependentsResponse: { table: any[], loading: boolean } = {table: [], loading: true};
  $exceptionsResponse: { table: any[], loading: boolean } = {table: [], loading: true};

  @Input() set httpParams(httpParams: HttpParams) {
    if(httpParams && httpParams.params?.optional?.tab == '0') {
      let groupedBy = periodManagement(httpParams.params.period.start, httpParams.params.period.end);
      let advancedParams = {};
      Object.entries(httpParams.params.optional).forEach(([key, value]) => {
        if(value && Array.isArray(value)) advancedParams[`${key}`] = (<Array<string>>value).map(v => `"${v}"`).join(',');
      });
      this.subscriptions.forEach(s => s.unsubscribe());
      this.subscriptions.push(this.getTimeAndTypeResponse(httpParams, groupedBy, advancedParams));
      this.subscriptions.push(this.getUsersByPeriod(httpParams, groupedBy, advancedParams));
      this.subscriptions.push(this.getDependencies(httpParams, advancedParams));
      this.subscriptions.push(this.getDependents(httpParams, advancedParams));
      this.subscriptions.push(this.getExceptions(httpParams, advancedParams, groupedBy));
    }
  }

  getTimeAndTypeResponse(httpParams: HttpParams, groupedBy: string, advancedParams) {
    this.$timeAndTypeResponse.bar = [];
    this.$timeAndTypeResponse.loading = true;
    return this._restSessionService.getRepartitionTimeAndTypeResponseByPeriodNew({
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      groupedBy: groupedBy,
      env: httpParams.params.env,
      server: httpParams.server,
      apiNames: advancedParams.api_name,
      versions: advancedParams.api_version,
      users: advancedParams.api_user
    }).pipe(
      map(r => {
        formatters[groupedBy](r, this._datePipe);
        return r;
      }), finalize(() => this.$timeAndTypeResponse.loading = false)
    ).subscribe({
      next: res => {
        this.$timeAndTypeResponse.bar = res;
        this.$timeAndTypeResponse.stats = this.calculateRepartitionStats(res);
      }
    });
  }

  getUsersByPeriod(httpParams: HttpParams, groupedBy: string, advancedParams) {
    this.$evolUserResponse.line = [];
    this.$evolUserResponse.loading = true;
    return this._restSessionService.getUsersByPeriod({
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      groupedBy: groupedBy,
      env: httpParams.params.env,
      server: httpParams.server,
      apiNames: advancedParams.api_name,
      versions: advancedParams.api_version,
      users: advancedParams.api_user
    }).pipe(
        finalize(() => this.$evolUserResponse.loading = false),
        map(r => {
          formatters[groupedBy](r, this._datePipe);
          return Object.entries(groupByField(r, "date")).map(([key, value]) => {
            return {count: value.length, date: key, year: value[0].year};
          });
        })
      )
      .subscribe({
        next: res => {
          this.$evolUserResponse.line = res;
        }
    })
  }

  getDependencies(httpParams: HttpParams, advancedParams) {
    this.$dependenciesResponse.table = [];
    this.$dependenciesResponse.loading = true;
    return this._restSessionService.getDependenciesNew({
        start: httpParams.params.period.start,
        end: httpParams.params.period.end,
        env: httpParams.params.env,
        server: httpParams.server,
        apiNames: advancedParams.api_name,
        versions: advancedParams.api_version,
        users: advancedParams.api_user
      })
      .pipe(finalize(() => this.$dependenciesResponse.loading = false))
      .subscribe({
        next: res => {
          this.$dependenciesResponse.table = res;
        }
      })
  }

  getDependents(httpParams: HttpParams, advancedParams) {
    this.$dependentsResponse.table = [];
    this.$dependentsResponse.loading = true;
    return this._restSessionService.getDependentsNew({
        start: httpParams.params.period.start,
        end: httpParams.params.period.end,
        env: httpParams.params.env,
        server: httpParams.server,
        apiNames: advancedParams.api_name,
        versions: advancedParams.api_version,
        users: advancedParams.api_user
      })
      .pipe(finalize(() => this.$dependentsResponse.loading = false))
      .subscribe({
        next: res => {
          this.$dependentsResponse.table = res;
        }
      })
  }

  getExceptions(httpParams: HttpParams, advancedParams, groupedBy: string) {
    this.$exceptionsResponse.table = [];
    this.$exceptionsResponse.loading = true;
    return this._restSessionService.getSessionExceptions({
      env: httpParams.params.env,
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      groupedBy: groupedBy,
      server: httpParams.server,
      apiNames: advancedParams.api_name,
      versions: advancedParams.api_version,
      users: advancedParams.api_user
      //app_name: `instance.app_name.eq(${httpParams.server})`
    }).pipe(
      finalize(() => this.$exceptionsResponse.loading = false),
      map(res => {
        formatters[groupedBy](res, this._datePipe, 'stringDate');
        return res.filter(r => r.errorType != null)
      }))
      .subscribe({
      next: res => {
        this.$exceptionsResponse.table = res;
      }
    })
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  initData() {
    this.$timeAndTypeResponse.bar = [];
    this.$evolUserResponse.line = [];
    this.$dependenciesResponse.table = [];
    this.$dependentsResponse.table = [];
    this.$exceptionsResponse.table = [];
  }

  calculateRepartitionStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countErrorClient'] + o['countErrorServer'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErrClient: acc.statCountErrClient + o['countErrorClient'], statCountErrorServer: acc.statCountErrorServer + o['countErrorServer']};
    }, {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0});
  }
}