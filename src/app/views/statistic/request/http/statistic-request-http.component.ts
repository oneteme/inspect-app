import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, periodManagement} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";

import {EnvRouter} from "../../../../service/router.service";
import {
    createRepartitionStatusConfig,
    createRepartitionPerformanceConfig,
    createRepartitionSizeConfig, createRepartitionLatencyConfig
} from "../constant";

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
  SIZE_REPARTITION = createRepartitionSizeConfig((value) => this._decimalPipe.transform(value) || '');
  LATENCY_REPARTITION = createRepartitionLatencyConfig((value) => this._decimalPipe.transform(value) || '');

  groupedBy: string = ''
  params: QueryParams;
  $statusRepartition: { data: any[], loading: boolean} = { data: [], loading: false};
  $statusRepartitionSlice: { data: any[], loading: boolean} = { data: [], loading: false};
  $performanceRepartition: { data: any[], loading: boolean,  } = {data: [], loading: true};
  $performanceRepartitionSlice: { data: any[], loading: boolean } = {data: [], loading: true};
  $sizeRepartition : {data: any[], loading: boolean} = {data: [], loading: true};
  $sizeRepartitionSlice : {data: any[], loading: boolean} = {data: [], loading: true};
  $latencyRepartition : {data: any[], loading: boolean} = {data: [], loading: true};
  $latencyRepartitionSlice : {data: any[], loading: boolean} = {data: [], loading: true};


  statusRepartitionChange(event){
    switch(event.type) {
      case 'slice':
        this.getCustom(this.$statusRepartitionSlice, this.getSliceColumns(event), null, this.params, this.groupedBy,"getCustom");
        break;
      default:
        if(!event.config.selectedSerie){
            event.config.selectedSerie = "status";
        }
        this.getCustom(this.$statusRepartition, this.getColumns(event), event.config.selectedGroup, this.params, this.groupedBy,"getCustom");
        break;
    }
  }


  performanceRepartitionChange(event){
    let e = { ...event, config: { ...event.config } };
    switch(e.type) {
      case 'slice':
    this.getCustom(this.$performanceRepartitionSlice, this.getSliceColumns(e), null, this.params, this.groupedBy,"getCustom");
        break;
      default:
        if(!e.config.selectedSerie){
            e.config.selectedSerie = "elapsedtime";
        }
        this.getCustom(this.$performanceRepartition, this.getColumns(e), e.config.selectedGroup, this.params, this.groupedBy,"getCustom");
        break;
    }
  }

    sizeRepartitionChange(event){
        switch(event.type) {
            case 'slice':
                this.getCustom(this.$sizeRepartitionSlice, this.getSliceColumns(event), null, this.params, this.groupedBy,"getCustom");
                break;
            default:
               if(!event.config.selectedSerie){
                    event.config.selectedSerie = "elapsedtime";
                }
                this.getCustom(this.$sizeRepartition, this.getColumns(event), event.config.selectedGroup, this.params, this.groupedBy,"getCustom");
                break;
        }
    }

    latencyRepartitionChange(event){
        switch(event.type) {
            case 'slice':
                this.getCustom(this.$latencyRepartitionSlice, this.getSliceColumns(event), null, this.params, this.groupedBy,"getLatency");
                break;
            default:
                if(!event.config.selectedSerie){
                    event.config.selectedSerie = "elapsedtime";
                }
                this.getCustom(this.$latencyRepartition, this.getColumns(event), event.config.selectedGroup, this.params, this.groupedBy,"getLatency");
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


    getCustom(arr: { data: any[], loading: boolean},
              columns: { column?: string; order?: string, agregate?: string, base: string, sliceFilter?: string  },
              group: string,
              queryParams: QueryParams,
              groupedBy: string,
              fn:string) {
    arr.data = [];
    arr.loading = true;
    columns.column =  columns.column && this.replaceString(columns.column, '[grouped]', `${groupedBy}`);
    this._httpRequestService[fn](
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
            query: (selectedIndicator: string) => `elapsedtime.${selectedIndicator}:default`,
          },
      performance_tranche:
          {
            query: (selectedIndicator: string) => `performance_tranche:performance_tranche,elapsedtime.${selectedIndicator}:count`,
          },
      status_ok_client_server_error:
          {
            query: (selectedIndicator: string) => `status_ok_client_server_error:status_ok_client_server_error,status.${selectedIndicator}:count`,
          },
      status:
          {
            query: (selectedIndicator: string) => `status,status.${selectedIndicator}:count`,
          },
      status_tranche:
          {
            query: (selectedIndicator: string) => `status_tranche:status_tranche,status.${selectedIndicator}:count`,
          },
        size:
          {
            query: (selectedIndicator: string) => `size_in_notnull.${selectedIndicator}:sizeIn,size_out_notnull.${selectedIndicator}:sizeOut`,
          },
        latency: {
            query: (selectedIndicator: string) => `${selectedIndicator}(elapsedtime.minus(rest_session.elapsedtime)):latency`,
        }
    }
  }
}