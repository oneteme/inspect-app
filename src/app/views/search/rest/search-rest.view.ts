import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Location} from '@angular/common';
import {ActivatedRoute, Params} from '@angular/router';
import {BehaviorSubject, finalize, Subject, takeUntil} from 'rxjs';
import {extractPeriod} from 'src/app/shared/util';
import {TraceService} from 'src/app/service/trace.service';
import {app, makeDatePeriod} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset} from '../../constants';
import {FilterService} from 'src/app/service/filter.service';
import {EnvRouter} from '../../../service/router.service';
import {InstanceService} from '../../../service/jquery/instance.service';
import {PageTitleService} from '../../../service/page-title.service';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import {CustomDateAdapter} from '../../../shared/material/custom-date-adapter';
import {MY_DATE_FORMATS} from '../../../shared/shared.module';
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from '@angular/material/datepicker';
import {CustomDateRangeSelectionStrategy} from '../../../shared/material/custom-date-range-selection-strategy';
import {IPeriod, IStep, IStepFrom, QueryParams} from '../../../model/conf.model';
import {RestSessionDto} from '../../../model/request.model';
import {TableProvider} from '@oneteme/jquery-table';
import {REST_SESSION_TABLE_CONFIG} from "../../../shared/_component/table/table.config";
import {getDefaultRelativePeriod, getQuickRangeStep, getQuickRangeDates, isDefaultRelativePeriod, PERIOD_QUICK_RANGES, PeriodQuickRange, toDisplayedPeriodEnd} from '../../../shared/period-filter';
import {HttpErrorResponse} from "@angular/common/http";

