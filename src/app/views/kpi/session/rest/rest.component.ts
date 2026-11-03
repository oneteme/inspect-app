import {ChangeDetectorRef, Component, inject, Input, OnInit, ViewChild} from "@angular/core";
import {QueryParams} from "../../../../model/conf.model";
import {finalize, Observable, of} from "rxjs";
import {buildFilterSelections, toFilterValues,
  ChartConfig,
  REST_SESSION_PERFORMANCE_CHART_CONFIG,
  REST_SESSION_STATUS_CHART_CONFIG,
  REST_SESSION_VOLUMETRY_CHART_CONFIG,
  buildSeries,
  pivotByStack
} from "../../kpi.config";
import {STATUS_CHART_PROVIDER_BASE} from "../../kpi.constants";
import {periodManagement, formatChartDates} from "../../../../shared/util";
import {ChartProvider, field} from "@oneteme/jquery-core";
import {RestSessionService} from "../../../../service/jquery/rest-session.service";
import {EnvRouter} from "../../../../service/router.service";
import {ChartComponent, selectBestScale} from "@oneteme/jquery-echarts";
import {OrganizerChartBinding, OrganizerChartBridgeOptions, OrganizerConfig, OrganizerButtonEvent, OrganizerSliceState, OrganizerState, buildOrganizerChartBinding, handleOrganizerChartEvent} from "@oneteme/jquery-organizer";
import {DatePipe} from "@angular/common";

@Component({
  templateUrl: './rest.component.html',
  styleUrls: ['./rest.component.scss']
})
export class RestComponent implements OnInit {
  private readonly _restSessionService = inject(RestSessionService);
  private readonly _router = inject(EnvRouter);
  private readonly _cdr = inject(ChangeDetectorRef);
  private readonly datePipe = inject(DatePipe);

  @ViewChild('statusChart') private _statusChart: ChartComponent<any, any>;
  @ViewChild('performanceChart') private _performanceChart: ChartComponent<any, any>;
  @ViewChild('volumetryChart') private _volumetryChart: ChartComponent<any, any>;


