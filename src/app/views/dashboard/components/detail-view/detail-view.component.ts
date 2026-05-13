import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'dashboard-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardDetailViewComponent {

    // ── Insights ────────────────────────────────────────────────
    @Input() selectedInsights: Set<string> = new Set();
    @Input() protocolDefs: any[] = [];
    @Input() topErrors: Record<string, { type: string; count: number }[]> = {};
    @Input() kpiLoading = true;
    @Input() serverHealthLoading = true;
    @Input() tabRequests: Record<string, any> = {};
    @Input() topSessionErrors: any[] = [];
    @Input() topBatchErrors: any[] = [];
    @Input() topViewErrors: any[] = [];
    @Input() sessionExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    @Input() batchExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    @Input() viewExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    @Input() startupExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    @Input() sessExcLineConfig: any;
    @Input() sessionCountLoading = true;
    @Input() sessionInitErrors = 0;
    @Input() startupErrorsByServer: { appName: string; errors: number }[] = [];
    @Input() sessionWebErrors = 0;
    @Input() sessionTestErrors = 0;
    @Input() insightsAllClear = false;
    @Input() divergentBranches: { branch: string; count: number; servers: string[] }[] = [];

    // ── Protocol activity ────────────────────────────────────────
    @Input() chartRequests: Record<string, any> = {};
    @Input() sparklinePercs: Record<string, number> = {};
    @Input() sparklineTitles: Record<string, { title: string; subtitle: string }> = {};

    // ── Outputs ─────────────────────────────────────────────────
    @Output() requestProtocolNav = new EventEmitter<{ key: string; errorType: string }>();
    @Output() sessionTypeNav = new EventEmitter<{ type: string; server?: string }>();
    @Output() exceptionNav = new EventEmitter<{ type: string; tab: 'rest' | 'batch' | 'view' }>();
    @Output() protocolDialogOpen = new EventEmitter<{ observable: any; type: string }>();
    @Output() instanceFilter = new EventEmitter<string>();

    // ── Helpers ──────────────────────────────────────────────────
    getErrBarWidth(list: { count: number }[], count: number): number {
        return list?.[0]?.count ? Math.round((count / list[0].count) * 100) : 0;
    }

    getSparklinePerc(key: string): number {
        return this.sparklinePercs[key] ?? 0;
    }

    getSparklineSubtitle(key: string): string {
        return this.sparklineTitles[key]?.subtitle ?? '';
    }

    getProtoErrBarWidth(errors: { count: number }[], count: number): number {
        return errors?.[0]?.count ? Math.round((count / errors[0].count) * 100) : 0;
    }

    getProtoTotalRequests(key: string): number {
        const def = this.protocolDefs.find(p => p.key === key);
        if (!def) return 0;
        const chart: any[] = this.chartRequests[def.reqKey]?.chart ?? [];
        return chart.reduce((acc, obj) => ({ countok: acc.countok + obj.countok, count: acc.count + obj.count }), { countok: 0, count: 0 }).countok;
    }

    getTrend(key: string): 'up' | 'down' | 'stable' {
        const def = this.protocolDefs.find(p => p.key === key);
        if (!def) return 'stable';
        const chart: any[] = this.chartRequests[def.reqKey]?.chart ?? [];
        if (chart.length < 4) return 'stable';
        const half = Math.floor(chart.length / 2);
        const avgFirst = chart.slice(0, half).reduce((s: number, e: any) => s + (e.perc ?? 0), 0) / half;
        const avgSecond = chart.slice(half).reduce((s: number, e: any) => s + (e.perc ?? 0), 0) / (chart.length - half);
        if (avgSecond > avgFirst * 1.25) return 'up';
        if (avgSecond < avgFirst * 0.75) return 'down';
        return 'stable';
    }

    // ── KPI dynamiques liés à l'insight sélectionné ──────────
    get selectedKey(): string | null {
        for (const k of this.selectedInsights) return k;
        return null;
    }

    get isSessionInsight(): boolean {
        const sessionKeys = new Set(['SERVICE', 'BATCH', 'STARTUP', 'VIEW', 'TEST']);
        return !!this.selectedKey && sessionKeys.has(this.selectedKey);
    }

    get isFluxInsight(): boolean {
        return !!this.selectedKey && !this.isSessionInsight;
    }

    get sessionChartData(): { stringDate: string; count: number }[] {
        if (this.selectedKey === 'BATCH')   return this.batchExceptionChart;
        if (this.selectedKey === 'VIEW')    return this.viewExceptionChart;
        if (this.selectedKey === 'STARTUP') return this.startupExceptionChart;
        return this.sessionExceptionChart;
    }

    get sessionChartSubtitle(): string {
        switch (this.selectedKey) {
            case 'BATCH':   return 'Batch — nombre d\'exceptions par période';
            case 'VIEW':    return 'UI — nombre d\'exceptions par période';
            case 'STARTUP': return 'Démarrage — nombre d\'exceptions par période';
            default:        return 'Service — nombre d\'exceptions par période';
        }
    }

    get selectedLabel(): string {
        if (!this.selectedKey) return 'Clients';
        const label = this.protocolDefs.find(p => p.key === this.selectedKey)?.label ?? this.selectedKey;
        const prefix = this.isSessionInsight ? 'Session' : 'Request';
        return `${prefix} — ${label}`;
    }

    /** Indique si le bloc db-clt-block est encore en chargement pour l'insight sélectionné */
    get isBlockLoading(): boolean {
        const key = this.selectedKey;
        if (!key) return false;
        if (key === 'SERVICE') return this.tabRequests['sessionExceptionsTable']?.isLoading !== false;
        if (key === 'BATCH')   return this.tabRequests['batchExceptionTable']?.isLoading !== false;
        if (key === 'VIEW')    return this.tabRequests['viewExceptionTable']?.isLoading !== false;
        if (key === 'STARTUP' || key === 'TEST') return this.sessionCountLoading;
        const def = this.protocolDefs.find(p => p.key === key);
        return def ? this.chartRequests[def.reqKey]?.isLoading !== false : this.kpiLoading;
    }

    /** Loading du graphique selon le type de session sélectionné */
    get sessionChartLoading(): boolean {
        if (this.selectedKey === 'BATCH')   return this.tabRequests['batchExceptionTable']?.isLoading || this.tabRequests['batchTopJobsTable']?.isLoading;
        if (this.selectedKey === 'VIEW')    return this.tabRequests['viewExceptionTable']?.isLoading;
        if (this.selectedKey === 'STARTUP') return this.tabRequests['startupExceptionTable']?.isLoading;
        return this.tabRequests['sessionExceptionsTable']?.isLoading;
    }

    /** Aucun incident détecté sur la période pour l'insight actif */
    get isNoIncidents(): boolean {
        const key = this.selectedKey;
        if (!key) return false;
        switch (key) {
            case 'SERVICE':
                return this.tabRequests['sessionExceptionsTable']?.isLoading === false && !this.topSessionErrors.length;
            case 'BATCH':
                return this.tabRequests['batchExceptionTable']?.isLoading === false && !this.topBatchErrors.length;
            case 'VIEW':
                return this.tabRequests['viewExceptionTable']?.isLoading === false && !this.topViewErrors.length && !this.sessionWebErrors;
            case 'STARTUP':
                return !this.sessionCountLoading && !this.sessionInitErrors && !this.divergentBranches.length;
            case 'TEST':
                return !this.sessionCountLoading && !this.sessionTestErrors;
            default:
                return !this.kpiLoading && !this.topErrors[key]?.length;
        }
    }

    trackByType(_: number, item: { type: string }): string { return item.type; }
    trackByAppName(_: number, item: { appName: string }): string { return item.appName; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }
}
