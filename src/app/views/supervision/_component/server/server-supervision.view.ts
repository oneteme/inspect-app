import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {combineLatest, EMPTY, finalize, forkJoin, of, Subject, switchMap, takeUntil} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TraceService} from "../../../../service/trace.service";
import {InstanceEnvironment} from "../../../../model/trace.model";
import {MachineUsageService} from "../../../../service/jquery/resource-usage.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {InstanceTraceService} from "../../../../service/jquery/instance-trace.service";
import {DatePipe, DecimalPipe, Location} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../../shared/material/custom-date-range-selection-strategy";
import {EnvRouter} from "../../../../service/router.service";
import {ConfigDialogComponent} from "../config-dialog/config-dialog.component";
import {InstanceService} from "../../../../service/jquery/instance.service";
import {ServerInstanceSelectorDialogComponent} from "./server-instance-selector-dialog/server-instance-selector-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {
  StacktraceDialogComponent
} from "../../../../shared/_component/exception-display/stacktrace-dialog/stacktrace-dialog.component";

@Component({
  templateUrl: './server-supervision.view.html',
  styleUrls: ['./server-supervision.view.scss'],
  providers: [
    {
      provide: DateAdapter, useClass: CustomDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS
    },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy
    }
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
  private readonly _location: Location = inject(Location);
  private readonly _decimalPipe: DecimalPipe = inject(DecimalPipe);
  private readonly _datePipe = inject(DatePipe);
  private readonly $destroy = new Subject<void>();
  private readonly _snackBar = inject(MatSnackBar);

  date = new Date().getTime();
  readonly formGroup = new FormGroup({
    range: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    }),
    instance: new FormControl< {id: string, appName: string, start: number, end: number} | null>(null, [Validators.required]),
    server: new FormControl< string | null>(null, [])
  });

  readonly USAGE_RESOURCE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('maxHeap')}, name: 'Maximum', type: 'area', color: '#feb019'},
      {data: {x: field('date'), y: field('commitedHeap')}, name: 'Allouée', color: '#00e396'},
      {data: {x: field('date'), y: field('usedHeap')}, name: 'Utilisée', color: '#008ffb'}

    ],
    options: {
      chart: {
        id: 'line-1',
        group: 'group',
        animations: {
          enabled: false
        },
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: []
          },
          export: {
            csv: {
              columnDelimiter: ',',
              headerCategory: 'category',
              headerValue: 'value'
            }
          },
          autoSelected: 'zoom'
        }
      },
      xaxis: {
        labels: {
          datetimeUTC: false
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value);
          }
        }
      },
      fill: {
        type: ['gradient', 'solid', 'solid'],
        gradient: {
          shade: 'light',
          type: 'vertical',
          inverseColors: 'false',
          shadeIntensity: 0.4,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [0, 100]
        }
      },
      stroke: {
        curve: 'smooth',
        dashArray: [5,0,0],
        width: [1,1,1]
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        x: {
          format: 'dd MMM HH:mm:ss'
        }
      }
    }
  };
  readonly USAGE_DISK_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('diskTotalSpace')}, name: 'Maximum', type: 'area', color: '#FEB019'},
      {data: {x: field('date'), y: field('usedDiskSpace')}, name: 'Utilisée', color: '#008ffb'}
    ],
    options: {
      chart: {
        id: 'line-2',
        group: 'group',
        animations: {
          enabled: false
        },
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: []
          },
          export: {
            csv: {
              columnDelimiter: ',',
              headerCategory: 'category',
              headerValue: 'value'
            }
          },
          autoSelected: 'zoom'
        }
      },
      xaxis: {
        labels: {
          datetimeUTC: false
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value);
          }
        }
      },
      fill: {
        type: ['gradient','solid'],
        gradient: {
          shade: 'light',
          type: 'vertical',
          inverseColors: 'false',
          shadeIntensity: 0.4,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [0, 100]
        }
      },
      stroke: {
        curve: 'smooth',
        dashArray: [5,0],
        width: [1,1]
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        x: {
          format: 'dd MMM HH:mm:ss'
        }
      }
    }
  };
  readonly USAGE_INSTANCE_TRACE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('traceCount')}, name: 'Traitements finalisés'},
      {data: {x: field('date'), y: field('pending')}, name: 'Traitements en cours'},
      {data: {x: field('date'), y: field('queueCapacity')}, name: 'Maximum', type: 'area', color: '#FEB019', visible: false}
    ],
    options: {
      chart: {
        id: 'line-3',
        group: 'group',
        animations: {
          enabled: false
        },
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: []
          },
          export: {
            csv: {
              columnDelimiter: ',',
              headerCategory: 'category',
              headerValue: 'value'
            }
          },
          autoSelected: 'zoom'
        }
      },
      xaxis: {
        labels: {
          datetimeUTC: false
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value);
          }
        }
      },
      fill: {
        type: ['solid', 'solid', 'gradient'],
        gradient: {
          shade: 'light',
          type: 'vertical',
          inverseColors: 'false',
          shadeIntensity: 0.4,
          opacityFrom: 0.9,
          opacityTo: 0.3,
          stops: [0, 100]
        }
      },
      stroke: {
        curve: 'smooth',
        dashArray: [0,0,5],
        width: [1,1,1]
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        x: {
          format: 'dd MMM HH:mm:ss'
        }
      }
    }
  };
  readonly ATTEMPT_INSTANCE_TRACE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('attempts')}, name: 'Tentative'}
    ],
    options: {
      chart: {
        id: 'line-4',
        group: 'group',
        animations: {
          enabled: false
        },
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: []
          },
          export: {
            csv: {
              columnDelimiter: ',',
              headerCategory: 'category',
              headerValue: 'value'
            }
          },
          autoSelected: 'zoom'
        }
      },
      xaxis: {
        labels: {
          datetimeUTC: false
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return this._decimalPipe.transform(value);
          }
        }
      },
      stroke: {
        curve: 'smooth',
        width: [1]
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        showForSingleSeries: true
      },
      tooltip: {
        x: {
          format: 'dd MMM HH:mm:ss'
        }
      }
    }
  };

  servers: string[] = [];
  instance: Partial<InstanceEnvironment> = {};
  instances: {id: string, appName: string, start: number, end: number}[] = [];
  usageResourceByPeriod: any[] = [];
  instanceTraceByPeriod: {date: Date, pending: number, attempts: number, traceCount: number, queueCapacity: number}[] = [];
  logEntryByPeriod: any[] = [];
  lastTrace: number;
  unavailableStat:  number = 0;
  traceStat:  number = 0;
  params: Partial<{instance: string, env: string, start: Date, end: Date}> = {};

  isLoading = false;
  isLoadingInstances = false;
  reloadInstances = true;
  activityDisplayType: 'TRACE' | 'ATTEMPT' | 'REPORT' = 'TRACE';

  ngOnInit() {
    this.onRouteChange();
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  onRouteChange(){
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, queryParams]) => {
        this.reloadInstances = !!(this.params.env && queryParams.env && this.params.env !== queryParams.env);
        this.params.instance = params.instance;
        this.params.env = queryParams.env;
        this.params.start = new Date(queryParams.start);
        this.params.end = new Date(queryParams.end);
        this.patchDateValue(this.params.start, this.params.end);
        if(this.reloadInstances){
          this.formGroup.patchValue({
            instance: null,
            server: null
          }, { emitEvent: false });
        }
        this.getInstances(this.params.start, this.params.end);
        this.getInstance();
      }
    });
  }

  onChangeStart(event) {
    this.formGroup.controls.range.controls.end.updateValueAndValidity({onlySelf: true});
    this.formGroup.controls.range.updateValueAndValidity({onlySelf: true});
    let start = this.formGroup.controls.range.controls.start.value;
    let end = this.formGroup.controls.range.controls.end.value || null;
    if(this.formGroup.controls.range.valid) {
      this.getInstances(start, end);
    }
  }

  onChangeEnd(event) {
    this.formGroup.controls.range.controls.start.updateValueAndValidity({onlySelf: true});
    this.formGroup.controls.range.updateValueAndValidity({onlySelf: true});
    let start = this.formGroup.controls.range.controls.start.value || null;
    let end = this.formGroup.controls.range.controls.end.value;
    if(this.formGroup.controls.range.valid) {
      this.getInstances(start, end);
    }
  }

  getInstances(start: Date, end: Date,) {
    this.instances = [];
    this.servers = [];
    this.isLoadingInstances = true;
    this._instanceService.getInstancesByPeriod({env: this.params.env, start: start, end: end})
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
    this.$destroy.next()
    this.isLoading = true;
    this.instance = null;
    this.usageResourceByPeriod = [];
    this.instanceTraceByPeriod = [];
    this.logEntryByPeriod = [];
    this.lastTrace = null;
    this.unavailableStat = 0;
    this.traceStat = 0;
    this._traceService.getInstance(this.params.instance)
    .pipe(switchMap(res => {
      if(res?.env !== this.params.env) {
        this._snackBar.open(`L'identifiant de cette instance ne correspond pas à l'environnement ${this.params.env}`, "Fermer",
            {
              horizontalPosition: "center",
              verticalPosition: "top",
              duration: 5000
            });
        return EMPTY;
      }
      this.instance = res;
      return forkJoin([
        this.instance.end ? of([]) : this._instanceTraceService.getLastInstanceTrace({instance: [this.params.instance]}),
        this._machineUsageService.getResourceMachineByPeriod({instance: this.params.instance, start: this.params.start, end: this.params.end}),
        this._instanceTraceService.getInstanceTraceByPeriod({instance: this.params.instance, start: this.params.start, end: this.params.end}),
        this._instanceTraceService.getPendingSum({instance: this.params.instance, date: this.params.start}),
        this._traceService.getLogEntryByPeriod(this.params.instance, this.params.start, this.params.end)
      ]);
    }),finalize(()=>(this.isLoading=false)), takeUntil(this.$destroy)).subscribe({
      next: ([last, usage, trace, pending, log]) => {
        this.usageResourceByPeriod = usage?.length ? usage.map(r => ({...r, date: new Date(r.date), maxHeap: this.instance.resource.maxHeap, diskTotalSpace: this.instance.resource.diskTotalSpace})) : [];
        let prv = pending;
        this.instanceTraceByPeriod =
          trace?.length
            ? trace.map((acc: any) => {
                acc.date = new Date(acc.date);
                acc.pending = (prv = acc.pending + prv);
                acc.queueCapacity = this.instance.configuration?.tracing?.queueCapacity;
                return acc;
              })
            : [];
        this.logEntryByPeriod = log.map(r => ({...r, date: this._datePipe.transform(r.instant * 1000, 'dd/MM/yyyy HH:mm:ss')}));
        this.lastTrace = last[0]?.date;
        this.getStatActivity();
      }
    });
  }

  open(row: any) {
    this._dialog.open(StacktraceDialogComponent, {
      data: { message: row.message, stackTraceRows: row.stacktrace }
    });
  }

  search() {
    if (this.formGroup.valid) {
      this.reloadInstances = false;
      this._router.navigate(['supervision','server', this.formGroup.controls.instance.value.id], {
        queryParams: { start: this.formGroup.controls.range.controls.start.getRawValue().toISOString(), end: this.formGroup.controls.range.controls.end.getRawValue().toISOString(), env: this.params.env, _reload: new Date().getTime() },
      });
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
      }
    });
  }

  getStatActivity() {
    this.unavailableStat = this.getUnavailableStat();
    this.traceStat = this.getCountStat();
  }

  getUnavailableStat(): number {
    const intervalMs = this.instance.configuration?.scheduling.interval ? this.instance.configuration.scheduling.interval * 1000 : null;
    if (!intervalMs) return;

    const maxStart = this.getMaxDate(new Date(this.instance.instant * 1000), this.formGroup.controls.range.controls.start.value);
    const minEnd = this.getMinDate(this.instance.end ? new Date(this.instance.end * 1000) : new Date(), this.formGroup.controls.range.controls.end.value);
    const traces = this.instanceTraceByPeriod.filter(t => t.traceCount !== null && t.traceCount !== undefined);

    let unavailable = 0;

    if (traces.length) {
      const diff = traces[0].date.getTime() - maxStart.getTime();
      if (diff > intervalMs) {
        let attempts = Math.trunc(diff / intervalMs) - 1;
        unavailable += (intervalMs / 1000) * attempts;
      }
    }

    let attempts = 0;
    for (let i = 0; i < traces.length - 1; i++) {
      if(traces[i].attempts > 1) {
        attempts = traces[i].attempts;
      } else {
        unavailable += (intervalMs / 1000) * attempts;
        attempts = 0;
        if(i > 0) {
          let diff = traces[i].date.getTime() - traces[i - 1].date.getTime();
          if(diff > intervalMs) {
            attempts = Math.trunc(diff / intervalMs) - 1;
          }
        }
      }
    }

    if (traces.length) {
      const diff = minEnd.getTime() - traces[traces.length - 1].date.getTime();
      if (diff > intervalMs) {
        let attempts = Math.trunc(diff / intervalMs) - 1;
        unavailable += (intervalMs / 1000) * attempts;
      }
    }
    return unavailable;
  }

  getCountStat(): number {
    return this.instanceTraceByPeriod.reduce((acc, curr) => {
      return acc + (curr.traceCount || 0);
    }, 0);
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

  onServerChange(){
    if(this.filtredInstances.length > 0) {
      const lastInstance = this.filtredInstances.reduce((a, b) => (a.start > b.start ? a : b), this.filtredInstances[0]);
      this.patchInstanceValue(lastInstance);
    }
  }

  get filtredInstances(){
    return this.instances.filter(s => s.appName == this.formGroup.controls.server?.value);
  }

}
