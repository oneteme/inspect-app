import {ChangeDetectorRef, Component, inject, Input, OnInit, ViewChild} from "@angular/core";
import {ChartComponent} from "@oneteme/jquery-echarts";
import {TableColumnProvider} from "@oneteme/jquery-table";
import {QueryParams} from "../../../../model/conf.model";
import {RestRequestService} from "../../../../service/jquery/rest-request.service";
import {finalize, Observable} from "rxjs";
import {
  buildSeries,
  ChartConfig,
  pivotByStack,
  REST_LATENCY_CHART_CONFIG,
  REST_PERFORMANCE_CHART_CONFIG,
  REST_STATUS_CHART_CONFIG,
  REST_VOLUMETRY_CHART_CONFIG
} from "../../../kpi/kpi.config";
import {periodManagement2} from "../../../../shared/util";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {OrganizerConfig, OrganizerButtonEvent, OrganizerSliceState, OrganizerState, chartConfigToOrganizer, chartConfigToState, applyOrganizerEventToChart} from "@oneteme/jquery-organizer";

@Component({
  templateUrl: './rest.component.html',
  styleUrls: ['./rest.component.scss']
})
export class RestKpiTestComponent implements OnInit {
  private readonly _httpRequestService = inject(RestRequestService);
  private readonly _cdr = inject(ChangeDetectorRef);

  @ViewChild('statusChart') private _statusChart: ChartComponent<any, any>;
  @ViewChild('performanceChart') private _performanceChart: ChartComponent<any, any>;
  @ViewChild('volumetryChart') private _volumetryChart: ChartComponent<any, any>;
  @ViewChild('latencyChart') private _latencyChart: ChartComponent<any, any>;

