import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {DecimalPipe} from "@angular/common";
import {combineLatest, EMPTY, finalize, forkJoin, of, Subject, switchMap, takeUntil} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TraceService} from "../../../../service/trace.service";
import {InstanceEnvironment} from "../../../../model/trace.model";
import {MachineUsageService} from "../../../../service/jquery/resource-usage.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {InstanceTraceService} from "../../../../service/jquery/instance-trace.service";
import {MatDialog} from "@angular/material/dialog";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../../shared/material/custom-date-range-selection-strategy";
import {EnvRouter} from "../../../../service/router.service";
import {InstanceService} from "../../../../service/jquery/instance.service";
import {
  ServerInstanceSelectorDialogComponent
} from "./server-instance-selector-dialog/server-instance-selector-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {PulseDialogComponent} from "../../../../shared/_component/pulse/dialog/pulse-dialog.component";
import {PageTitleService} from '../../../../service/page-title.service';
import {getDefaultRelativePeriod, getQuickRangeStep, getQuickRangeDates, isDefaultRelativePeriod, PERIOD_QUICK_RANGES, PeriodQuickRange, toDisplayedPeriodEnd} from '../../../../shared/period-filter';
import {IPeriod, IStep, IStepFrom} from '../../../../model/conf.model';
import {shallowEqual} from '../../../search/session/rest/search-rest.view';

