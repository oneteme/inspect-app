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

  REPARTITION_STATUS = createRepartitionStatusConfig((value) => this._decimalPipe.transform(value) || '');
  PERFORMANCE_REPARTITION = createRepartitionPerformanceConfig((value) => this._decimalPipe.transform(value) || '');

  groupedBy: string = ''
  params: QueryParams;
  $statusRepartition: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $statusRepartitionSlice: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $performanceRepartition: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};
  $performanceRepartitionSlice: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};




  statusRepartitionChange(event){
    switch(event.type) {
      case 'slice':
        this.getCostum(this.$statusRepartitionSlice, this.getSliceColumns(event), null, this.params, this.groupedBy);
        break;
      default:
        if(!event.config.selectedSerie){
            event.config.selectedSerie = "status";
        }
        this.getCostum(this.$statusRepartition, this.getColumns(event), event.config.selectedGroup, this.params, this.groupedBy);
        break;
    }
  }


  performanceRepartitionChange(event){
    switch(event.type) {
      case 'slice':
        this.getCostum(this.$performanceRepartitionSlice, this.getSliceColumns(event), null, this.params, this.groupedBy);
        break;
      default:
        if(!event.config.selectedSerie){
           event.config.selectedSerie = "elapsedtime";
        }
        this.getCostum(this.$performanceRepartition, this.getColumns(event), event.config.selectedGroup, this.params, this.groupedBy);
        break;
    }
  }


  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
    }
  }
    getColumns(o:any) {
      return {
        ...this.columnsConfig["groupColumns"][o.config.selectedGroup],
        base: this.columnsConfig["seriesColumns"][o.config.selectedSerie].query(o.config.selectedIndicator),
         sliceFilter:  Object.keys(o.sliceFilter).length > 0 ? {[this.columnsConfig['sliceColumns'][o.config.selectedSlice].selector] : o.sliceFilter[o.config.selectedSlice]} : null
      }
    }
    getSliceColumns(o:any) {
      return {
         base : this.columnsConfig['sliceColumns'][o.config.selectedSlice].query
      }
    }


    getCostum(arr: { data: any[], loading: boolean, stats: any},
              columns: { column?: string; order?: string, agregate?: string, base: string, sliceFilter?: string  },
              group: string,
              queryParams: QueryParams,
              groupedBy: string) {
      console.log(columns)
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
      }
    });
  }

  replaceString(str: string,search: string, replacement: string) {
    return str.includes(search) ? str.replace(search, replacement) : str;
  }

  protected readonly Object = Object;
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
      status_ok_client_server_error:
          {
            selector: 'status_ok_client_server_error',
            query: (selectedIndicator: string) => `status_ok_client_server_error:status_ok_client_server_error,status.${selectedIndicator}:count`,
            name: 'status_ok_client_server_error',
            color: 'gray'
          },
      status:
          {
            selector: 'status',
            query: (selectedIndicator: string) => `status,status.${selectedIndicator}:count`,
            name: 'status',
            color: '#2f8dd0'
          },
      status_tranche:
          {
            selector: 'status_tranche',
            query: (selectedIndicator: string) => `status_tranche:status_tranche,status.${selectedIndicator}:count`,
            name: 'status_tranche',
            color: 'gray'
          }
    }
  }
}