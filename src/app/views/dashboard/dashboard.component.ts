import {Component, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {catchError, combineLatest, EMPTY, finalize, forkJoin, map, Observable, of, Subscription, switchMap} from 'rxjs';
import {DatePipe, DecimalPipe, Location} from '@angular/common';
import {app, makeDatePeriod} from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Constants, UA_CATEGORY_DEFS, UA_PIE_BASE, UaGroup} from '../constants';
import {formatters, groupByColor, periodManagement, recreateDate} from 'src/app/shared/util';
import {MatDialog} from '@angular/material/dialog';
import {ProtocolExceptionComponent} from './components/protocol-exception-modal/protocol-exception-modal.component';
import {InstanceService} from 'src/app/service/jquery/instance.service';
import {RestSessionService} from 'src/app/service/jquery/rest-session.service';
import {MainSessionService} from 'src/app/service/jquery/main-session.service';
import {RestRequestService} from 'src/app/service/jquery/rest-request.service';
import {DatabaseRequestService} from 'src/app/service/jquery/database-request.service';
import {FtpRequestService} from 'src/app/service/jquery/ftp-request.service';
import {LdapRequestService} from 'src/app/service/jquery/ldap-request.service';
import {
    LastServerStart,
    SessionExceptionsByPeriodAndAppname,
} from 'src/app/model/jquery.model';
import {SmtpRequestService} from 'src/app/service/jquery/smtp-request.service';
import {NumberFormatterPipe} from 'src/app/shared/pipe/number.pipe';
import {ChartProvider} from '@oneteme/jquery-core';
import {InstanceTraceService} from 'src/app/service/jquery/instance-trace.service';

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent implements OnDestroy {
    constants = Constants;

    readonly protocolDefs: { key: string; reqKey: string; label: string; chartConfig: any }[] = [
        { key: 'rest',  reqKey: 'restRequestExceptionsTable',     label: 'REST',  chartConfig: Constants.REST_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'jdbc',  reqKey: 'databaseRequestExceptionsTable', label: 'JDBC',  chartConfig: Constants.DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'ftp',   reqKey: 'ftpRequestExceptionsTable',      label: 'FTP',   chartConfig: Constants.FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'smtp',  reqKey: 'smtpRequestExceptionsTable',     label: 'SMTP',  chartConfig: Constants.SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'ldap',  reqKey: 'ldapRequestExceptionsTable',     label: 'LDAP',  chartConfig: Constants.LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE },
    ];

    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _router: EnvRouter = inject(EnvRouter);
    private _instanceService = inject(InstanceService);
    private _sessionService = inject(RestSessionService);
    private _mainService = inject(MainSessionService);
    private _restService = inject(RestRequestService);
    private _datebaseService = inject(DatabaseRequestService);
    private _ftpService = inject(FtpRequestService);
    private _smtpService = inject(SmtpRequestService)
    private _ldapService = inject(LdapRequestService);
    private _location: Location = inject(Location);
    private _datePipe = inject(DatePipe);
    private _dialog = inject(MatDialog);
    private _decimalPipe = inject(DecimalPipe);
    private _numberFormatter = inject(NumberFormatterPipe);
    private _instanceTraceService = inject(InstanceTraceService);

    sparklineTitles: {
        rest: {title: string, subtitle: string},
        jdbc: {title: string, subtitle: string},
        ftp: {title: string, subtitle: string},
        smtp: {title: string, subtitle: string},
        ldap: {title: string, subtitle: string}
    } = {
        rest: {title: 'REST: 0.00%', subtitle: 'sur 0 requête'},
        jdbc: {title: 'JDBC: 0.00%', subtitle: 'sur 0 requête'},
        ftp: {title: 'FTP: 0.00%', subtitle: 'sur 0 requête'},
        smtp: {title: 'SMTP: 0.00%', subtitle: 'sur 0 requête'},
        ldap: {title: 'LDAP: 0.00%', subtitle: 'sur 0 requête'}
    }

    MAPPING_TYPE = Constants.MAPPING_TYPE;
    selectedExceptionTab = 0;
    subscriptions: Subscription[] = [];
    chartSubscriptions: Subscription[] = [];
    tabSubscriptions: Subscription[] = [];
    tabRequests: { [key: string]: { observable?: Observable<Object>, data?: any[], isLoading?: boolean, key?: string } } = {};
    chartRequests: { [key: string]: { observable?: Observable<Object>, data?: any[], chart?:any[], isLoading?: boolean, key?: string, title?: string, subtitle?: string } } = {};
    serverFilterForm = new FormGroup({
        appname: new FormControl([""]),
        dateRangePicker: new FormGroup({
            start: new FormControl<Date | null>(null, [Validators.required]),
            end: new FormControl<Date | null>(null, [Validators.required]),
        }),
    });
    serverNameIsLoading = true;
    params: Partial<{ env: string, start: Date, end: Date, serveurs: string[] }> = {};
    nameDataList: any[];
    groupedBy: string;

    serverHealthData: LastServerStart[] = [];
    serverHealthLoading = true;
    deployTableRows: (LastServerStart & { lastTrace?: number })[] = [];
    deployTableToday: Date = new Date();
    versionColor: any = {};
    onlineServerStat = 0;
    pendingServerStat = 0;
    offlineServerStat = 0;
    showOverview = true;
    serverStatusFilter: 'online' | 'pending' | 'offline' | 'all' = 'all';
    filteredDeployRows: (LastServerStart & { lastTrace?: number })[] = [];
    private _onlineRows: (LastServerStart & { lastTrace?: number })[] = [];
    private _pendingRows: (LastServerStart & { lastTrace?: number })[] = [];
    private _offlineRows: (LastServerStart & { lastTrace?: number })[] = [];
    sessionCountData: { type: string; total: number; errors: number }[] = [];
    sessionCountLoading = true;
    restSessionCount: { total: number; errors: number } = { total: 0, errors: 0 };
    globalKpi: { globalErrorRate: number; totalSessions: number; totalErrors: number } | null = null;
    kpiLoading = true;
    sparklinePercs: { rest: number; jdbc: number; ftp: number; smtp: number; ldap: number } = { rest: 0, jdbc: 0, ftp: 0, smtp: 0, ldap: 0 };
    topErrors: Record<string, { type: string; count: number }[]> = {};
    showInactiveProtocols = false;
    selectedInsights = new Set<string>();
    userAgentData: { label: string; count: number; pct: number; color: string; group: UaGroup }[] = [];
    userAgentLoading = true;
    hiddenAgents = new Set<string>();
    uaPieConfig: ChartProvider<string, number> = UA_PIE_BASE as ChartProvider<string, number>;
    uaChartData: { label: string; count: number; pct: number; color: string; group: UaGroup }[] = [];

    toggleAgent(label: string): void {
        if (this.hiddenAgents.has(label)) {
            this.hiddenAgents.delete(label);
        } else {
            this.hiddenAgents.add(label);
        }
        this.hiddenAgents = new Set(this.hiddenAgents);
        this.uaChartData = this.userAgentData.filter(d => !this.hiddenAgents.has(d.label));
        this._rebuildUaGroups();
        this._rebuildUaPieConfig();
    }

    readonly uaGroupDefs: { key: UaGroup; label: string; icon: string }[] = [
        { key: 'service', label: 'Technologies',   icon: 'hub'          },
        { key: 'user',    label: 'Navigateurs',        icon: 'public'       },
        { key: 'tool',    label: 'Outils',               icon: 'terminal'     },
        { key: 'unknown', label: 'Non identifiés',       icon: 'help_outline' },
    ];

    uaGroups: { key: UaGroup; label: string; icon: string; items: typeof this.userAgentData }[] = [];

    private _rebuildUaGroups(): void {
        this.uaGroups = this.uaGroupDefs.map(g => ({
            ...g,
            items: this.userAgentData.filter(d => d.group === g.key)
        }));
    }

    private _rebuildUaPieConfig(): void {
        const visible = this.uaChartData;
        const total = visible.reduce((s, d) => s + d.count, 0);
        const baseDonutLabels = (UA_PIE_BASE.options?.plotOptions as any)?.pie?.donut?.labels ?? {};
        this.uaPieConfig = {
            ...UA_PIE_BASE,
            options: {
                ...UA_PIE_BASE.options,
                colors: visible.map(d => d.color),
                plotOptions: { pie: { donut: { labels: { ...baseDonutLabels, total: { ...baseDonutLabels.total, formatter: () => total.toLocaleString('fr-FR') + ' req.' } } } } }
            }
        };
    }

    private _chartsResolved = 0;
    constructor() {
        this.subscriptions.push(combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || app.defaultEnv;
                this.params.start = v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(0, 1).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(0, 1).end;
                this.params.serveurs = Array.isArray(v.queryParams['appname']) ? v.queryParams['appname'] : v.queryParams['appname'] ? [v.queryParams['appname']] : []
                if (this.params.serveurs.length > 0) {
                    this.patchServerValue(this.params.serveurs);
                }
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.subscriptions.push(this._instanceService.getApplications('SERVER', this.params.env)
                    .pipe(finalize(() => this.serverNameIsLoading = false))
                    .subscribe({
                        next: (appNames: { appName: string }[]) => {
                            this.nameDataList = appNames.map(r => r.appName);
                            this.patchServerValue(this.params.serveurs);
                        }, error: (e) => {
                            console.log(e)
                        }
                    }));

                let serverParam = this.createServerFilter();
                this.chartRequests = this.REQUESTS(this.params.env, this.params.start, this.params.end, serverParam.app_name);
                this.tabRequests   = this.TAB_REQUESTS(this.params.env, this.params.start, this.params.end, serverParam.app_name);
                this.showInactiveProtocols = false;
                this.initTab();
                this.initCharts();
                this.loadServerHealth(this.params.env);
                this.loadUserAgentData();
                this.sessionCountData = [];
                this.sessionCountLoading = true;
                this.restSessionCount = { total: 0, errors: 0 };
                this.subscriptions.push(this._sessionService.getCountByEnv({ env: this.params.env, start: this.params.start, end: this.params.end })
                    .subscribe({ next: (data) => { this.restSessionCount = data; this._rebuildSessionSummaries(); } }));
                this.subscriptions.push(this._mainService.getCountByType({ env: this.params.env, start: this.params.start, end: this.params.end })
                    .pipe(finalize(() => this.sessionCountLoading = false))
                    .subscribe({ next: (data) => { this.sessionCountData = data; this._rebuildSessionSummaries(); } }));
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${this.params.serveurs.length > 0 ? '&' + this.params.serveurs.map(name => `appname=${name}`).join('&') : ''}`)
            }
        }));
    }
    initCharts() {
        this._chartsResolved = 0;
        this.globalKpi = null;
        this.kpiLoading = true;
        this.chartSubscriptions.forEach(t => t.unsubscribe());
        const totalCharts = Object.keys(this.chartRequests).length;
        Object.keys(this.chartRequests).forEach(k => {
            this.chartRequests[k].chart = [];
            this.chartRequests[k].isLoading = true;
            this.chartSubscriptions.push(this.chartRequests[k].observable
                .pipe(finalize(() => {
                    this.chartRequests[k].isLoading = false;
                    if (++this._chartsResolved >= totalCharts) {
                        this.computeGlobalKpi();
                    }
                }))
                .subscribe({
                    next: (res: any) => {
                        this.chartRequests[k].data = res.data;
                        this.chartRequests[k].chart = res.chart;
                    }
                }));
        });
    }


    initTab() {
        this.exceptionsAllEmpty = false;
        this.tabSubscriptions.forEach(t => t.unsubscribe());
        this.selectedExceptionTab = 0;
        Object.keys(this.tabRequests).forEach(i => {
            this.tabRequests[i].data = [];
            this.tabRequests[i].isLoading = true;
            this.tabSubscriptions.push(this.tabRequests[i].observable
                .pipe(finalize(() => {
                    this.tabRequests[i].isLoading = false;
                    this._autoSelectTab();
                    this._rebuildTabErrors();
                }))
                .subscribe({
                    next: (res: any[]) => {
                        this.tabRequests[i].data = res;
                    }
                }));
        })
    }

    private _autoSelectTab(): void {
        if (this.tabRequests.sessionExceptionsTable?.isLoading || this.tabRequests.batchExceptionTable?.isLoading) return;
        if (!this.tabRequests.sessionExceptionsTable?.data?.length && this.tabRequests.batchExceptionTable?.data?.length > 0) {
            this.selectedExceptionTab = 1;
        } else {
            this.selectedExceptionTab = 0;
        }
    }

    search() {
        if (this.serverFilterForm.valid) {
            let appname = this.serverFilterForm.getRawValue().appname;
            let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
            let end = this.serverFilterForm.getRawValue().dateRangePicker.end
            let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
            if (this.params.start.toISOString() != start.toISOString()
                || this.params.end.toISOString() != excludedEnd.toISOString()
                || !this.params?.serveurs?.every((element, index) => element === appname[index])
                || appname.length != this.params?.serveurs?.length) {
                this._router.navigate([], {
                    relativeTo: this._activatedRoute,
                    queryParamsHandling: 'merge',
                    queryParams: { ...(appname !== undefined && { appname }), start: start.toISOString(), end: excludedEnd }
                })
            } else {
                this.initTab();
                this.initCharts();
            }
        }
    }

    patchDateValue(start: Date, end: Date) {
        this.serverFilterForm.patchValue({
            dateRangePicker: {
                start: start,
                end: end
            }
        }, { emitEvent: false });
    }


    createServerFilter(): any {
        if (this.params.serveurs.length > 0) {
            return { app_name: `${this.params.serveurs.map(v => `"${v}"`).join(',')}` };
        }
        return { app_name: null };
    }

    openProtocolDialog(exceptions: { observable: any, type: string }) {
        if (exceptions.observable.data?.length > 0) {
            this._dialog.open(ProtocolExceptionComponent, {
                width: "70%",
                height: "60vh",
                panelClass: "exception-modal",
                data: {
                    exceptions: exceptions,
                    serveurs: this.params.serveurs,
                    env: this.params.env,
                    start: this.params.start,
                    groupedBy: this.groupedBy,
                    type: exceptions.type
                },

            })
        }
    }

    patchServerValue(servers: any[]) {
        this.serverFilterForm.patchValue({
            appname: servers
        }, { emitEvent: false })
    }

    computeGlobalKpi() {
        const keys = ['restRequestExceptionsTable', 'databaseRequestExceptionsTable', 'ftpRequestExceptionsTable', 'smtpRequestExceptionsTable', 'ldapRequestExceptionsTable'];
        let totalErrors = 0;
        let totalRequests = 0;
        keys.forEach(k => {
            const sum = this.sumcounts(this.chartRequests[k]?.chart ?? []);
            totalErrors += sum.count;
            totalRequests += sum.countok;
        });
        this.globalKpi = {
            globalErrorRate: totalRequests > 0 ? (totalErrors * 100) / totalRequests : 0,
            totalSessions: totalRequests,
            totalErrors
        };
        this.kpiLoading = false;
        this._computeTopErrors();
        this._rebuildProtocolSummaries();
    }

    loadServerHealth(env: string) {
        this.serverHealthLoading = true;
        this.serverHealthData = [];
        this.deployTableRows = [];
        this.subscriptions.push(
            this._instanceService.getLastServerStart({ env })
                .pipe(
                    switchMap((servers: LastServerStart[]) => forkJoin({
                        servers: of(servers),
                        traces: servers.length
                            ? this._instanceTraceService.getLastInstanceTrace({ instance: servers.map(s => s.id) })
                            : of([])
                    })),
                    finalize(() => this.serverHealthLoading = false)
                )
                .subscribe({ next: ({ servers, traces }) => {
                    this.serverHealthData = servers;
                    this.versionColor = groupByColor(servers, (v: any) => v.version);
                    this.deployTableRows = servers.map(s => ({ ...s, lastTrace: traces.find((t: any) => t.id === s.id)?.date }));
                    this.deployTableToday = new Date();
                    this._rebuildDeployStats();
                    this._rebuildServerHealth();
                }})
        );
    }

    private _rebuildDeployStats(): void {
        const now = new Date().getTime();
        this._onlineRows = [];
        this._pendingRows = [];
        this._offlineRows = [];
        for (const s of this.deployTableRows) {
            if (s.end || !s.lastTrace) {
                this._offlineRows.push(s);
            } else {
                const threshold = now - ((s.configuration?.scheduling?.interval ?? 3600) + 60) * 1000;
                if (s.lastTrace >= threshold) {
                    this._onlineRows.push(s);
                } else {
                    this._pendingRows.push(s);
                }
            }
        }
        this.onlineServerStat = this._onlineRows.length;
        this.pendingServerStat = this._pendingRows.length;
        this.offlineServerStat = this._offlineRows.length;
        this._applyStatusFilter();
    }

    private _applyStatusFilter(): void {
        switch (this.serverStatusFilter) {
            case 'online': this.filteredDeployRows = this._onlineRows; break;
            case 'pending': this.filteredDeployRows = this._pendingRows; break;
            case 'offline': this.filteredDeployRows = this._offlineRows; break;
            default: this.filteredDeployRows = this.deployTableRows;
        }
    }

    loadUserAgentData(): void {
        this.userAgentLoading = true;
        this.userAgentData = [];
        const serverFilter = this.createServerFilter();
        this.subscriptions.push(
            this._sessionService.getCountByUserAgent({
                env: this.params.env,
                start: this.params.start,
                end: this.params.end,
                app_name: serverFilter.app_name
            })
            .pipe(
                catchError(() => { this.userAgentLoading = false; return EMPTY; }),
                finalize(() => this.userAgentLoading = false)
            )
            .subscribe({
                next: (data: { count: number, userAgent: string }[]) => {
                    const categorized: Record<string, number> = {};
                    data.forEach(d => {
                        const label = this._categorizeUserAgent(d.userAgent ?? '');
                        categorized[label] = (categorized[label] ?? 0) + d.count;
                    });
                    const total = Object.values(categorized).reduce((s, n) => s + n, 0);
                    this.userAgentData = Object.entries(categorized)
                        .map(([label, count]) => ({
                            label,
                            count,
                            pct: total > 0 ? Math.round((count * 10000) / total) / 100 : 0,
                            color: UA_CATEGORY_DEFS[label]?.color ?? '#94a3b8',
                            group: UA_CATEGORY_DEFS[label]?.group ?? 'unknown'
                        }))
                        .sort((a, b) => b.count - a.count);
                    this.uaChartData = [...this.userAgentData];
                    this._rebuildUaGroups();
                    this._rebuildUaPieConfig();
                }
            })
        );
    }

    private _categorizeUserAgent(ua: string): string {
        const u = (ua ?? '').toLowerCase().trim();
        if (!u || u === 'null') return 'Inconnu';
        for (const [label, def] of Object.entries(UA_CATEGORY_DEFS)) {
            if (def.keywords.some(kw => u.includes(kw))) return label;
        }
        return 'Autre';
    }

    navigateToSessionRest() {
        this._router.navigate(['/session/rest'], {
            queryParams: {
                env: this.params.env,
                start: this.params.start?.toISOString(),
                end: this.params.end?.toISOString(),
                rangestatus: ['5xx', '4xx']
            }
        });
    }

    inactiveProtocolsCount = 0;

    get hasNoData(): boolean {
        return !this.serverHealthLoading && !this.kpiLoading && this.deployTableRows.length === 0;
    }
    quietProtocols: typeof this.protocolDefs = [];
    unstableServers: LastServerStart[] = [];
    versionSummary: { version: string; count: number }[] = [];
    stoppedServers: LastServerStart[] = [];
    divergentBranches: { branch: string; count: number; servers: string[] }[] = [];

    private _rebuildServerHealth(): void {
        const keys = ['restRequestExceptionsTable', 'databaseRequestExceptionsTable', 'ftpRequestExceptionsTable', 'smtpRequestExceptionsTable', 'ldapRequestExceptionsTable'];
        this.inactiveProtocolsCount = keys.filter(k => !this.chartRequests[k]?.isLoading && !this.chartRequests[k]?.data?.length).length;
        this.quietProtocols = this.protocolDefs.filter(p =>
            !this.chartRequests[p.reqKey].isLoading &&
            !this.chartRequests[p.reqKey].data?.length
        );
        this.unstableServers = this.serverHealthData
            .filter(s => s.restart > 1)
            .sort((a, b) => b.restart - a.restart)
            .slice(0, 5);
        this.stoppedServers = this.serverHealthData
            .filter(s => s.end !== null && s.end !== undefined)
            .sort((a, b) => b.end - a.end)
            .slice(0, 5);
        if (!this.serverHealthData.length) {
            this.versionSummary = [];
            this.divergentBranches = [];
            return;
        }
        const vmap: Record<string, number> = {};
        this.serverHealthData.forEach(s => { const v = s.version ?? '?'; vmap[v] = (vmap[v] ?? 0) + 1; });
        this.versionSummary = Object.entries(vmap).map(([version, count]) => ({ version, count })).sort((a, b) => b.count - a.count);
        const bmap: Record<string, string[]> = {};
        this.serverHealthData.forEach(s => {
            const b = s.branch ?? '?';
            if (b === 'main' || b === 'master') return;
            if (!bmap[b]) bmap[b] = [];
            bmap[b].push(s.appName);
        });
        this.divergentBranches = Object.entries(bmap).map(([branch, servers]) => ({ branch, count: servers.length, servers })).sort((a, b) => b.count - a.count);
    }

    exceptionsAllEmpty = false;

    private _rebuildExceptionsAllEmpty(): void {
        this.exceptionsAllEmpty = !this.tabRequests.sessionExceptionsTable?.isLoading
            && !this.tabRequests.batchExceptionTable?.isLoading
            && !this.tabRequests.sessionExceptionsTable?.data?.length
            && !this.tabRequests.batchExceptionTable?.data?.length;
    }

    getTrend(key: string): 'up' | 'down' | 'stable' {
        const def = this.protocolDefs.find(p => p.key === key);
        if (!def) return 'stable';
        const chart: any[] = this.chartRequests[def.reqKey]?.chart ?? [];
        if (chart.length < 4) return 'stable';
        const half = Math.floor(chart.length / 2);
        const avgFirst  = chart.slice(0, half).reduce((s: number, e: any) => s + (e.perc ?? 0), 0) / half;
        const avgSecond = chart.slice(half).reduce((s: number, e: any) => s + (e.perc ?? 0), 0) / (chart.length - half);
        if (avgSecond > avgFirst * 1.25) return 'up';
        if (avgSecond < avgFirst * 0.75) return 'down';
        return 'stable';
    }

    topSessionErrors: { type: string; count: number }[] = [];
    topBatchErrors: { type: string; count: number }[] = [];

    private _rebuildTabErrors(): void {
        const sessionData: any[] = this.tabRequests['sessionExceptionsTable']?.data ?? [];
        const sm: Record<string, number> = {};
        sessionData.forEach(d => { if (d.errorType) sm[d.errorType] = (sm[d.errorType] ?? 0) + d.count; });
        this.topSessionErrors = Object.entries(sm).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 6);
        const batchData: any[] = this.tabRequests['batchExceptionTable']?.data ?? [];
        const bm: Record<string, number> = {};
        batchData.forEach(d => { if (d.errorType) bm[d.errorType] = (bm[d.errorType] ?? 0) + d.count; });
        this.topBatchErrors = Object.entries(bm).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 6);
        this._rebuildExceptionsAllEmpty();
        this._rebuildInsightsAllClear();
    }


    getProtoBarWidth(count: number): number {
        if (!this.globalKpi?.totalSessions) return 0;
        return Math.min(Math.round((count / this.globalKpi.totalSessions) * 100), 100);
    }

    getErrBarWidth(list: { count: number }[], count: number): number {
        return list?.[0]?.count ? Math.round((count / list[0].count) * 100) : 0;
    }

    isRecentlyStarted(server: LastServerStart): boolean {
        if (!server.lastStart || server.end) return false;
        return (Date.now() - new Date(server.lastStart).getTime()) < 3_600_000;
    }

    insightsAllClear = false;
    hasRequestErrors = false;
    sessionInitErrors = 0;
    sessionWebErrors = 0;
    sessionTestErrors = 0;

    private _rebuildInsightsAllClear(): void {
        this.hasRequestErrors = Object.values(this.topErrors).some(e => e?.length > 0);
        this.sessionInitErrors = this.sessionCountData.find(d => d.type === 'STARTUP')?.errors ?? 0;
        this.sessionWebErrors  = this.sessionCountData.find(d => d.type === 'VIEW')?.errors ?? 0;
        this.sessionTestErrors = this.sessionCountData.find(d => d.type === 'TEST')?.errors ?? 0;
        this.insightsAllClear = !this.serverHealthLoading
            && !this.stoppedServers.length
            && this.tabRequests.sessionExceptionsTable?.isLoading === false
            && this.tabRequests.batchExceptionTable?.isLoading === false
            && !this.topSessionErrors.length
            && !this.topBatchErrors.length
            && !this.hasRequestErrors
            && !this.sessionInitErrors
            && !this.sessionWebErrors
            && !this.sessionTestErrors;
    }

    navigateToRequestProtocol(key: string, errorType: string): void {
        const routes: Record<string, string> = {
            rest: '/request/rest',
            jdbc: '/request/jdbc',
            ftp: '/request/ftp',
            smtp: '/request/smtp',
            ldap: '/request/ldap',
        };
        const target = routes[key];
        if (!target) return;
        this._router.navigate([target], {
            queryParams: {
                env: this.params.env,
                start: this.params.start?.toISOString(),
                end: this.params.end?.toISOString(),
                q: errorType,
                server: this.params.serveurs,
            }
        });
    }

    navigateToSessionByType(sessionType: string, errorType?: string): void {
        const routes: Record<string, string> = {
            STARTUP: '/session/startup',
            VIEW: '/session/view',
            TEST: '/session/test',
        };
        const target = routes[sessionType];
        if (!target) return;
        this._router.navigate([target], {
            queryParams: {
                env: this.params.env,
                start: this.params.start?.toISOString(),
                end: this.params.end?.toISOString(),
                server: this.params.serveurs,
                rangestatus: ['Ko'],
                ...(errorType ? { q: errorType } : {}),
            }
        });
    }

    navigateToException(type: string, tab: 'rest' | 'batch') {
        const target = tab === 'rest' ? '/session/rest' : '/session/batch';
        const rangestatus = tab === 'rest' ? ['5xx', '4xx'] : ['Ko'];
        this._router.navigate([target], {
            queryParams: {
                env: this.params.env,
                start: this.params.start?.toISOString(),
                end: this.params.end?.toISOString(),
                q: type,
                server: this.params.serveurs,
                rangestatus
            }
        });
    }

    toggleInsight(key: string): void {
        if (this.selectedInsights.has(key)) {
            this.selectedInsights = new Set();
        } else {
            this.selectedInsights = new Set([key]);
            this.showOverview = false;
        }
    }

    clearInsights(): void {
        this.selectedInsights = new Set();
        this.showOverview = true;
    }

    selectServerStatus(status: 'online' | 'pending' | 'offline' | 'all'): void {
        this.clearInsights();
        this.serverStatusFilter = status;
        this._applyStatusFilter();
    }


    get hasSelectedInsights(): boolean { return this.selectedInsights.size > 0; }

    navigateOnStatusIndicator(event: MouseEvent, row: any): void {
        const date = new Date(row.lastTrace);
        this._router.navigateOnClick(event, ['/supervision', row.type.toLowerCase(), row.id], {
            queryParams: {
                env: row.env,
                start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(),
                end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString()
            }
        });
    }

    navigateOnSinceClick(event: MouseEvent, row: any): void {
        this._router.navigateOnClick(event, ['/session/startup', row.id], { queryParams: { env: this.params.env } });
    }

    navigateOnServerClick(event: MouseEvent, row: any): void {
        this._router.navigateOnClick(event, ['/instance/detail', row.id], { queryParams: { env: this.params.env } });
    }

    navigateOnRestartClick(event: MouseEvent, start: number, server: string): void {
        this._router.navigateOnClick(event, ['/session/startup'], {
            queryParams: { env: this.params.env, start: new Date(start).toISOString(), end: new Date().toISOString(), server }
        });
    }

    trackByKey(_: number, item: { key: string }): string { return item.key; }
    trackByType(_: number, item: { type: string }): string { return item.type; }
    trackByVersion(_: number, item: { version: string }): string { return item.version; }
    trackByBranch(_: number, item: { branch: string }): string { return item.branch; }
    trackByAppName(_: number, item: { appName: string }): string { return item.appName; }

    getSparklinePerc(key: string): number {
        return (this.sparklinePercs as Record<string, number>)[key] ?? 0;
    }

    getSparklineSubtitle(key: string): string {
        return (this.sparklineTitles as Record<string, { subtitle: string }>)[key]?.subtitle ?? '';
    }

    getProtoErrBarWidth(errors: { count: number }[], count: number): number {
        return errors?.[0]?.count ? Math.round((count / errors[0].count) * 100) : 0;
    }

    getProtoTotalRequests(key: string): number {
        const def = this.protocolDefs.find(p => p.key === key);
        if (!def) return 0;
        return this.sumcounts(this.chartRequests[def.reqKey]?.chart ?? []).countok;
    }

    private _computeTopErrors(): void {
        const defs: Record<string, string> = {
            rest: 'restRequestExceptionsTable',
            jdbc: 'databaseRequestExceptionsTable',
            ftp: 'ftpRequestExceptionsTable',
            smtp: 'smtpRequestExceptionsTable',
            ldap: 'ldapRequestExceptionsTable'
        };
        Object.entries(defs).forEach(([key, reqKey]) => {
            const data: any[] = this.chartRequests[reqKey]?.data ?? [];
            const map: Record<string, number> = {};
            data.forEach((d: any) => { if (d.errorType) map[d.errorType] = (map[d.errorType] ?? 0) + d.count; });
            this.topErrors[key] = Object.entries(map)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);
        });
    }

    protocolSummaries: { key: string; label: string; rate: number; count: number; total: number }[] = [];
    sessionSummaries: { key: string; label: string; errors: number; total: number; rate: number; barPct: number }[] = [];
    sessionTotal = 0;

    private _rebuildProtocolSummaries(): void {
        const entries = [
            { key: 'rest', label: 'REST', reqKey: 'restRequestExceptionsTable', rate: this.sparklinePercs.rest },
            { key: 'jdbc', label: 'JDBC', reqKey: 'databaseRequestExceptionsTable', rate: this.sparklinePercs.jdbc },
            { key: 'ftp', label: 'FTP', reqKey: 'ftpRequestExceptionsTable', rate: this.sparklinePercs.ftp },
            { key: 'smtp', label: 'SMTP', reqKey: 'smtpRequestExceptionsTable', rate: this.sparklinePercs.smtp },
            { key: 'ldap', label: 'LDAP', reqKey: 'ldapRequestExceptionsTable', rate: this.sparklinePercs.ldap },
        ];
        this.protocolSummaries = entries
            .map(p => {
                const s = this.sumcounts(this.chartRequests[p.reqKey]?.chart ?? []);
                return { key: p.key, label: p.label, rate: p.rate, count: s.count, total: s.countok };
            })
            .filter(p => p.total > 0);
        this._rebuildServerHealth();
    }

    private _rebuildSessionSummaries(): void {
        const types = [
            { key: 'SERVICE', type: 'REST', label: 'Service' },
            { key: 'BATCH', type: 'BATCH', label: 'Job' },
            { key: 'STARTUP', type: 'STARTUP', label: 'Startup' },
            { key: 'VIEW', type: 'VIEW', label: 'UI' },
            { key: 'TEST', type: 'TEST', label: 'Test' },
        ];
        this.sessionTotal = this.sessionCountData.reduce((s, d) => s + d.total, 0) + this.restSessionCount.total;
        const overallTotal = this.sessionTotal;
        this.sessionSummaries = types
            .map(t => {
                let total: number; let errors: number;
                if (t.type === 'REST') { total = this.restSessionCount.total; errors = this.restSessionCount.errors; }
                else { const found = this.sessionCountData.find(d => d.type === t.type); total = found?.total ?? 0; errors = found?.errors ?? 0; }
                return { key: t.key, label: t.label, errors, total, rate: total > 0 ? (errors * 100) / total : 0, barPct: overallTotal > 0 ? (total * 100) / overallTotal : 0 };
            })
            .filter(s => s.total > 0);
        this._rebuildInsightsAllClear();
    }

    navigateToSupervision(server: LastServerStart) {
        const d = new Date(server.lastStart);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        this._router.navigate(['/supervision/server', server.id], {
            queryParams: { env: this.params.env, start: dayStart.toISOString(), end: dayEnd.toISOString() }
        });
    }

    setTitle(type: string, data: any[]): {title: string, subtitle: string} {
        let title = `${type}: 0.00%`;
        let subtitle = 'sur 0 requête';
        let arr = this.groupByProperty("stringDate", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } }).sort((a,b)=> a.stringDate.localeCompare(b.stringDate));
        if (arr.length) {
            let sumRes = this.sumcounts(arr);
            title = `${type}: ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%`;
            const n = sumRes.countok ?? 0;
            subtitle = `sur ${this._decimalPipe.transform(n)} requête${n > 1 ? 's' : ''}`;
        }
        return {title: title, subtitle: subtitle};
    }

    setChartData(data: any[]) {
        let arr = this.groupByProperty("stringDate", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } }).sort((a,b)=> a.stringDate.localeCompare(b.stringDate));
        data = data.filter((a:any)=> a.count>0)
        return {chart : arr, data :data}
    }

    groupBypropertyRest(property: string, array: any[]) {
        let helper: any = {};
        return array.reduce((acc: any, item: any) => {
            if (!helper[item[property]]) {
                helper[item[property]] = Object.assign({}, item);
                helper[item[property]].count = item.errorType ? item.count : 0;
                acc.push(helper[item[property]]);
            } else {
                if(item.errorType){
                    helper[item[property]].count += item["count"];
                }
            }
            return acc;
        }, []);
    }

    groupByProperty(property: string, array: any[]) {
        let helper: any = {};
        return array.reduce((acc: any, item: any) => {

            if (!helper[item[property]]) {
                helper[item[property]] = Object.assign({}, item);
                acc.push(helper[item[property]]);
            } else {
                helper[item[property]].countok += item["countok"];
                helper[item[property]].count += item["count"];
            }
            return acc;
        }, []);
    }

    sumcounts(array: any[]) {
        return array.reduce((acc, obj) => {
            return {
                countok: acc.countok + obj.countok,
                count: acc.count + obj.count
            }
        }, { countok: 0, count: 0 });
    }

    private buildExceptionObservable(
        source$: Observable<any[]>,
        groupedBy: string,
        label: string,
        key: 'rest' | 'jdbc' | 'ftp' | 'smtp' | 'ldap'
    ): Observable<{ chart: any[]; data: any[] }> {
        return source$.pipe(map((result: any[]) => {
            formatters[groupedBy](result, this._datePipe, 'stringDate');
            const res = this.groupBypropertyRest('stringDate', result)
                .map((d: any) => ({ ...d, perc: (d.count * 100) / d.countok }))
                .sort((a: any, b: any) => a.stringDate.localeCompare(b.stringDate));
            const sumRes = res.length ? this.sumcounts(res) : null;
            this.sparklinePercs[key] = sumRes ? (sumRes.count * 100) / sumRes.countok : 0;
            this.sparklineTitles[key] = {
                title: sumRes ? `${label}: ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%` : `${label}: 0.00%`,
                subtitle: sumRes ? `sur ${this._decimalPipe.transform(sumRes.countok)} requête${sumRes.countok > 1 ? 's' : ''}` : 'sur 0 requête'
            };
            return { chart: res, data: result.filter((a: any) => a.errorType != null) };
        }));
    }

    TAB_REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        this.groupedBy = periodManagement(start, end);
        return {
            //   Rest-Main Sessions exceptions
            sessionExceptionsTable: {
                observable: this._sessionService.getSessionExceptions({ env: env, start: start, end: end, groupedBy: this.groupedBy, server: app_name, others: {"status.ge(500).or(status.lt(400))": ""}})
                    .pipe(map(((result: SessionExceptionsByPeriodAndAppname[]) => {
                        formatters[this.groupedBy](result, this._datePipe, 'stringDate');
                        return result.filter(r => r.errorType != null); // rename errorType to errType in backend
                    })))
            },

            batchExceptionTable: {
                observable: this._mainService.getMainExceptions({ env: env, start: start, end: end, groupedBy: this.groupedBy, app_name: app_name })
                    .pipe(map(((result: SessionExceptionsByPeriodAndAppname[]) => {
                        formatters[this.groupedBy](result, this._datePipe, 'stringDate')
                        return result.filter(r => r.errorType != null);
                    })))
            },

        }
    }
    REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        const groupedBy = periodManagement(start, end);
        const p = { env, start, end, groupedBy, app_name };
        return {
            restRequestExceptionsTable: { observable: this.buildExceptionObservable(this._restService.getRestExceptions1(p), groupedBy, 'REST', 'rest') },
            databaseRequestExceptionsTable: { observable: this.buildExceptionObservable(this._datebaseService.getJdbcRestSessionExceptions(p), groupedBy, 'JDBC', 'jdbc') },
            ftpRequestExceptionsTable: { observable: this.buildExceptionObservable(this._ftpService.getftpSessionExceptions(p), groupedBy, 'FTP', 'ftp') },
            smtpRequestExceptionsTable: { observable: this.buildExceptionObservable(this._smtpService.getSmtpExceptions(p), groupedBy, 'SMTP', 'smtp') },
            ldapRequestExceptionsTable: { observable: this.buildExceptionObservable(this._ldapService.getLdapSessionExceptions(p), groupedBy, 'LDAP', 'ldap') },
        };
    }

    onSessionExceptionRowSelected(event: {event: MouseEvent, row: any}) {
        const result = recreateDate(this.groupedBy, event.row, this.params.start);

        if(result) {
            this._router.navigate(['/session/rest'], {
                queryParams: {
                    'env': this.params.env,
                    'start': result.start.toISOString(),
                    'end': result.end.toISOString(),
                    'q': event.row.errorType,
                    'server': this.params.serveurs,
                    'rangestatus': ['5xx', '4xx']
                }
            });
        }
    }

    onBatchExceptionRowSelected(event: {event: MouseEvent, row: any}){
        const result = recreateDate(this.groupedBy, event.row, this.params.start);
        if(result){
            this._router.navigate(['/session/batch'], {
                queryParams: {
                    'env': this.params.env,
                    'start': result.start.toISOString(),
                    'end': result.end.toISOString(),
                    'q' : event.row.errorType,
                    'server': this.params.serveurs,
                    'rangestatus': ['Ko']
                }
            });
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.chartSubscriptions.forEach(s => s.unsubscribe());
        this.tabSubscriptions.forEach(s => s.unsubscribe());
        if(this._dialog){
            this._dialog.closeAll();
        }
    }
}
