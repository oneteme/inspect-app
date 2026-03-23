import {Component, inject, Input} from "@angular/core";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {DatabaseRequestService} from "../../../../service/jquery/database-request.service";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, getStringOrCall, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {HttpParams} from "../../server/_component/rest-tab/rest-tab.component";
import {EnvRouter} from "../../../../service/router.service";
import {
  FTP_REPARTITION_PERFORMANCE_CONFIG, FTP_REPARTITION_PERFORMANCE_JQUERY_CONFIG,
  JDBC_REPARTITION_PERFORMANCE_CONFIG, JDBC_REPARTITION_PERFORMANCE_JQUERY_CONFIG
} from "../http/constant";

@Component({
  templateUrl: './statistic-request-jdbc.component.html',
  styleUrls: ['./statistic-request-jdbc.component.scss']
})
export class StatisticRequestJdbcComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private _decimalPipe = inject(DecimalPipe);

  REPARTITION_PERFORMANCE_CONFIG = JDBC_REPARTITION_PERFORMANCE_CONFIG((value) => this._decimalPipe.transform(value) || '');

  $performanceRepartition: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};
  $performanceRepartitionSlice: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};

  groupedBy: string;
  params: QueryParams;

  performanceRepartitionChange(event){
    switch(event.type) {
      case 'slice':
        this.getCustom(this.$performanceRepartitionSlice, this.getSliceColumns(event, JDBC_REPARTITION_PERFORMANCE_JQUERY_CONFIG), null);
        break;
      default:
        if(!event.config.selectedSerie){
          event.config.selectedSerie = "elapsedtime";
        }
        this.getCustom(this.$performanceRepartition, this.getColumns(event, JDBC_REPARTITION_PERFORMANCE_JQUERY_CONFIG), event.config.selectedGroup);
        break;
    }
  }

  getCustom(arr: { data: any[], loading: boolean, stats: any},
            columns: { column?: string; order?: string, agregate?: string, base: string, sliceFilter?: string  },
            group: string) {
    arr.data = [];
    arr.loading = true;
    columns.column =  columns.column && this.replaceString(columns.column, '[grouped]', `${this.groupedBy}`);
    return this._databaseRequestService.getCustom(
      columns, {
        start: this.params.period.start,
        end: this.params.period.end,
        env: this.params.env,
        hosts: this.params.hosts,
        method: this.params.commands
      }).pipe(
      map(r => {
        if (group === 'date') {
          formatters[this.groupedBy](r, this._datePipe);
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

  getColumns(o: any, config: any) {
    return {
      ...config["groupColumns"][o.config.selectedGroup],
      base: config["seriesColumns"][o.config.selectedSerie].query(o.config.selectedIndicator),
      sliceFilter:  Object.keys(o.sliceFilter).length > 0 ? {[config['sliceColumns'][o.config.selectedSlice].selector] : o.sliceFilter[o.config.selectedSlice]} : null
    }
  }

  getSliceColumns(o:any, config: any) {
    return {
      base : config['sliceColumns'][o.config.selectedSlice].query
    }
  }

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
    }
  }
}