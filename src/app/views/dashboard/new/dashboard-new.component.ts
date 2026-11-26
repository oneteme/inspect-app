import {ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit} from "@angular/core";
import {getDefaultTodayPeriod, toDisplayedPeriodEnd} from "../../../shared/period-filter";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {IPeriod, IStep, IStepFrom, Period} from "../../../model/conf.model";
import {groupByColor, periodManagement, shallowEqual} from "../../../shared/util";
import {ActivatedRoute, Params} from "@angular/router";
import {EnvRouter} from "../../../service/router.service";
import {finalize, Observable, Subject, takeUntil} from "rxjs";
import {app} from "../../../../environments/environment";
import {RestSessionService} from "../../../service/jquery/rest-session.service";
import {MainSessionService} from "../../../service/jquery/main-session.service";
import {DecimalPipe} from "@angular/common";
import {Constants} from "../../constants";
import {PageTitleService} from "../../../service/page-title.service";
import {RestRequestService} from "../../../service/jquery/rest-request.service";
import {DatabaseRequestService} from "../../../service/jquery/database-request.service";
import {FtpRequestService} from "../../../service/jquery/ftp-request.service";
import {SmtpRequestService} from "../../../service/jquery/smtp-request.service";
import {LdapRequestService} from "../../../service/jquery/ldap-request.service";
import {EventSessionService} from "../../../service/event-session.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {LastServerStart} from "../../../model/jquery.model";

interface Summary {
  type: string;
  countError: number;
  countWarn: number;
  countTotal: number;
}

interface SummaryOverview {
  category: string;
  type: string;
  date: string;
  year: number;
  label: string;
  count: number;
  countTotal: number;
}

