import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'dashboard-detail-view',
  templateUrl: './detail-view.component.html',
  styleUrls: ['./detail-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class DashboardDetailViewComponent {

    // ── User agent ──────────────────────────────────────────────
    @Input() userAgentData: any[] = [];
    @Input() userAgentLoading = true;
    @Input() uaGroups: any[] = [];
    @Input() uaChartData: any[] = [];
    @Input() uaPieConfig: any;
    @Input() hiddenAgents: Set<string> = new Set();

    // ── Insights ────────────────────────────────────────────────
    @Input() selectedInsights: Set<string> = new Set();
    @Input() protocolDefs: any[] = [];
    @Input() topErrors: Record<string, { type: string; count: number }[]> = {};
    @Input() kpiLoading = true;
    @Input() serverHealthLoading = true;
    @Input() stoppedServers: any[] = [];
    @Input() tabRequests: Record<string, any> = {};
    @Input() topSessionErrors: any[] = [];
    @Input() topBatchErrors: any[] = [];
    @Input() sessionCountLoading = true;
    @Input() sessionInitErrors = 0;
    @Input() sessionWebErrors = 0;
    @Input() sessionTestErrors = 0;
    @Input() insightsAllClear = false;

    // ── Protocol activity ────────────────────────────────────────
    @Input() chartRequests: Record<string, any> = {};
    @Input() sparklinePercs: Record<string, number> = {};
    @Input() sparklineTitles: Record<string, { title: string; subtitle: string }> = {};

    // ── Outputs ─────────────────────────────────────────────────
    @Output() agentToggle = new EventEmitter<string>();
    @Output() requestProtocolNav = new EventEmitter<{ key: string; errorType: string }>();
    @Output() sessionTypeNav = new EventEmitter<string>();
    @Output() exceptionNav = new EventEmitter<{ type: string; tab: 'rest' | 'batch' }>();
    @Output() supervisionNav = new EventEmitter<any>();
    @Output() protocolDialogOpen = new EventEmitter<{ observable: any; type: string }>();

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

    get selectedLabel(): string {
        if (!this.selectedKey) return 'Clients';
        const label = this.protocolDefs.find(p => p.key === this.selectedKey)?.label ?? this.selectedKey;
        const prefix = this.isSessionInsight ? 'Session' : 'Request';
        return `${prefix} — ${label}`;
    }

    get totalUaClients(): number {
        return this.uaGroups.reduce(
            (sum, g) => sum + g.items.reduce((s: number, i: any) => s + (i.count || 0), 0), 0
        );
    }

    getProtoTotalErrors(key: string): number {
        if (key === 'SERVICE') return this.topSessionErrors.reduce((s, e) => s + e.count, 0);
        if (key === 'BATCH')   return this.topBatchErrors.reduce((s, e) => s + e.count, 0);
        if (key === 'STARTUP') return this.sessionInitErrors;
        if (key === 'VIEW')    return this.sessionWebErrors;
        if (key === 'TEST')    return this.sessionTestErrors;
        return (this.topErrors[key] || []).reduce((s, e) => s + e.count, 0);
    }

    getProtoTotalCalls(key: string): number {
        const def = this.protocolDefs.find(p => p.key === key);
        if (!def) return 0;
        const chart: any[] = this.chartRequests[def.reqKey]?.chart ?? [];
        return chart.reduce((acc, obj) => acc + (obj.count ?? obj.countok ?? 0), 0);
    }

    trackByType(_: number, item: { type: string }): string { return item.type; }
    trackByAppName(_: number, item: { appName: string }): string { return item.appName; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }
}
