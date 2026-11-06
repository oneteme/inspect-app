import {ChangeDetectorRef, Component, inject, Input, ViewChild} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {finalize, Observable, of} from "rxjs";
import {buildFilterSelections, toFilterValues,
  ChartConfig,
  STARTUP_SESSION_PERFORMANCE_CHART_CONFIG,
  STARTUP_SESSION_STATUS_CHART_CONFIG,
  buildSeries,
  lineTypeOptions,
  pivotByStack
} from "../../kpi.config";
import {periodManagement, formatChartDates, buildPeriodSliceDisplay, resolvePeriodGranularity} from "../../../../shared/util";
import {MainSessionService} from "../../../../service/jquery/main-session.service";
import {ChartComponent, selectBestScale} from "@oneteme/jquery-echarts";
import {OrganizerChartBinding, OrganizerChartBridgeOptions, OrganizerConfig, OrganizerButtonEvent, OrganizerSliceState, OrganizerState, OrganizerXOption, buildOrganizerChartBinding, handleOrganizerChartEvent} from "@oneteme/jquery-organizer";
import {DatePipe} from "@angular/common";
import {ChartProvider, buildPeriodOptions, remapSliceKeys} from "@oneteme/jquery-core";
import {STATUS_CHART_PROVIDER_BASE} from "../../kpi.constants";
import {withKpiChartTypes} from "../../kpi-chart-type";

@Component({
  templateUrl: './startup.component.html',
  styleUrls: ['./startup.component.scss']
})
export class StartupComponent {
  private readonly _mainSessionService = inject(MainSessionService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly datePipe = inject(DatePipe);

  @ViewChild('statusChart') private readonly _statusChart: ChartComponent<any, any>;
  @ViewChild('performanceChart') private readonly _performanceChart: ChartComponent<any, any>;

  $statusRepartition: Partial<{data: any[], rawData: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true};
  $statusOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $statusView: 'chart' | 'table' = 'chart';
  $statusSlice: OrganizerSliceState | null = null;
  $statusFilterValues: Record<string, string[]> = {};
  $statusDisplayUnit = '';

  $performanceRepartition: Partial<{data: any[], rawData: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = {data: [], loading: true};
  $performanceOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $performanceSlice: OrganizerSliceState | null = null;
  $performanceFilterValues: Record<string, string[]> = {};
  $performanceDisplayUnit = '';
  $userRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $dependentChart: {data: any[], loading: boolean} = {data: [], loading: true};
  $globalStatistic: {totalRequest: number, totalRequestError: number, percentError: number,  elapsedPercentile: number, totalName: number} = {totalRequest: 0, totalRequestError: 0, percentError: 0, elapsedPercentile: 0, totalName: 0};

  readonly STATUS_CHART_PROVIDER_BASE = STATUS_CHART_PROVIDER_BASE;

  $statusChartType = 'column';
  $performanceChartType = 'column';

  groupedBy: string = '';
  $statusGranularity: string = '';
  $performanceGranularity: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement(this.params.period.start, this.params.period.end);

      // Initialize ChartConfigs and OrganizerConfigs
      this.$statusGranularity = this.groupedBy;
      this.$performanceGranularity = this.groupedBy;
      this.$statusRepartition.chartConfig = STARTUP_SESSION_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = STARTUP_SESSION_PERFORMANCE_CHART_CONFIG(this.groupedBy);

      this._rebuildOrganizerConfigs();

      this._fetchAllCharts();
      this.getDependents();
      this.getUser();
      this.getGlobalStatistics();
    }
  };

  onStatusViewChange(event: OrganizerButtonEvent): void {
    if (event.type === 'chartTypeSelected') {
      this.$statusChartType = event.state.selectedChartType ?? this.$statusChartType;
      this.$statusOrganizer = withKpiChartTypes(this.$statusOrganizer, this.$statusChartType);
      this._cdr.markForCheck();
      return;
    }
    if (event.type === 'viewSwitched') {
      this.$statusView = event.state.viewMode ?? 'chart';
    }
    const granularity = this._resolveGranularityAfterX(event, this.$statusGranularity);
    if (granularity !== this.$statusGranularity) {
      this.$statusGranularity = granularity;
      this.$statusRepartition.chartConfig = STARTUP_SESSION_STATUS_CHART_CONFIG(granularity);
    }
    const result = this._handleOrganizerEvent(event, this.$statusRepartition.chartConfig, this.$statusOrganizer, this._statusOrganizerOptions());
    this.$statusOrganizer = withKpiChartTypes(result.binding, this.$statusChartType);
    if (result.shouldRefetch) {
      this._fetchStatus();
    }
    this._cdr.markForCheck();
  }

  onStatusSliceChange(sliceState: OrganizerSliceState | null): void {
    this.$statusSlice = sliceState;
    if (!sliceState) {
      this.$statusFilterValues = {};
    }
    if (sliceState?.filterApplied === true) {
      this._fetchStatus();
    }
  }

