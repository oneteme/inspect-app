import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, finalize, Subject, takeUntil} from 'rxjs';
import {Location} from '@angular/common';
import {extractPeriod,} from '../../../../shared/util';
import {TraceService} from '../../../../service/trace.service';
import {app} from '../../../../../environments/environment';
import {Constants} from '../../../constants';
import {EnvRouter} from "../../../../service/router.service";
import {InstanceService} from "../../../../service/jquery/instance.service";
import {PageTitleService} from "../../../../service/page-title.service";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../../shared/material/custom-date-range-selection-strategy";
import {IPeriod, IStep, IStepFrom, QueryParams} from "../../../../model/conf.model";
import {TableProvider} from "@oneteme/jquery-table";
import {
  getDefaultRelativePeriod,
  getQuickRangeDates,
  getQuickRangeStep,
  isDefaultRelativePeriod,
  PERIOD_QUICK_RANGES,
  PeriodQuickRange,
  toDisplayedPeriodEnd
} from '../../../../shared/period-filter';
import {HttpErrorResponse} from "@angular/common/http";
import {SessionEventDto} from "../../../../model/request.model";
import {SESSION_EVENT_TABLE_CONFIG} from "../../../../shared/_component/table/table.config";
import {shallowEqual} from "../../request/search-request.view";

@Component({
  templateUrl: './search-main-event.view.html',
  styleUrls: ['./search-main-event.view.scss'],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
  ]
})
export class SearchMainEventView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _traceService = inject(TraceService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _pageTitleService = inject(PageTitleService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);
  private readonly $destroy = new Subject<void>();

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  readonly periodQuickRanges = PERIOD_QUICK_RANGES;
  tableConfig: TableProvider<SessionEventDto> = this.buildTableConfig();
  events: SessionEventDto[];

  serverNameIsLoading = true;
  serverFilterForm = new FormGroup({
    appname: new FormControl([""]),
    rangestatus: new FormControl([]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    })
  });
  nameDataList: any[];
  isLoading = false;
  queryParams: Partial<QueryParams> = {};
  type: string = '';

  constructor() {
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, queryParams]) => {
        this.type = params.type_main;
        this.tableConfig = this.buildTableConfig(queryParams.q);
        this._pageTitleService.set({
          icon: Constants.MAPPING_TYPE[this.type]?.icon || 'search',
          iconOutlined: true,
          title: 'Événements',
          subtitle: Constants.MAPPING_TYPE[this.type]?.subtitle
        });
        if (queryParams.start && queryParams.end) this.queryParams = new QueryParams(new IPeriod(new Date(queryParams.start), new Date(queryParams.end)), queryParams.namespace || app.defaultNamespace, !queryParams.server ? [] : Array.isArray(queryParams.server) ? queryParams.server : [queryParams.server], null, !queryParams.rangestatus ? [] : Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus])
        if (!queryParams.start && !queryParams.end) {
          let period;
          if (queryParams.step && queryParams.from) {
            period = new IStepFrom(Number(queryParams.step), Number(queryParams.from));
          } else if (queryParams.step) {
            period = new IStep(Number(queryParams.step));
          }
          this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), queryParams.namespace || app.defaultNamespace, !queryParams.server ? [] : Array.isArray(queryParams.server) ? queryParams.server : [queryParams.server], null, !queryParams.rangestatus ? [] : Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus]);
        }
        this.patchServerValue(this.queryParams.appname);
        this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

        this._instanceService.getApplications(this.type == 'view' ? 'CLIENT' : 'SERVER', this.queryParams.namespace)
            .pipe(finalize(() => this.serverNameIsLoading = false))
            .subscribe({
              next: res => {
                this.nameDataList = res.map(r => r.appName);
                this.patchServerValue(this.queryParams.appname);
              }, error: (e) => {
                console.log(e)
              }
            });
        this.getEvents();
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.queryParams.buildPath()}`);
      }
    });
  }

  onChangeStart(event) {
    this.serverFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({onlySelf: true})
    let start = this.serverFilterForm.controls.dateRangePicker.controls.start.value;
    let end = this.serverFilterForm.controls.dateRangePicker.controls.end.value || null;
    this.queryParams.period = new IPeriod(start, end);
  }

  onChangeEnd(event) {
    this.serverFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({onlySelf: true})
    let start = this.serverFilterForm.controls.dateRangePicker.controls.start.value || null;
    let end = this.serverFilterForm.controls.dateRangePicker.controls.end.value;
    this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
  }

  onChangeServer($event) {
    this.queryParams.appname = this.serverFilterForm.controls.appname.value;
  }

  onChangeStatus($event) {
    this.queryParams.rangestatus = this.serverFilterForm.controls.rangestatus.value && this.serverFilterForm.controls.rangestatus.value.map((f: {
      icon: string,
      label: string,
      color: string,
      value: any
    }) => f.value)
  }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    this._pageTitleService.clear();
  }

  getEvents() {
    this.$destroy.next();
    const params = {
      'instance.namespace': this.queryParams.namespace,
      'instance.app_name': this.queryParams.appname,
      'start.ge': this.queryParams.period.start.toISOString(),
      'start.lt': this.queryParams.period.end.toISOString()
    };

    this.isLoading = true;
    this.events = [];
    this._traceService.getSessionEvents()
        .pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false))
        .subscribe({
          next: d => {
            this.events = d;
          },
          error: (error: HttpErrorResponse) => {
            if(error.status === 413) {
              this.tableConfig.labels.empty = error.error.message;
            }
          }
        });
  }

  private buildTableConfig(initialQuery?: string): TableProvider<SessionEventDto> {
    return {
      ...SESSION_EVENT_TABLE_CONFIG,
      clearSearchInput: this.type || null,
      search: initialQuery
          ? { ...SESSION_EVENT_TABLE_CONFIG.search, initialQuery, searchColumns: ['value', 'location'] }
          : SESSION_EVENT_TABLE_CONFIG.search
    };
  }


  search() {
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
        this.getEvents();
      }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: start,
        end: end
      }
    }, {emitEvent: false});
  }

  patchServerValue(appname: any[]) {
    this.serverFilterForm.patchValue({
      appname: appname
    }, {emitEvent: false})
    this.queryParams.appname = appname

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
