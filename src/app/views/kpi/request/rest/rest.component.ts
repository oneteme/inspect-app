import {ChangeDetectorRef, Component, inject, Input, OnInit, ViewChild} from "@angular/core";
import {DatePipe} from "@angular/common";
import {ChartComponent, selectBestScale} from "@oneteme/jquery-echarts";
import {TableColumnProvider} from "@oneteme/jquery-table";
import {QueryParams} from "../../../../model/conf.model";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {finalize, Observable, of} from "rxjs";
import {buildSeries,ChartConfig,pivotByStack,REST_LATENCY_CHART_CONFIG,REST_PERFORMANCE_CHART_CONFIG,REST_STATUS_CHART_CONFIG,REST_VOLUMETRY_CHART_CONFIG} from "./../../kpi.config";
import {periodManagement2, formatChartDates} from "../../../../shared/util";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {OrganizerChartBinding, OrganizerChartBridgeOptions, OrganizerConfig, OrganizerButtonEvent, OrganizerSliceState, OrganizerState, buildOrganizerChartBinding, handleOrganizerChartEvent} from "@oneteme/jquery-organizer";
import {STATUS_CHART_PROVIDER_BASE} from "../../kpi.constants";

@Component({
  templateUrl: './rest.component.html',
  styleUrls: ['./rest.component.scss']
})
export class RestComponent implements OnInit {
  private readonly _httpRequestService = inject(RestRequestService);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly datePipe = inject(DatePipe);

  @ViewChild('statusChart') private readonly _statusChart: ChartComponent<any, any>;
  @ViewChild('performanceChart') private readonly _performanceChart: ChartComponent<any, any>;
  @ViewChild('volumetryChart') private readonly _volumetryChart: ChartComponent<any, any>;
  @ViewChild('latencyChart') private readonly _latencyChart: ChartComponent<any, any>;

