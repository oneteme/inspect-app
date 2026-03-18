import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, getStringOrCall, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {EnvRouter} from "../../../../service/router.service";
import {createRepartitionStatusConfig, createRepartitionPerformanceConfig} from "./constant";

@Component({
  templateUrl: './statistic-request-http.component.html',
  styleUrls: ['./statistic-request-http.component.scss']
})
export class StatisticRequestHttpComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _httpRequestService = inject(RestRequestService);
  private _decimalPipe = inject(DecimalPipe);
  private _router: EnvRouter = inject(EnvRouter);
  errorStatus = {
    "ServerError": "5xx",
    "ClientError": "4xx",
  }
  REPARTITION_STATUS = createRepartitionStatusConfig((value) => this._decimalPipe.transform(value) || '');
  PERFORMANCE_REPARTITION = createRepartitionPerformanceConfig((value) => this._decimalPipe.transform(value) || '');

  groupedBy: string = ''
  params: QueryParams;
  $statusRepartition: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $statusRepartitionSlice: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $performanceRepartition: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};
  $performanceRepartitionSlice: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};

  $exceptionsResponse: { data: any[], loading: boolean, type: string } = {data: [], loading: true, type: 'exceptionsResponse'};
  $exceptionsResponseCross: { data: any[], loading: boolean, type: string } = {data: [], loading: true, type: 'exceptionsResponseCross'};
  $latencyTypeResponse: { data: any[], loading: boolean, stats: { avg: number, max: number }} = { data: [], loading: false, stats: { avg: 0, max: 0 }};
  $latencyTypeResponseCross: { data: any[], loading: boolean, stats: { avg: number, max: number }} = { data: [], loading: false, stats: { avg: 0, max: 0 }};

  getRequestColumns(type: 'timeAndTypeResponse' | 'exceptionsResponse', group?: string, cross?: string) {
    const columns = {
      date: ()=> (type === 'timeAndTypeResponse'
          ? { column: `start.${this.groupedBy}:date,start.year:year`, order: 'year.asc,date.asc' }
          : { column: `count.sum.over(partition(start.${this.groupedBy}:date,start.year)):countok,start.${this.groupedBy}:date,start.year:year`, order: 'date.asc' }),
      method: { column: 'method.coalesce("<empty>"):method' },
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

  chartChange(event){
    if(event.type == "slice" ){
      //this.getRepartitionTimeAndTypeResponseByPeriod(this.$statusRepartitionSlice, event.columns, null, this.params, this.groupedBy);
    }else {
     /// this.getRepartitionTimeAndTypeResponseByPeriod(this.$statusRepartition, event.columns, event.config.selectedGroup, this.params, this.groupedBy);
    }
  }


  performanceRepartitionChange(event){
    if(event.type == "slice" ){
      this.getRepartitionTimeAndTypeResponseByPeriod(this.$performanceRepartitionSlice, event.columns, null, this.params, this.groupedBy);
    }else {
      this.getRepartitionTimeAndTypeResponseByPeriod(this.$performanceRepartition, this.getColumns(event.config), event.config.selectedGroup, this.params, this.groupedBy);
    }
  }


  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
      //this.getRepartitionTimeAndTypeResponseByPeriod(this.$timeAndTypeResponseCross,queryParams.optional?.group, queryParams.optional?.cross, this.params, this.groupedBy);
      this.getExceptions(this.$exceptionsResponse, queryParams.optional?.group, null, queryParams,  this.groupedBy);
      this.getExceptions(this.$exceptionsResponseCross, queryParams.optional?.group, queryParams.optional?.cross, queryParams,  this.groupedBy);
      this.getLatencyByHost(this.$latencyTypeResponse, queryParams.optional?.group,null, queryParams, this.groupedBy);
      this.getLatencyByHost(this.$latencyTypeResponseCross, queryParams.optional?.group, queryParams.optional?.cross, queryParams, this.groupedBy);
    }
  }
    getColumns(o:any) {
      let selectedSerie = o.selectedSerie;
      if(!o.selectedSerie){
        selectedSerie = "elapsedtime";
      }
      return {
        ...this.columnsConfig["groupColumns"][o.selectedGroup],
        base: this.columnsConfig["seriesColumns"][selectedSerie].query(o.selectedIndicator)
      }
    }

    getRepartitionTimeAndTypeResponseByPeriod(arr: { data: any[], loading: boolean, stats: any},
                                            columns: { column: string; order?: string, agregate: string, base: string, sliceFilter: string  },
                                            group: string,
                                            queryParams: QueryParams,
                                            groupedBy: string) {
    arr.data = [];
    arr.loading = true;
    columns.column =  columns.column && this.replaceString(columns.column, '[grouped]', `${groupedBy}`);
    return this._httpRequestService.getCustom(
          columns, {
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

  replaceString(str: string,search: string, replacement: string) {
    return str.includes(search) ? str.replace(search, replacement) : str;
  }

  protected readonly Object = Object;
  private readonly dynamicSeriesMap: Map<string, any> = new Map()








  columnsConfig = {
    groupColumns: {
      date: {
        column: `start.[grouped]:date,start.year:year`,
        order: 'year.asc,date.asc',
        group: (row) => `${row['date']}_${row['year']}`,
        properties: ['date', 'year']
      },
      method: {column: 'method.coalesce("<empty>"):method', group: (row) => (row['method']), properties: ['method']},
      auth: {column: 'auth.coalesce("<no_auth>"):auth', group: (row) => (row['auth']), properties: ['auth']},
      media: {column: 'media.coalesce("<empty>"):media', group: (row) => row['media'], properties: ['media']},
    },
    sliceColumns: {
      user: {
        selector: 'user',
        query: 'user.coalesce("<empty>").distinct:user',
        name: 'user'
      },
      app_name: {
        selector: 'instance.app_name',
        query: 'instance.app_name.coalesce("<empty>").distinct:app_name',
        name: 'app'
      }
    },
    seriesColumns: {
      elapsedtime:
          {
            selector: 'count',
            query: (selectedIndicator: string) => `elapsedtime.${selectedIndicator}:count`,
            name: 'count',
            color: '#2f8dd0'
          },
      performance_tranche:
          {
            selector: 'performance_tranche',
            query: (selectedIndicator: string) => `performance_tranche:performance_tranche,elapsedtime.${selectedIndicator}:count`,
            name: 'performance_tranche',
            color: 'gray'
          },
      'status_ok_client_server_error':
          {
            selector: 'status_ok_client_server_error',
            query: (selectedIndicator: string) => `status_ok_client_server_error:status_ok_client_server_error,status.${selectedIndicator}:count`,
            name: 'status_ok_client_server_error',
            color: 'gray'
          }

    }
  }
}