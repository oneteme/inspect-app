import {Component, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {combineLatest, EMPTY, finalize, forkJoin, map, of, Subject, switchMap, takeUntil} from "rxjs";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {TraceService} from "../../service/trace.service";
import {InstanceEnvironment, StackTraceRow} from "../../model/trace.model";
import {MachineUsageService} from "../../service/jquery/resource-usage.service";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {InstanceTraceService} from "../../service/jquery/instance-trace.service";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {DatePipe, DecimalPipe} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {StacktraceDialogComponent} from "./_component/stacktrace-dialog/stacktrace-dialog.component";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../shared/material/custom-date-range-selection-strategy";
import {EnvRouter} from "../../service/router.service";
import {ConfigDialogComponent} from "./_component/config-dialog/config-dialog.component";
import {InstanceService} from "../../service/jquery/instance.service";

@Component({
  templateUrl: './supervision.view.html',
  styleUrls: ['./supervision.view.scss'],
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
export class SupervisionView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _traceService = inject(TraceService);
  private readonly _machineUsageService = inject(MachineUsageService);
  private readonly _instanceTraceService = inject(InstanceTraceService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _dialog = inject(MatDialog);
  private _decimalPipe: DecimalPipe = inject(DecimalPipe);
  private readonly _datePipe = inject(DatePipe);
  private readonly $destroy = new Subject<void>();

  readonly formGroup = new FormGroup({
    range: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    }),
    server: new FormControl< {id: string, appName: string, start: number, end: number} | null>(null, [Validators.required])
  });

  readonly USAGE_RESOURCE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('usedHeap')}, name: 'Utilisée'},
      {data: {x: field('date'), y: field('commitedHeap')}, name: 'Allouée'},
      {data: {x: field('date'), y: field('maxHeap')}, name: 'Maximum', type: 'area'}
    ],
    options: {
      chart: {
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
  readonly USAGE_DISK_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 300,
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('usedDiskSpace')}, name: 'Utilisée'},
      {data: {x: field('date'), y: field('diskTotalSpace')}, name: 'Maximum', type: 'area', color: '#FEB019'}
    ],
    options: {
      chart: {
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
        type: ['solid', 'gradient'],
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
        dashArray: [0,5],
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

  instance: Partial<InstanceEnvironment> = {};
  instances: {id: string, appName: string, start: number, end: number}[] = [];
  usageResourceByPeriod: any[] = [];
  instanceTraceByPeriod: any[] = [];
  logEntryByPeriod: any[] = [];
  unavailableStat:  number = 0;
  traceStat:  number = 0;
  params: Partial<{instance: string, env: string, start: Date, end: Date}> = {};

  displayedColumns: string[] = ['date', 'level', 'message', 'action'];
  dataSource: MatTableDataSource<{ date: string, level: string, message: string, stacktrace: StackTraceRow[] }> = new MatTableDataSource([]);

  isLoading = false;
  isLoadingInstances = false;
  isInactiveInstance = false;
  reloadInstances = true;
  displayLogEntries = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sort') sort: MatSort;

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
        this.reloadInstances = this.reloadInstances || this.params.env != queryParams.env;
        this.params.instance = params.instance;
        this.params.env = queryParams.env;
        this.params.start = new Date(queryParams.start);
        this.params.end = new Date(queryParams.end);
        this.patchDateValue(this.params.start, this.params.end);
        if(this.reloadInstances) {
          this.getInstances(this.params.start, this.params.end);
        }
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

  getInstances(start: Date, end: Date) {
    this.isLoadingInstances = true;
    this._instanceService.getInstancesByPeriod({env: this.params.env, start: start, end: end})
    .pipe(finalize(() => this.isLoadingInstances = false))
    .subscribe({
        next: res => {
          this.instances = res;
          this.patchServerValue(this.instances.find(i => i.id == this.params.instance))
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
    this.unavailableStat = 0;
    this.traceStat = 0;
    this.dataSource = new MatTableDataSource([]);
    this._traceService.getInstance(this.params.instance)
    .pipe(switchMap(res => {
      this.instance = res;
      return forkJoin([
        this.instance.end ? of(null) : this._instanceTraceService.getLastInstanceTrace({instance: this.params.instance}),
        this._machineUsageService.getResourceMachineByPeriod({instance: this.params.instance, start: this.params.start, end: this.params.end}),
        this._instanceTraceService.getInstanceTraceByPeriod({instance: this.params.instance, start: this.params.start, end: this.params.end}),
        this._traceService.getLogEntryByPeriod(this.params.instance, this.params.start, this.params.end)
      ]);
    }), finalize(() => this.isLoading = false), takeUntil(this.$destroy)).subscribe({
      next: ([last, usage, trace, log]) => {
        this.usageResourceByPeriod = usage.map(r => ({...r, date: new Date(r.date), maxHeap: this.instance.resource.maxHeap, diskTotalSpace: this.instance.resource.diskTotalSpace}));
        this.instanceTraceByPeriod = trace.map(r => ({...r, date: new Date(r.date), queueCapacity: this.instance.configuration?.tracing?.queueCapacity}));
        this.logEntryByPeriod = log.map(r => ({...r, date: this._datePipe.transform(r.instant * 1000, 'dd/MM/yyyy HH:mm:ss')}));
        this.dataSource = new MatTableDataSource(this.logEntryByPeriod);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        if(last && last[0].date && this.instance.configuration?.scheduling?.interval) {
          this.isInactiveInstance =  (new Date(last[0].date) < new Date(new Date().getTime() - (this.instance.configuration.scheduling.interval + 60) * 1000));
        }
        this.getStatActivity();
      }
    });
  }

  open(row: { date: string, level: string, message: string, stacktrace: StackTraceRow[] }) {
    this._dialog.open(StacktraceDialogComponent, {
      data: row
    });
  }

  search() {
    if (this.formGroup.valid) {
      this.reloadInstances = false;
      this._router.navigate(['supervision', this.formGroup.controls.server.value.id], {
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

  patchServerValue(instance: {id: string, appName: string, start: number, end: number}) {
    this.formGroup.patchValue({
      server: instance
    }, { emitEvent: false });
  }

  openConfig() {
    this._dialog.open(ConfigDialogComponent, {
      data: this.instance.configuration
    });
  }

  openLog() {
    this.displayLogEntries = !this.displayLogEntries;
  }

  getStatActivity() {
    let start = this.instanceTraceByPeriod[0]?.date;
    let end = this.instanceTraceByPeriod[this.instanceTraceByPeriod.length - 1]?.date;
    if(this.instance.configuration?.scheduling?.interval) this.unavailableStat = (1 - Math.floor(this.instanceTraceByPeriod.length / ((end - start + (30 * 1000)) / (this.instance.configuration.scheduling.interval * 1000)))) * 100;
    this.traceStat = this.instanceTraceByPeriod.reduce((acc, curr) => {
      return acc + curr.traceCount;
    }, 0)
  }
}