  readonly METHOD_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('method'), y: field('count') } }
    ],
    options: {
      legend: { orient: 'horizontal', bottom: 0, left: 'center' },
      series: [{ label: { show: false }, labelLine: { show: false } }],
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

  $performanceRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $performanceOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $performanceSlice: OrganizerSliceState | null = null;
  $performanceFilteredValues: any[] = [];

  $volumetryRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $volumetryOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $volumetrySlice: OrganizerSliceState | null = null;
  $volumetryFilteredValues: any[] = [];

  $latencyRepartition: Partial<{data: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = { data: [], loading: true };
  $latencyOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $latencySlice: OrganizerSliceState | null = null;
  $latencyFilteredValues: any[] = [];

  $methodRepartition: {data: any[], loading: boolean} = { data: [], loading: true };
  $mediaRepartition: {data: any[], loading: boolean} = { data: [], loading: true };
  $globalStatistic = { totalRequest: 0, totalRequestError: 0, percentError: 0, elapsedPercentile: 0 };

  // Shared chart options (axes, tooltip, grid)
  readonly MEDIA_PIE_CONFIG: ChartProvider<string, number> = {
    series: [{ data: { x: field('media'), y: field('count') } }],
    options: {
      legend: { orient: 'horizontal', bottom: 0, left: 'center' },
      series: [{ label: { show: false }, labelLine: { show: false } }],
      tooltip: { formatter: (params: any) => `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)` }
    }
  };

  readonly STATUS_CHART_PROVIDER_BASE: Partial<ChartProvider<string, number>> = {
    stacked: true,
    series: [],
    options: {
      backgroundColor: 'transparent',
      grid: { top: 16, bottom: 48, left: 8, right: 16, containLabel: true },
      xAxis: { axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { rotate: 30, overflow: 'truncate', width: 120, fontSize: 11, interval: 'auto' } },
      yAxis: { axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }, axisLabel: { fontSize: 11, color: '#94a3b8', formatter: (v: number) => v?.toLocaleString('fr-FR') } },
      tooltip: { trigger: 'axis', borderRadius: 10, borderWidth: 0, backgroundColor: 'rgba(15,23,42,0.88)', textStyle: { color: '#f1f5f9', fontSize: 12, whiteSpace: 'normal', width: 300 }, confine: true }
    }
  };

  params: QueryParams;
  groupedBy: string = '';

  @Input() set queryParams(value: QueryParams) {
    if (value) {
      console.log('[REST-TEST] queryParams setter called with:', value);
      this.params = value;
      this.groupedBy = periodManagement2(this.params.period.start, this.params.period.end);
      console.log('[REST-TEST] groupedBy:', this.groupedBy);

      // Initialize ChartConfigs and OrganizerConfigs
      this.$statusRepartition.chartConfig = REST_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = REST_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.$volumetryRepartition.chartConfig = REST_VOLUMETRY_CHART_CONFIG(this.groupedBy);
      this.$latencyRepartition.chartConfig = REST_LATENCY_CHART_CONFIG(this.groupedBy);
      
      console.log('[REST-TEST] Status ChartConfig:', this.$statusRepartition.chartConfig);
      console.log('[REST-TEST] Volumetry ChartConfig:', this.$volumetryRepartition.chartConfig);

      this._rebuildOrganizerConfigs();
      console.log('[REST-TEST] Status Organizer Config:', this.$statusOrganizer);
      console.log('[REST-TEST] Volumetry Organizer Config:', this.$volumetryOrganizer);
      
      this._fetchAllCharts();
      this.getMethods();
      this.getMediaType();
      this.getGlobalStatistics();
    }
  }

  ngOnInit() {}

  // OrganizerEvent handlers (one per chart)

  onStatusViewChange(event: OrganizerButtonEvent): void {
    if (event.type === 'viewSwitched') {
      this.$statusView = event.state.viewMode ?? 'chart';
      this.$statusOrganizer = {
        config: chartConfigToOrganizer(this.$statusRepartition.chartConfig, {
          onFetchSliceData: this.$statusOrganizer.config.onFetchSliceData,
          onExportVisual: this.$statusOrganizer.config.onExportVisual,
          onExportData: this.$statusOrganizer.config.onExportData,
          switchView: { currentView: this.$statusView, onSwitch: v => { this.$statusView = v; this._cdr.markForCheck(); } }
        }),
        state: { ...event.state }
      };
      this._cdr.markForCheck();
      return;
    }
    applyOrganizerEventToChart(event, this.$statusRepartition.chartConfig);
    if (event.type === 'ySelected') {
      this.$statusOrganizer = {
        config: chartConfigToOrganizer(this.$statusRepartition.chartConfig, { onFetchSliceData: this.$statusOrganizer.config.onFetchSliceData, onExportVisual: this.$statusOrganizer.config.onExportVisual, onExportData: this.$statusOrganizer.config.onExportData }),
        state: chartConfigToState(this.$statusRepartition.chartConfig)
      };
    } else {
      this.$statusOrganizer = { config: this.$statusOrganizer.config, state: event.state };
    }
    if (event.type !== 'sliceSelected') {
      this._fetchStatus();
    }
  }

  onStatusSliceChange(sliceState: OrganizerSliceState | null): void {
    this.$statusSlice = sliceState;
    if (!sliceState) {
      this.$statusFilteredValues = [];
    }
    this._fetchStatus();
  }

  onPerformanceViewChange(event: OrganizerButtonEvent): void {
    applyOrganizerEventToChart(event, this.$performanceRepartition.chartConfig);
    if (event.type === 'ySelected') {
      this.$performanceOrganizer = {
        config: chartConfigToOrganizer(this.$performanceRepartition.chartConfig, { onFetchSliceData: this.$performanceOrganizer.config.onFetchSliceData, onExportVisual: this.$performanceOrganizer.config.onExportVisual, onExportData: this.$performanceOrganizer.config.onExportData }),
        state: chartConfigToState(this.$performanceRepartition.chartConfig)
      };
    } else {
      this.$performanceOrganizer = { config: this.$performanceOrganizer.config, state: event.state };
    }
    if (event.type !== 'sliceSelected') {
      this._fetchPerformance();
    }
  }

  onPerformanceSliceChange(sliceState: OrganizerSliceState | null): void {
    this.$performanceSlice = sliceState;
    if (!sliceState) {
      this.$performanceFilteredValues = [];
    }
    this._fetchPerformance();
  }

  onVolumetryViewChange(event: OrganizerButtonEvent): void {
    applyOrganizerEventToChart(event, this.$volumetryRepartition.chartConfig);
    if (event.type === 'ySelected') {
      this.$volumetryOrganizer = {
        config: chartConfigToOrganizer(this.$volumetryRepartition.chartConfig, { onFetchSliceData: this.$volumetryOrganizer.config.onFetchSliceData, onExportVisual: this.$volumetryOrganizer.config.onExportVisual, onExportData: this.$volumetryOrganizer.config.onExportData }),
        state: chartConfigToState(this.$volumetryRepartition.chartConfig)
      };
    } else {
      this.$volumetryOrganizer = { config: this.$volumetryOrganizer.config, state: event.state };
    }
    if (event.type !== 'sliceSelected') {
      this._fetchVolumetry();
    }
  }

  onVolumetrySliceChange(sliceState: OrganizerSliceState | null): void {
    this.$volumetrySlice = sliceState;
    if (!sliceState) {
      this.$volumetryFilteredValues = [];
    }
    this._fetchVolumetry();
  }

  onLatencyViewChange(event: OrganizerButtonEvent): void {
    applyOrganizerEventToChart(event, this.$latencyRepartition.chartConfig);
    if (event.type === 'ySelected') {
      this.$latencyOrganizer = {
        config: chartConfigToOrganizer(this.$latencyRepartition.chartConfig, { onFetchSliceData: this.$latencyOrganizer.config.onFetchSliceData, onExportVisual: this.$latencyOrganizer.config.onExportVisual, onExportData: this.$latencyOrganizer.config.onExportData }),
        state: chartConfigToState(this.$latencyRepartition.chartConfig)
      };
    } else {
      this.$latencyOrganizer = { config: this.$latencyOrganizer.config, state: event.state };
    }
    if (event.type !== 'sliceSelected') {
      this._fetchLatency();
    }
  }

  onLatencySliceChange(sliceState: OrganizerSliceState | null): void {
    this.$latencySlice = sliceState;
    if (!sliceState) {
      this.$latencyFilteredValues = [];
    }
    this._fetchLatency();
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
    
    console.log('[REST-TEST] _fetchStatus - config:', cfg);
    console.log('[REST-TEST] _fetchStatus - indicator:', ind);
    console.log('[REST-TEST] _fetchStatus - group:', grp);
    console.log('[REST-TEST] _fetchStatus - stack:', stk);
    console.log('[REST-TEST] _fetchStatus - series items:', cfg.series.items);
    
    this.$statusRepartition.loading = true;
    this.$statusRepartition.data = [];
    this._httpRequestService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk, filter: flt },
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: this.$statusFilteredValues.length ? this.$statusFilteredValues : undefined }
    ).pipe(finalize(() => this.$statusRepartition.loading = false))
    .subscribe(data => {
      console.log('[REST-TEST] _fetchStatus - raw data received:', data);
      const series = buildSeries(cfg.series.items, ind, grp, stk, data);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, data) : data;
      this.$statusRepartition.rawData = data;
      this.$statusRepartition.data = pivoted;
      console.log('[REST-TEST] _fetchStatus - built series:', series);
      this.$statusRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series: series
      } as ChartProvider<string, number>;
      console.log('[REST-TEST] _fetchStatus - final chartProvider:', this.$statusRepartition.chartProvider);
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
      const series = buildSeries(cfg.series.items, ind, grp, stk, data);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, data) : data;
      this.$performanceRepartition.data = pivoted;
      this.$performanceRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series
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
    
    console.log('[REST-TEST] _fetchVolumetry - config:', cfg);
    console.log('[REST-TEST] _fetchVolumetry - indicator:', ind);
    console.log('[REST-TEST] _fetchVolumetry - group:', grp);
    console.log('[REST-TEST] _fetchVolumetry - stack:', stk);
    console.log('[REST-TEST] _fetchVolumetry - series items:', cfg.series.items);
    
    this.$volumetryRepartition.loading = true;
    this.$volumetryRepartition.data = [];
    this._httpRequestService.getSizeCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk, filter: flt },
      { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, filters: this.$volumetryFilteredValues.length ? this.$volumetryFilteredValues : undefined }
    ).pipe(finalize(() => this.$volumetryRepartition.loading = false))
    .subscribe(data => {
      console.log('[REST-TEST] _fetchVolumetry - raw data received:', data);
      const series = buildSeries(cfg.series.items, ind, grp, stk, data);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, data) : data;
      console.log('[REST-TEST] _fetchVolumetry - pivoted data:', pivoted);
      this.$volumetryRepartition.data = pivoted;
      console.log('[REST-TEST] _fetchVolumetry - built series:', series);
      this.$volumetryRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series: series
      } as ChartProvider<string, number>;
      console.log('[REST-TEST] _fetchVolumetry - final chartProvider:', this.$volumetryRepartition.chartProvider);
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
      const series = buildSeries(cfg.series.items, ind, grp, stk, data);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, data) : data;
      this.$latencyRepartition.data = pivoted;
      this.$latencyRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series
      } as ChartProvider<string, number>;
      this._cdr.markForCheck();
    });
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

  // ─── Helper: rebuild organizer configs from current chartConfigs ──────────────

  private _rebuildOrganizerConfigs(): void {
    console.log('[REST-TEST] _rebuildOrganizerConfigs - Status config input:', this.$statusRepartition.chartConfig);
    console.log('[REST-TEST] _rebuildOrganizerConfigs - Volumetry config input:', this.$volumetryRepartition.chartConfig);
    
    this.$statusOrganizer = {
      config: chartConfigToOrganizer(this.$statusRepartition.chartConfig, {
        onFetchSliceData: (filterKey: string) => this._httpRequestService.getFilters(
          this.$statusRepartition.chartConfig!.filters!.items!.find(f => f.key === filterKey)!,
          { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts }
        ) as Observable<any[]>,
        onExportVisual: () => this._statusChart?.exportImage('disponibilite'),
        onExportData:   () => this._statusChart?.exportData('disponibilite'),
        switchView: { currentView: this.$statusView, onSwitch: v => { this.$statusView = v; this._cdr.markForCheck(); } },
      }),
      state: chartConfigToState(this.$statusRepartition.chartConfig)
    };
    this.$performanceOrganizer = {
      config: chartConfigToOrganizer(this.$performanceRepartition.chartConfig, {
        onFetchSliceData: (filterKey: string) => this._httpRequestService.getFilters(
          this.$performanceRepartition.chartConfig!.filters!.items!.find(f => f.key === filterKey)!,
          { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts }
        ) as Observable<any[]>,
        onExportVisual: () => this._performanceChart?.exportImage('performance'),
        onExportData:   () => this._performanceChart?.exportData('performance'),
      }),
      state: chartConfigToState(this.$performanceRepartition.chartConfig)
    };
    this.$volumetryOrganizer = {
      config: chartConfigToOrganizer(this.$volumetryRepartition.chartConfig, {
        onFetchSliceData: (filterKey: string) => this._httpRequestService.getFilters(
          this.$volumetryRepartition.chartConfig!.filters!.items!.find(f => f.key === filterKey)!,
          { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts }
        ) as Observable<any[]>,
        onExportVisual: () => this._volumetryChart?.exportImage('volumetrie'),
        onExportData:   () => this._volumetryChart?.exportData('volumetrie'),
      }),
      state: chartConfigToState(this.$volumetryRepartition.chartConfig)
    };
    this.$latencyOrganizer = {
      config: chartConfigToOrganizer(this.$latencyRepartition.chartConfig, {
        onFetchSliceData: (filterKey: string) => this._httpRequestService.getFilters(
          this.$latencyRepartition.chartConfig!.filters!.items!.find(f => f.key === filterKey)!,
          { env: this.params.env, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts }
        ) as Observable<any[]>,
        onExportVisual: () => this._latencyChart?.exportImage('latence'),
        onExportData:   () => this._latencyChart?.exportData('latence'),
      }),
      state: chartConfigToState(this.$latencyRepartition.chartConfig)
    };
    
    console.log('[REST-TEST] _rebuildOrganizerConfigs - Status result:', this.$statusOrganizer);
    console.log('[REST-TEST] _rebuildOrganizerConfigs - Volumetry result:', this.$volumetryOrganizer);
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
}
