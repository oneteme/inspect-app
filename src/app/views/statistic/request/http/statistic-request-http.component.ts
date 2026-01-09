import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {DatabaseRequestService} from "../../../../service/jquery/database-request.service";
import {SmtpRequestService} from "../../../../service/jquery/smtp-request.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, groupByField, periodManagement} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {HttpParams} from "../../server/_component/rest-tab/rest-tab.component";

@Component({
  templateUrl: './statistic-request-http.component.html',
  styleUrls: ['./statistic-request-http.component.scss']
})
export class StatisticRequestHttpComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _httpRequestService = inject(RestRequestService);

  seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: '2xx', color: '#33cc33'},
    {data: {x: field('date'), y: field('countErrorClient')}, name: '4xx', color: '#ffa31a'},
    {data: {x: field('date'), y: field('countErrorServer')}, name: '5xx', color: '#ff0000'}
  ];

  $timeAndTypeResponse: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number} } = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0} };
  $exceptionsResponse: { data: any[], loading: boolean } = {data: [], loading: true};
  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      let groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      this.getRepartitionTimeAndTypeResponseByPeriod(queryParams, groupedBy);
      this.getExceptions(queryParams, groupedBy);
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

  calculateStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countErrorClient'] + o['countErrorServer'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErrClient: acc.statCountErrClient + o['countErrorClient'], statCountErrorServer: acc.statCountErrorServer + o['countErrorServer']};
    }, {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0});
  }
}