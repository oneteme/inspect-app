import {Component, inject, Input} from "@angular/core";
import {DatePipe} from "@angular/common";
import {field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {EnvRouter} from "../../../../service/router.service";

@Component({
  templateUrl: './statistic-request-http.component.html',
  styleUrls: ['./statistic-request-http.component.scss']
})
export class StatisticRequestHttpComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _httpRequestService = inject(RestRequestService);
  private _router: EnvRouter = inject(EnvRouter);
  errorStatus = {
    "ServerError": "5xx",
    "ClientError": "4xx",
  }
  seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: '2xx', color: '#33cc33'},
    {data: {x: field('date'), y: field('countErrorClient')}, name: '4xx', color: '#ffa31a'},
    {data: {x: field('date'), y: field('countErrorServer')}, name: '5xx', color: '#ff0000'},
    {data: {x: field('date'), y: field('countServerUnavailableRows')}, name: '0', color: 'gray'}
  ];

  groupedBy: string = ''
  params: QueryParams;
  $timeAndTypeResponse: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $timeAndTypeResponseCross: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $exceptionsResponse: { data: any[], loading: boolean, type: string } = {data: [], loading: true, type: 'exceptionsResponse'};
  $exceptionsResponseCross: { data: any[], loading: boolean, type: string } = {data: [], loading: true, type: 'exceptionsResponseCross'};
  $latencyTypeResponse: { data: any[], loading: boolean, stats: { avg: number, max: number }} = { data: [], loading: false, stats: { avg: 0, max: 0 }};
  $latencyTypeResponseCross: { data: any[], loading: boolean, stats: { avg: number, max: number }} = { data: [], loading: false, stats: { avg: 0, max: 0 }};
  getRequestColumns(type: 'timeAndTypeResponse' | 'exceptionsResponse', group?: string, cross?: string) {
    const columns = {
      date: () => (type === 'timeAndTypeResponse'
          ? { column: `start.${this.groupedBy}:date,start.year:year`, order: 'year.asc,date.asc' }
          : { column: `count.sum.over(partition(start.${this.groupedBy}:date,start.year)):countok,start.${this.groupedBy}:date,start.year:year`, order: 'date.asc' }),
      method: { column: 'method.coalesce("<empty>"):name' },
      auth: { column: 'auth.coalesce("<no_auth>"):name' },
      media: { column: 'media.coalesce("<empty>"):name' },
      user: { column: 'user.coalesce("<empty>"):name' },
      app: { column: 'instance.app_name.coalesce("<empty>"):name' }
    };

    const groupCol = this.getStringOrCall(columns[group]);

    if (cross) {
      const crossCol = this.getStringOrCall(columns[cross]);
      return {
        column: `${crossCol.column},${groupCol.column}`,
        order: groupCol.order || crossCol.order
      };
    }

    return groupCol;
  }

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      this.getRepartitionTimeAndTypeResponseByPeriod(this.$timeAndTypeResponse, queryParams.optional?.group,null, queryParams, this.groupedBy);
      this.getRepartitionTimeAndTypeResponseByPeriod(this.$timeAndTypeResponseCross,queryParams.optional?.group, queryParams.optional?.cross, queryParams, this.groupedBy);
      this.getExceptions(this.$exceptionsResponse, queryParams.optional?.group, null, queryParams,  this.groupedBy);
      this.getExceptions(this.$exceptionsResponseCross, queryParams.optional?.group, queryParams.optional?.cross, queryParams,  this.groupedBy);
      this.getLatencyByHost(this.$latencyTypeResponse, queryParams.optional?.group,null, queryParams, this.groupedBy);
      this.getLatencyByHost(this.$latencyTypeResponseCross, queryParams.optional?.group, queryParams.optional?.cross, queryParams, this.groupedBy);
    }
  }

  getLatencyByHost(arr: { data: any[], loading: boolean, stats: { avg: number, max: number } },
                                            group: string,
                                            cross: string,
                                            queryParams: QueryParams,
                                            groupedBy: string) {
    arr.data = [];
    arr.loading = true;
    return this._httpRequestService.getLatencyByHost(
        this.getRequestColumns('timeAndTypeResponse', group, cross), {
          start: queryParams.period.start,
          end: queryParams.period.end,
          groupedBy: groupedBy,
          env: queryParams.env,
          hosts: queryParams.hosts}).pipe(
        map(r => {
          if (group === 'date') {
            formatters[groupedBy](r, this._datePipe);
          }
          return r;
        }), finalize(() => arr.loading = false)
    ).subscribe({
      next: res => {
        arr.data = res;
        arr.stats = this.calculateLatencyStats(res);
      }
    });
  }

  getRepartitionTimeAndTypeResponseByPeriod(arr: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number} },
                                            group: string,
                                            cross: string,
                                            queryParams: QueryParams,
                                            groupedBy: string) {
    arr.data = [];
    arr.loading = true;
    return this._httpRequestService.getRepartitionTimeAndTypeResponseByPeriod(
        this.getRequestColumns('timeAndTypeResponse',  group, cross), {
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      env: queryParams.env,
      hosts: queryParams.hosts,
      method: queryParams.commands}).pipe(
      map(r => {
        if (group === 'date') {
          formatters[groupedBy](r, this._datePipe);
        }
        return r;
      }), finalize(() => arr.loading = false)
    ).subscribe({
      next: res => {
        arr.data = res;
        arr.stats = this.calculateStats(res);
      }
    });
  }

  getExceptions(arr: { data: any[], loading: boolean },
                group: string,
                cross: string,
                queryParams: QueryParams,
                groupedBy: string) {
    arr.data = [];
    arr.loading = true;
    return this._httpRequestService.getRestExceptionsByHost(
        this.getRequestColumns('exceptionsResponse', group, cross), {
      env: queryParams.env,
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      hosts: queryParams.hosts,
      command: queryParams.commands
    }).pipe(
        finalize(() => arr.loading = false),
        map(res => {
          if (group === 'date') {
            formatters[groupedBy](res, this._datePipe);
          }
          return res.filter(r => r.errorType != null);
        }))
        .subscribe({
          next: res => {
            arr.data = res;

          }
        })
  }


  calculateStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countErrorClient'] + o['countErrorServer']+ o['countServerUnavailableRows'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErrClient: acc.statCountErrClient + o['countErrorClient'], statCountErrorServer: acc.statCountErrorServer + o['countErrorServer'], statCountUnavailableServer: acc.statCountUnavailableServer + o['countServerUnavailableRows']};
    }, {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer: 0});
  }

  calculateLatencyStats(res: any[]): { avg: number, max: number } {
    if (!res?.length) return { avg: 0, max: 0 };
    const totalAvg = res.reduce((sum, o) => sum + (o['avg'] || 0), 0);
    const maxValue = Math.max(...res.map(o => o['max'] || 0));
    return { avg: totalAvg / res.length, max: maxValue };
  }

  onSessionExceptionRowSelected(row:any) {
    const result = recreateDate(this.groupedBy, row, this.params.period.start);
    if(result) {
      this._router.navigate(['/request/rest'], {
        queryParams: {
          'env': this.params.env,
          'start': result.start.toISOString(),
          'end': result.end.toISOString(),
          'q':  !this.errorStatus[row.errorType] ? row.errorType : '',
          'host': this.params.hosts,
          'rangestatus': this.errorStatus[row.errorType] || '0xx'
        }
      });
    }
  }
  getStringOrCall(o?: any | (() => any)) {
    return typeof o === "function" ? o() : o;
  }
}