@Component({
  templateUrl: './server-supervision.view.html',
  styleUrls: ['./server-supervision.view.scss'],
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS},
    {provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy}
  ]
})
export class ServerSupervisionView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _traceService = inject(TraceService);
  private readonly _machineUsageService = inject(MachineUsageService);
  private readonly _instanceTraceService = inject(InstanceTraceService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _dialog = inject(MatDialog);
  private readonly _decimalPipe = inject(DecimalPipe);
  private readonly _snackBar = inject(MatSnackBar);
  private readonly _pageTitleService = inject(PageTitleService);
  private readonly $destroy = new Subject<void>();
  private readonly $requestCancel = new Subject<void>();

  readonly formGroup = new FormGroup({
    range: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    }),
    instance: new FormControl<{id: string; appName: string; start: number; end: number} | null>(null, [Validators.required]),
    server: new FormControl<string | null>(null)
  });

  readonly USAGE_RESOURCE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    group: 'sync',
    groupSync: ['tooltip', 'datazoom'],
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('maxHeap')}, name: 'Maximum', type: 'area', color: '#feb019'},
      {data: {x: field('date'), y: field('commitedHeap')}, name: 'Allouée', color: '#00e396'},
      {data: {x: field('date'), y: field('usedHeap')}, name: 'Utilisée', color: '#008ffb'}
    ],
    options: {
      animation: false,
      dataZoom: [{type: 'inside', xAxisIndex: 0}],
      xAxis: {axisLabel: {hideOverlap: true}},
      yAxis: {axisLabel: {formatter: (v: number) => this._decimalPipe.transform(v)}},
      series: [
        {
          lineStyle: { type: 'dashed' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#feb019CC' },
                { offset: 1, color: '#feb01911' }
              ]
            }
          }
        }
      ]
    }
  };
  readonly USAGE_DISK_BY_PERIOD_LINE: ChartProvider<string, number> = {
    group: 'sync',
    groupSync: ['tooltip', 'datazoom'],
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('diskTotalSpace')}, name: 'Maximum', type: 'area', color: '#FEB019'},
      {data: {x: field('date'), y: field('usedDiskSpace')}, name: 'Utilisée', color: '#008ffb'}
    ],
    options: {
      animation: false,
      dataZoom: [{ type: 'inside', xAxisIndex: 0 }],
      xAxis: { axisLabel: { hideOverlap: true } },
      yAxis: { axisLabel: { formatter: (v: number) => this._decimalPipe.transform(v) } },
      series: [
        {
          lineStyle: { type: 'dashed' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#FEB019CC' },
                { offset: 1, color: '#FEB01911' }
              ]
            }
          }
        }
      ]
    }
  };
  readonly USAGE_CPU_BY_PERIOD_LINE: ChartProvider<string, number> = {
    group: 'sync',
    groupSync: ['tooltip', 'datazoom'],
    height: 300,
    stacked: false,
    ytitle: '%',
    series: [
      {data: {x: field('date'), y: field('cpuUsage')}, name: 'CPU utilisée', color: '#7c3aed'}
    ],
    options: {
      animation: false,
      dataZoom: [{type: 'inside', xAxisIndex: 0}],
      xAxis: {axisLabel: {hideOverlap: true}},
      yAxis: {
        min: 0,
        max: 100,
        axisLabel: {formatter: (v: number) => `${this._decimalPipe.transform(v)} %`}
      },
      legend: {show: true}
    }
  };
  readonly USAGE_THREADS_BY_PERIOD_LINE: ChartProvider<string, number> = {
    group: 'sync',
    groupSync: ['tooltip', 'datazoom'],
    height: 300,
    stacked: false,
    ytitle: 'Threads',
    series: [
      {data: {x: field('date'), y: field('nbActiveThread')}, name: 'Threads actifs', color: '#2563eb'},
      {data: {x: field('date'), y: field('nbStartThread')}, name: 'Threads démarrés', color: '#ea580c'}
    ],
    options: {
      animation: false,
      dataZoom: [{type: 'inside', xAxisIndex: 0}],
      xAxis: {axisLabel: {hideOverlap: true}},
      yAxis: {axisLabel: {formatter: (v: number) => this._decimalPipe.transform(v)}},
      legend: {show: true}
    }
  };
  date = new Date();
  servers: string[] = [];
  instance: Partial<InstanceEnvironment> = {};
  instances: {id: string, appName: string, start: number, end: number}[] = [];
  usageResourceByPeriod: any[] = [];
  lastTrace: number;
  params: Partial<{instance: string, namespace: string, start: Date, end: Date}> = {};

  isLoading = false;
  isLoadingInstances = false;
  reloadInstances = true;
  selectedPeriod: Partial<{start: Date, end: Date}>;
  readonly periodQuickRanges = PERIOD_QUICK_RANGES;
  period: IPeriod | IStep | IStepFrom;
  currentQueryParams: {[key: string]: any} = {};

  constructor() {
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).pipe(
      takeUntil(this.$destroy)
    ).subscribe({
      next: ([params, queryParams]: any) => {
        this.params.instance = params.instance;
        this.params.namespace = queryParams.namespace;
        
        if (queryParams.start && queryParams.end) {
          this.period = new IPeriod(new Date(queryParams.start), new Date(queryParams.end));
        } else if (queryParams.step && queryParams.from) {
          this.period = new IStepFrom(Number(queryParams.step), Number(queryParams.from));
        } else if (queryParams.step) {
          this.period = new IStep(Number(queryParams.step));
        } else {
          this.period = getDefaultRelativePeriod();
        }
        
        this.params.start = this.period.start;
        this.params.end = this.period.end;
        // this.syncChartPeriodBounds();
        
        this.patchDateValue(this.params.start, toDisplayedPeriodEnd(this.params.end));
        
        this.getInstances(this.params.start, this.params.end);
        this.getInstance();
      }
    });
  }

  ngOnInit() {
    this._pageTitleService.set({ icon: 'browse_activity', iconOutlined: true, title: 'Supervision', subtitle: 'Serveur' });
  }

  ngOnDestroy() {
    this.$requestCancel.next();
    this.$requestCancel.complete();
    this.$destroy.next();
    this.$destroy.complete();
    this._pageTitleService.clear();
  }

  ngAfterViewInit() {

  }

  onChangeStart(event: any) {
    this.formGroup.controls.range.controls.end.updateValueAndValidity({onlySelf: true});
    const start = this.formGroup.controls.range.controls.start.value;
    const end = this.formGroup.controls.range.controls.end.value || null;
    this.period = new IPeriod(start, end);
    if(this.formGroup.controls.range.valid) {
      this.getInstances(start, end);
    }
  }

  onChangeEnd(event: any) {
    this.formGroup.controls.range.controls.start.updateValueAndValidity({onlySelf: true});
    this.formGroup.controls.range.updateValueAndValidity({onlySelf: true});
    const start = this.formGroup.controls.range.controls.start.value || null;
    const end = this.formGroup.controls.range.controls.end.value;
    this.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
    if(this.formGroup.controls.range.valid) {
      this.getInstances(start, end);
    }
  }

  getInstances(start: Date, end: Date,) {
    this.instances = [];
    this.servers = [];
    this.isLoadingInstances = true;
    this._instanceService.getInstancesByPeriod({namespace: this.params.namespace, start: start, end: end})
    .pipe(finalize(() => this.isLoadingInstances = false))
    .subscribe({
        next: res => {
          if(res.length){
            this.instances = res;
            this.servers = [...new Set(this.instances.map(i => i.appName))];
            let s = this.instances.find(i => i.id == this.params.instance);
            if(s) {
              this.patchInstanceValue(s)
              this.patchServerValue(s.appName)
            }
          }
        }
      });
  }

  getInstance() {
    this.$requestCancel.next();
    this.isLoading = true;
    this.instance = null;
    this.usageResourceByPeriod = [];
    this.lastTrace = null;
    // this.syncChartPeriodBounds();
    this._traceService.getInstance(this.params.instance)
    .pipe(switchMap(res => {
        console.log(res.namespace, this.params.namespace)
      if(res?.namespace !== this.params.namespace) {
        this._snackBar.open(`L'identifiant de cette instance ne correspond pas à l'environnement ${this.params.namespace}`, "Fermer",
            {
              horizontalPosition: "center",
              verticalPosition: "top",
              duration: 5000
            });
        return EMPTY;
      }
      this.instance = res;
      this.updatePageTitle();
      if (!this.formGroup.controls.server.value) {
        const instanceAsRow = { id: res.id, appName: res.name, start: res.instant, end: res.end };
        if (!this.servers.includes(res.name)) {
          this.servers = [...this.servers, res.name];
        }
        if (!this.instances.some(i => i.id === res.id)) {
          this.instances = [...this.instances, instanceAsRow];
        }
        this.patchServerValue(res.name);
        this.patchInstanceValue(instanceAsRow);
      }
      return forkJoin([
        this.instance.end ? of([]) : this._instanceTraceService.getLastInstanceTrace({instance: [this.params.instance]}),
        this._machineUsageService.getResourceMachineByPeriod({instance: this.params.instance, start: this.params.start, end: this.params.end})
      ]);
    }), finalize(() => (this.isLoading = false)), takeUntil(this.$requestCancel), takeUntil(this.$destroy)).subscribe({
      next: ([last, usage]) => {
        this.usageResourceByPeriod = usage?.length ? usage.map(r => ({...r, date: new Date(r.date), maxHeap: this.instance.resource.maxHeap, diskTotalSpace: this.instance.resource.diskTotalSpace})) : [];
        console.log(usage)
        this.lastTrace = last[0]?.date;
        this.updatePageTitle();
        this.selectedPeriod = this.defaultSelectedPeriod();
      }
    });
  }

  private updatePageTitle() {
    if (!this.instance) return;
    this._pageTitleService.set({
      icon: 'browse_activity',
      iconOutlined: true,
      title: this.instance.name,
      subtitle: 'Supervision • Serveur'
    });
  }

  private defaultSelectedPeriod(): {start: Date, end: Date} {
    return {start: this.getMaxDate(new Date(this.instance.instant * 1000), this.params.start), end: this.getMinDate(this.instance.end ? new Date(this.instance.end * 1000) : new Date(), this.params.end)};
  }

  search() {
    if (this.formGroup.valid) {
      const start = this.formGroup.controls.range.controls.start.getRawValue();
      const end = this.formGroup.controls.range.controls.end.getRawValue();
      
      if (!(this.period instanceof IStep) && !(this.period instanceof IStepFrom)) {
        this.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
      }
      
      const periodParams = this.period.buildParams();
      const newQueryParams = {
        namespace: this.params.namespace,
        app_name: this.formGroup.controls.server.value || null,
        ...periodParams
      };
      const newInstanceId = this.formGroup.controls.instance.value.id;
      const currentInstanceId = this._activatedRoute.snapshot.params['instance'];
      const instanceChanged = currentInstanceId !== newInstanceId;

      if (instanceChanged || !shallowEqual(this._activatedRoute.snapshot.queryParams, newQueryParams)) {
        // L'instance ou les params ont changé, naviguer (met à jour l'URL)
        this._router.navigate(['supervision', 'server', newInstanceId], {
          queryParams: newQueryParams
        });
      } else {
        this.reloadInstances = false;
        this.params.start = this.period.start;
        this.params.end = this.period.end;
        this.patchDateValue(this.params.start, toDisplayedPeriodEnd(this.params.end));
        this.getInstances(this.params.start, this.params.end);
        this.getInstance();
      }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.formGroup.patchValue({
      range: {
        start: start,
        end: end
      }
    }, { emitEvent: false });
  }

  patchInstanceValue(instance: {id: string, appName: string, start: number, end: number}) {
    this.formGroup.patchValue({
      instance: instance
    }, { emitEvent: false });
  }

  patchServerValue(server: string) {
    this.formGroup.patchValue({
      server: server
    }, { emitEvent: false });
  }

  openInstanceSelector() {
    const dialogRef = this._dialog.open(ServerInstanceSelectorDialogComponent, {
      width: '500px',
      data: {
        servers: this.servers,
        instances: this.instances,
        selectedServer: this.formGroup.controls.server.value,
        selectedInstance: this.formGroup.controls.instance.value,
        isLoadingInstances: this.isLoadingInstances
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.patchServerValue(result.server);
        this.patchInstanceValue(result.instance);
        this.search();
      }
    });
  }

  onClickPulse() {
    this._dialog.open(PulseDialogComponent, {
      width: '1000px',
      height: '65vh',
      data: {
        name: this.instance.name,
        instance: this.instance.id,
        instanceStart: new Date(this.instance.instant * 1000),
        start: this.selectedPeriod.start,
        end: this.selectedPeriod.end
      }
    });
  }

  /**
   * Retourne la date maximale entre deux dates
   * @param date1 Première date
   * @param date2 Deuxième date
   * @returns La date la plus récente
   */
  getMaxDate(date1: Date, date2: Date): Date {
    return date1.getTime() > date2.getTime() ? date1 : date2;
  }

  getMinDate(date1: Date, date2: Date): Date {
    return date1.getTime() < date2.getTime() ? date1 : date2;
  }

  private syncChartPeriodBounds(): void {
    const min = this.params.start?.getTime();
    const currentMinute = new Date();
    currentMinute.setSeconds(59, 999);
    const requestedMax = this.params.end ? this.params.end.getTime() - 1 : undefined;
    const max = requestedMax != null ? Math.min(requestedMax, currentMinute.getTime()) : undefined;

    [
      this.USAGE_RESOURCE_BY_PERIOD_LINE,
      this.USAGE_DISK_BY_PERIOD_LINE,
    ].forEach((chartConfig) => {
      chartConfig.options = {
        ...chartConfig.options,
        xAxis: {
          ...(chartConfig.options?.xAxis || {}),
          min,
          max,
          axisLabel: {
            ...(chartConfig.options?.xAxis as any)?.axisLabel
          }
        }
      };
    });
  }


  onServerChange(){
    if(this.filtredInstances.length > 0) {
      const lastInstance = this.filtredInstances.reduce((a, b) => (a.start > b.start ? a : b), this.filtredInstances[0]);
      this.patchInstanceValue(lastInstance);
    }
  }

  get filtredInstances(){
    return this.instances.filter(s => s.appName == this.formGroup.controls.server?.value);
  }

  isDefaultPeriod(): boolean {
    return isDefaultRelativePeriod(this.period);
  }

  resetPeriod(): void {
    const defaultPeriod = getDefaultRelativePeriod();
    this.period = defaultPeriod;
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
    this.period = period;
    this.patchDateValue(period.start, toDisplayedPeriodEnd(period.end));
  }
}
