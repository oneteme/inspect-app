import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {DatabaseRequestService} from "../../../../service/jquery/database-request.service";
import {SmtpRequestService} from "../../../../service/jquery/smtp-request.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, periodManagement} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {LdapRequestService} from "../../../../service/jquery/ldap-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";

@Component({
  templateUrl: './statistic-request-ldap.component.html',
  styleUrls: ['./statistic-request-ldap.component.scss']
})
export class StatisticRequestLdapComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _ldapRequestService = inject(LdapRequestService);

  readonly seriesProvider: SerieProvider<string, number>[] = [
    {data: {x: field('date'), y: field('countSuccess')}, name: 'OK', color: '#33cc33'},
    {data: {x: field('date'), y: field('countError')}, name: 'KO', color: '#ff0000'},
  ];

  $timeAndTypeResponse: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErr: number} } = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErr: 0} };
  $exceptionsResponse: { data: any[], loading: boolean } = {data: [], loading: true};
  $dependenciesResponse: { table: any[], loading: boolean } = {table: [], loading: true};

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      let groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      this.getRepartitionTimeAndTypeResponseByPeriod(queryParams, groupedBy);
      this.getExceptions(queryParams, groupedBy);
      this.getDependencies(queryParams);
    }
  }

  getRepartitionTimeAndTypeResponseByPeriod(queryParams: QueryParams, groupedBy: string) {
    this.$timeAndTypeResponse.data = [];
    this.$timeAndTypeResponse.loading = true;
    return this._ldapRequestService.getRepartitionTimeAndTypeResponseByPeriod({
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
  getDependencies(queryParams: QueryParams) {
    this.$dependenciesResponse.table = [];
    this.$dependenciesResponse.loading = true;
    return this._ldapRequestService.getDependentsNew({
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

  getExceptions(queryParams: QueryParams, groupedBy: string) {
    this.$exceptionsResponse.data = [];
    this.$exceptionsResponse.loading = true;
    return this._ldapRequestService.getLdapExceptions({
      env: queryParams.env,
      start: queryParams.period.start,
      end: queryParams.period.end,
      groupedBy: groupedBy,
      app_name: null,
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
            this.$exceptionsResponse.data = res
          }
        })
  }

  calculateStats(res: any[]) {
    return res.reduce((acc: {statCount: number, statCountOk: number, statCountErr: number}, o) => {
      return {statCount: acc.statCount + o['countSuccess'] + o['countError'], statCountOk: acc.statCountOk + o['countSuccess'], statCountErr: acc.statCountErr + o['countError']};
    }, {statCount: 0, statCountOk: 0, statCountErr: 0});
  }
}