  onPerformanceViewChange(event: OrganizerButtonEvent): void {
    if (event.type === 'chartTypeSelected') {
      this.$performanceChartType = event.state.selectedChartType ?? this.$performanceChartType;
      this.$performanceOrganizer = withKpiChartTypes(this.$performanceOrganizer, this.$performanceChartType);
      this._cdr.markForCheck();
      return;
    }
    const granularity = this._resolveGranularityAfterX(event, this.$performanceGranularity);
    if (granularity !== this.$performanceGranularity) {
      this.$performanceGranularity = granularity;
      this.$performanceRepartition.chartConfig = STARTUP_SESSION_PERFORMANCE_CHART_CONFIG(granularity);
    }
    const result = this._handleOrganizerEvent(event, this.$performanceRepartition.chartConfig, this.$performanceOrganizer, this._performanceOrganizerOptions());
    this.$performanceOrganizer = withKpiChartTypes(result.binding, this.$performanceChartType);
    if (result.shouldRefetch) {
      this._fetchPerformance();
    }
    this._cdr.markForCheck();
  }

  onPerformanceSliceChange(sliceState: OrganizerSliceState | null): void {
    this.$performanceSlice = sliceState;
    if (!sliceState) {
      this.$performanceFilterValues = {};
    }
    if (sliceState?.filterApplied === true) {
      this._fetchPerformance();
    }
  }

  onStatusFilterChange(activeKeys: string[][]): void {
    if (!this.$statusSlice) return;
    this.$statusFilterValues = toFilterValues(this.$statusSlice.sliceConfigs, activeKeys);
    this._fetchStatus();
  }

  onPerformanceFilterChange(activeKeys: string[][]): void {
    if (!this.$performanceSlice) return;
    this.$performanceFilterValues = toFilterValues(this.$performanceSlice.sliceConfigs, activeKeys);
    this._fetchPerformance();
  }

