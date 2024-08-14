import { Component, OnInit,  inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {  Observable, Subscription, catchError, combineLatest, finalize, map, of } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JQueryService } from 'src/app/service/jquery.service';
import { MatTableDataSource } from '@angular/material/table';
import { Constants } from '../../constants';
import { application, makePeriod } from 'src/environments/environment';
import { formatters, periodManagement } from 'src/app/shared/util';
import { ChartProvider, field } from '@oneteme/jquery-core';

@Component({
  templateUrl: './statistic-database.view.html',
  styleUrls: ['./statistic-database.view.scss']
})
export class StatisticDatabaseView implements OnInit {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(Router);
  private _datePipe = inject(DatePipe);
  private _statsService = inject(JQueryService);
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
    this._statsService.getRestSession({ 'column.distinct': 'dbquery.db&dbquery.parent=apisession.id&order=dbquery.db.asc', 'apisession.environement': this.env }).pipe(catchError(error => of(error)))
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
    this.requests = this.DB_REQUEST(this.db, this.env, this.start, this.end)
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
      dbInfo: { observable: this._statsService.getDatabaseRequest({ 'column.distinct': 'host,db,driver,db_name,db_version', 'database_request.parent': 'rest_session.id', 'rest_session.instance_env': 'instance.id', "instance.environement": env, "db": db, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString() }) },
      countOkKoSlowest: { observable: this._statsService.getDatabaseRequest({ 'column': 'count_db_error:countErrorServer,count:count,count_slowest:countSlowest,start.date:date', 'database_request.parent': 'rest_session.id', 'rest_session.instance_env': 'instance.id', "instance.environement": env, "db": db, 'rest_session.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'rest_session.start.lt': now.toISOString(), 'start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString(), 'start.lt': now.toISOString()}) },
      countMinMaxAvg: { observable: this._statsService.getDatabaseRequest({ 'column': `count_db_succes:countDbSucces,elapsedtime.max:max,elapsedtime.avg:avg,start.${groupedBy}:date,start.year:year`, 'database_request.parent': 'rest_session.id', 'rest_session.instance_env': 'instance.id', "instance.environement": env, "db": db, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': `start.year.asc,start.${groupedBy}.asc` }).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      countRepartitionBySpeedBar: {
        observable: this._statsService.getDatabaseRequest({ 'column': `count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,start.${groupedBy}:date,start.year:year`, 'database_request.parent': 'rest_session.id', 'rest_session.instance_env': 'instance.id', "instance.environement": env, "db": db, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': `start.year.asc,start.${groupedBy}.asc` }).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      countRepartitionBySpeedPie: { observable: this._statsService.getDatabaseRequest({ 'column': 'count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest', 'database_request.parent': 'rest_session.id', 'rest_session.instance_env': 'instance.id', "instance.environement": env, "db": db, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'start.ge': start.toISOString(), 'start.lt': end.toISOString()}) },
      exceptions: { observable: this._statsService.getException({ 'column': 'count,err_type,err_msg', 'err.group': '', 'exception.parent': 'database_request.id', 'database_request.parent': 'rest_session.id', 'rest_session.instance_env': 'instance.id', "instance.environement": env, "database_request.db": db, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'database_request.start.ge': start.toISOString(), 'database_request.start.lt': end.toISOString(), 'order': 'count.desc' })}
      // usersInfo: { observable: this._statsService.getDatabaseRequest({ 'column': 'count:countRows,dbquery.user', 'dbquery.parent': 'apisession.id', "apisession.environement": env, "dbquery.db": db, 'apisession.start.ge': start.toISOString(), 'apisession.start.lt': end.toISOString(), 'dbquery.start.ge': start.toISOString(), 'dbquery.start.lt': end.toISOString() }) }
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