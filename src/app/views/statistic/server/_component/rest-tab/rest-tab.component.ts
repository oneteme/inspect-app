import {Component, inject, Input, OnDestroy} from "@angular/core";
import {finalize, map, Subscription} from "rxjs";
import {RestSessionService} from "../../../../../service/jquery/rest-session.service";
import {formatters, groupByField, periodManagement, recreateDate} from "../../../../../shared/util";
import {DatePipe} from "@angular/common";
import {QueryParams} from "../../../../../model/conf.model";
import {EnvRouter} from "../../../../../service/router.service";

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
  private _router: EnvRouter = inject(EnvRouter);
  private subscriptions: Subscription[] = [];

  $timeAndTypeResponse: { bar: any[], loading: boolean } = { bar: [], loading: true };
  $evolUserResponse: { line: any[], loading: boolean } = { line: [], loading: true };
  $dependenciesResponse: { table: any[], loading: boolean } = {table: [], loading: true};
  $dependentsResponse: { table: any[], loading: boolean } = {table: [], loading: true};
  $exceptionsResponse: { table: any[], loading: boolean } = {table: [], loading: true};
  groupedBy: string;
  private _httpParams: HttpParams;

  @Input() set httpParams(httpParams: HttpParams) {
    this._httpParams = httpParams;
    if(httpParams && httpParams.params?.optional?.tab == '0') {
      this.groupedBy = periodManagement(httpParams.params.period.start, httpParams.params.period.end);
      let advancedParams = {};
      Object.entries(httpParams.params.optional).forEach(([key, value]) => {
        if(value && Array.isArray(value)) advancedParams[`${key}`] = (<Array<string>>value).map(v => `"${v}"`).join(',');
      });
      this.subscriptions.forEach(s => s.unsubscribe());
      this.subscriptions.push(this.getTimeAndTypeResponse(httpParams, this.groupedBy, advancedParams));
      this.subscriptions.push(this.getUsersByPeriod(httpParams, this.groupedBy, advancedParams));
      this.subscriptions.push(this.getDependencies(httpParams, advancedParams));
      this.subscriptions.push(this.getDependents(httpParams, advancedParams));
      this.subscriptions.push(this.getExceptions(httpParams, advancedParams, this.groupedBy));
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

  onSessionExceptionRowSelected(row:any) {
    const result = recreateDate(this.groupedBy, row, this._httpParams.params.period.start);
    if(result){
      this._router.navigate(['/session/rest'], {
        queryParams: {
          'env': this._httpParams.params.env,
          'start': result.start.toISOString(),
          'end': result.end.toISOString(),
          'q' : row.errorType,
          'server': this._httpParams.server.replace(/"/g, ''),
          'rangestatus': ['5xx','4XX']
        }
      });
    }
  }
}