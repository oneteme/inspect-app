import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { DashboardDetailContext } from './detail-view.model';
import {STATUS} from "../../../constants";

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
    @Output() instanceFilter = new EventEmitter<string>();
    @Output() viewAllClick = new EventEmitter<string>();

    getErrBarWidth(list: { count: number }[], count: number): number {
        return list?.[0]?.count ? Math.round((count / list[0].count) * 100) : 0;
    }

    getSparklinePerc(key: string): number {
        return this.context.sparklinePercs[key] ?? 0;
    }

    get selectedKey(): string | null {
        return this.context.selectedInsights.values().next().value ?? null;
    }

    get isSessionInsight(): boolean {
        const sessionKeys = new Set(['SERVICE', 'BATCH', 'STARTUP', 'VIEW', 'TEST']);
        return !!this.selectedKey && sessionKeys.has(this.selectedKey);
    }

    get sessionChartData(): { stringDate: string; count: number }[] {
        if (this.selectedKey === 'BATCH') return this.context.batchExceptionChart;
        if (this.selectedKey === 'VIEW') return this.context.viewExceptionChart;
        if (this.selectedKey === 'STARTUP') return this.context.startupExceptionChart;
        return this.context.sessionExceptionChart;
    }

    get sessionChartSubtitle(): string {
        switch (this.selectedKey) {
            case 'BATCH': return ' — Tâches planifiées';
            case 'VIEW': return ' — Parcours client';
            case 'STARTUP': return ' — Initialisation';
            default: return ' — Services exposés';
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
        return proto ? ` — ${proto.label}` : '';
    }

    /** Indique si le bloc db-clt-block est encore en chargement pour l'insight sélectionné */
    get isBlockLoading(): boolean {
        const key = this.selectedKey;
        if (!key) return false;
        if (key === 'SERVICE') return this.context.tabRequests['sessionExceptionsTable']?.isLoading !== false;
        if (key === 'BATCH')   return this.context.tabRequests['batchExceptionTable']?.isLoading !== false;
        if (key === 'VIEW')    return this.context.tabRequests['viewExceptionTable']?.isLoading !== false;
        if (key === 'STARTUP' || key === 'TEST') return this.context.tabRequests['startupExceptionTable']?.isLoading !== false;
        const protoDef = this.context.protocolDefs.find(p => p.key === key);
        if (protoDef) {
            if (this.context.chartRequests[protoDef.reqKey]?.isLoading !== false) return true;
            // chart chargé : si taux 0 % on sait qu'il n'y a rien, sinon attendre topErrors
            return this.context.sparklinePercs[key] !== 0 && this.context.kpiLoading;
        }
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
            default: {
                const protoDef = this.context.protocolDefs.find(p => p.key === key);
                const loaded = protoDef
                    ? this.context.chartRequests[protoDef.reqKey]?.isLoading === false
                    : !this.context.kpiLoading;
                return loaded && this.context.sparklinePercs[key] === 0;
            }
        }
    }

    trackByType(_: number, item: { type: string }): string { return item.type; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }

    protected readonly Status = STATUS;
}
