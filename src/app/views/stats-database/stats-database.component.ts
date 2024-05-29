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
  db: any;
  dbNameListIsLoading: boolean = false
  dataIsLoading: boolean = false
  countOkKo: any[];
  countMinMaxAvg: any[];
  countRepartitionBySpeed: any[];
  exceptions: any[];
  dbInfo: any[] = [];
  userInfo: any[];
  start: Date;
  end: Date;
  doresetServerFormValue: boolean = false;
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

        this.db = v.params.name;
        this.env = v.queryParams.env || application.default_env;
        this.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6)).start;
        this.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
        this.patchDateValue(this.start, new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate() - 1));
        this.init();
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`)

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
    this._statsService.getSessionApi({ 'column.distinct': 'dbquery.db&dbquery.parent=apisession.id&order=dbquery.db.asc', 'apisession.environement': this.env }).pipe(catchError(error => of(error)))
      .subscribe({
        next: (res: { db: string }[]) => {
          this.dbNameDataList = res.map((s: any) => s.db)
          this.serverFilterForm.controls.dbnameControl.enable();
          this.dbNameListIsLoading = false;
          this.serverFilterForm.controls.dbnameControl.patchValue(this.db)
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
      let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
      let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
      if (start.toISOString() != this.start.toISOString() || excludedEnd.toISOString() != this.end.toISOString()) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { start: start.toISOString(), end: excludedEnd.toISOString() }
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
    let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
    this.requests = this.DB_REQUEST(this.db, this.env, start, end)
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


  DB_REQUEST = (db: string, env: string, start: Date, end: Date) => {
    let now = new Date();
    var groupedBy = periodManagement(start, end);
    return {
      dbInfo: { observable: this._statsService.getSessionApi({ 'column.distinct': 'dbquery.host,dbquery.db,dbquery.driver,dbquery.db_name,dbquery.db_version', 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString(), 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString() }) },
      countOkKoSlowest: { observable: this._statsService.getSessionApi({ 'column': 'dbquery.count_db_error:countErrorServer,dbquery.count:count,dbquery.count_slowest:countSlowest,dbquery.start.date:date', 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'apisession.start.lt': now.toISOString(), 'dbquery.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(), 'dbquery.start.lt': now.toISOString()}) },
      countMinMaxAvg: { observable: this._statsService.getSessionApi({ 'column': `dbquery.count_db_succes:countDbSucces,dbquery.elapsedtime.max:max,dbquery.elapsedtime.avg:avg,dbquery.start.${groupedBy}:date,dbquery.start.year:year`, 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString(), 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString(), 'order': `dbquery.start.year.asc,dbquery.start.${groupedBy}.asc` }).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      countRepartitionBySpeedBar: {
        observable: this._statsService.getSessionApi({ 'column': `dbquery.count_slowest:elapsedTimeSlowest,dbquery.count_slow:elapsedTimeSlow,dbquery.count_medium:elapsedTimeMedium,dbquery.count_fast:elapsedTimeFast,dbquery.count_fastest:elapsedTimeFastest,dbquery.start.${groupedBy}:date,dbquery.start.year:year`, 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString(), 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString(), 'order': `dbquery.start.year.asc,dbquery.start.${groupedBy}.asc` }).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      countRepartitionBySpeedPie: { observable: this._statsService.getSessionApi({ 'column': 'dbquery.count_slowest:elapsedTimeSlowest,dbquery.count_slow:elapsedTimeSlow,dbquery.count_medium:elapsedTimeMedium,dbquery.count_fast:elapsedTimeFast,dbquery.count_fastest:elapsedTimeFastest', 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString(), 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString()}) },
      exceptions: { observable: this._statsService.getSessionApi({ 'column': 'count,dbaction.err_type,dbaction.err_msg', 'dbaction.err.group': '', 'dbaction.parent': 'dbquery.id', 'dbquery.parent': 'apisession.id', 'order': 'count.desc', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString(), 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString() })},
      usersInfo: { observable: this._statsService.getSessionApi({ 'column': 'count:countRows,dbquery.user', 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString(), 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString() }) }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: start,
        end: end
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