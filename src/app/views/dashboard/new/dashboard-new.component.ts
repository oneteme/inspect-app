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
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";

export interface SummaryOverview {
  category: string;
  type: string;
  data: {
    date: string;
    year: number;
    label: string;
    count: number;
    countTotal: number;
  }[];
  series: SerieProvider<string, number>[];
}

export interface Summary {
  category: 'session' | 'request' | 'event';
  label: string;
  subSummaries: SubSummary[];
  hasNoData: boolean;
}

export interface SubSummary {
  type: string;
  label: string;
  countError: number;
  countWarn: number;
  countTotal: number;
  isLoading: boolean;
}

export const INIT_SUMMARIES: Summary[] = [
  {
    category: 'session',
    label: Constants.MAPPING_TYPE['treatment'].title,
    subSummaries: [
      {type: 'rest', label: Constants.MAPPING_TYPE['rest'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'schedule', label: Constants.MAPPING_TYPE['schedule'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'startup', label: Constants.MAPPING_TYPE['startup'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'view', label: Constants.MAPPING_TYPE['view'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'test', label: Constants.MAPPING_TYPE['test'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false}
    ],
    hasNoData: false
  },
  {
    category: 'request',
    label: Constants.MAPPING_TYPE['request'].title,
    subSummaries: [
      {type: 'rest', label: Constants.REQUEST_MAPPING_TYPE['rest'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'jdbc', label: Constants.REQUEST_MAPPING_TYPE['jdbc'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'smtp', label: Constants.REQUEST_MAPPING_TYPE['smtp'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'ftp', label: Constants.REQUEST_MAPPING_TYPE['ftp'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false},
      {type: 'ldap', label: Constants.REQUEST_MAPPING_TYPE['ldap'].title, countError: 0, countWarn: 0, countTotal: 0, isLoading: false}
    ],
    hasNoData: false
  }
]

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

  params: Partial<{ namespace: string, period: IPeriod }> = {};

  periodFilterForm = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required])
  });

  versionColor: any = {};

  instanceRows: LastServerStart[] = [];
  selectedSummary: SummaryOverview = {category: '', type: '', data: [], series: []};

  summaries = INIT_SUMMARIES;

  isInstanceLoading = false;
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
    }, {emitEvent: false});
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
      icon: Constants.MAPPING_TYPE['dashboard']?.icon,
      title: Constants.MAPPING_TYPE['dashboard']?.title,
      iconOutlined: true
    });
  }

  private buildParams(queryParams: Params): Partial<{ namespace: string, period: IPeriod }> {
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
    return {namespace: params.namespace, period: new IPeriod(params.period.start, params.period.end)};
  }

  private buildQueryParams(params: Partial<{ namespace: string, period: IPeriod }>): Params {
    return {
      namespace: params.namespace,
      ...params.period.buildParams()
    };
  }

  private initSidebar() {
    this.summaries = INIT_SUMMARIES;
    this.getLastInstances();
    this.getRestSessionCountExceptions();
    this.getMainSessionCountExceptions();
    this.getRestRequestCountExceptions();
    this.getDatabaseRequestCountExceptions();
    this.getFtpRequestCountExceptions();
    this.getSmtpRequestCountExceptions();
    this.getLdapRequestCountExceptions();
    //this.getEventSessionCountExceptions();
  }

  get sessionSummary() {
    return this.summaries.find(s => s.category === 'session');
  }

  get requestSummary() {
    return this.summaries.find(s => s.category === 'request');
  }

  get eventSummary() {
    return this.summaries.find(s => s.category === 'event');
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
    this.sessionSummary.subSummaries.filter(summary => summary.type != 'rest').forEach(summary => {
      summary.isLoading = true
    });
    this._mainSessionService.getCountExceptionByType({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.sessionSummary.subSummaries.filter(summary => summary.type != 'rest').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.sessionSummary.subSummaries.filter(summary => summary.type != 'rest').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  getRestSessionCountExceptions() {
    this.sessionSummary.subSummaries.filter(summary => summary.type === 'rest').forEach(summary => {
      summary.isLoading = true
    });
    this._restSessionService.getCountException({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.sessionSummary.subSummaries.filter(summary => summary.type === 'rest').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.sessionSummary.subSummaries.filter(summary => summary.type === 'rest').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  getRestRequestCountExceptions() {
    this.requestSummary.subSummaries.filter(summary => summary.type === 'rest').forEach(summary => {
      summary.isLoading = true
    });
    this._restRequestService.getCountException({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.requestSummary.subSummaries.filter(summary => summary.type === 'rest').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.requestSummary.subSummaries.filter(summary => summary.type === 'rest').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  getDatabaseRequestCountExceptions() {
    this.requestSummary.subSummaries.filter(summary => summary.type === 'jdbc').forEach(summary => {
      summary.isLoading = true
    });
    this._databaseRequestService.getCountException({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.requestSummary.subSummaries.filter(summary => summary.type === 'jdbc').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.requestSummary.subSummaries.filter(summary => summary.type === 'jdbc').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  getLdapRequestCountExceptions() {
    this.requestSummary.subSummaries.filter(summary => summary.type === 'ldap').forEach(summary => {
      summary.isLoading = true
    });
    this._ldapRequestService.getCountException({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.requestSummary.subSummaries.filter(summary => summary.type === 'ldap').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.requestSummary.subSummaries.filter(summary => summary.type === 'ldap').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  getFtpRequestCountExceptions() {
    this.requestSummary.subSummaries.filter(summary => summary.type === 'ftp').forEach(summary => {
      summary.isLoading = true
    });
    this._ftpRequestService.getCountException({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.requestSummary.subSummaries.filter(summary => summary.type === 'ftp').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.requestSummary.subSummaries.filter(summary => summary.type === 'ftp').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  getSmtpRequestCountExceptions() {
    this.requestSummary.subSummaries.filter(summary => summary.type === 'smtp').forEach(summary => {
      summary.isLoading = true
    });
    this._smtpRequestService.getCountException({
      namespace: this.params.namespace,
      start: this.params.period.start,
      end: this.params.period.end
    })
        .pipe(
            takeUntil(this.$destroy),
            finalize(() => this.requestSummary.subSummaries.filter(summary => summary.type === 'smtp').forEach(summary => {
              summary.isLoading = false
            }))
        )
        .subscribe({
          next: res => {
            this.requestSummary.subSummaries.filter(summary => summary.type === 'smtp').forEach(summary => {
              const found = res.find(r => r.type === summary.type);
              if (found) {
                summary.countError = found.countError;
                summary.countTotal = found.countTotal;
              }
            });
          }
        });
  }

  /*getEventSessionCountExceptions() {
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
  }*/

  onClickSummary(category: string, summary: Partial<SubSummary>) {
    this.selectedSummary = {category: category, type: summary.type, data: [], series: []};
    console.log('onClickSummary', this.selectedSummary);
    this.isSummaryLoading = true;
    this.CATEGORY(this.params.namespace, this.params.period.start, this.params.period.end, periodManagement(this.params.period.start, this.params.period.end))[category][summary.type]
        .pipe(
            finalize(() => this.isSummaryLoading = false)
        )
        .subscribe({
          next: res => {
            this.selectedSummary = {...this.selectedSummary, data: res};
          }
        });
  }

  onNavigateSearch(event: MouseEvent, row: {
    category: string,
    type: string,
    label: string,
    count: number,
    totalCount: number
  }) {
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

  private CATEGORY = (namespace: string, start: Date, end: Date, groupedBy: string): {
    [key: string]: {
      [key: string]: Observable<{ date: string, year: number, label: string, count: number, countTotal: number }[]>
    }
  } => {
    return {
      session: this.SESSION(namespace, start, end, groupedBy),
      request: this.REQUEST(namespace, start, end, groupedBy),
      event: this.EVENT(namespace, start, end, groupedBy)
    };
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