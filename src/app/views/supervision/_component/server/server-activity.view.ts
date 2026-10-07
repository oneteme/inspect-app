import {DecimalPipe} from '@angular/common';
import {Component, inject, OnDestroy} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from '@angular/material/datepicker';
import {ChartProvider, field} from '@oneteme/jquery-core';
import {TableProvider} from '@oneteme/jquery-table';
import {catchError, finalize, forkJoin, of, Subject, switchMap, takeUntil, tap} from 'rxjs';
import {LogEntry} from '../../../../model/trace.model';
import {LogEntryService} from '../../../../service/jquery/log-entry.service';
import {InstanceTraceService, SequenceActivityEvent} from '../../../../service/jquery/instance-trace.service';
import {PageTitleService} from '../../../../service/page-title.service';
import {InstanceService} from '../../../../service/jquery/instance.service';
import {app} from '../../../../../environments/environment';
import {getDefaultRelativePeriod} from '../../../../shared/period-filter';
import {IPeriod, IStep, IStepFrom} from '../../../../model/conf.model';
import {CustomDateAdapter} from '../../../../shared/material/custom-date-adapter';
import {CustomDateRangeSelectionStrategy} from '../../../../shared/material/custom-date-range-selection-strategy';
import {MY_DATE_FORMATS} from '../../../../shared/shared.module';
import {ActivityPeriodGroup, activityPeriodManagement} from '../../../../shared/util';
import {DEFAULT_TABLE_CONFIG} from '../../../../shared/_component/table/table.config';

interface AttemptDistributionRow {
  appName: string;
  attempts: number;
  attemptsLabel: string;
  count: number;
}

interface ActivityFilters {
  namespace: string;
  start: Date;
  end: Date;
  app_name?: string[];
}

interface SequenceDiagnosticRow extends Omit<SequenceActivityEvent, 'date'> {
  date: Date;
  previousSequence: number | null;
  sequenceDelta: number | null;
  anomalyLabels: string[];
  eventLabel: string;
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
  attemptHeatmapData: any[] = [];
  sequenceAnomalies: SequenceDiagnosticRow[] = [];
  attemptDistributionData: AttemptDistributionRow[] = [];
  sequenceGapData: SequenceDiagnosticRow[] = [];
  retryReceptionCount = 0;
  retryTotal = 0;
  sequenceDiagnosticUnavailable = false;
  logEntryByPeriod: LogEntry[] = [];
  traceStat = 0;
  attemptStat = 0;
  isLoading = false;
  errorMessage = '';