  private _fetchSliceData(chartConfig: ChartConfig, filterKey: string, granularity: string): Observable<any[]> {
    const filter = chartConfig.filters?.items?.find(item => item.key === filterKey);
    if (!filter) {
      return of([]);
    }

    return this._mainSessionService.getFilters(
      filter,
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, groupedBy: granularity, type: 'STARTUP' }
    ) as Observable<any[]>;
  }

  private _fetchAllCharts(): void {
    this._fetchStatus();
    this._fetchPerformance();
  }

  private _fetchStatus(): void {
    const cfg = this.$statusRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);

    this.$statusRepartition.loading = true;
    this.$statusRepartition.data = [];
    this._mainSessionService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk },
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, groupedBy: this.$statusGranularity, selections: buildFilterSelections(cfg, this.$statusFilterValues), type: 'STARTUP' }
    ).pipe(finalize(() => this.$statusRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.$statusGranularity, this.datePipe, this.params.period.start) : data;
      const series = buildSeries(cfg.series.items, ind, grp, stk, formattedData);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, formattedData) : formattedData;
      this.$statusRepartition.rawData = formattedData;
      this.$statusRepartition.data = pivoted;
      const yAlias = ind?.jquery.buildAlias(cfg.series.items.find(s => s.selected)?.jquery.buildAlias() ?? '') ?? '';
      this.$statusDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAlias);
      this.$statusRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series: series,
        optionsByType: lineTypeOptions(series)
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
  }

  private _fetchPerformance(): void {
    const cfg = this.$performanceRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);
    this.$performanceRepartition.loading = true;
    this.$performanceRepartition.data = [];
    this._mainSessionService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk },
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, groupedBy: this.$performanceGranularity, selections: buildFilterSelections(cfg, this.$performanceFilterValues), type: 'STARTUP' }
    ).pipe(finalize(() => this.$performanceRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.$performanceGranularity, this.datePipe, this.params.period.start) : data;
      const series = buildSeries(cfg.series.items, ind, grp, stk, formattedData);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, formattedData) : formattedData;
      this.$performanceRepartition.data = pivoted;
      const yAlias = ind?.jquery.buildAlias(cfg.series.items.find(s => s.selected)?.jquery.buildAlias() ?? '') ?? '';
      this.$performanceDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAlias);
      this.$performanceRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series,
        yUnit: ind?.unit,
        optionsByType: lineTypeOptions(series)
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
  }

  private _resolveDisplayUnit(unit: string | any | undefined, data: any[], yAlias: string | string[]): string {
    if (!unit) return '';
    if (typeof unit === 'string') return unit;

    const aliases = Array.isArray(yAlias) ? yAlias : [yAlias];
    const allValues: number[] = aliases.flatMap(alias =>
      data
        .map((d: any) => typeof d[alias] === 'number' ? d[alias] : Number.parseFloat(d[alias]))
        .filter((v: number) => Number.isFinite(v) && v > 0)
    );

    return selectBestScale(unit, allValues).unit;
  }

  private _rebuildOrganizerConfigs(): void {
    this.$statusOrganizer = withKpiChartTypes(buildOrganizerChartBinding(this.$statusRepartition.chartConfig, this._statusOrganizerOptions()), this.$statusChartType);
    this.$performanceOrganizer = withKpiChartTypes(buildOrganizerChartBinding(this.$performanceRepartition.chartConfig, this._performanceOrganizerOptions()), this.$performanceChartType);
  }

  private _statusOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$statusRepartition.chartConfig, filterKey, this.$statusGranularity),
      resolveSliceDisplay: (filterKey: string) => this._resolvePeriodSliceDisplay(filterKey, this.$statusGranularity),
      resolveXOptions: (groupKey: string) => this._resolveXOptions(groupKey),
      remapSliceSelection: remapSliceKeys,
      onExportVisual: () => this._statusChart?.exportImage('status'),
      onExportData: () => this._statusChart?.exportData('status')
    };
  }

  private _performanceOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$performanceRepartition.chartConfig, filterKey, this.$performanceGranularity),
      resolveSliceDisplay: (filterKey: string) => this._resolvePeriodSliceDisplay(filterKey, this.$performanceGranularity),
      resolveXOptions: (groupKey: string) => this._resolveXOptions(groupKey),
      remapSliceSelection: remapSliceKeys,
      onExportVisual: () => this._performanceChart?.exportImage('performance'),
      onExportData: () => this._performanceChart?.exportData('performance'),
    };
  }

  private _resolvePeriodSliceDisplay(filterKey: string, granularity: string) {
    return filterKey === 'date' ? buildPeriodSliceDisplay(granularity, this.params.period.start) : undefined;
  }

  private _resolveXOptions(groupKey: string): OrganizerXOption[] | undefined {
    return groupKey === 'date' ? buildPeriodOptions() : undefined;
  }

  private _resolveGranularityAfterX(event: OrganizerButtonEvent, current: string): string {
    if (event.type !== 'xSelected' || event.state.selectedX !== 'date') {
      return current;
    }
    return resolvePeriodGranularity(event.state.selectedXOption, this.params.period.start, this.params.period.end);
  }

  private _handleOrganizerEvent(
    event: OrganizerButtonEvent,
    chartConfig: ChartConfig,
    currentBinding: OrganizerChartBinding,
    options: OrganizerChartBridgeOptions
  ) {
    return handleOrganizerChartEvent(event, chartConfig, currentBinding, options);
  }

  activeChartSubheaderLabel(chartConfig: ChartConfig, displayUnit: string): string {
    const ind = chartConfig?.indicators?.items?.find(i => i.selected);
    if (!ind) return '';
    const indicatorName = ind.menu?.label ?? '';
    if (displayUnit) {
      const prefix = (ind as any).group ?? ind.menu?.label ?? '';
      const label = prefix ? `${prefix} en ${displayUnit}` : displayUnit;
      return indicatorName ? `${label} : ${indicatorName}` : label;
    }
    return indicatorName;
  }

  activeGroupLabel(chartConfig: ChartConfig): string {
    return chartConfig?.groups?.items?.find(g => g.selected)?.menu?.label || '';
  }

  activeStackLabel(chartConfig: ChartConfig): string {
    const ind = chartConfig?.indicators?.items?.find(i => i.selected);
    return ind?.extra?.stacks?.items?.find(s => s.selected)?.menu?.label || '';
  }

  getUser() {
    let args: any = {
      'column': `count(user.distinct):count,start.${this.groupedBy}.varchar:date`,
      'join': 'instance',
      'instance.namespace': this.params.namespace,
      'instance.type': 'SERVER',
      'type': 'STARTUP',
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': `start.${this.groupedBy}.asc`
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$userRepartition.loading = true;
    this._mainSessionService.getMainSession(args).pipe(finalize(() => this.$userRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userRepartition.data = formatChartDates(res, this.groupedBy, this.datePipe, this.params.period.start);
      }
    });
  }

  getDependents() {
    this.$dependentChart.loading = true;
    this.$dependentChart.data = [];
    this._mainSessionService.getDependents({namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts, type: 'STARTUP'})
    .pipe(finalize(() => this.$dependentChart.loading = false))
    .subscribe({
      next: (res: any[]) => {this.$dependentChart.data = res}
    })
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `percentileDisc(0.95).within(group.order(elapsed_time)):elapsedPercentile,count:count_request,count_error:count_error`,
      'join': 'instance',
      'instance.namespace': this.params.namespace,
      'instance.type': 'SERVER',
      'type': 'STARTUP',
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this._mainSessionService.getMainSession(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0]?.count_request ?? 0;
        this.$globalStatistic.totalRequestError = res[0]?.count_error ?? 0;
        this.$globalStatistic.percentError = res[0]?.count_request ? (res[0].count_error / res[0].count_request) * 100 : 0;
        this.$globalStatistic.elapsedPercentile = res[0]?.elapsedPercentile ?? 0;
      }
    });
  }
}
