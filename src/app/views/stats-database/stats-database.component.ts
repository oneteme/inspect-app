import { Component, OnInit,  inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {  Observable, Subscription, catchError, combineLatest, finalize, map, of } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StatsService } from 'src/app/shared/services/stats.service';
import { MatTableDataSource } from '@angular/material/table';
import { Constants } from '../constants';
import { application, makePeriod } from 'src/environments/environment';
import { formatters, periodManagement } from 'src/app/shared/util';
import { ChartProvider, field } from '@oneteme/jquery-core';

@Component({
  templateUrl: './stats-database.component.html',
  styleUrls: ['./stats-database.component.scss']
})
export class StatsDatabaseComponent implements OnInit {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(Router);
  private _datePipe = inject(DatePipe);
  private _statsService = inject(StatsService);
  private _location = inject(Location);

  constants = Constants;

  serverFilterForm = new FormGroup({
    dbnameControl: new FormControl(""),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    }),
  });

  env: any;
  dbNameDataList: any[];
  schema: any;
  dbNameListIsLoading: boolean = false
  dataIsLoading: boolean = false
  countOkKo: any[];
  countMinMaxAvg: any[];
  countRepartitionBySpeed: any[];
  exceptions: any[];
  dbInfo: any[] = [];
  userInfo: any[];
  doresetServerFormValue: boolean = false;
  DEFAULT_START: Date;
  DEFAULT_END: Date;
  displayedColumns: string[] = ['name'];
  dataSource: MatTableDataSource<{ name: string }> = new MatTableDataSource([]);

  requests: { [key: string]: { observable: Observable<Object>, data?: any[], isLoading?: boolean } } = {};
  subscriptions: Subscription[] = [];

  constructor() {
    combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams
    }).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {

        this.schema = v.params.name;
        this.env = v.queryParams.env || application.default_env;
        let start = v.queryParams.start || (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6)).start.toISOString();
        let end = v.queryParams.end || (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6)).end.toISOString();

        this.patchDateValue(start, end);
        this.init();
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${start}&end=${end}`)

      }, error: (err) => {
        console.log(err)
      }
    })
  }

  ngOnInit(): void {

  }

  setServerFormValue() {
    this.dbNameListIsLoading = true;
    this.serverFilterForm.controls.dbnameControl.reset();
    this.serverFilterForm.controls.dbnameControl.disable();
    this._statsService.getSessionApi({ 'column.distinct': 'query.schema&query.parent=request.id&order=query.schema.asc', 'request.environement': this.env }).pipe(catchError(error => of(error)))
      .subscribe({
        next: (res: { schema: string }[]) => {
          this.dbNameDataList = res.map((s: any) => s.schema)
          this.serverFilterForm.controls.dbnameControl.enable();
          this.dbNameListIsLoading = false;
          this.serverFilterForm.controls.dbnameControl.patchValue(this.schema)
        },
        error: err => {
          this.dbNameListIsLoading = false;
          this.serverFilterForm.controls.dbnameControl.enable();
          console.log(err)
        }
      });
  }

  search() {
    if (this.serverFilterForm.valid) {
      let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
      let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
      if (start.toISOString() != this._activatedRoute.snapshot?.queryParams['start'] || end.toISOString() != this._activatedRoute.snapshot?.queryParams['end']) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { start: start.toISOString(), end: end.toISOString() }
        })
      } else {
        this.init();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  init() {
    this.dataIsLoading = true;
    let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
    let end = new Date(this.serverFilterForm.getRawValue().dateRangePicker.end);
    end.setDate(end.getDate() + 1);
    this.requests = this.DB_REQUEST(this.schema, this.env, start, end)
    Object.keys(this.requests).forEach(k => {
      this.requests[k].data = [];
      this.requests[k].isLoading = true;
      this.subscriptions.push(this.requests[k].observable.pipe(finalize(() => this.requests[k].isLoading = false))
        .subscribe({
          next: (res: any) => {
            this.requests[k].data = res;
          }
        }))
    })
  }


  DB_REQUEST = (schema: string, env: string, start: Date, end: Date) => {
    let now = new Date();
    var groupedBy = periodManagement(start, end);
    return {
      dbInfo: { observable: this._statsService.getSessionApi({ 'column.distinct': 'query.host,query.schema,query.driver,query.db_name,query.db_version', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString(), 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString() }) },
      countOkKoSlowest: { observable: this._statsService.getSessionApi({ 'column': 'query.count_db_error:countErrorServer,query.count:count,query.count_slowest:countSlowest,query.start.date:date', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'request.start.lt': now.toISOString(), 'query.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(), 'query.start.lt': now.toISOString()}) },
      countMinMaxAvg: { observable: this._statsService.getSessionApi({ 'column': `query.count_db_succes:countDbSucces,query.elapsedtime.max:max,query.elapsedtime.avg:avg,query.start.${groupedBy}:date,query.start.year:year`, 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString(), 'order': `query.start.year.asc,query.start.${groupedBy}.asc` }).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      countRepartitionBySpeedBar: {
        observable: this._statsService.getSessionApi({ 'column': `query.count_slowest:elapsedTimeSlowest,query.count_slow:elapsedTimeSlow,query.count_medium:elapsedTimeMedium,query.count_fast:elapsedTimeFast,query.count_fastest:elapsedTimeFastest,query.start.${groupedBy}:date,query.start.year:year`, 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString(), 'order': `query.start.year.asc,query.start.${groupedBy}.asc` }).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      countRepartitionBySpeedPie: { observable: this._statsService.getSessionApi({ 'column': 'query.count_slowest:elapsedTimeSlowest,query.count_slow:elapsedTimeSlow,query.count_medium:elapsedTimeMedium,query.count_fast:elapsedTimeFast,query.count_fastest:elapsedTimeFastest', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString()}) },
      exceptions: { observable: this._statsService.getSessionApi({ 'column': 'count,dbaction.err_type.coalesce(null),dbaction.err_msg.coalesce(null)', 'dbaction.err_type.not': 'null', 'dbaction.err_msg.not': 'null', 'dbaction.parent': 'query.id', 'query.parent': 'request.id', 'order': 'count.desc', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }).pipe(map((d: any) => d.slice(0, 5))) },
      usersInfo: { observable: this._statsService.getSessionApi({ 'column': 'count:countRows,query.user', 'query.parent': 'request.id', "request.environement": env, "query.schema": schema, 'request.start.ge': start.toISOString(), 'request.start.lt': end.toISOString(), 'query.start.ge': start.toISOString(), 'query.start.lt': end.toISOString() }) }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: new Date(start),
        end: new Date(end)
      }
    }, { emitEvent: false });
  }

  usersInfoChartConfig: ChartProvider<string, number> = {
    title: 'Nombre d\'appels par utilisateur',
    height: 350,
    series: [
      {data: {x: field('user'), y: field('countRows')}, name: 'Nombre de requêtes'}
    ],
    options: {
      legend: {
        position: 'right',
        offsetX: 0,
        offsetY: 50
      },
      tooltip: {
        shared: true,
        intersect: false,
      }
    }
  }

}