  readonly METHOD_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('method'), y: field('count') } }
    ],
    options: {
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center'
      },
      series: [{
        label: {
          show: false             // pas de datalabels sur les slices
        },
        labelLine: {
          show: false             // pas de lignes de labels non plus
        }
      }],
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
      }
    }
  }

  readonly USER_AGENT_PIE_CONFIG: ChartProvider<string, number> = {
    series: [
      { data: { x: field('user_agt'), y: field('count') } }
    ],
    options: {
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center'
      },
      series: [{
        label: {
          show: false             // pas de datalabels sur les slices
        },
        labelLine: {
          show: false             // pas de lignes de labels non plus
        }
      }],
      tooltip: {
        formatter: (params: any) =>
          `${params.name} : <b>${params.value.toLocaleString('fr-FR')}</b> (${params.percent}%)`
      }
    }
  }

  readonly STATUS_CHART_PROVIDER_BASE = STATUS_CHART_PROVIDER_BASE;

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

  $volumetryRepartition : Partial<{data: any[], rawData: any[], loading: boolean, chartConfig: ChartConfig, chartProvider: ChartProvider<string, number>}> = {data: [], loading: true};
  $volumetryOrganizer: {config: OrganizerConfig, state: OrganizerState} = { config: {}, state: {} };
  $volumetrySlice: OrganizerSliceState | null = null;
  $volumetryFilterValues: Record<string, string[]> = {};
  $volumetryDisplayUnit = '';

  $methodRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $userAgentRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $dependencyRepartition: {data: any[], loading: boolean} = {data: [], loading: true};
  $dependentRepartition: {data: any[], loading: boolean} = {data: [], loading: true};
  $mediaRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $userRepartition: {data: any[], loading: boolean} = { data: [], loading: true};
  $globalStatistic: {totalRequest: number, percentError: number, totalRequestError: number, elapsedPercentile: number, totalUser: number} = {totalRequest: 0, totalRequestError: 0, percentError: 0, elapsedPercentile: 0, totalUser: 0};

  groupedBy: string = '';
  params: QueryParams;

  @Input() set queryParams(value: QueryParams) {
    if(value) {
      this.params = value;
      this.groupedBy = periodManagement(this.params.period.start, this.params.period.end);

      // Initialize ChartConfigs and OrganizerConfigs
      this.$statusRepartition.chartConfig = REST_SESSION_STATUS_CHART_CONFIG(this.groupedBy);
      this.$performanceRepartition.chartConfig = REST_SESSION_PERFORMANCE_CHART_CONFIG(this.groupedBy);
      this.$volumetryRepartition.chartConfig = REST_SESSION_VOLUMETRY_CHART_CONFIG(this.groupedBy);

      this._rebuildOrganizerConfigs();

      this._fetchAllCharts();
      this.getMethods();
      this.getUser();
      this.getUserAgents();
      this.getMediaType();
      this.getDependencies();
      this.getDependents();
      this.getGlobalStatistics();
    }
  };

  ngOnInit() {}

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
      this.$statusFilterValues = {};
    }
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
      this.$performanceFilterValues = {};
    }
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
      this.$volumetryFilterValues = {};
    }
    if (sliceState?.filterApplied === true) {
      this._fetchVolumetry();
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

  onVolumetryFilterChange(activeKeys: string[][]): void {
    if (!this.$volumetrySlice) return;
    this.$volumetryFilterValues = toFilterValues(this.$volumetrySlice.sliceConfigs, activeKeys);
    this._fetchVolumetry();
  }

  private _fetchSliceData(chartConfig: ChartConfig, filterKey: string): Observable<any[]> {
    const filter = chartConfig.filters?.items?.find(item => item.key === filterKey);
    if (!filter) {
      return of([]);
    }

    return this._restSessionService.getFilters(
      filter,
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts }
    ) as Observable<any[]>;
  }

  private _fetchAllCharts(): void {
    this._fetchStatus();
    this._fetchPerformance();
    this._fetchVolumetry();
  }

  private _fetchStatus(): void {
    const cfg = this.$statusRepartition.chartConfig;
    const ind = cfg.indicators.items.find(i => i.selected);
    const grp = cfg.groups.items.find(g => g.selected);
    const stk = ind?.extra?.stacks?.items?.find(s => s.selected);

    this.$statusRepartition.loading = true;
    this.$statusRepartition.data = [];
    this._restSessionService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk },
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, selections: buildFilterSelections(cfg, this.$statusFilterValues) }
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
    this.$performanceRepartition.loading = true;
    this.$performanceRepartition.data = [];
    this._restSessionService.getCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk },
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, selections: buildFilterSelections(cfg, this.$performanceFilterValues) }
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

    this.$volumetryRepartition.loading = true;
    this.$volumetryRepartition.data = [];
    this._restSessionService.getSizeCustom(
      { series: cfg.series.items, indicator: ind, group: grp, stack: stk },
      { namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, hosts: this.params.hosts, selections: buildFilterSelections(cfg, this.$volumetryFilterValues) }
    ).pipe(finalize(() => this.$volumetryRepartition.loading = false))
    .subscribe(data => {
      const formattedData = grp?.key === 'date' ? formatChartDates(data, this.groupedBy, this.datePipe) : data;
      const series = buildSeries(cfg.series.items, ind, grp, stk, formattedData);
      const pivoted = stk ? pivotByStack(cfg.series.items, ind, grp, stk, formattedData) : formattedData;
      this.$volumetryRepartition.rawData = formattedData;
      this.$volumetryRepartition.data = pivoted;
      const yAlias = ind?.jquery.buildAlias(cfg.series.items.find(s => s.selected)?.jquery.buildAlias() ?? '') ?? '';
      this.$volumetryDisplayUnit = this._resolveDisplayUnit(ind?.unit, formattedData, yAlias);
      this.$volumetryRepartition.chartProvider = {
        ...this.STATUS_CHART_PROVIDER_BASE,
        series: series
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
        .map((d: any) => typeof d[alias] === 'number' ? d[alias] : parseFloat(d[alias]))
        .filter((v: number) => isFinite(v) && v > 0)
    );

    return selectBestScale(unit, allValues).unit;
  }

  private _rebuildOrganizerConfigs(): void {
    this.$statusOrganizer = buildOrganizerChartBinding(this.$statusRepartition.chartConfig, this._statusOrganizerOptions());
    this.$performanceOrganizer = buildOrganizerChartBinding(this.$performanceRepartition.chartConfig, this._performanceOrganizerOptions());
    this.$volumetryOrganizer = buildOrganizerChartBinding(this.$volumetryRepartition.chartConfig, this._volumetryOrganizerOptions());
  }

  private _statusOrganizerOptions(): OrganizerChartBridgeOptions {
    return {
      onFetchSliceData: (filterKey: string) => this._fetchSliceData(this.$statusRepartition.chartConfig, filterKey),
      onExportVisual: () => this._statusChart?.exportImage('status'),
      onExportData: () => this._statusChart?.exportData('status')
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
      onExportVisual: () => this._volumetryChart?.exportImage('volumetry'),
      onExportData: () => this._volumetryChart?.exportData('volumetry')
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
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': `start.${this.groupedBy}.asc`
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$userRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$userRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$userRepartition.data = res;
      }
    });
  }

  getMediaType() {
    let args: any = {
      'column': `count:count,media.coalesce("Non renseigné"):media`,
      'join': 'instance',
      'instance.namespace': this.params.namespace,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$mediaRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$mediaRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$mediaRepartition.data = res;
      }
    });
  }

  getMethods() {
    let args: any = {
      'column': `count:count,method:method`,
      'join': 'instance',
      'instance.namespace': this.params.namespace,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$methodRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$methodRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        this.$methodRepartition.data = res;
      }
    });
  }

  getUserAgents() {
    let args: any = {
      'column': `count:count,user_agt:user_agt`,
      'join': 'instance',
      'instance.namespace': this.params.namespace,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString(),
      'order': 'count.desc'
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this.$userAgentRepartition.loading = true;
    this._restSessionService.getRestSession(args).pipe(finalize(() => this.$userAgentRepartition.loading = false)).subscribe({
      next: (res: any[]) => {
        const aggregated = (res || []).reduce((sum, r) => {
          const userAgent = (r.user_agt ? r.user_agt.split('/')[0].trim() : '') || 'N/A';
          sum[userAgent] = (sum[userAgent] || 0) + (r.count || 0);
          return sum;
        }, {} as Record<string, number>);

        this.$userAgentRepartition.data = Object.entries(aggregated)
            .map(([user_agt, count]: [string, number]) => ({ user_agt, count }))
            .sort((a, b) => b.count - a.count);
      }
    });
  }

  getDependencies() {
    this.$dependencyRepartition.loading = true;
    this.$dependencyRepartition.data = [];
    this._restSessionService.getDependencies({namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts})
      .pipe(finalize(() => this.$dependencyRepartition.loading = false))
      .subscribe({
        next: (res: any[]) => {this.$dependencyRepartition.data = res}
      })
  }

  getDependents() {
    this.$dependentRepartition.loading = true;
    this.$dependentRepartition.data = [];
    this._restSessionService.getDependents({namespace: this.params.namespace, start: this.params.period.start, end: this.params.period.end, servers: this.params.hosts})
    .pipe(finalize(() => this.$dependentRepartition.loading = false))
    .subscribe({
      next: (res: any[]) => {this.$dependentRepartition.data = res}
    })
  }

  getGlobalStatistics() {
    let args: any = {
      'column': `percentileDisc(0.95).within(group.order(elapsed_time)):elapsedPercentile,count:count_request,count_error:count_error,count(user.distinct):count_user`,
      'join': 'instance',
      'instance.namespace': this.params.namespace,
      'start.ge': this.params.period.start.toISOString(),
      'start.lt': this.params.period.end.toISOString()
    }
    if(this.params.hosts?.length){
      args['instance.app_name.in'] = this.params.hosts.join(',');
    }
    this._restSessionService.getRestSession(args).subscribe({
      next: (res: any[]) => {
        this.$globalStatistic.totalRequest = res[0]?.count_request ?? 0;
        this.$globalStatistic.totalRequestError = res[0]?.count_error ?? 0;
        this.$globalStatistic.percentError = res[0]?.count_request ? (res[0].count_error / res[0].count_request) * 100 : 0;
        this.$globalStatistic.elapsedPercentile = res[0]?.elapsedPercentile ?? 0;
        this.$globalStatistic.totalUser = res[0]?.count_user ?? 0;
      }
    });
  }

  getActualIndicator(chartConfig: ChartConfig) {
    return chartConfig.indicators.items.find(g => g.selected);
  }

  getActualGroup(chartConfig: ChartConfig) {
    return chartConfig.groups.items.find(g => g.selected);
  }

  getActualFilter(chartConfig: ChartConfig) {
    return chartConfig.filters.items.find(g => g.selected);
  }

  getActualStack(chartConfig: ChartConfig) {
    return this.getActualIndicator(chartConfig).extra?.stacks?.items.find(g => g.selected);
  }
}