@Component({
  templateUrl: './search-rest.view.html',
  styleUrls: ['./search-rest.view.scss'],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
  ]
})
export class SearchRestView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _instanceService = inject(InstanceService);
  private readonly _pageTitleService = inject(PageTitleService);
  private readonly _traceService = inject(TraceService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);
  private readonly $destroy = new Subject<void>();

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  nameDataList: any[];
  isLoading = false;
  serverNameIsLoading = true;

  serverFilterForm = new FormGroup({
    appname: new FormControl([]),
    rangestatus: new FormControl([]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  filters: { icon: string; label: string; color: string; value: any }[] = [
    { icon: 'warning', label: '5xx', color: '#F44336', value: '5xx' },
    { icon: 'error', label: '4xx', color: '#F9AD4E', value: '4xx' },
    { icon: 'done', label: '2xx', color: '#4CAF50', value: '2xx' },
    { icon: 'pending', label: 'En cours', color: '', value: 'pending' }
  ];
  readonly periodQuickRanges = PERIOD_QUICK_RANGES;
  queryParams: Partial<QueryParams> = {};

  tableConfig: TableProvider<RestSessionDto> = {
    ...REST_SESSION_TABLE_CONFIG,
    onRowSelected: (row, event) => this.selectedRequest(event, row)
  };
  sessions: RestSessionDto[];

  constructor() {
    this._activatedRoute.queryParams.subscribe({
      next: (params: Params) => {
        if(params.start && params.end) this.queryParams = new QueryParams(new IPeriod(new Date(params.start), new Date(params.end)), params.env ||  app.defaultEnv, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server],null,!params.rangestatus ? []: Array.isArray(params.rangestatus) ? params.rangestatus : [params.rangestatus] )
        if(!params.start && !params.end)  {
          let period;
          if(params.step && params.from){
            period = new IStepFrom(Number(params.step), Number(params.from));
          } else if(params.step){
            period = new IStep(Number(params.step));
          }
          this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), params.env || app.defaultEnv, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server], null, !params.rangestatus ? []: Array.isArray(params.rangestatus) ? params.rangestatus : [params.rangestatus]);
        }
        if(params.q){
          this.queryParams.optional = {q: params.q};
          this.tableConfig = {
            ...this.tableConfig,
            search: { ...this.tableConfig?.search, initialQuery: params.q, searchColumns: ['exception'] }
          }
        }
        this.patchStatusValue(this.queryParams.rangestatus)
        this.patchServerValue(this.queryParams.appname);
        this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

        this._instanceService.getApplications('SERVER', this.queryParams.env)
            .pipe(finalize(()=> this.serverNameIsLoading = false))
          .subscribe({
            next: res => {
              this.nameDataList = res.map(r => r.appName);
              this.patchServerValue(this.queryParams.appname);
              }, error: (e) => {
                console.log(e)
              }
          });
        this.getIncomingRequest();
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.queryParams.buildPath()}`);
      }
    });
  }

  ngOnInit(): void {
    this._pageTitleService.set({
      icon: Constants.MAPPING_TYPE['rest']?.icon || 'http',
      title: (Constants.MAPPING_TYPE['rest']?.title || 'Services Exposés') + ' • Suivi',
      subtitle: Constants.MAPPING_TYPE['rest']?.subtitle
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    this._pageTitleService.clear();
  }

  onChangeStart(event: any): void {
    this.serverFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({ onlySelf: true });
    const start = this.serverFilterForm.controls.dateRangePicker.controls.start.value;
    const end = this.serverFilterForm.controls.dateRangePicker.controls.end.value || null;
    this.queryParams.period = new IPeriod(start, end);
  }

  onChangeEnd(event: any): void {
    this.serverFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({ onlySelf: true });
    const start = this.serverFilterForm.controls.dateRangePicker.controls.start.value || null;
    const end = this.serverFilterForm.controls.dateRangePicker.controls.end.value;
    this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
  }

  onChangeServer($event: any): void {
    this.queryParams.appname = this.serverFilterForm.controls.appname.value;
  }

  onChangeStatus($event: any): void {
    this.queryParams.rangestatus = this.serverFilterForm.controls.rangestatus.value?.map((f: { value: any }) => f.value);
  }

  search(): void {
    if (this.serverFilterForm.valid) {
      if (!shallowEqual(this._activatedRoute.snapshot.queryParams, this.queryParams.buildParams())) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParams: this.queryParams.buildParams()
        });
      } else {
        if (this.queryParams.period instanceof IStep) {
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));
        }
        this.getIncomingRequest();
      }
    }
  }

  getIncomingRequest(): void {
    this.$destroy.next();
    const params: any = {
      'env': this.queryParams.env,
      'instance.app_name': this.queryParams.appname,
      'status.origin': this.queryParams.rangestatus,
      'start.ge': this.queryParams.period.start.toISOString(),
      'end.lt': this.queryParams.period.end.toISOString()
    };

    this.isLoading = true;
    this.sessions = [];
    this._traceService.getRestSessions(params)
      .pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false))
      .subscribe({
        next: d => {
          this.sessions = d;
        },
        error: (error: HttpErrorResponse) => {
          if(error.status === 413) {
            this.tableConfig.labels.empty = error.error.message;
          }
        }
      });
  }

  patchDateValue(start: Date, end: Date): void {
    this.serverFilterForm.patchValue({ dateRangePicker: { start, end } }, { emitEvent: false });
  }

  patchServerValue(servers: any[]): void {
    this.serverFilterForm.patchValue({ appname: servers }, { emitEvent: false });
    this.queryParams.appname = servers;
  }

  patchStatusValue(rangestatus: any[]): void {
    this.serverFilterForm.patchValue({
      rangestatus: this.filters.filter((f: any) => rangestatus.toString().includes(f.value))
    }, { emitEvent: false });
    this.queryParams.rangestatus = rangestatus;
  }

  selectedRequest(event: MouseEvent, row: RestSessionDto): void {
    if (row) {
      this._router.navigateOnClick(event, ['/session/rest', row.id], {
        queryParams: { env: this.queryParams.env }
      });
    }
  }

  isDefaultPeriod(): boolean {
    return isDefaultRelativePeriod(this.queryParams?.period);
  }

  resetPeriod(): void {
    const defaultPeriod = getDefaultRelativePeriod();
    this.queryParams.period = defaultPeriod;
    this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
  }

  applyQuickRange(range: PeriodQuickRange): void {
    let period;
    if (range === 'yesterday') {
      const dates = getQuickRangeDates(range);
      period = new IPeriod(dates.start, dates.end);
    } else {
      period = getQuickRangeStep(range);
    }
    this.queryParams.period = period;
    this.patchDateValue(period.start, toDisplayedPeriodEnd(period.end));
  }
}

export function shallowEqual(
    a: {[key: string | symbol]: any},
    b: {[key: string | symbol]: any},
): boolean {
  // While `undefined` should never be possible, it would sometimes be the case in IE 11
  // and pre-chromium Edge. The check below accounts for this edge case.
  const k1 = a ? getDataKeys(a) : undefined;
  const k2 = b ? getDataKeys(b) : undefined;
  if (!k1 || !k2 || k1.length != k2.length) {
    return false;
  }
  let key: string | symbol;
  for (let i = 0; i < k1.length; i++) {
    key = k1[i];
    if (!equalArraysOrString(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Gets the keys of an object, including `symbol` keys.
 */
export function getDataKeys(obj: Object): Array<string | symbol> {
  return [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
}

/**
 * Test equality for arrays of strings or a string.
 */
export function equalArraysOrString(a: string | string[], b: string | string[]) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((val, index) => bSorted[index] === val);
  } else {
    return a === b;
  }
}