@Component({
  templateUrl: './dashboard-new.component.html',
  styleUrls: ['./dashboard-new.component.scss']
})
export class DashboardNewComponent implements OnInit, OnDestroy {
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: EnvRouter = inject(EnvRouter);
  private readonly _decimalPipe = inject(DecimalPipe);
  private readonly _pageTitleService = inject(PageTitleService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _restSessionService = inject(RestSessionService);
  private readonly _mainSessionService = inject(MainSessionService);
  private readonly _restRequestService = inject(RestRequestService);
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private readonly _ftpRequestService = inject(FtpRequestService);
  private readonly _smtpRequestService = inject(SmtpRequestService)
  private readonly _ldapRequestService = inject(LdapRequestService);
  private readonly _eventSessionService = inject(EventSessionService);
  private readonly $destroy = new Subject<void>();

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  REQUEST_MAPPING_TYPE = Constants.REQUEST_MAPPING_TYPE;

  params: Partial<{ namespace: string, period: IPeriod}> = {};

  periodFilterForm = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required])
  });

  versionColor: any = {};

  instanceRows: LastServerStart[] = [];

  sessionSummaries: Partial<Summary>[] = [];
  requestSummaries: Partial<Summary>[] = [];
  eventSummaries: Partial<Summary>[] = [];

  selectedSummary: SummaryOverview[] = [];

  isInstanceLoading = false;
  isMainSessionLoading = false;
  isRestSessionLoading = false;
  isRestRequestLoading = false;
  isDatabaseRequestLoading = false;
  isFtpRequestLoading = false;
  isSmtpRequestLoading = false;
  isLdapRequestLoading = false;
  isEventSessionLoading = false;
  isSummaryLoading = false;

  ngOnInit(): void {
    this.initTitlePage();
    this._activatedRoute.queryParams.pipe(takeUntil(this.$destroy)).subscribe({
      next: (queryParams) => {
        this.params = this.buildParams(queryParams);
        this.patchDateValue(this.params.period.start, toDisplayedPeriodEnd(this.params.period.end));
        this.initSidebar();
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup logic here
  }

  patchDateValue(start: Date, end: Date) {
    this.periodFilterForm.patchValue({
      start: start,
      end: end
    }, { emitEvent: false });
  }

  search(event: MouseEvent) {
    if (this.periodFilterForm.valid) {
      const start = this.periodFilterForm.getRawValue().start;
      const end = this.periodFilterForm.getRawValue().end;
      this.params.period = new IPeriod(start, end);
      this._router.navigateOnClick(event, [], {
        relativeTo: this._activatedRoute,
        queryParams: this.buildQueryParams(this.params)
      });
    }
  }

  private initTitlePage() {
    this._pageTitleService.set({
      icon: Constants.MAPPING_TYPE['dashboard']?.icon || 'deployed_code',
      title: Constants.MAPPING_TYPE['dashboard']?.title || 'Vue d\'ensemble',
      iconOutlined: true
    });
  }

  private buildParams(queryParams: Params):  Partial<{ namespace: string, period: IPeriod }> {
    let params: Partial<{ namespace: string, period: IPeriod | IStep | IStepFrom }> = {};
    params.namespace = queryParams.namespace || app.defaultNamespace;
    if (queryParams.start && queryParams.end) {
      params.period = new IPeriod(new Date(queryParams.start), new Date(queryParams.end));
    } else if (queryParams.step && queryParams.from) {
      params.period = new IStepFrom(Number(queryParams.step), Number(queryParams.from));
    } else if (queryParams.step) {
      params.period = new IStep(Number(queryParams.step));
    } else {
      params.period = getDefaultTodayPeriod();
    }
    return {namespace: params.namespace, period: new IPeriod(params.period.start, params.period.end) };
  }

  private buildQueryParams(params: Partial<{ namespace: string, period: IPeriod }>): Params {
    return {
      namespace: params.namespace,
      ...params.period.buildParams()
    };
  }

  private initSidebar() {
    this.sessionSummaries = [];
    this.requestSummaries = [];
    this.eventSummaries = [];
    this.getLastInstances();
    this.getRestSessionCountExceptions();
    this.getMainSessionCountExceptions();
    this.getRestRequestCountExceptions();
    this.getDatabaseRequestCountExceptions();
    this.getFtpRequestCountExceptions();
    this.getSmtpRequestCountExceptions();
    this.getLdapRequestCountExceptions();
    this.getEventSessionCountExceptions();
  }

  getLastInstances() {
    this.instanceRows = [];
    this.isInstanceLoading = true;
    this._instanceService.getLastServerStart(this.params.namespace)
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isInstanceLoading = false)
        )
        .subscribe({
          next: res => {
            this.instanceRows = res;
            this.versionColor = groupByColor(res, (v: any) => v.version);
          }
        })
  }

  getMainSessionCountExceptions() {
    this.isMainSessionLoading = true;
    this._mainSessionService.getCountExceptionByType({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isMainSessionLoading = false)
        )
        .subscribe({
          next: res => {
            this.sessionSummaries.push(...res);
          }
        });
  }

  getRestSessionCountExceptions() {
    this.isRestSessionLoading = true;
    this._restSessionService.getCountException({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isRestSessionLoading = false)
        )
        .subscribe({
          next: res => {
            this.sessionSummaries.push(res);
          }
        });
  }

  getRestRequestCountExceptions() {
    this.isRestRequestLoading = true;
    this._restRequestService.getCountException({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isRestRequestLoading = false)
        )
        .subscribe({
          next: res => {
            this.requestSummaries.push(res);
          }
        });
  }

  getDatabaseRequestCountExceptions() {
    this.isDatabaseRequestLoading = true;
    this._databaseRequestService.getCountException({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isDatabaseRequestLoading = false)
        )
        .subscribe({
          next: res => {
            this.requestSummaries.push(res);
          }
        });
  }

  getLdapRequestCountExceptions() {
    this.isLdapRequestLoading = true;
    this._ldapRequestService.getCountException({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isLdapRequestLoading = false)
        )
        .subscribe({
          next: res => {
            this.requestSummaries.push(res);
          }
        });
  }

  getFtpRequestCountExceptions() {
    this.isFtpRequestLoading = true;
    this._ftpRequestService.getCountException({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isFtpRequestLoading = false)
        )
        .subscribe({
          next: res => {
            this.requestSummaries.push(res);
          }
        });
  }

  getSmtpRequestCountExceptions() {
    this.isSmtpRequestLoading = true;
    this._smtpRequestService.getCountException({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isSmtpRequestLoading = false)
        )
        .subscribe({
          next: res => {
            this.requestSummaries.push(res);
          }
        });
  }

  getEventSessionCountExceptions() {
    this.isEventSessionLoading = true;
    this._eventSessionService.getCountByCategory({ namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.isEventSessionLoading = false)
        )
        .subscribe({
          next: res => {
            let countLog = res.countWarn + res.countError + res.countInfo;
            let countAction = res.countAction;
            if(countLog > 0) {
              this.eventSummaries.push({ type: 'log', countWarn: res.countWarn, countError: res.countError, countTotal: countLog });
            }
            if(countAction > 0) {
              this.eventSummaries.push({ type: 'user', countWarn: 0, countError: 0, countTotal: countAction });
            }
          }
        });
  }

  onClickSessionSummary(summary: Partial<Summary>) {
    this.selectedSummary = [];
    this.isSummaryLoading = true;
    this.SESSION(this.params.namespace, this.params.period.start, this.params.period.end, periodManagement(this.params.period.start, this.params.period.end))[summary.type]
        .pipe(
            finalize(() => this.isSummaryLoading = false)
        )
        .subscribe({
          next: res => {
            this.selectedSummary = res.map(r => ({...r, category: 'session', type: summary.type}));
          }
        });
  }

  onClickRequestSummary(summary: Partial<Summary>) {
    this.selectedSummary = [];
    this.isSummaryLoading = true;
    this.REQUEST(this.params.namespace, this.params.period.start, this.params.period.end, periodManagement(this.params.period.start, this.params.period.end))[summary.type]
        .pipe(
            finalize(() => this.isSummaryLoading = false)
        )
        .subscribe({
          next: res => {
            this.selectedSummary = res.map(r => ({...r, category: 'request', type: summary.type}));
          }
        });
  }

  onClickEventSummary(summary: Partial<Summary>) {
    this.selectedSummary = [];
    this.isSummaryLoading = true;
    this.EVENT(this.params.namespace, this.params.period.start, this.params.period.end, periodManagement(this.params.period.start, this.params.period.end))[summary.type]
        .pipe(
            finalize(() => this.isSummaryLoading = false)
        )
        .subscribe({
          next: res => {
            this.selectedSummary = res.map(r => ({...r, category: 'event', type: summary.type}));
          }
        });
  }

  onNavigateSearch(event: MouseEvent, row: {category: string, type: string, label: string, count: number, totalCount: number}) {
    console.log(row)
    let queryParams = row.category == 'event' ? {
      ...this.buildQueryParams(this.params),
      type: [row.label]
    } : {
      ...this.buildQueryParams(this.params),
      rangestatus: [row.label]
    };
    this._router.navigateOnClick(event, [row.category, row.type], {
      queryParams
    });
  }

  private SESSION = (namespace: string, start: Date, end: Date, groupedBy: string): { [key: string]: Observable<{date: string, year: number, label: string, count: number, countTotal: number}[]> } => {
    return {
      rest: this._restSessionService.getExceptionByDateNew(namespace, start, end, groupedBy),
      view: this._mainSessionService.getExceptionByDateNew(namespace, start, end, groupedBy, 'VIEW'),
      schedule: this._mainSessionService.getExceptionByDateNew(namespace, start, end, groupedBy, 'SCHEDULE'),
      startup: this._mainSessionService.getExceptionByDateNew(namespace, start, end, groupedBy, 'STARTUP'),
      test: this._mainSessionService.getExceptionByDateNew(namespace, start, end, groupedBy, 'TEST')
    };
  };

  private REQUEST = (namespace: string, start: Date, end: Date, groupedBy: string): { [key: string]: Observable<{date: string, year: number, label: string, count: number, countTotal: number}[]> } => {
    return {
      rest: this._restRequestService.getExceptionByDateNew(namespace, start, end, groupedBy),
      jdbc: this._databaseRequestService.getExceptionByDateNew(namespace, start, end, groupedBy),
      ftp: this._ftpRequestService.getExceptionByDateNew(namespace, start, end, groupedBy),
      smtp: this._smtpRequestService.getExceptionByDateNew(namespace, start, end, groupedBy),
      ldap: this._ldapRequestService.getExceptionByDateNew(namespace, start, end, groupedBy)
    };
  }

  private EVENT = (namespace: string, start: Date, end: Date, groupedBy: string): { [key: string]: Observable<{date: string, year: number, label: string, count: number, countTotal: number}[]> } => {
    return {
      log: this._eventSessionService.getLogEventByDate(namespace, start, end, groupedBy),
      user: this._eventSessionService.getUserEventByDate(namespace, start, end, groupedBy)
    };
  }
}