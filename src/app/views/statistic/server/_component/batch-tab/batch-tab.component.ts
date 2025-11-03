import {Component, inject, Input, OnDestroy} from "@angular/core";
import {DatePipe} from "@angular/common";
import {MainSessionService} from "../../../../../service/jquery/main-session.service";
import {formatters, groupByField, periodManagement} from "../../../../../shared/util";
import {finalize, map, Subscription} from "rxjs";
import {HttpParams} from "../rest-tab/rest-tab.component";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {field} from "@oneteme/jquery-core";

@Component({
  selector: 'batch-tab',
  templateUrl: './batch-tab.component.html',
  styleUrls: ['./batch-tab.component.scss']
})
export class BatchTabComponent implements OnDestroy {
  private _mainSessionService = inject(MainSessionService);
  private _datePipe = inject(DatePipe);
  private subscriptions: Subscription[] = [];

  readonly seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: 'OK', color: '#33cc33'},
    {data: {x: field('date'), y: field('countError')}, name: 'KO', color: '#ff0000'},
  ];

  $timeAndTypeResponse: {
    bar: any[],
    loading: boolean,
    stats: { statCount: number, statCountOk: number, statCountErr: number }
  } = {bar: [], loading: true, stats: {statCount: 0, statCountOk: 0, statCountErr: 0}};
  $evolUserResponse: { line: any[], loading: boolean } = {line: [], loading: true};
  $dependentsResponse: { table: any[], loading: boolean } = {table: [], loading: true};
  $exceptionsResponse: { table: any[], loading: boolean } = {table: [], loading: true};

  @Input() set httpParams(httpParams: HttpParams) {
    if (httpParams && httpParams.params?.optional?.tab == '1') {
      let groupedBy = periodManagement(httpParams.params.period.start, httpParams.params.period.end);
      let advancedParams = {};
      Object.entries(httpParams.params.optional).forEach(([key, value]) => {
        if (value && Array.isArray(value)) advancedParams[`${key}`] = (<Array<string>>value).map(v => `"${v}"`).join(',');
      });
      this.subscriptions.forEach(s => s.unsubscribe());
      this.subscriptions.push(this.getTimeAndTypeResponse(httpParams, groupedBy, advancedParams));
      this.subscriptions.push(this.getUsersByPeriod(httpParams, groupedBy, advancedParams));
      this.subscriptions.push(this.getDependents(httpParams, advancedParams));
      this.subscriptions.push(this.getExceptions(httpParams, advancedParams, groupedBy));
    }
  }

  getTimeAndTypeResponse(httpParams: HttpParams, groupedBy: string, advancedParams) {
    this.$timeAndTypeResponse.bar = [];
    this.$timeAndTypeResponse.loading = true;
    return this._mainSessionService.getRepartitionTimeAndTypeResponseByPeriodNew({
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      groupedBy: groupedBy,
      env: httpParams.params.env,
      server: httpParams.server,
      apiNames: advancedParams.batch_name,
      versions: advancedParams.batch_version,
      users: advancedParams.batch_user
    }).pipe(
      map(r => {
        formatters[groupedBy](r, this._datePipe);
        return r;
      }), finalize(() => this.$timeAndTypeResponse.loading = false)
    ).subscribe({
      next: res => {
        this.$timeAndTypeResponse.bar = res;
        this.$timeAndTypeResponse.stats = this.calculateStats(res);
      }
    });
  }

  getUsersByPeriod(httpParams: HttpParams, groupedBy: string, advancedParams) {
    this.$evolUserResponse.line = [];
    this.$evolUserResponse.loading = true;
    return this._mainSessionService.getUsersByPeriod({
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      groupedBy: groupedBy,
      env: httpParams.params.env,
      server: httpParams.server,
      apiNames: advancedParams.batch_name,
      versions: advancedParams.batch_version,
      users: advancedParams.batch_user
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

  getDependents(httpParams: HttpParams, advancedParams) {
    this.$dependentsResponse.table = [];
    this.$dependentsResponse.loading = true;

    return this._mainSessionService.getDependentsNew({
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      env: httpParams.params.env,
      server: httpParams.server,
      apiNames: advancedParams.batch_name,
      versions: advancedParams.batch_version,
      users: advancedParams.batch_user
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

    return this._mainSessionService.getSessionExceptions({
      env: httpParams.params.env,
      start: httpParams.params.period.start,
      end: httpParams.params.period.end,
      groupedBy: groupedBy,
      app_name: `instance.app_name.eq(${httpParams.server})`
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

  calculateStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErr: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countError'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErr: acc.statCountErr + o['countError']};
    }, {statCount: 0, statCountOk: 0, statCountErr: 0});
  }

  initData() {
    this.$timeAndTypeResponse.bar = [];
    this.$evolUserResponse.line = [];
    this.$dependentsResponse.table = [];
    this.$exceptionsResponse.table = [];
  }
}