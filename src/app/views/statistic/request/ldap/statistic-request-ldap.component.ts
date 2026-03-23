import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {DatabaseRequestService} from "../../../../service/jquery/database-request.service";
import {SmtpRequestService} from "../../../../service/jquery/smtp-request.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, getStringOrCall, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {LdapRequestService} from "../../../../service/jquery/ldap-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {EnvRouter} from "../../../../service/router.service";

@Component({
  templateUrl: './statistic-request-ldap.component.html',
  styleUrls: ['./statistic-request-ldap.component.scss']
})
export class StatisticRequestLdapComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _ldapRequestService = inject(LdapRequestService);
  private _router: EnvRouter = inject(EnvRouter);

  readonly seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: 'OK', color: '#33cc33'},
    {data: {x: field('date'), y: field('countError')}, name: 'KO', color: '#ff0000'},
  ];
  groupedBy: string;
  params: QueryParams;
  $timeAndTypeResponse: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErr: number} } = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErr: 0} };
  $timeAndTypeResponseCross: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErr: number} } = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErr: 0} };
  $exceptionsResponse: { data: any[], loading: boolean } = {data: [], loading: true};
  $exceptionsResponseCross: { data: any[], loading: boolean } = {data: [], loading: true};

  getRequestColumns(type: 'timeAndTypeResponse' | 'exceptionsResponse', group?: string, cross?: string) {
    const columns = {
      date: ()=> (type === 'timeAndTypeResponse'
          ? { column: `start.${this.groupedBy}:date,start.year:year`, order: 'year.asc,date.asc' }
          : { column: `start.${this.groupedBy}:date,start.year:year,count.sum.over(partition(date)):countok,exception.count_exception:count,count.divide(countok).multiply(100).round(2):pct`, order: 'date.asc' }),
      command: { column: 'command.coalesce("<empty>"):command' },
      auth: { column: 'auth.coalesce("<no_auth>"):auth' },
      media: { column: 'media.coalesce("<empty>"):media' },
      user: { column: `user.coalesce("<empty>"):name` },
      app: { column: `instance.app_name.coalesce("<empty>"):name` }
    };
    let g= getStringOrCall(columns[group]);

    const groupCol = getStringOrCall(columns[group]);

    if (cross) {
      const crossCol = getStringOrCall(columns[cross]);
      return {
        column: `${crossCol.column},${groupCol.column}`,
        order: groupCol.order || crossCol.order
      };
    }
    return g;
  }

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      this.getRepartitionTimeAndTypeResponseByPeriod(this.$timeAndTypeResponse, queryParams.optional?.group,null, queryParams, this.groupedBy);
      this.getRepartitionTimeAndTypeResponseByPeriod(this.$timeAndTypeResponseCross, queryParams.optional?.group,queryParams.optional?.cross, queryParams, this.groupedBy);
      this.getExceptions(this.$exceptionsResponse, queryParams.optional?.group, null, queryParams,  this.groupedBy);
      this.getExceptions(this.$exceptionsResponseCross, queryParams.optional?.group, queryParams.optional?.cross, queryParams,  this.groupedBy);
    }
  }

  getRepartitionTimeAndTypeResponseByPeriod(arr: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErr: number} },
                                            group: string,
                                            cross: string,
                                            queryParams: QueryParams,
                                            groupedBy: string) {
    arr.data = [];
    arr.loading = true;
    return this._ldapRequestService.getRepartitionTimeAndTypeResponseByPeriod(
        this.getRequestColumns('timeAndTypeResponse', group, cross), {
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      env: queryParams.env,
      hosts: queryParams.hosts,
      command: queryParams.commands
    }).pipe(
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

  getExceptions(arr: { data: any[], loading: boolean  },
                group: string,
                cross: string,
                queryParams: QueryParams,
                groupedBy: string) {
    arr.data = [];
    arr.loading = true;
    return this._ldapRequestService.getLdapExceptions(
        this.getRequestColumns('exceptionsResponse', group, cross), {
      env: queryParams.env,
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      app_name: null,
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
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErr: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countError'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErr: acc.statCountErr + o['countError']};
    }, {statCount: 0, statCountOk: 0, statCountErr: 0});
  }


  onSessionExceptionRowSelected(row:any) {
    const result = recreateDate(this.groupedBy, row, this.params.period.start);
    if(result) {
      this._router.navigate(['/request/ldap'], {
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