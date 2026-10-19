import {DecimalPipe} from '@angular/common';
import {Component, inject, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from '@angular/material/datepicker';
import {ChartProvider, field} from '@oneteme/jquery-core';
import {catchError, finalize, forkJoin, of, Subject, switchMap, takeUntil, tap} from 'rxjs';
import {LogEntry} from '../../../../model/trace.model';
import {LogEntryService} from '../../../../service/jquery/log-entry.service';
import {InstanceTraceService, SequenceLossEvent} from '../../../../service/jquery/instance-trace.service';
import {PageTitleService} from '../../../../service/page-title.service';
import {InstanceService} from '../../../../service/jquery/instance.service';
import {app} from '../../../../../environments/environment';
import {getDefaultRelativePeriod} from '../../../../shared/period-filter';
import {IPeriod, IStep, IStepFrom} from '../../../../model/conf.model';
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
  [key: string]: any;
  traceCount: number;
  pending: number;
}

interface SequenceLossRow {
  [key: string]: any;
  seq: number;
  atm: number;
  eventCount: number;
  firstStart: number;
  lastStart: number;
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
  private readonly _destroy$ = new Subject<void>();

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
  instanceTraceByPeriod: any[] = [];
  retryOccurrencesHeatmapData: any[] = [];
  sequenceLossData: SequenceLossRow[] = [];
  logEntryByPeriod: LogEntry[] = [];
  traceStat = 0;
  isLoading = false;

  readonly USAGE_INSTANCE_TRACE_BY_PERIOD_LINE: ChartProvider<string, number> = {
    height: 335,
    group: 'sync',
    groupSync: ['tooltip', 'datazoom'],
    stacked: false,
    ytitle: '',
    series: [
      {data: {x: field(this.groupedBy), y: field('traceCount')}, name: 'Traitements finalisés'},
      {data: {x: field(this.groupedBy), y: field('pending')}, name: 'Traitements en cours'}
    ],
    options: {
      animation: false,
      dataZoom: [{type: 'inside', xAxisIndex: 0}],
      xAxis: {axisLabel: {hideOverlap: true}},
      yAxis: {axisLabel: {formatter: (value: number) => this._decimalPipe.transform(value)}},
      // Marqueurs visibles : une seule période (ex. une journée) reste affichée sur la courbe
      series: [{symbolSize: 6}, {symbolSize: 6}]
    }
  };