  readonly sequenceAnomaliesTableConfig: TableProvider<SequenceDiagnosticRow> = {
    ...DEFAULT_TABLE_CONFIG,
    labels: {
      ...DEFAULT_TABLE_CONFIG.labels,
      empty: 'Aucune répétition, tentative supplémentaire ou rupture observée dans la période.'
    },
    columns: [
      {
        key: 'date', header: 'Date', groupable: false, sliceable: false,
        sortValue: row => row.date.getTime(),
        searchValue: row => row.date.toLocaleString('fr-FR')
      },
      {
        key: 'appName', header: 'Application / instance',
        searchValue: row => `${row.appName} ${row.instanceId}`
      },
      {key: 'sequence', header: 'Séquence'},
      {key: 'previousSequence', header: 'Précédente'},
      {key: 'sequenceDelta', header: 'Écart'},
      {key: 'attempts', header: 'Tentatives'},
      {key: 'pending', header: 'Pending'},
      {key: 'traceCount', header: 'Traces'},
      {
        key: 'anomalyLabels', header: 'Diagnostic', groupable: false, sliceable: false,
        value: row => row.anomalyLabels.join(', '),
        searchValue: row => row.anomalyLabels.join(', ')
      }
    ]
  };

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
      yAxis: {axisLabel: {formatter: (value: number) => this._decimalPipe.transform(value)}}
    }
  };

  readonly ATTEMPT_INSTANCE_TRACE_BY_APP_HEATMAP: ChartProvider<string, number> = {
    height: 335,
    series: [{data: {x: field(this.groupedBy), y: field('attempts')}, name: field('appName')}],
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
        inRange: {color: ['#ddd6fe', '#a78bfa', '#7c3aed', '#5b21b6', '#3b0764']}
      },
      series: [{
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 700,
          textBorderColor: '#4c1d95',
          textBorderWidth: 1,
          formatter: (params: any) => params.value?.[2] > 0 ? params.value[2].toLocaleString('fr-FR') : ''
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(76, 29, 149, 0.4)'
          }
        }
      }],
      tooltip: {
        position: 'top',
        formatter: (params: any) => this.formatAttemptHeatmapTooltip(params)
      }
    }
  };

  readonly ATTEMPT_DISTRIBUTION_BAR: ChartProvider<string, number> = {
    height: 335,
    series: [{data: {x: field('attempts'), y: field('count')}, name: field('appName')}],
    options: {
      animation: false,
      xAxis: {
        type: 'category',
        name: 'Tentatives par réception',
        axisLabel: {
          hideOverlap: true,
          formatter: (value: number | string) => Number(value) === 3 ? '3+' : String(value)
        }
      },
      yAxis: {type: 'value', name: 'Nombre de réceptions', minInterval: 1, axisLabel: {formatter: (value: number) => this._decimalPipe.transform(value)}},
      legend: {show: true},
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const category = params.data?.attempts ?? params.name ??
            (Array.isArray(params.value) ? params.value[0] : '');
          const categoryLabel = Number(category) === 3 ? '3+' : String(category);
          const appName = params.data?.appName ?? params.seriesName;
          const row = this.attemptDistributionData.find(item =>
            item.appName === appName && item.attemptsLabel === categoryLabel
          );
          const rawCount = Array.isArray(params.value) ? params.value[1] : params.value;
          const count = Number(params.data?.count ?? row?.count ?? params.data?.value ?? rawCount ?? 0);
          return `<strong>${row?.appName || appName || 'Application inconnue'}</strong><br/>` +
            `Tentatives par réception : ${categoryLabel || row?.attemptsLabel || '—'}<br/>` +
            `Réceptions : ${count.toLocaleString('fr-FR')}`;
        }
      }
    }
  };

  readonly SEQUENCE_GAP_BAR: ChartProvider<string, number> = {
    height: 335,
    series: [{data: {x: field('eventLabel'), y: field('sequenceDelta')}, name: field('appName')}],
    options: {
      animation: false,
      dataZoom: [{type: 'inside', xAxisIndex: 0}],
      xAxis: {type: 'category', name: 'Événement', axisLabel: {hideOverlap: true}},
      yAxis: {type: 'value', name: 'Écart de séquence', axisLabel: {formatter: (value: number) => this._decimalPipe.transform(value)}},
      legend: {show: true},
      series: [{type: 'bar'}],
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const eventLabel = String(params.data?.eventLabel ?? params.name ?? params.axisValue ??
            (Array.isArray(params.value) ? params.value[0] : ''));
          const row = this.sequenceGapData.find(item => item.eventLabel === eventLabel &&
            item.appName === (params.data?.appName ?? params.seriesName)) ||
            this.sequenceGapData.find(item => item.eventLabel === eventLabel);
          const rawDelta = Array.isArray(params.value) ? params.value[1] : params.value;
          return `<strong>${row?.appName || 'Application inconnue'}</strong><br/>` +
            `Instance : ${row?.instanceId || 'inconnue'}<br/>` +
            `Date : ${row?.date?.toLocaleString('fr-FR') || ''}<br/>` +
            `Séquence : ${row?.sequence ?? ''} (précédente : ${row?.previousSequence ?? '—'})<br/>` +
            `Écart : ${row?.sequenceDelta ?? rawDelta ?? '—'}<br/>` +
            `Tentatives : ${row?.attempts ?? 0}`;
        }
      }
    }
  };

  constructor() {
    this._pageTitleService.set({icon: 'activity_zone', iconOutlined: true, title: 'Activité'});
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
        this.sequenceDiagnosticUnavailable = false;
        this.syncActivityChartCategories([]);
        this.isLoading = true;
        this.errorMessage = '';

        return forkJoin({
          trace: this._instanceTraceService.getActivityByPeriod({...this.params, groupedBy: this.groupedBy}),
          events: this._instanceTraceService.getSequenceEventsByPeriod(this.params).pipe(catchError(() => {
            this.sequenceDiagnosticUnavailable = true;
            return of([]);
          })),
          logs: this._logEntryService.getActivityByPeriod(this.params),
          instances: this._instanceService.getInstancesByPeriod({namespace: this.params.namespace, start, end})
        }).pipe(
          tap(({trace, events, logs, instances}) => {
            this.appNames = [...new Set(instances.map(instance => instance.appName).filter(Boolean))];
            this.instanceTraceByPeriod = trace.map(row => ({
              ...row,
              appName: row.appName || 'Application inconnue'
            }));
            this.attemptHeatmapData = this.instanceTraceByPeriod
              .filter(row => Number.isFinite(row.attempts))
              .map(row => ({...row, attempts: row.attempts || 0}));
            this.sequenceAnomalies = this.buildSequenceDiagnostics(events);
            this.attemptDistributionData = this.buildAttemptDistribution(events);
            this.sequenceGapData = this.sequenceAnomalies
              .filter(row => row.sequenceDelta !== null && row.sequenceDelta !== 1)
              .sort((a, b) => a.date.getTime() - b.date.getTime());
            this.retryReceptionCount = events.filter(row => Number(row.attempts) > 1).length;
            this.retryTotal = 0;
            events.forEach(row => {
              this.retryTotal += Math.max(0, Number(row.attempts) - 1 || 0);
            });
            this.syncAttemptDistributionCategories();
            this.syncSequenceGapCategories();
            this.syncActivityChartCategories(this.instanceTraceByPeriod);
            this.logEntryByPeriod = logs;
            this.traceStat = trace.reduce((total, row) => total + (row.traceCount || 0), 0);
            this.attemptStat = trace.reduce((total, row) => total + (row.attempts || 0), 0);
          }),
          catchError(() => {
            this.resetActivityData();
            this.syncAttemptDistributionCategories();
            this.syncSequenceGapCategories();
            this.syncActivityChartCategories([]);
            this.errorMessage = 'Impossible de charger l’activité.';
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
    this.attemptHeatmapData = [];
    this.sequenceAnomalies = [];
    this.attemptDistributionData = [];
    this.sequenceGapData = [];
    this.logEntryByPeriod = [];
    this.retryReceptionCount = 0;
    this.retryTotal = 0;
    this.traceStat = 0;
    this.attemptStat = 0;
  }

  private normalizeAppNames(value: string | string[] | null | undefined): string[] | undefined {
    if (!value) return undefined;
    const names = (Array.isArray(value) ? value : value.split(','))
      .map(name => name.trim())
      .filter(Boolean);
    return names.length ? [...new Set(names)] : undefined;
  }

  private resolvePeriod(queryParams: {[key: string]: any}): IPeriod | IStep | IStepFrom {
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

  private formatAttemptHeatmapTooltip(params: any): string {
    const candidate = Array.isArray(params.value) ? params.value : params.data?.value;
    const values = Array.isArray(candidate) ? candidate : [];
    const rows = this.attemptHeatmapData;
    const apps = [...new Set(rows.map(row => String(row.appName || 'Application inconnue')))];
    const periods = [...new Set(rows.map(row => row[this.groupedBy]))];
    const appName = this.resolveHeatmapAppName(params.data?.appName ?? values[1], apps, params.seriesName);

    const rawPeriod = params.data?.[this.groupedBy] ?? values[0] ?? params.axisValue;
    const hasPeriod = periods.some(period => String(period) === String(rawPeriod));
    const period = !hasPeriod && typeof rawPeriod === 'number' ? periods[rawPeriod] : rawPeriod;
    const row = rows.find(item =>
      String(item.appName) === appName && String(item[this.groupedBy]) === String(period)
    );
    const attempts = Number(row?.attempts ?? values[2] ?? params.data?.attempts ?? 0);

    return `${row?.appName || appName || 'Application inconnue'}<br/>` +
      `${row?.[this.groupedBy] ?? period ?? ''}<br/>` +
      `<strong>${attempts.toLocaleString('fr-FR')} tentatives</strong>`;
  }

  private resolveHeatmapAppName(rawApp: any, apps: string[], seriesName: any): string {
    const appName = String(rawApp ?? seriesName ?? '');
    if (apps.includes(String(rawApp))) return appName;

    const appIndex = Number(rawApp);
    if (Number.isInteger(appIndex) && String(rawApp).trim() !== '') {
      return apps[appIndex] || String(seriesName || '');
    }
    return rawApp == null ? String(seriesName || '') : appName;
  }

  private buildAttemptDistribution(events: SequenceActivityEvent[]): AttemptDistributionRow[] {
    const counts = new Map<string, AttemptDistributionRow>();
    events.forEach(event => {
      const attempts = Math.max(1, Math.floor(Number(event.attempts) || 1));
      const bucket = Math.min(attempts, 3);
      const attemptsLabel = bucket === 3 ? '3+' : String(bucket);
      const appName = event.appName || 'Application inconnue';
      const key = `${appName}\u0000${attemptsLabel}`;
      const current = counts.get(key) || {appName, attempts: bucket, attemptsLabel, count: 0};
      current.count++;
      counts.set(key, current);
    });

    const appNames = [...new Set(events.map(event => event.appName || 'Application inconnue'))]
      .sort((a, b) => a.localeCompare(b));
    console.log(appNames.flatMap(appName => [1, 2, 3].map(attempts => {
      const attemptsLabel = attempts === 3 ? '3+' : String(attempts);
      const key = `${appName}\u0000${attemptsLabel}`;
      return counts.get(key) || {appName, attempts, attemptsLabel, count: 0};
    })))
    return appNames.flatMap(appName => [1, 2, 3].map(attempts => {
      const attemptsLabel = attempts === 3 ? '3+' : String(attempts);
      const key = `${appName}\u0000${attemptsLabel}`;
      return counts.get(key) || {appName, attempts, attemptsLabel, count: 0};
    }));
  }

  private buildSequenceDiagnostics(events: SequenceActivityEvent[]): SequenceDiagnosticRow[] {
    const byInstance = new Map<string, SequenceActivityEvent[]>();
    events.forEach(event => {
      const instanceId = String(event.instanceId || event.appName || 'instance inconnue');
      const sequence = Number(event.sequence);
      const date = Number(event.date);
      if (!Number.isFinite(sequence) || !Number.isFinite(date)) return;
      const key = `${event.appName || 'Application inconnue'}\u0000${instanceId}`;
      const rows = byInstance.get(key) || [];
      rows.push({...event, sequence, date});
      byInstance.set(key, rows);
    });

    const diagnostics: SequenceDiagnosticRow[] = [];
    byInstance.forEach(rows => {
      rows.sort((a, b) => a.date - b.date);
      let previousSequence: number | null = null;
      const seen = new Set<number>();
      rows.forEach((event, eventIndex) => {
        const instanceId = String(event.instanceId || event.appName || 'instance inconnue');
        const sequence = Number(event.sequence);
        const sequenceDelta = previousSequence === null ? null : sequence - previousSequence;
        const anomalyLabels: string[] = [];
        if (Number(event.attempts) > 1) anomalyLabels.push('Retries observés');
        if (seen.has(sequence)) anomalyLabels.push('Séquence répétée');
        if (sequenceDelta !== null && sequenceDelta > 1) anomalyLabels.push(`Saut observé (+${sequenceDelta - 1})`);
        if (sequenceDelta !== null && sequenceDelta < 0) anomalyLabels.push('Retour / reset possible');
        diagnostics.push({
          ...event,
          date: new Date(Number(event.date)),
          previousSequence,
          sequenceDelta,
          anomalyLabels,
          eventLabel: `${new Date(Number(event.date)).toLocaleString('fr-FR')} · ${instanceId.slice(-6)} · #${sequence} · ${eventIndex + 1}`
        });
        seen.add(sequence);
        previousSequence = sequence;
      });
    });

    return diagnostics.filter(row => row.anomalyLabels.length > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private syncAttemptDistributionCategories(): void {
    const apps = [...new Set(this.attemptDistributionData.map(row => row.appName))];
    this.ATTEMPT_DISTRIBUTION_BAR.options = {
      ...this.ATTEMPT_DISTRIBUTION_BAR.options,
      xAxis: {...(this.ATTEMPT_DISTRIBUTION_BAR.options?.xAxis as any), data: [1, 2, 3]},
      series: apps.map(() => ({
        type: 'bar',
        barMinHeight: 3,
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const value = Number(Array.isArray(params.value) ? params.value[1] : params.value);
            return value > 0 ? value.toLocaleString('fr-FR') : '';
          }
        }
      }))
    };
  }

  private syncSequenceGapCategories(): void {
    const categories = this.sequenceGapData.map(row => row.eventLabel);
    this.SEQUENCE_GAP_BAR.series = [
      {data: {x: field('eventLabel'), y: field('sequenceDelta')}, name: field('appName')}
    ];
    this.SEQUENCE_GAP_BAR.options = {
      ...this.SEQUENCE_GAP_BAR.options,
      xAxis: {...(this.SEQUENCE_GAP_BAR.options?.xAxis as any), data: categories}
    };
  }

  private syncActivityChartCategories(rows: any[]): void {
    const categories = [...new Set(rows
      .map(row => row[this.groupedBy])
      .filter(value => value !== null && value !== undefined))];
    const appCategories = [...new Set(rows.map(row => row.appName || 'Application inconnue'))];
    const xAxis = {type: 'category', data: categories};

    this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.series = [
      {data: {x: field(this.groupedBy), y: field('traceCount')}, name: 'Traitements finalisés'},
      {data: {x: field(this.groupedBy), y: field('pending')}, name: 'Traitements en cours'}
    ];
    this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options = {
      ...this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options,
      xAxis: {...(this.USAGE_INSTANCE_TRACE_BY_PERIOD_LINE.options?.xAxis as any), ...xAxis}
    };
    this.ATTEMPT_INSTANCE_TRACE_BY_APP_HEATMAP.series = [
      {data: {x: field(this.groupedBy), y: field('attempts')}, name: field('appName')}
    ];
    this.ATTEMPT_INSTANCE_TRACE_BY_APP_HEATMAP.options = {
      ...this.ATTEMPT_INSTANCE_TRACE_BY_APP_HEATMAP.options,
      xAxis: {...(this.ATTEMPT_INSTANCE_TRACE_BY_APP_HEATMAP.options?.xAxis as any), ...xAxis},
      yAxis: {...(this.ATTEMPT_INSTANCE_TRACE_BY_APP_HEATMAP.options?.yAxis as any), data: appCategories}
    };
  }

}