  readonly METHOD_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('method'), y: field('count') } }
    ],
    options: {
      legend: { orient: 'horizontal', bottom: 0, left: 'center' },
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
      }
    }
  }

  // Chart state
  $statusRepartition: Partial<{data: any[], rawData: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $statusOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $statusView: 'chart' | 'table' = 'chart';
  $statusSlice: OrganizerSliceState | null = null;
  $statusFilteredValues: any[] = [];
  $statusDisplayUnit = '';

  $performanceRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $performanceOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $performanceSlice: OrganizerSliceState | null = null;
  $performanceFilteredValues: any[] = [];
  $performanceDisplayUnit = '';

  $volumetryRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $volumetryOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $volumetrySlice: OrganizerSliceState | null = null;
  $volumetryFilteredValues: any[] = [];
  $volumetryDisplayUnit = '';

  $latencyRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $latencyOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $latencySlice: OrganizerSliceState | null = null;
  $latencyFilteredValues: any[] = [];
  $latencyDisplayUnit = '';

  $methodRepartition: { data: any[], loading: boolean } = { data: [], loading: true };
  $mediaRepartition: { data: any[], loading: boolean } = { data: [], loading: true };
  $userRepartition: { data: any[], loading: boolean } = { data: [], loading: true };
  $dependencyRepartition: { data: any[], loading: boolean } = { data: [], loading: true };
  $globalStatistic = { totalRequest: 0, totalRequestError: 0, percentError: 0, elapsedPercentile: 0 };

  // Shared chart options (axes, tooltip, grid)
  readonly MEDIA_PIE_CONFIG: ChartProvider<string, number> = {
    series: [{ data: { x: field('media'), y: field('count') } }],
    options: {
      legend: { orient: 'horizontal', bottom: 0, left: 'center' },
      tooltip: { formatter: (params: any) => `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)` }
    }
  };

  readonly STATUS_CHART_PROVIDER_BASE = STATUS_CHART_PROVIDER_BASE;

  params: QueryParams;
  groupedBy: string = '';

  @Input() set queryParams(value: QueryParams) {
    if (value) {
      this.params = value;
      this.groupedBy = periodManagement2(this.params.period.start, this.params.period.end);

      // Initialize ChartConfigs and OrganizerConfigs
      this.$statusRepartition.chartConfig = REST_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = REST_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.$volumetryRepartition.chartConfig = REST_VOLUMETRY_CHART_CONFIG(this.groupedBy);
      this.$latencyRepartition.chartConfig = REST_LATENCY_CHART_CONFIG(this.groupedBy);
      
      this._rebuildOrganizerConfigs();
      
      this._fetchAllCharts();
      this.getMethods();
      this.getMediaType();
      this.getUser();
      this.getDependencies();
      this.getGlobalStatistics();
    }
  }

  ngOnInit(): void {
    // Component initialized, data loading happens in queryParams setter
  }

  onStatusViewChange(event: OrganizerButtonEvent): void {
    if (event.type === 'viewSwitched') {
      this.$statusView = event.state.viewMode ?? 'chart';
    }
    const result = this._handleOrganizerEvent(event, this.$statusRepartition.chartConfig, this.$statusOrganizer, this._statusOrganizerOptions());
    this.$statusOrganizer = result.binding;
    if (result.shouldRefetch) {
      this._fetchStatus();
    }
    this._cdr.markForCheck();
  }

  onStatusSliceChange(sliceState: OrganizerSliceState | null): void {
    this.$statusSlice = sliceState;
    if (!sliceState) {
      this.$statusFilteredValues = [];
    }
    // Refetch seulement si un filtre a été effectivement sélectionné
    if (sliceState?.filterApplied === true) {
      this._fetchStatus();
    }
  }

  onPerformanceViewChange(event: OrganizerButtonEvent): void {
    const result = this._handleOrganizerEvent(event, this.$performanceRepartition.chartConfig, this.$performanceOrganizer, this._performanceOrganizerOptions());
    this.$performanceOrganizer = result.binding;
    if (result.shouldRefetch) {
      this._fetchPerformance();
    }
    this._cdr.markForCheck();
  }

  onPerformanceSliceChange(sliceState: OrganizerSliceState | null): void {
    this.$performanceSlice = sliceState;
    if (!sliceState) {
      this.$performanceFilteredValues = [];
    }
    // Refetch seulement si un filtre a été effectivement sélectionné
    if (sliceState?.filterApplied === true) {
      this._fetchPerformance();
    }
  }

  onVolumetryViewChange(event: OrganizerButtonEvent): void {
    const result = this._handleOrganizerEvent(event, this.$volumetryRepartition.chartConfig, this.$volumetryOrganizer, this._volumetryOrganizerOptions());
    this.$volumetryOrganizer = result.binding;
    if (result.shouldRefetch) {
      this._fetchVolumetry();
    }
    this._cdr.markForCheck();
  }

  onVolumetrySliceChange(sliceState: OrganizerSliceState | null): void {
    this.$volumetrySlice = sliceState;
    if (!sliceState) {
      this.$volumetryFilteredValues = [];
    }
    // Refetch seulement si un filtre a été effectivement sélectionné
    if (sliceState?.filterApplied === true) {
      this._fetchVolumetry();
    }
  }

  onLatencyViewChange(event: OrganizerButtonEvent): void {
    const result = this._handleOrganizerEvent(event, this.$latencyRepartition.chartConfig, this.$latencyOrganizer, this._latencyOrganizerOptions());
    this.$latencyOrganizer = result.binding;
    if (result.shouldRefetch) {
      this._fetchLatency();
    }
    this._cdr.markForCheck();
  }

  onLatencySliceChange(sliceState: OrganizerSliceState | null): void {
    this.$latencySlice = sliceState;
    if (!sliceState) {
      this.$latencyFilteredValues = [];
    }
    // Refetch seulement si un filtre a été effectivement sélectionné
    if (sliceState?.filterApplied === true) {
      this._fetchLatency();
    }
  }

  onStatusFilterChange(filterFn: (row: any) => boolean): void {
    if (!this.$statusSlice) return;
    const columnKey = this.$statusSlice.sliceConfigs[0]?.columnKey;
    this.$statusFilteredValues = this.$statusSlice.tasks.filter(filterFn).map(t => t[columnKey]);
    this._fetchStatus();
  }

  onPerformanceFilterChange(filterFn: (row: any) => boolean): void {
    if (!this.$performanceSlice) return;
    const columnKey = this.$performanceSlice.sliceConfigs[0]?.columnKey;
    this.$performanceFilteredValues = this.$performanceSlice.tasks.filter(filterFn).map(t => t[columnKey]);
    this._fetchPerformance();
  }

  onVolumetryFilterChange(filterFn: (row: any) => boolean): void {
    if (!this.$volumetrySlice) return;
    const columnKey = this.$volumetrySlice.sliceConfigs[0]?.columnKey;
    this.$volumetryFilteredValues = this.$volumetrySlice.tasks.filter(filterFn).map(t => t[columnKey]);
    this._fetchVolumetry();
  }

  onLatencyFilterChange(filterFn: (row: any) => boolean): void {
    if (!this.$latencySlice) return;
    const columnKey = this.$latencySlice.sliceConfigs[0]?.columnKey;
    this.$latencyFilteredValues = this.$latencySlice.tasks.filter(filterFn).map(t => t[columnKey]);
    this._fetchLatency();
  }

  private _fetchSliceData(chartConfig: ChartConfig, filterKey: string): Observable<any[]> {
    const filter = chartConfig.filters?.items?.find(item => item.key === filterKey);
    if (!filter) {
      return of([]);
    }

    return this._httpRequestService.getFilters(
      filter,
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts }
    ) as Observable<any[]>;
  }

  // Data fetching

  private _fetchAllCharts(): void {
    this._fetchStatus();
    this._fetchPerformance();
    this._fetchVolumetry();
    this._fetchLatency();
  }

  private _fetchStatus(): void {
    const cfg = this.$statusRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);
    const flt = cfg.filters?.items?.find(f => f.selected);
    
    this.$statusRepartition.loading = true;
    this.$statusRepartition.data = [];
    this._httpRequestService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk, filter: flt },
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: this.$statusFilteredValues.length ? this.$statusFilteredValues : undefined }
    ).pipe(finalize(() => this.$statusRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.groupedBy, this.datePipe) : data;
      const series = buildSeries(cfg.series.items, ind, grp, stk, formattedData);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, formattedData) : formattedData;
      this.$statusRepartition.rawData = formattedData;
      this.$statusRepartition.data = pivoted;
      const yAlias = ind?.jquery.buildAlias(cfg.series.items.find(s => s.selected)?.jquery.buildAlias() ?? '') ?? '';
      this.$statusDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAlias);
      this.$statusRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series: series
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
  }

  private _fetchPerformance(): void {
    const cfg = this.$performanceRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);
    const flt = cfg.filters?.items?.find(f => f.selected);
    this.$performanceRepartition.loading = true;
    this.$performanceRepartition.data = [];
    this._httpRequestService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk, filter: flt },
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: this.$performanceFilteredValues.length ? this.$performanceFilteredValues : undefined }
    ).pipe(finalize(() => this.$performanceRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.groupedBy, this.datePipe) : data;
      const series = buildSeries(cfg.series.items, ind, grp, stk, formattedData);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, formattedData) : formattedData;
      this.$performanceRepartition.data = pivoted;
      const yAlias = ind?.jquery.buildAlias(cfg.series.items.find(s => s.selected)?.jquery.buildAlias() ?? '') ?? '';
      this.$performanceDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAlias);
      this.$performanceRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series,
        yUnit: ind?.unit
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
  }

  private _fetchVolumetry(): void {
    const cfg = this.$volumetryRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);
    const flt = cfg.filters?.items?.find(f => f.selected);
    
    this.$volumetryRepartition.loading = true;
    this.$volumetryRepartition.data = [];
    this._httpRequestService.getSizeCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk, filter: flt },
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: this.$volumetryFilteredValues.length ? this.$volumetryFilteredValues : undefined }
    ).pipe(finalize(() => this.$volumetryRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.groupedBy, this.datePipe) : data;
      const selectedSeries = cfg.series.items.filter(s => s.selected);
      const series = buildSeries(selectedSeries, ind, grp, stk, formattedData);
      const pivoted = stk ? pivotByStack(selectedSeries, ind, grp, stk, formattedData) : formattedData;
      this.$volumetryRepartition.data = pivoted;
      // Calcule le maxVal sur toutes les séries sélectionnées, pas juste la première
      const yAliases = selectedSeries.map(s => ind?.jquery.buildAlias(s?.jquery.buildAlias() ?? '') ?? '');
      this.$volumetryDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAliases);
      this.$volumetryRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series,
        yUnit: ind?.unit
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
  }

  private _fetchLatency(): void {
    const cfg = this.$latencyRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);
    const flt = cfg.filters?.items?.find(f => f.selected);
    this.$latencyRepartition.loading = true;
    this.$latencyRepartition.data = [];
    this._httpRequestService.getLatency2(
      { serie: cfg.series.items[0], indicator: ind, group: grp, stack: stk, filter: flt },
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: this.$latencyFilteredValues.length ? this.$latencyFilteredValues : undefined }
    ).pipe(finalize(() => this.$latencyRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.groupedBy, this.datePipe) : data;
      let effectiveStk = stk;
      if (stk && formattedData.length > 0) {
        const stackAlias = stk.jquery.buildAlias();
        if (!(stackAlias in formattedData[0])) {
          effectiveStk = undefined;
        }
      }
      
      const series = buildSeries(cfg.series.items, ind, grp, effectiveStk, formattedData);
      const pivoted = effectiveStk ? pivotByStack(cfg.series.items, ind, grp, effectiveStk, formattedData) : formattedData;
      this.$latencyRepartition.data = pivoted;
      const yAlias = ind?.jquery.buildAlias(cfg.series.items[0]?.jquery.buildAlias() ?? '') ?? '';
      this.$latencyDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAlias);
      this.$latencyRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series,
        yUnit: ind?.unit
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
  }

  private _resolveDisplayUnit(unit: string | any | undefined, data: any[], yAlias: string | string[]): string {
    if (!unit) return '';
    if (typeof unit === 'string') return unit;

    // Collecte les valeurs de toutes les séries demandées
    const aliases = Array.isArray(yAlias) ? yAlias : [yAlias];
    const allValues: number[] = aliases.flatMap(alias =>
      data
        .map((d: any) => typeof d[alias] === 'number' ? d[alias] : Number.parseFloat(d[alias]))
        .filter((v: number) => Number.isFinite(v) && v > 0)
    );

    // Délègue à la même fonction que le chart pour garantir la cohérence
    return selectBestScale(unit, allValues).unit;
  }

  getMediaType() {
    const args: any = {
      'column': `count:count,media.coalesce("Non renseigné"):media`,
      'instance_env': 'instance.id',
      'instance.environement': `"${this.params.env}"`,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    };
    if (this.params.hosts?.length) {
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$mediaRepartition.loading = true;
    this._httpRequestService.getRestRequest(args)
      .pipe(finalize(() => this.$mediaRepartition.loading = false))
      .subscribe({ next: (res: any[]) => { this.$mediaRepartition.data = res; } });
  }

  getMethods() {
    const args: any = {
      'column': `count:count,method:method`,
      'instance_env': 'instance.id',
      'instance.environement': `"${this.params.env}"`,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    };
    if (this.params.hosts?.length) {
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$methodRepartition.loading = true;
    this._httpRequestService.getRestRequest(args)
      .pipe(finalize(() => this.$methodRepartition.loading = false))
      .subscribe({ next: (res: any[]) => { this.$methodRepartition.data = res; } });
  }

  getGlobalStatistics() {
    const args: any = {
      'column': `elapsed_percentile:elapsedPercentile,count:count_request,count_error:count_error`,
      'instance_env': 'instance.id',
      'instance.environement': `"${this.params.env}"`,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    };
    if (this.params.hosts?.length) {
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this._httpRequestService.getRestRequest(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0]?.count_request ?? 0;
        this.$globalStatistic.totalRequestError = res[0]?.count_error ?? 0;
        this.$globalStatistic.percentError = res[0]?.count_request ? (res[0].count_error / res[0].count_request) * 100 : 0;
        this.$globalStatistic.elapsedPercentile = res[0]?.elapsedPercentile ?? 0;
      }
    });
  }

  private _rebuildOrganizerConfigs(): void {
    this.$statusOrganizer = buildOrganizerChartBinding(this.$statusRepartition.chartConfig, this._statusOrganizerOptions());
    this.$performanceOrganizer = buildOrganizerChartBinding(this.$performanceRepartition.chartConfig, this._performanceOrganizerOptions());
    this.$volumetryOrganizer = buildOrganizerChartBinding(this.$volumetryRepartition.chartConfig, this._volumetryOrganizerOptions());
    this.$latencyOrganizer = buildOrganizerChartBinding(this.$latencyRepartition.chartConfig, this._latencyOrganizerOptions());
  }

  private _statusOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$statusRepartition.chartConfig, filterKey),
      onExportVisual: () => this._statusChart?.exportImage('disponibilite'),
      onExportData: () => this._statusChart?.exportData('disponibilite')
    };
  }

  private _performanceOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$performanceRepartition.chartConfig, filterKey),
      onExportVisual: () => this._performanceChart?.exportImage('performance'),
      onExportData: () => this._performanceChart?.exportData('performance'),
    };
  }

  private _volumetryOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$volumetryRepartition.chartConfig, filterKey),
      onExportVisual: () => this._volumetryChart?.exportImage('volumetrie'),
      onExportData: () => this._volumetryChart?.exportData('volumetrie'),
    };
  }

  private _latencyOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$latencyRepartition.chartConfig, filterKey),
      onExportVisual: () => this._latencyChart?.exportImage('latence'),
      onExportData: () => this._latencyChart?.exportData('latence'),
    };
  }

  private _handleOrganizerEvent(
    event: OrganizerButtonEvent,
    chartConfig: ChartConfig,
    currentBinding: OrganizerChartBinding,
    options: OrganizerChartBridgeOptions
  ) {
    return handleOrganizerChartEvent(event, chartConfig, currentBinding, options);
  }

  statusTableColumns(): TableColumnProvider[] {
    const cfg = this.$statusRepartition.chartConfig;
    if (!cfg) return [];
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);
    const ser = cfg.series.items[0];
    const cols: TableColumnProvider[] = [];
    if (grp) {
      const k = grp.jquery.buildAlias();
      cols.push({ key: k, header: grp.menu.label || grp.key, value: (row: any) => row[k], sortable: true });
    }
    if (ind && ser) {
      const k = ind.jquery.buildAlias(ser.jquery.buildAlias());
      cols.push({ key: k, header: ind.menu.label || ind.key, value: (row: any) => row[k], sortable: true });
    }
    if (stk) {
      const k = stk.jquery.buildAlias();
      cols.push({ key: k, header: stk.menu.label || stk.key, value: (row: any) => row[k], sortable: true });
    }
    return cols;
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

  activeIndicatorLabel(chartConfig: ChartConfig): string {
    return chartConfig?.indicators?.items?.find(i => i.selected)?.menu?.label || '';
  }

  activeGroupLabel(chartConfig: ChartConfig): string {
    return chartConfig?.groups?.items?.find(g => g.selected)?.menu?.label || '';
  }

  activeStackLabel(chartConfig: ChartConfig): string {
    const ind = chartConfig?.indicators?.items?.find(i => i.selected);
    return ind?.extra?.stacks?.items?.find(s => s.selected)?.menu?.label || '';
  }

  getUser(): void {
    const args: any = {
      'column': `count(user.distinct):count,start.${this.groupedBy}.varchar:date`,
      'instance_env': 'instance.id',
      'instance.environement': `"${this.params.env}"`,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': `start.${this.groupedBy}.asc`
    };
    if (this.params.hosts?.length) {
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$userRepartition.loading = true;
    this._httpRequestService.getRestRequest(args)
      .pipe(finalize(() => this.$userRepartition.loading = false))
      .subscribe({ next: (res: any[]) => { this.$userRepartition.data = formatChartDates(res, this.groupedBy, this.datePipe); } });
  }

  getDependencies(): void {
    const args: any = {
      'column': `instance.app_name:origin,host:target,count:count`,
      'instance_env': 'instance.id',
      'instance.environement': `"${this.params.env}"`,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.asc'
    };
    if (this.params.hosts?.length) {
      args['host.in'] = this.params.hosts.map(o => `"${o}"`).join(',');
    }
    this.$dependencyRepartition.loading = true;
    this._httpRequestService.getRestRequest(args)
      .pipe(finalize(() => this.$dependencyRepartition.loading = false))
      .subscribe({ next: (res: any[]) => { this.$dependencyRepartition.data = res; } });
  }
}
