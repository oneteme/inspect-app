import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DashboardDetailContext } from './detail-view.model';

@Component({
    selector: 'dashboard-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardDetailViewComponent {

    @Input() context!: DashboardDetailContext;

    @Output() requestProtocolNav = new EventEmitter<{ key: string; errorType: string }>();
    @Output() sessionTypeNav = new EventEmitter<{ type: string; server?: string }>();
    @Output() exceptionNav = new EventEmitter<{ type: string; tab: 'rest' | 'batch' | 'view' }>();
    @Output() protocolDialogOpen = new EventEmitter<{ observable: any; type: string }>();
    @Output() instanceFilter = new EventEmitter<string>();

    getErrBarWidth(list: { count: number }[], count: number): number {
        return list?.[0]?.count ? Math.round((count / list[0].count) * 100) : 0;
    }

    getSparklinePerc(key: string): number {
        return this.context.sparklinePercs[key] ?? 0;
    }

    getSparklineSubtitle(key: string): string {
        return this.context.sparklineTitles[key]?.subtitle ?? '';
    }

    getProtoErrBarWidth(errors: { count: number }[], count: number): number {
        return errors?.[0]?.count ? Math.round((count / errors[0].count) * 100) : 0;
    }

    getProtoTotalRequests(key: string): number {
        const def = this.context.protocolDefs.find(p => p.key === key);
        if (!def) return 0;
        const chart: any[] = this.context.chartRequests[def.reqKey]?.chart ?? [];
        return chart.reduce((acc, obj) => ({ countok: acc.countok + obj.countok, count: acc.count + obj.count }), { countok: 0, count: 0 }).countok;
    }

    getTrend(key: string): 'up' | 'down' | 'stable' {
        const def = this.context.protocolDefs.find(p => p.key === key);
        if (!def) return 'stable';
        const chart: any[] = this.context.chartRequests[def.reqKey]?.chart ?? [];
        if (chart.length < 4) return 'stable';
        const half = Math.floor(chart.length / 2);
        const avgFirst = chart.slice(0, half).reduce((s: number, e: any) => s + (e.perc ?? 0), 0) / half;
        const avgSecond = chart.slice(half).reduce((s: number, e: any) => s + (e.perc ?? 0), 0) / (chart.length - half);
        if (avgSecond > avgFirst * 1.25) return 'up';
        if (avgSecond < avgFirst * 0.75) return 'down';
        return 'stable';
    }

    get selectedKey(): string | null {
        for (const k of this.context.selectedInsights) return k;
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
        if (this.selectedKey === 'BATCH')   return this.context.batchExceptionChart;
        if (this.selectedKey === 'VIEW')    return this.context.viewExceptionChart;
        if (this.selectedKey === 'STARTUP') return this.context.startupExceptionChart;
        return this.context.sessionExceptionChart;
    }

    get sessionChartSubtitle(): string {
        switch (this.selectedKey) {
            case 'BATCH': return 'Tâches planifiées — taux d\'exceptions';
            case 'VIEW': return 'Parcours client — taux d\'exceptions';
            case 'STARTUP': return 'Initialisation — taux d\'exceptions';
            default: return 'Services exposés — taux d\'exceptions';
        }
    }

    get selectedLabel(): string {
        if (!this.selectedKey) return 'Clients';
        if (this.isSessionInsight) {
            const sessionLabels: Record<string, string> = {
                SERVICE: 'Services exposés', BATCH: 'Tâches planifiées', STARTUP: 'Initialisation', VIEW: 'Parcours client', TEST: 'Test'
            };
            return sessionLabels[this.selectedKey] ?? this.selectedKey;
        }
        return this.context.protocolDefs.find(p => p.key === this.selectedKey)?.label ?? this.selectedKey;
    }

    get fluxChartSubtitle(): string {
        const proto = this.context.protocolDefs.find(p => this.context.selectedInsights.has(p.key));
        return proto ? `${proto.label} — Taux d'exceptions` : 'Taux d\'exceptions';
    }

    /** Indique si le bloc db-clt-block est encore en chargement pour l'insight sélectionné */
    get isBlockLoading(): boolean {
        const key = this.selectedKey;
        if (!key) return false;
        if (key === 'SERVICE') return this.context.tabRequests['sessionExceptionsTable']?.isLoading !== false;
        if (key === 'BATCH')   return this.context.tabRequests['batchExceptionTable']?.isLoading !== false;
        if (key === 'VIEW')    return this.context.tabRequests['viewExceptionTable']?.isLoading !== false;
        if (key === 'STARTUP' || key === 'TEST') return this.context.tabRequests['startupExceptionTable']?.isLoading !== false;
        return this.context.kpiLoading;
    }

    /** Loading du graphique selon le type de session sélectionné */
    get sessionChartLoading(): boolean {
        if (this.selectedKey === 'BATCH')   return this.context.tabRequests['batchExceptionTable']?.isLoading || this.context.tabRequests['batchTopJobsTable']?.isLoading;
        if (this.selectedKey === 'VIEW')    return this.context.tabRequests['viewExceptionTable']?.isLoading;
        if (this.selectedKey === 'STARTUP') return this.context.tabRequests['startupExceptionTable']?.isLoading;
        return this.context.tabRequests['sessionExceptionsTable']?.isLoading;
    }

    /** Aucun incident détecté sur la période pour l'insight actif */
    get isNoIncidents(): boolean {
        const key = this.selectedKey;
        if (!key) return false;
        switch (key) {
            case 'SERVICE':
                return this.context.tabRequests['sessionExceptionsTable']?.isLoading === false && !this.context.topSessionErrors.length;
            case 'BATCH':
                return this.context.tabRequests['batchExceptionTable']?.isLoading === false && !this.context.topBatchErrors.length;
            case 'VIEW':
                return this.context.tabRequests['viewExceptionTable']?.isLoading === false && !this.context.topViewErrors.length && !this.context.sessionWebErrors;
            case 'STARTUP':
                return !this.context.sessionCountLoading && !this.context.sessionInitErrors;
            case 'TEST':
                return !this.context.sessionCountLoading && !this.context.sessionTestErrors;
            default:
                return !this.context.kpiLoading && !this.context.topErrors[key]?.length;
        }
    }

    trackByType(_: number, item: { type: string }): string { return item.type; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }
}
