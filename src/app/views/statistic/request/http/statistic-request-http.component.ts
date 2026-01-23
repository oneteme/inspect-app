import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {DatabaseRequestService} from "../../../../service/jquery/database-request.service";
import {SmtpRequestService} from "../../../../service/jquery/smtp-request.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {HttpParams} from "../../server/_component/rest-tab/rest-tab.component";
import {EnvRouter} from "../../../../service/router.service";

@Component({
  templateUrl: './statistic-request-http.component.html',
  styleUrls: ['./statistic-request-http.component.scss']
})
export class StatisticRequestHttpComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _httpRequestService = inject(RestRequestService);
  private _router: EnvRouter = inject(EnvRouter);

  seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: '2xx', color: '#33cc33'},
    {data: {x: field('date'), y: field('countErrorClient')}, name: '4xx', color: '#ffa31a'},
    {data: {x: field('date'), y: field('countErrorServer')}, name: '5xx', color: '#ff0000'},
    {data: {x: field('date'), y: field('countServerUnavailableRows')}, name: '0', color: 'gray'}
  ];

  groupedBy: string;
  params: QueryParams;
  $timeAndTypeResponse: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number} } = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0} };
  $evolUserResponse: { line: any[], loading: boolean } = { line: [], loading: true };
  $exceptionsResponse: { data: any[], loading: boolean } = {data: [], loading: true};
  $dependenciesResponse: { table: any[], loading: boolean } = {table: [], loading: true};

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      this.getRepartitionTimeAndTypeResponseByPeriod(queryParams,  this.groupedBy);
      this.getUsersByPeriod(queryParams, this.groupedBy);
      this.getExceptions(queryParams,  this.groupedBy);
      this.getDependencies(queryParams);
    }
  }

  getRepartitionTimeAndTypeResponseByPeriod(queryParams: QueryParams, groupedBy: string) {
    this.$timeAndTypeResponse.data = [];
    this.$timeAndTypeResponse.loading = true;
    return this._httpRequestService.getRepartitionTimeAndTypeResponseByPeriod({
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      env: queryParams.env,
      host: queryParams.hosts,
      method: queryParams.commands    }).pipe(
      map(r => {
        formatters[groupedBy](r, this._datePipe);
        return r;
      }), finalize(() => this.$timeAndTypeResponse.loading = false)
    ).subscribe({
      next: res => {
        this.$timeAndTypeResponse.data = res;
        this.$timeAndTypeResponse.stats = this.calculateStats(res);
      }
    });
  }

  getUsersByPeriod(queryParams: QueryParams, groupedBy: string) {
    this.$evolUserResponse.line = [];
    this.$evolUserResponse.loading = true;
    return this._httpRequestService.getUsersByPeriod({
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      env: queryParams.env,
      host: queryParams.hosts,
      method: queryParams.commands
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

  getExceptions(queryParams: QueryParams, groupedBy: string) {
    this.$exceptionsResponse.data = [];
    this.$exceptionsResponse.loading = true;
    return this._httpRequestService.getRestExceptionsByHost({
      env: queryParams.env,
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      host: queryParams.hosts,
      command: queryParams.commands
    }).pipe(
        finalize(() => this.$exceptionsResponse.loading = false),
        map(res => {
          formatters[groupedBy](res, this._datePipe, 'stringDate');
          return res.filter(r => r.errorType != null)
        }))
        .subscribe({
          next: res => {
            this.$exceptionsResponse.data = res;
          }
        })
  }
  getDependencies(queryParams: QueryParams) {
    this.$dependenciesResponse.table = [];
    this.$dependenciesResponse.loading = true;
    return this._httpRequestService.getDependentsNew({
      start: queryParams.period.start,
      end: queryParams.period.end,
      env: queryParams.env,
      host: queryParams.hosts,
      method: queryParams.commands
    }).pipe(
        map(r => {
          return r;
        }), finalize(() => this.$dependenciesResponse.loading = false)
    ).subscribe({
      next: res => {
        this.$dependenciesResponse.table = res.map(item => ({
          ...item,
          count: item.countSucces + item.countErrServer+  item.countErrClient + item.countServerUnavailableRows
        }));
      }
    });
  }
  calculateStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countErrorClient'] + o['countErrorServer']+ o['countServerUnavailableRows'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErrClient: acc.statCountErrClient + o['countErrorClient'], statCountErrorServer: acc.statCountErrorServer + o['countErrorServer'], statCountUnavailableServer: acc.statCountUnavailableServer + o['countServerUnavailableRows']};
    }, {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer: 0});
  }
  onSessionExceptionRowSelected(row:any) {
    const result = recreateDate(this.groupedBy, row, this.params.period.start);
    if(result) {
      this._router.navigate(['/request/rest'], {
        queryParams: {
          'env': this.params.env,
          'start': result.start.toISOString(),
          'end': result.end.toISOString(),
          'q': row.errorType,
          'host': this.params.hosts,
          'rangestatus' : 'Ko'
        }
      });
    }
  }
}