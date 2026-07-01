import {Component, inject, OnDestroy, OnInit, ViewContainerRef} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, finalize, Subscription} from "rxjs";
import {Location} from "@angular/common";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from '@angular/material/datepicker';
import {SessionKpiComponentResolverService} from "./session-kpi-component-resolver.service";
import {EnvRouter} from "../../../service/router.service";
import {IPeriod, IStep, IStepFrom, Period, QueryParams} from "../../../model/conf.model";
import {app} from "../../../../environments/environment";
import {Constants} from "../../constants";
import {PageTitleService} from "../../../service/page-title.service";
import {RestSessionService} from "../../../service/jquery/rest-session.service";
import {MainSessionService} from "../../../service/jquery/main-session.service";
import {CustomDateAdapter} from '../../../shared/material/custom-date-adapter';
import {MY_DATE_FORMATS} from '../../../shared/shared.module';
import {CustomDateRangeSelectionStrategy} from '../../../shared/material/custom-date-range-selection-strategy';
import {getDefaultTodayPeriod, getKpiQuickRangeDates, isDefaultTodayPeriod, KPI_PERIOD_QUICK_RANGES, KpiPeriodQuickRange, toDisplayedPeriodEnd} from '../../../shared/period-filter';

@Component({
  templateUrl: './session-kpi.view.html',
  styleUrls: ['./session-kpi.view.scss'],
  host: { 'data-view': 'session-kpi' },
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
  ]
})
export class SessionKpiView implements OnInit, OnDestroy {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(EnvRouter);
  private readonly _componentResolver = inject(SessionKpiComponentResolverService);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _restSessionService = inject(RestSessionService);
  private readonly _mainSessionService = inject(MainSessionService);
  private readonly _pageTitleService = inject(PageTitleService);

  private readonly _location = inject(Location);

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  readonly periodQuickRanges = KPI_PERIOD_QUICK_RANGES;

  serverNameIsLoading: boolean;
  nameDataList: any[] = [];
  filterForm = new FormGroup({
    host: new FormControl([""]),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });
  hostSubscription: Subscription;
  params: Partial<{type: 'rest' | 'batch' | 'startup', queryParams: QueryParams}> = {};
  serviceType: { [key: string]: {service : RestSessionService | MainSessionService }  } = {
    "rest": { service: this._restSessionService },
    "batch": { service: this._mainSessionService },
    "startup": { service: this._mainSessionService }
  };

  ngOnInit() {
    combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams}).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {
        const type = v.params.session_type as 'rest' | 'batch' | 'startup';
        this.params.type = type;
        this._pageTitleService.set({
          icon: 'finance_mode',
          iconOutlined: true,
          title: (Constants.MAPPING_TYPE[type]?.title || type) + ' • KPI',
          subtitle: Constants.MAPPING_TYPE[type]?.subtitle
        });
        let period: Period = getDefaultTodayPeriod();
        if (v.queryParams.start && v.queryParams.end) {
          period = new IPeriod(new Date(v.queryParams.start), new Date(v.queryParams.end));
        } else if (v.queryParams.step && v.queryParams.from) {
          period = new IStepFrom(Number(v.queryParams.step), Number(v.queryParams.from));
        } else if (v.queryParams.step) {
          period = new IStep(Number(v.queryParams.step));
        }
        let hosts: string[] = [];
        if (v.queryParams.host) {
          hosts = Array.isArray(v.queryParams.host) ? v.queryParams.host : [v.queryParams.host];
        }
        this.params.queryParams = new QueryParams(period, v.queryParams.env || app.defaultEnv, undefined, hosts)
        this.patchDateValue(this.params.queryParams.period.start, toDisplayedPeriodEnd(this.params.queryParams.period.end));
        this.getHosts();
        if(type) {
          const componentType = this._componentResolver.resolveComponent(type);
          this.loadComponent(componentType);
        }
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.params.queryParams.buildPath()}`);
      }
    });
  }

  ngOnDestroy() {
    if(this.hostSubscription) {
      this.hostSubscription.unsubscribe();
    }
    this._pageTitleService.clear();
  }

  patchDateValue(start: Date, end: Date) {
    this.filterForm.controls.dateRange.patchValue({
      start: start,
      end: end
    }, {emitEvent: false});
  }

  private loadComponent(componentType: any): void {
    this._viewContainerRef.clear();
    let componentRef = this._viewContainerRef.createComponent(componentType);
    componentRef.setInput('queryParams', this.params.queryParams);
  }

  getHosts(){
    if (!this.params.type || !this.params.queryParams)return;
    if(this.hostSubscription){
      this.hostSubscription.unsubscribe();
    }
    this.nameDataList = [];
    this.serverNameIsLoading = true;
    this.hostSubscription = this.serviceType[this.params.type].service.getHosts({ env: this.params.queryParams.env, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end, type: this.params.type.toUpperCase()})
        .pipe(finalize(()=> this.serverNameIsLoading = false))
        .subscribe({
          next: res => {
            this.nameDataList = res.map(r => r.host);
            this.patchHostValue(this.params.queryParams?.hosts || []);
          }, error: (e) => {
            console.log(e)
          }
        });
  }

  patchHostValue(hosts: any[]) {
    this.filterForm.patchValue({
      host: hosts
    },{ emitEvent: false })
  }

  search(){
    if(this.filterForm.valid && this.params.queryParams) {
      const start = this.filterForm.controls.dateRange.controls.start.value;
      const end = this.filterForm.controls.dateRange.controls.end.value;
      if (!start || !end) return;
      this.params.queryParams.period = new IPeriod(start, new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1));
      this._router.navigate([], {
        relativeTo: this._activatedRoute,
        queryParams: this.params.queryParams.buildParams()
      });
    }
  }

  onChangeHost() {
    if (!this.params.queryParams) return;
    const hosts = this.filterForm.controls.host.value || [];
    if (hosts.includes('global')) {
      // Si "Global" est sélectionné, vider le tableau des hosts
      this.params.queryParams.hosts = [];
    } else {
      // Sinon, utiliser les valeurs sélectionnées
      this.params.queryParams.hosts = [...hosts];
    }
  }

  onHostopenedChange() {
    if (!this.params.queryParams) {
      return;
    }
    this.params.queryParams.hosts = [...(this.filterForm.controls.host.value || [])];
  }

  applyQuickRange(range: KpiPeriodQuickRange): void {
    if (!this.params.queryParams) return;
    const {start, end, queryEnd} = getKpiQuickRangeDates(range);
    this.params.queryParams.period = new IPeriod(start, queryEnd);
    this.patchDateValue(start, toDisplayedPeriodEnd(end));
  }

  isDefaultPeriod(): boolean {
    return isDefaultTodayPeriod(this.params.queryParams?.period);
  }

  resetPeriod(): void {
    if (!this.params.queryParams) return;
    const period = getDefaultTodayPeriod();
    this.params.queryParams.period = period;
    this.patchDateValue(period.start, toDisplayedPeriodEnd(period.end));
    this.search();
  }
}

