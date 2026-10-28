import {DecimalPipe} from '@angular/common';
import {Component, inject, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from '@angular/material/datepicker';
import {MatDialog} from '@angular/material/dialog';
import {ChartProvider, field} from '@oneteme/jquery-core';
import {TableProvider} from '@oneteme/jquery-table';
import {catchError, EMPTY, finalize, merge, Subject, switchMap, takeUntil, tap} from 'rxjs';
import {LogEntry} from '../../../../model/trace.model';
import {LogEntryService} from '../../../../service/jquery/log-entry.service';
import {InstanceTraceService, SequenceLossEvent} from '../../../../service/jquery/instance-trace.service';
import {PageTitleService} from '../../../../service/page-title.service';
import {InstanceService} from '../../../../service/jquery/instance.service';
import {StacktraceDialogComponent} from '../../../../shared/_component/exception-display/stacktrace-dialog/stacktrace-dialog.component';
import {LOG_TABLE_CONFIG} from '../../../../shared/_component/table/table.config';
import {app} from '../../../../../environments/environment';
import {getDefaultRelativePeriod} from '../../../../shared/period-filter';
import {IPeriod} from '../../../../model/conf.model';
import {CustomDateAdapter} from '../../../../shared/material/custom-date-adapter';
import {CustomDateRangeSelectionStrategy} from '../../../../shared/material/custom-date-range-selection-strategy';
import {MY_DATE_FORMATS} from '../../../../shared/shared.module';
import {ActivityPeriodGroup, activityPeriodManagement} from '../../../../shared/util';

interface ActivityFilters {
  namespace: string;
  start: Date;
  end: Date;
  app_name?: string[];
}

interface PeriodTraceRow {
  date: string | number;
  year?: string | number;
  traceCount: number | null;
  pending: number | null;
}

interface SequenceLossRow {
  date: string;
  seq: number;
  atm: number;
}

@Component({
  templateUrl: './server-activity.view.html',
  styleUrls: ['./server-activity.view.scss'],
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS},
    {provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy}
  ]
})
export class ServerActivityView implements OnDestroy {
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _logEntryService = inject(LogEntryService);
  private readonly _instanceTraceService = inject(InstanceTraceService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _pageTitleService = inject(PageTitleService);
  private readonly _decimalPipe = inject(DecimalPipe);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroy$ = new Subject<void>();

  readonly tableConfig: TableProvider<LogEntry> = LOG_TABLE_CONFIG;
  readonly formGroup = new FormGroup({
    range: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    }),
    appName: new FormControl<string[]>([], {nonNullable: true})
  });
  readonly appNameControl = this.formGroup.controls.appName;
  appNames: string[] = [];
  isLoadingApps = false;
  params: ActivityFilters = {
    namespace: app.defaultNamespace, start: new Date(), end: new Date()
  };
  groupedBy: ActivityPeriodGroup = 'hourMinute';
  instanceTraceByPeriod: PeriodTraceRow[] = [];
  sequenceLossData: SequenceLossRow[] = [];
  logEntryByPeriod: LogEntry[] = [];
  traceStat = 0;
  isLoading = false;
  isLoadingTrace = false;
  isLoadingSequenceLosses = false;
  isLoadingLogs = false;

  get sequenceLossPeriodsWithEvents(): number {
    return this.sequenceLossData.filter(row => row.seq > 0 || row.atm > 0).length;
  }

  readonly USAGE_INSTANCE_TRACE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 335,
    group: 'sync',
    groupSync: ['tooltip', 'datazoom'],
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field('date'), y: field('traceCount')}, name: 'Traitements finalisés'},
      {data: {x: field('date'), y: field('pending')}, name: 'Traitements en cours'}
    ],
    options: {
      animation: false,
      dataZoom: [{type: 'inside', xAxisIndex: 0}],
      xAxis: {axisLabel: {hideOverlap: true, rotate: 45}},
      yAxis: {axisLabel: {formatter: (value: number) => this._decimalPipe.transform(value)}},
      // Marqueurs visibles : une seule période (ex. une journée) reste affichée sur la courbe
      series: [{symbolSize: 6}, {symbolSize: 6}]
    }
  };

  readonly SEQUENCE_LOSS_BAR: ChartProvider<string, number> = {
    height: 335,
    series: [
      {data: {x: field('date'), y: field('seq')}, name: 'Séquences perdues'},
      {data: {x: field('date'), y: field('atm')}, name: 'Tentatives échouées'}
    ],
    options: {
      animation: false,
      xAxis: {type: 'category', name: 'Période', axisLabel: {hideOverlap: true, rotate: 45}},
      yAxis: {
        type: 'value',
        name: 'Nombre',
        minInterval: 1,
        axisLabel: {formatter: (value: number) => this._decimalPipe.transform(value)}
      },
      legend: {show: true},
      series: [
        {type: 'bar', itemStyle: {color: '#6366f1', borderRadius: [4, 4, 0, 0]}},
        {type: 'bar', itemStyle: {color: '#f59e0b', borderRadius: [4, 4, 0, 0]}}
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const item = Array.isArray(params) ? params[0] : params;
          const period = String(item?.axisValue ?? item?.name ?? '');
          const row = this.sequenceLossData.find(item => item.date === period);
          return `Période : ${period || '—'}<br/>` +
              `Séquences perdues : ${row?.seq ?? 0}<br/>` +
              `Tentatives échouées : ${row?.atm ?? 0}`;
        }
      }
    }
  };

  constructor() {
    this._pageTitleService.set({icon: 'admin_panel_settings', iconOutlined: true, title: 'Supervision du serveur'});
    this._route.queryParams.pipe(
        switchMap(queryParams => {
          const period = this.resolvePeriod(queryParams);
          const {start, end} = period;

          if (new Date(queryParams.start).getTime() !== start.getTime() ||
              new Date(queryParams.end).getTime() !== end.getTime()) {
            this._router.navigate([], {
              relativeTo: this._route,
              queryParams: {...period.buildParams(), step: null, from: null},
              queryParamsHandling: 'merge',
              replaceUrl: true
            });
            return EMPTY;
          }

          this.groupedBy = activityPeriodManagement(start, end);

          this.params = {
            namespace: queryParams.namespace || app.defaultNamespace,
            start,
            end,
            app_name: this.normalizeAppNames(queryParams.app_name)
          };
          this.formGroup.patchValue({
            range: {start, end},
            appName: this.params.app_name || []
          }, {emitEvent: false});
          this.isLoadingApps = true;
          this.resetActivityData();
          this.syncActivityChartCategories([]);
          this.syncSequenceLossCategories();
          this.isLoading = true;
          this.isLoadingTrace = true;
          this.isLoadingSequenceLosses = true;
          this.isLoadingLogs = true;

          return merge(
              this._instanceTraceService.getActivityByPeriod({...this.params, groupedBy: this.groupedBy}).pipe(
                  tap(trace => {
                    this.instanceTraceByPeriod = this.aggregateTraceByPeriod(trace);
                    this.syncActivityChartCategories(this.instanceTraceByPeriod);
                    this.traceStat = this.instanceTraceByPeriod.reduce((total, row) => total + (row.traceCount ?? 0), 0);
                  }),
                  catchError(() => EMPTY),
                  finalize(() => this.isLoadingTrace = false)
              ),
              this._instanceTraceService.getSequenceLossesByPeriod({...this.params, groupedBy: this.groupedBy}).pipe(
                  tap(sequenceLosses => {
                    this.sequenceLossData = this.aggregateSequenceLossByPeriod(sequenceLosses);
                    this.syncSequenceLossCategories();
                  }),
                  catchError(() => EMPTY),
                  finalize(() => this.isLoadingSequenceLosses = false)
              ),
              this._logEntryService.getActivityByPeriod(this.params).pipe(
                  tap(logs => this.logEntryByPeriod = logs),
                  catchError(() => EMPTY),
                  finalize(() => this.isLoadingLogs = false)
              ),
              this._instanceService.getInstancesByPeriod({namespace: this.params.namespace, start, end}).pipe(
                  tap(instances => {
                    this.appNames = [...new Set(instances.map(instance => instance.appName).filter(Boolean))];
                  }),
                  catchError(() => EMPTY),
                  finalize(() => this.isLoadingApps = false)
              )
          ).pipe(finalize(() => this.isLoading = false));
        }),
        takeUntil(this._destroy$)
    ).subscribe();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    this._pageTitleService.clear();
  }

  search(): void {
    const start = this.formGroup.controls.range.controls.start.value;
    const end = this.formGroup.controls.range.controls.end.value;
    if (!start || !end || start >= end || !this.formGroup.controls.range.valid) {
      return;
    }
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        start: start.toISOString(),
        end: end.toISOString(),
        step: null,
        from: null,
        app_name: this.appNameControl.value.length ? this.appNameControl.value : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: false
    });
  }

  openLogStacktrace(row: LogEntry): void {
    console.log(row)
    this._dialog.open(StacktraceDialogComponent, {
      data: {message: row.message, stackRows: row.stackRows}
    });
  }

  private resetActivityData(): void {
    this.appNames = [];
    this.instanceTraceByPeriod = [];
    this.sequenceLossData = [];
    this.logEntryByPeriod = [];
    this.traceStat = 0;
  }

  private normalizeAppNames(value: string | string[] | null | undefined): string[] | undefined {
    if (!value) return undefined;
    const names = (Array.isArray(value) ? value : value.split(','))
        .map(name => name.trim())
        .filter(Boolean);
    return names.length ? [...new Set(names)] : undefined;
  }

  private resolvePeriod(queryParams: { [key: string]: any }): IPeriod {
    if (queryParams.start && queryParams.end) {
      const start = new Date(queryParams.start);
      const end = new Date(queryParams.end);
      if (start < end) {
        return new IPeriod(start, end);
      }
    }
    const fallback = getDefaultRelativePeriod(24);
    return new IPeriod(fallback.start, fallback.end);
  }

  private getChartCategories(rows: {date: string | number}[]): string[] {
    // Conserver uniquement les dates reçues, dans l'ordre des résultats API.
    return [...new Set(rows
        .map(row => row.date)
        .filter(date => date !== null && date !== undefined && String(date).trim() !== '')
        .map(String))];
  }

  private finiteNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  private aggregateTraceByPeriod(rows: PeriodTraceRow[]): PeriodTraceRow[] {
    const periods = new Map<string, PeriodTraceRow>();
    rows.forEach(row => {
      if (row.date === null || row.date === undefined || String(row.date).trim() === '') return;
      const period = String(row.date);
      const current = periods.get(period) ?? {date: period, traceCount: null, pending: null};
      current.traceCount = (current.traceCount ?? 0) + this.finiteNumber(row.traceCount);
      if (row.pending !== null && row.pending !== undefined) {
        current.pending = (current.pending ?? 0) + this.finiteNumber(row.pending);
      }
      periods.set(period, current);
    });
    let cumulativePending = 0;
    let hasPendingValue = false;
    return [...periods.values()].map(row => {
      if (row.pending !== null) {
        cumulativePending += row.pending;
        hasPendingValue = true;
      }
      return {...row, pending: hasPendingValue ? cumulativePending : null};
    });
  }

  private aggregateSequenceLossByPeriod(events: SequenceLossEvent[]): SequenceLossRow[] {
    const periods = new Map<string, SequenceLossRow>();
    events.forEach(event => {
      if (event.date === null || event.date === undefined || String(event.date).trim() === '') return;
      // Une valeur négative correspond à un reset de séquence, pas à une perte
      const seq = Math.max(0, this.finiteNumber(event.seq));
      const atm = Math.max(0, this.finiteNumber(event.atm));
      if (seq === 0 && atm === 0) return;
      const period = String(event.date);
      const current = periods.get(period) ?? {date: period, seq: 0, atm: 0};
      current.seq += seq;
      current.atm += atm;
      periods.set(period, current);
    });
    return [...periods.values()];
  }

  private syncActivityChartCategories(rows: PeriodTraceRow[]): void {
    const categories = this.getChartCategories(rows);
    const xAxis = {type: 'category', data: categories};
    this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.series = [
      {data: {x: field('date'), y: field('traceCount')}, name: 'Traitements finalisés'},
      {data: {x: field('date'), y: field('pending')}, name: 'Traitements en cours'}
    ];
    this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options = {
      ...this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options,
      xAxis: {...(this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options?.xAxis as any), ...xAxis}
    };
  }


  private syncSequenceLossCategories(): void {
    this.SEQUENCE_LOSS_BAR.series = [
      {data: {x: field('date'), y: field('seq')}, name: 'Séquences perdues'},
      {data: {x: field('date'), y: field('atm')}, name: 'Tentatives échouées'}
    ];
    this.SEQUENCE_LOSS_BAR.options = {
      ...this.SEQUENCE_LOSS_BAR.options,
      xAxis: {
        ...(this.SEQUENCE_LOSS_BAR.options?.xAxis as any),
        data: this.getChartCategories(this.sequenceLossData)
      }
    };
  }
}