  readonly RETRY_OCCURRENCES_HEATMAP: ChartProvider<string, number> = {
    height: 335,
    series: [{data: {x: field(this.groupedBy), y: field('sum')}, name: field('appName')}],
    options: {
      animation: false,
      grid: {top: 12, bottom: 56, left: 12, right: 12, containLabel: true},
      xAxis: {type: 'category', axisLabel: {hideOverlap: true}},
      yAxis: {type: 'category', axisLabel: {hideOverlap: true}},
      visualMap: {
        dimension: 2,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        text: ['Élevé', 'Faible'],
        inRange: {color: ['#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a']}
      },
      series: [{
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 700,
          textBorderColor: '#7f1d1d',
          textBorderWidth: 1,
          formatter: (params: any) => params.value?.[2] > 0 ? params.value[2].toLocaleString('fr-FR') : ''
        },
        itemStyle: {borderColor: '#ffffff', borderWidth: 1}
      }],
      tooltip: {
        position: 'top',
        formatter: (params: any) => this.formatRetryOccurrencesTooltip(params)
      }
    }
  };

  readonly SEQUENCE_LOSS_BAR: ChartProvider<string, number> = {
    height: 335,
    series: [
      {data: {x: field(this.groupedBy), y: field('seq')}, name: 'Séquences perdues'},
      {data: {x: field(this.groupedBy), y: field('atm')}, name: 'Tentatives échouées'}
    ],
    options: {
      animation: false,
      xAxis: {type: 'category', name: 'Période', axisLabel: {hideOverlap: true}},
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
          const row = this.sequenceLossData.find(item => String(item[this.groupedBy]) === period);
          return `Période : ${period || '—'}<br/>` +
              `Date : ${row ? this.formatDateRange(row.firstStart, row.lastStart) : '—'}<br/>` +
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

          if (!queryParams.start || !queryParams.end) {
            const periodParams = period instanceof IPeriod
                ? period.buildParams()
                : {start: period.start.toISOString(), end: period.end.toISOString()};
            this._router.navigate([], {
              relativeTo: this._route,
              queryParams: periodParams,
              queryParamsHandling: 'merge',
              replaceUrl: true
            });
          }

          const start = period.start;
          const end = period.end;
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
          this.isLoading = true;

          return forkJoin({
            trace: this._instanceTraceService.getActivityByPeriod({...this.params, groupedBy: this.groupedBy}),
            retryOccurrences: this._instanceTraceService.getRetryOccurrencesHeatmap({
              ...this.params,
              groupedBy: this.groupedBy
            }),
            sequenceLosses: this._instanceTraceService.getSequenceLossesByPeriod({
              ...this.params,
              groupedBy: this.groupedBy
            }).pipe(catchError(() => of([]))),
            logs: this._logEntryService.getActivityByPeriod(this.params),
            instances: this._instanceService.getInstancesByPeriod({namespace: this.params.namespace, start, end})
          }).pipe(
              tap(({trace, retryOccurrences, sequenceLosses, logs, instances}) => {
                this.appNames = [...new Set(instances.map(instance => instance.appName).filter(Boolean))];
                this.instanceTraceByPeriod = this.aggregateTraceByPeriod(trace);

                this.retryOccurrencesHeatmapData = retryOccurrences
                    .filter(row => row[this.groupedBy] !== null && row[this.groupedBy] !== undefined && Number.isFinite(Number(row.sum)))
                    .map(row => ({
                      ...row,
                      [this.groupedBy]: String(row[this.groupedBy]),
                      appName: row.appName || 'Application inconnue',
                      sum: Number(row.sum) || 0
                    }));
                this.sequenceLossData = this.aggregateSequenceLossByPeriod(sequenceLosses);
                this.syncActivityChartCategories(this.instanceTraceByPeriod);
                this.syncRetryOccurrencesCategories();
                this.syncSequenceLossCategories();
                this.logEntryByPeriod = logs;
                this.traceStat = trace.reduce((total, row) => total + (row.traceCount || 0), 0);
              }),
              catchError(() => {
                this.resetActivityData();
                this.syncActivityChartCategories([]);
                this.syncRetryOccurrencesCategories();
                this.syncSequenceLossCategories();
                return of(null);
              }),
              finalize(() => {
                this.isLoading = false;
                this.isLoadingApps = false;
              })
          );
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
    if (!start || !end || !this.formGroup.controls.range.valid) {
      return;
    }
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        start: start.toISOString(),
        end: end.toISOString(),
        app_name: this.appNameControl.value.length ? this.appNameControl.value : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: false
    });
  }

  private resetActivityData(): void {
    this.instanceTraceByPeriod = [];
    this.retryOccurrencesHeatmapData = [];
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

  private resolvePeriod(queryParams: { [key: string]: any }): IPeriod | IStep | IStepFrom {
    if (queryParams.start && queryParams.end) {
      const start = new Date(queryParams.start);
      const end = new Date(queryParams.end);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        return new IPeriod(start, end);
      }
    } else if (queryParams.step && queryParams.from) {
      return new IStepFrom(Number(queryParams.step), Number(queryParams.from));
    } else if (queryParams.step) {
      return new IStep(Number(queryParams.step));
    }
    return getDefaultRelativePeriod();
  }

  private formatRetryOccurrencesTooltip(params: any): string {
    // La heatmap fournit [indexPériode, indexApplication, valeur].
    const [periodIndex, appIndex, sum = 0] = params.value ?? [];
    const options = this.RETRY_OCCURRENCES_HEATMAP.options;
    const period = (options?.xAxis as {data?: string[]})?.data?.[periodIndex] ?? '';
    const appName = (options?.yAxis as {data?: string[]})?.data?.[appIndex] || 'Application inconnue';
    return `${appName}<br/>${period}<br/>` +
        `<strong>${Number(sum).toLocaleString('fr-FR')} occurrences</strong>`;
  }

  private aggregateTraceByPeriod(rows: PeriodTraceRow[]): PeriodTraceRow[] {
    const periods = new Map<string, PeriodTraceRow>();
    rows.forEach(row => {
      const period = row[this.groupedBy].toString();
      if (period === null || period === undefined) return;
      const key = String(period);
      const current: PeriodTraceRow = periods.get(key) ?? {[this.groupedBy]: period, traceCount: 0, pending: 0};
      current.traceCount += Number(row.traceCount) || 0;
      current.pending += Number(row.pending) || 0;
      periods.set(key, current);
    });
    return [...periods.values()];
  }

  private aggregateSequenceLossByPeriod(events: SequenceLossEvent[]): SequenceLossRow[] {
    const periods = new Map<string, SequenceLossRow>();
    events.forEach(event => {
      const period = (event as SequenceLossEvent & Record<string, any>)[this.groupedBy]?.toString();
      const timestamp = Number(event.start);
      // Une valeur négative correspond à un reset de séquence, pas à une perte
      const seq = Math.max(0, Number(event.seq) || 0);
      const atm = Math.max(0, Number(event.atm) || 0);
      if (period === null || period === undefined || !Number.isFinite(timestamp) || (seq === 0 && atm === 0)) return;
      const key = String(period);
      const current: SequenceLossRow = periods.get(key) ?? {
        [this.groupedBy]: period, seq: 0, atm: 0, eventCount: 0, firstStart: timestamp, lastStart: timestamp
      };
      current.seq += seq;
      current.atm += atm;
      current.eventCount += 1;
      current.firstStart = Math.min(current.firstStart, timestamp);
      current.lastStart = Math.max(current.lastStart, timestamp);
      periods.set(key, current);
    });
    return [...periods.values()];
  }

  private formatDateRange(first: number, last: number): string {
    const from = new Date(first).toLocaleString('fr-FR');
    return first === last ? from : `${from} → ${new Date(last).toLocaleString('fr-FR')}`;
  }

  private syncActivityChartCategories(rows: any[]): void {
    const categories = [...new Set(rows
        .map(row => row[this.groupedBy].toString())
        .filter(value => value !== null && value !== undefined))];
    const xAxis = {type: 'category', data: categories};
    this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.series = [
      {data: {x: field(this.groupedBy), y: field('traceCount')}, name: 'Traitements finalisés'},
      {data: {x: field(this.groupedBy), y: field('pending')}, name: 'Traitements en cours'}
    ];
    this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options = {
      ...this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options,
      xAxis: {...(this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options?.xAxis as any), ...xAxis}
    };
  }

  private syncRetryOccurrencesCategories(): void {
    const categories = [...new Set(this.retryOccurrencesHeatmapData.map(row => row[this.groupedBy]))];
    const appCategories = [...new Set(this.retryOccurrencesHeatmapData.map(row => row.appName || 'Application inconnue'))];
    this.RETRY_OCCURRENCES_HEATMAP.series = [
      {data: {x: field(this.groupedBy), y: field('sum')}, name: field('appName')}
    ];
    this.RETRY_OCCURRENCES_HEATMAP.options = {
      ...this.RETRY_OCCURRENCES_HEATMAP.options,
      xAxis: {...(this.RETRY_OCCURRENCES_HEATMAP.options?.xAxis as any), data: categories},
      yAxis: {...(this.RETRY_OCCURRENCES_HEATMAP.options?.yAxis as any), data: appCategories}
    };
  }

  private syncSequenceLossCategories(): void {
    this.SEQUENCE_LOSS_BAR.series = [
      {data: {x: field(this.groupedBy), y: field('seq')}, name: 'Séquences perdues'},
      {data: {x: field(this.groupedBy), y: field('atm')}, name: 'Tentatives échouées'}
    ];
    this.SEQUENCE_LOSS_BAR.options = {
      ...this.SEQUENCE_LOSS_BAR.options,
      xAxis: {
        ...(this.SEQUENCE_LOSS_BAR.options?.xAxis as any),
        data: [...new Set(this.sequenceLossData
            .map(row => row[this.groupedBy])
            .filter(value => value !== null && value !== undefined))]
      }
    };
  }
}

