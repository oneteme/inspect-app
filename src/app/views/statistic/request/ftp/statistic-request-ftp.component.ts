import {Component, inject, Input} from "@angular/core";
import {DatePipe, DecimalPipe} from "@angular/common";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {QueryParams} from "../../../../model/conf.model";
import {formatters, getStringOrCall, groupByField, periodManagement, recreateDate} from "../../../../shared/util";
import {finalize, map} from "rxjs";
import {FtpRequestService} from "../../../../service/jquery/ftp-request.service";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {ActivatedRoute} from "@angular/router";
import {EnvRouter} from "../../../../service/router.service";
import {
  FTP_REPARTITION_PERFORMANCE_CONFIG, FTP_REPARTITION_PERFORMANCE_JQUERY_CONFIG,
  FTP_REPARTITION_STATUS_CONFIG, FTP_REPARTITION_STATUS_JQUERY_CONFIG,
  REST_REPARTITION_STATUS
} from "../constant";

@Component({
  templateUrl: './statistic-request-ftp.component.html',
  styleUrls: ['./statistic-request-ftp.component.scss']
})
export class StatisticRequestFtpComponent {
  private readonly _datePipe = inject(DatePipe);
  private readonly _ftpRequestService = inject(FtpRequestService);
  private _decimalPipe = inject(DecimalPipe);

  REPARTITION_STATUS_CONFIG = FTP_REPARTITION_STATUS_CONFIG((value) => this._decimalPipe.transform(value) || '');
  REPARTITION_PERFORMANCE_CONFIG = FTP_REPARTITION_PERFORMANCE_CONFIG((value) => this._decimalPipe.transform(value) || '');

  groupedBy: string;
  params: QueryParams;

  $statusRepartition: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $statusRepartitionSlice: { data: any[], loading: boolean, stats: {statCount: number, statCountOk: number, statCountErrClient: number, statCountErrorServer: number, statCountUnavailableServer: number}} = { data: [], loading: false, stats: {statCount: 0, statCountOk: 0, statCountErrClient: 0, statCountErrorServer: 0, statCountUnavailableServer:0}};
  $performanceRepartition: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};
  $performanceRepartitionSlice: { data: any[], loading: boolean, stats: any } = {data: [], loading: true, stats :{}};

  statusRepartitionChange(event) {
    switch(event.type) {
      case 'slice':
        this.getCustom(this.$performanceRepartitionSlice, this.getSliceColumns(event, FTP_REPARTITION_STATUS_JQUERY_CONFIG), null);
        break;
      default:
        if(!event.config.selectedSerie){
          event.config.selectedSerie = "status";
        }
        this.getCustom(this.$statusRepartition, this.getColumns(event, FTP_REPARTITION_STATUS_JQUERY_CONFIG), event.config.selectedGroup);
    }
  }

  performanceRepartitionChange(event){
    switch(event.type) {
      case 'slice':
        this.getCustom(this.$performanceRepartitionSlice, this.getSliceColumns(event, FTP_REPARTITION_PERFORMANCE_JQUERY_CONFIG), null);
        break;
      default:
        if(!event.config.selectedSerie){
          event.config.selectedSerie = "elapsedtime";
        }
        this.getCustom(this.$performanceRepartition, this.getColumns(event, FTP_REPARTITION_PERFORMANCE_JQUERY_CONFIG), event.config.selectedGroup);
        break;
    }
  }

  getCustom(arr: { data: any[], loading: boolean, stats: any},
            columns: { column?: string; order?: string, agregate?: string, base: string, sliceFilter?: string  },
            group: string) {
    arr.data = [];
    arr.loading = true;
    columns.column =  columns.column && this.replaceString(columns.column, '[grouped]', `${this.groupedBy}`);
    return this._ftpRequestService.getCustom(
      columns, {
        start: this.params.period.start,
        end: this.params.period.end,
        env: this.params.env,
        hosts: this.params.hosts
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

  getColumns(o: any, config: any) {
    return {
      ...config["groupColumns"][o.config.selectedGroup],
      base: config["seriesColumns"][o.config.selectedSerie].query(o.config.selectedIndicator)
    }
  }

  getSliceColumns(o:any, config: any) {
    return {
      base : config['sliceColumns'][o.config.selectedSlice].query
    }
  }

  replaceString(str: string,search: string, replacement: string) {
    return str.includes(search) ? str.replace(search, replacement) : str;
  }

  @Input() set queryParams(queryParams: QueryParams) {
    if(queryParams) {
      this.params = queryParams;
      this.groupedBy = periodManagement(queryParams.period.start, queryParams.period.end);
    }
  }
}