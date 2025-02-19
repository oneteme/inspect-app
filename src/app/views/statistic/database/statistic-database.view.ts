import { Component, OnInit,  inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {Observable, Subscription, catchError, combineLatest, finalize, map, of, tap} from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { JQueryService } from 'src/app/service/jquery/jquery.service';
import { MatTableDataSource } from '@angular/material/table';
import { Constants } from '../../constants';
import { application, makeDatePeriod } from 'src/environments/environment';
import { formatters, periodManagement } from 'src/app/shared/util';
import { ChartProvider, field } from '@oneteme/jquery-core';
import {DatabaseRequestService} from "../../../service/jquery/database-request.service";
import {ExceptionService} from "../../../service/jquery/exception.service";

@Component({
  templateUrl: './statistic-database.view.html',
  styleUrls: ['./statistic-database.view.scss']
})
export class StatisticDatabaseView implements OnInit {
  private _activatedRoute = inject(ActivatedRoute);
  private _router = inject(Router);
  private _datePipe = inject(DatePipe);
  private _databaseService = inject(DatabaseRequestService);
  private _exceptionService = inject(ExceptionService);
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
  db: any;
  start: Date;
  end: Date;
  displayedColumns: string[] = ['name'];
  dataSource: MatTableDataSource<{ name: string }> = new MatTableDataSource([]);

  requests: { [key: string]: { observable: Observable<Object>, data?: any[], isLoading?: boolean } } = {};
  subscriptions: Subscription[] = [];

  constructor() {
    this.subscriptions.push(combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams
    }).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {

        this.db = v.params.database_name;
        this.env = v.queryParams.env || application.default_env;
        this.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.database.default_period || application.dashboard.default_period || makeDatePeriod(6)).start;
        this.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.database.default_period || application.dashboard.default_period || makeDatePeriod(6, 1)).end;
        this.patchDateValue(this.start, new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate() - 1));
        this.init();
        this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`)

      }, error: (err) => {
        console.log(err)
      }
    }))
  }

  ngOnInit(): void {

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
    let groupedBy = periodManagement(start, end);
    return {
      repartitionRequestByPeriodLine: {
        observable: this._databaseService.getRepartitionRequestByPeriod({start: start, end: end, groupedBy: groupedBy, database: db, env: env}).pipe(tap(r => {
          formatters[groupedBy](r, this._datePipe);
        }))
      },
      repartitionTimeByPeriodBar: { observable: this._databaseService.getRepartitionTimeByPeriod({start: start, end: end, groupedBy: groupedBy, database: db, env: env}).pipe(map(((r: any[]) => {
          formatters[groupedBy](r, this._datePipe);
          return r;
        })))
      },
      repartitionTimePie: { observable: this._databaseService.getRepartitionTime({start: start, end: end, database: db, env: env}) },
      exceptions: {
        observable: this._exceptionService.getDatabaseException({start: start, end: end, database: db, env: env}).pipe(map(res => {
          return res.slice(0, 5).map((r: {count: number, errorType: string}) => {
            const index = r?.errorType.lastIndexOf('.') + 1;
            return { count: r.count, label: r?.errorType?.substring(index) };
          });
        }))
      }
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