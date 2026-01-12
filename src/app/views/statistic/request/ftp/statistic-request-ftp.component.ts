import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {FtpRequestService} from "../../../../service/jquery/ftp-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {ActivatedRoute} from "@angular/router";
import {EnvRouter} from "../../../../service/router.service";

@Component({
  templateUrl: './statistic-request-ftp.component.html',
  styleUrls: ['./statistic-request-ftp.component.scss']
})
export class StatisticRequestFtpComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _ftpRequestService = inject(FtpRequestService);
  private _router: EnvRouter = inject(EnvRouter);

  readonly seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: 'OK', color: '#33cc33'},
    {data: {x: field('date'), y: field('countError')}, name: 'KO', color: '#ff0000'},
  ];
  groupedBy: string;
  params: QueryParams;
  $timeAndTypeResponse: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErr: number} } = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErr: 0} };
  $evolUserResponse: { line: any[], loading: boolean } = { line: [], loading: true };
  $exceptionsResponse: { data: any[], loading: boolean } = {data: [], loading: true};
  $dependenciesResponse: { table: any[], loading: boolean } = {table: [], loading: true};

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      this.getRepartitionTimeAndTypeResponseByPeriod(queryParams, this.groupedBy);
      this.getUsersByPeriod(queryParams, this.groupedBy);
      this.getExceptions(queryParams, this.groupedBy);
      this.getDependencies(queryParams);
    }
  }

  getRepartitionTimeAndTypeResponseByPeriod(queryParams: QueryParams, groupedBy: string) {
    this.$timeAndTypeResponse.data = [];
    this.$timeAndTypeResponse.loading = true;
    return this._ftpRequestService.getRepartitionTimeAndTypeResponseByPeriod({
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      env: queryParams.env,
      host: queryParams.hosts,
      command: queryParams.commands
    }).pipe(
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
    return this._ftpRequestService.getUsersByPeriod({
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
    return this._ftpRequestService.getftpSessionExceptionsByHost({
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
    return this._ftpRequestService.getDependentsNew({
      start: queryParams.period.start,
      end: queryParams.period.end,
      env: queryParams.env,
      host: queryParams.hosts,
      command: queryParams.commands
    }).pipe(
        map(r => {
          return r;
        }), finalize(() => this.$dependenciesResponse.loading = false)
    ).subscribe({
      next: res => {
        this.$dependenciesResponse.table = res.map(item => ({
          ...item,
          count: item.countSucces + item.countErrServer
        }));
      }
    });
  }
    calculateStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErr: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countError'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErr: acc.statCountErr + o['countError']};
    }, {statCount: 0, statCountOk: 0, statCountErr: 0});
  }
  onSessionExceptionRowSelected(row:any) {
    const result = recreateDate(this.groupedBy, row, this.params.period.start);
    if(result) {
      this._router.navigate(['/request/ftp'], {
        queryParams: {
          'env': this.params.env,
          'start': result.start.toISOString(),
          'end': result.end.toISOString(),
          'q': row.errorType,
          'host': this.params.hosts
        }
      });
    }
  }
}