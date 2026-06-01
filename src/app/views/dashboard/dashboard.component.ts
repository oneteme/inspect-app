import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {combineLatest, finalize, forkJoin, map, Observable, of, Subscription, switchMap, tap} from 'rxjs';
import {DatePipe, DecimalPipe, Location} from '@angular/common';
import {app, makeDatePeriod} from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Constants} from '../constants';
import {formatters, groupByColor, periodManagement} from 'src/app/shared/util';
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
    ExceptionsByPeriodAndAppname
} from 'src/app/model/jquery.model';
import {SmtpRequestService} from 'src/app/service/jquery/smtp-request.service';
import {InstanceTraceService} from 'src/app/service/jquery/instance-trace.service';
import {DashboardDetailContext} from './components/detail-view/detail-view.model';
import {PageTitleService} from '../../service/page-title.service';

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit, OnDestroy {
    constants = Constants;

    readonly protocolDefs: { key: string; reqKey: string; label: string; chartConfig: any }[] = [
        { key: 'rest', reqKey: 'restRequestExceptionsTable', label: 'HTTP', chartConfig: Constants.REST_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'jdbc', reqKey: 'databaseRequestExceptionsTable', label: 'JDBC', chartConfig: Constants.DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'ftp', reqKey: 'ftpRequestExceptionsTable', label: 'FTP', chartConfig: Constants.FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'smtp', reqKey: 'smtpRequestExceptionsTable', label: 'SMTP', chartConfig: Constants.SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE },
        { key: 'ldap', reqKey: 'ldapRequestExceptionsTable', label: 'LDAP', chartConfig: Constants.LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE },
    ];

    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly _instanceService = inject(InstanceService);
    private readonly _sessionService = inject(RestSessionService);
    private readonly _mainService = inject(MainSessionService);
    private readonly _restService = inject(RestRequestService);
    private readonly _datebaseService = inject(DatabaseRequestService);
    private readonly _ftpService = inject(FtpRequestService);
    private readonly _smtpService = inject(SmtpRequestService)
    private readonly _ldapService = inject(LdapRequestService);
    private readonly _location: Location = inject(Location);
    private readonly _datePipe = inject(DatePipe);
    private readonly _dialog = inject(MatDialog);
    private readonly _decimalPipe = inject(DecimalPipe);
    private readonly _instanceTraceService = inject(InstanceTraceService);
    private readonly _cdr = inject(ChangeDetectorRef);
    private readonly _pageTitleService = inject(PageTitleService);

    sparklineTitles: {
        rest: {title: string, subtitle: string},
        jdbc: {title: string, subtitle: string},
        ftp: {title: string, subtitle: string},
        smtp: {title: string, subtitle: string},
        ldap: {title: string, subtitle: string}
    } = {
        rest: {title: 'HTTP: 0.00%', subtitle: 'sur 0 requête'},
        jdbc: {title: 'JDBC: 0.00%', subtitle: 'sur 0 requête'},
        ftp: {title: 'FTP: 0.00%', subtitle: 'sur 0 requête'},
        smtp: {title: 'SMTP: 0.00%', subtitle: 'sur 0 requête'},
        ldap: {title: 'LDAP: 0.00%', subtitle: 'sur 0 requête'}
    }

    MAPPING_TYPE = Constants.MAPPING_TYPE;
    subscriptions: Subscription[] = [];
    chartSubscriptions: Subscription[] = [];
    tabSubscriptions: Subscription[] = [];
    sessionSubscriptions: Subscription[] = [];
    private _serverHealthSub: Subscription | null = null;
    private _applicationsSub: Subscription | null = null;
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
    restSessionCountLoading = true;
    restSessionCount: { total: number; errors: number } = { total: 0, errors: 0 };
    globalKpi: { globalErrorRate: number; totalSessions: number; totalErrors: number } | null = null;
    kpiLoading = true;
    sparklinePercs: { rest: number; jdbc: number; ftp: number; smtp: number; ldap: number } = { rest: 0, jdbc: 0, ftp: 0, smtp: 0, ldap: 0 };
    topErrors: Record<string, { type: string; count: number }[]> = {};
    selectedInsights = new Set<string>();
    sessExcLineConfig = Constants.SESSION_EXCEPTION_LINE;

    // server health


    // exception charts par type de session
    topSessionErrors: { type: string; count: number }[] = [];
    topBatchErrors: { type: string; count: number }[] = [];
    topViewErrors: { type: string; count: number }[] = [];
    topStartupErrors: { type: string; count: number }[] = [];
    sessionExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    batchExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    viewExceptionChart: { stringDate: string; count: number; perc: number }[] = [];
    startupExceptionChart: { stringDate: string; count: number; perc: number }[] = [];

    // état des insights (tout clair / erreurs par catégorie)

    sessionInitErrors = 0;
    sessionWebErrors = 0;
    sessionTestErrors = 0;
    instanceSearchQuery = '';

    readonly skeletonRows = [1, 2, 3, 4];
    readonly statSkeletonRows = [1, 2, 3];

    // résumés calculés après chargement
    protocolSummaries: { key: string; label: string; rate: number; count: number; total: number; loading: boolean; title: string }[] = [];
    sessionSummaries: { key: string; label: string; errors: number; total: number; rate: number; barPct: number; loading: boolean; title: string }[] = [];
    sessionTotal = 0;

    private _chartsResolved = 0;
    private _tabsResolved = 0;
    private _loadGen = 0;
    private _lastHealthEnv: string | null = null;
    private _sessionCountByType: Record<string, { total: number; errors: number }> = {};
    constructor() {
        this.subscriptions.push(combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || app.defaultEnv;
                this.params.start = v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(0, 1).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(0, 1).end;
                this.groupedBy = periodManagement(this.params.start, this.params.end);
                const appname = v.queryParams['appname'];
                if (Array.isArray(appname)) this.params.serveurs = appname;
                else this.params.serveurs = appname ? [appname] : [];
                if (this.params.serveurs.length > 0) {
                    this.patchServerValue(this.params.serveurs);
                }
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
        this._applicationsSub?.unsubscribe();
                this._applicationsSub = this._instanceService.getApplications('SERVER', this.params.env)
                    .pipe(finalize(() => this.serverNameIsLoading = false))
                    .subscribe({
                        next: (appNames: { appName: string }[]) => {
                            this.nameDataList = appNames.map(r => r.appName);
                            this.patchServerValue(this.params.serveurs);
                        }, error: (e) => {
                            console.log(e)
                        }
                    });

                let serverParam = this.createServerFilter();
                const effectiveEnd = this.params.end > new Date() ? new Date() : this.params.end;
                this.chartRequests = this.REQUESTS(this.params.env, this.params.start, effectiveEnd, serverParam.app_name);
                this.tabRequests   = this.TAB_REQUESTS(this.params.env, this.params.start, effectiveEnd, serverParam.app_name);
                this.sessionSubscriptions.forEach(s => s.unsubscribe());
                this.sessionSubscriptions = [];
                this.sessionSummaries = [];
                this.protocolSummaries = [];
                this.sessionCountData = [];
                this.sessionCountLoading = true;
                this.restSessionCountLoading = true;
                this.restSessionCount = { total: 0, errors: 0 };
                const envChanged = this.params.env !== this._lastHealthEnv;
                if (envChanged) {
                    this.deployTableRows = [];
                    this.filteredDeployRows = [];
                    this.serverHealthLoading = true;
                    this.pendingServerStat = 0;
                    this.offlineServerStat = 0;
                }
                const gen = ++this._loadGen;
                this.initTab(gen);
                this.initCharts(gen);
                if (envChanged) {
                    this._lastHealthEnv = this.params.env ?? null;
                    this.loadServerHealth(this.params.env, gen);
                }
                this.sessionSubscriptions.push(this._sessionService.getCountByEnv({ env: this.params.env, start: this.params.start, end: this.params.end })
                    .pipe(finalize(() => { if (this._loadGen === gen) { this.restSessionCountLoading = false; this._rebuildSessionSummaries(); } }))
                    .subscribe({ next: (data) => { if (this._loadGen === gen) { this.restSessionCount = data; } } }));

                const serverQuery = this.params.serveurs.length > 0 ? '&' + this.params.serveurs.map(name => 'appname=' + name).join('&') : '';
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${serverQuery}`)
            }
        }));
    }
    initCharts(gen: number) {
        this.globalKpi = null;
        this.kpiLoading = true;
        this.sparklinePercs = { rest: 0, jdbc: 0, ftp: 0, smtp: 0, ldap: 0 };
        this.sparklineTitles = {
            rest:  { title: 'REST: 0.00%',  subtitle: 'sur 0 requête' },
            jdbc:  { title: 'JDBC: 0.00%',  subtitle: 'sur 0 requête' },
            ftp:   { title: 'FTP: 0.00%',   subtitle: 'sur 0 requête' },
            smtp:  { title: 'SMTP: 0.00%',  subtitle: 'sur 0 requête' },
            ldap:  { title: 'LDAP: 0.00%',  subtitle: 'sur 0 requête' }
        };
        // Annule les requêtes précédentes en vol (unsubscribe ne déclenche PAS next/error)
        this.chartSubscriptions.forEach(t => t.unsubscribe());
        this.chartSubscriptions = [];

        const keys = Object.keys(this.chartRequests);
        keys.forEach(k => {
            this.chartRequests[k].chart = [];
            this.chartRequests[k].isLoading = true;
        });
        this.protocolSummaries = [
            { key: 'rest',  label: 'HTTP',  rate: 0, count: 0, total: 0, loading: true, title: '' },
            { key: 'jdbc',  label: 'JDBC',  rate: 0, count: 0, total: 0, loading: true, title: '' },
            { key: 'ftp',   label: 'FTP',   rate: 0, count: 0, total: 0, loading: true, title: '' },
            { key: 'smtp',  label: 'SMTP',  rate: 0, count: 0, total: 0, loading: true, title: '' },
            { key: 'ldap',  label: 'LDAP',  rate: 0, count: 0, total: 0, loading: true, title: '' },
        ];

        this._chartsResolved = 0;
        const totalCharts = keys.length;
        keys.forEach(k => {
            this.chartSubscriptions.push(this.chartRequests[k].observable
                .pipe(finalize(() => {
                    if (this._loadGen !== gen) return;
                    this.chartRequests[k].isLoading = false;
                    if (++this._chartsResolved >= totalCharts) {
                        this.computeGlobalKpi();
                    }
                    this._rebuildProtocolSummaries();
                }))
                .subscribe({
                    next: (res: any) => {
                        if (this._loadGen !== gen) return;
                        this.chartRequests[k].data = res.data;
                        this.chartRequests[k].chart = res.chart;
                    }
                }));
        });
    }


    initTab(gen: number) {
        this.sessionExceptionChart = [];
        this.batchExceptionChart = [];
        this.viewExceptionChart = [];
        this.startupExceptionChart = [];
        this.topSessionErrors = [];
        this.topBatchErrors = [];
        this.topViewErrors = [];
        this.topStartupErrors = [];
        this.tabSubscriptions.forEach(t => t.unsubscribe());
        this.tabSubscriptions = [];
        this._tabsResolved = 0;
        this._sessionCountByType = {};
        this.sessionCountLoading = true;
        const keys = Object.keys(this.tabRequests);
        const totalTabs = keys.length;
        keys.forEach(i => {
            this.tabRequests[i].data = [];
            this.tabRequests[i].isLoading = true;
            this.tabSubscriptions.push(this.tabRequests[i].observable
                .pipe(finalize(() => {
                    if (this._loadGen !== gen) return;
                    this.tabRequests[i].isLoading = false;
                    this._rebuildSingleTabErrors(i);
                    if (++this._tabsResolved >= totalTabs) {
                        this.sessionCountLoading = false;
                        this._rebuildInsightsAllClear();
                    } else {
                        this._cdr.markForCheck();
                    }
                }))
                .subscribe({
                    next: (res: any[]) => {
                        if (this._loadGen !== gen) return;
                        this.tabRequests[i].data = res;
                    },
                    error: (e) => { console.log(e) }
                }));
        });
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
                const gen = ++this._loadGen;
                this.initTab(gen);
                this.initCharts(gen);
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
            return { app_name: this.params.serveurs.map(v => '"' + v + '"').join(',') };
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
    }

    loadServerHealth(env: string, gen: number) {
        this.serverHealthLoading = true;
        this.serverHealthData = [];
        this.deployTableRows = [];
        this._serverHealthSub?.unsubscribe();
        this._serverHealthSub = this._instanceService.getLastServerStart({ env })
                .pipe(
                    switchMap((servers: LastServerStart[]) => forkJoin({
                        servers: of(servers),
                        traces: servers.length
                            ? this._instanceTraceService.getLastInstanceTrace({ instance: servers.map(s => s.id) })
                            : of([])
                    })),
                    finalize(() => { if (this._loadGen === gen) { this.serverHealthLoading = false; this._cdr.markForCheck(); } })
                )
                .subscribe({ next: ({ servers, traces }) => {
                    if (this._loadGen !== gen) return;
                    this.serverHealthData = servers;
                    this.versionColor = groupByColor(servers, (v: any) => v.version);
                    this.deployTableRows = servers.map(s => ({ ...s, lastTrace: traces.find((t: any) => t.id === s.id)?.date }));
                    this.deployTableToday = new Date();
                    this._rebuildDeployStats();
                    this._rebuildServerHealth();
                }})

    }

    private _rebuildDeployStats(): void {
        const now = Date.now();
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

    get hasNoData(): boolean {
        return !this.serverHealthLoading && this.deployTableRows.length === 0;
    }

    private _rebuildServerHealth(): void {
        this._cdr.markForCheck();
    }

    private _fillHourGaps(map: Record<string, number>, start: Date, end: Date): { stringDate: string; count: number }[] {
        const now = new Date();
        if (this.groupedBy === 'hour') {
            const result: { stringDate: string; count: number }[] = [];
            const startH = start.getHours();
            const isToday = start.toDateString() === now.toDateString();
            const endH = isToday ? now.getHours() : 23;
            for (let h = startH; h <= endH; h++) {
                const label = this._datePipe.transform(new Date(2000, 1, 1, h), 'shortTime');
                result.push({ stringDate: label, count: map[label] ?? 0 });
            }
            return result;
        }
        if (this.groupedBy === 'date') {
            const result: { stringDate: string; count: number }[] = [];
            const effectiveEnd = end > now ? now : end;
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            while (d < effectiveEnd) {
                const label = this._datePipe.transform(d, 'd MMM yy');
                result.push({ stringDate: label, count: map[label] ?? 0 });
                d.setDate(d.getDate() + 1);
            }
            return result;
        }
        return Object.entries(map).map(([stringDate, count]) => ({ stringDate, count })).sort((a, b) => a.stringDate.localeCompare(b.stringDate));
    }

    private _addPerc(filled: { stringDate: string; count: number }[], countokMap: Record<string, number>): { stringDate: string; count: number; perc: number }[] {
        return filled.map(p => ({ ...p, perc: countokMap[p.stringDate] ? (p.count * 100) / countokMap[p.stringDate] : 0 }));
    }

    private _aggregateTabData(data: any[]): { errors: Record<string, number>; dates: Record<string, number>; countoks: Record<string, number> } {
        const errors: Record<string, number> = {};
        const dates: Record<string, number> = {};
        const countoks: Record<string, number> = {};
        data.forEach(d => {
            if (d.errorType) errors[d.errorType] = (errors[d.errorType] ?? 0) + d.count;
            if (d.stringDate) {
                dates[d.stringDate] = (dates[d.stringDate] ?? 0) + d.count;
                if (d.countok && !countoks[d.stringDate]) countoks[d.stringDate] = d.countok;
            }
        });
        return { errors, dates, countoks };
    }

    private _patchSessionCountData(type: string): void {
        const counts = this._sessionCountByType[type];
        if (!counts) return;
        const idx = this.sessionCountData.findIndex(d => d.type === type);
        if (idx >= 0) {
            this.sessionCountData = [...this.sessionCountData.slice(0, idx), { type, ...counts }, ...this.sessionCountData.slice(idx + 1)];
        } else {
            this.sessionCountData = [...this.sessionCountData, { type, ...counts }];
        }
    }

    private _rebuildSingleTabErrors(tabKey: string): void {
        const effectiveEnd = this.params.end! > new Date() ? new Date() : this.params.end!;
        if (tabKey === 'sessionExceptionsTable') {
            const { errors: sm, dates: sd, countoks: sc } = this._aggregateTabData(this.tabRequests['sessionExceptionsTable']?.data ?? []);
            this.topSessionErrors = Object.entries(sm).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
            this.sessionExceptionChart = this._addPerc(this._fillHourGaps(sd, this.params.start!, effectiveEnd), sc);
        } else if (tabKey === 'batchExceptionTable') {
            const { errors: bm, dates: bd, countoks: bc } = this._aggregateTabData(this.tabRequests['batchExceptionTable']?.data ?? []);
            this.topBatchErrors = Object.entries(bm).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
            this.batchExceptionChart = this._addPerc(this._fillHourGaps(bd, this.params.start!, effectiveEnd), bc);
            this._patchSessionCountData('BATCH');
            this._rebuildSessionSummaries();
        } else if (tabKey === 'viewExceptionTable') {
            const { errors: vm, dates: vd, countoks: vc } = this._aggregateTabData(this.tabRequests['viewExceptionTable']?.data ?? []);
            this.topViewErrors = Object.entries(vm).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
            this.viewExceptionChart = this._addPerc(this._fillHourGaps(vd, this.params.start!, effectiveEnd), vc);
            this._patchSessionCountData('VIEW');
            this._rebuildSessionSummaries();
        } else if (tabKey === 'startupExceptionTable') {
            const { errors: stum, dates: stud, countoks: stuc } = this._aggregateTabData(this.tabRequests['startupExceptionTable']?.data ?? []);
            this.topStartupErrors = Object.entries(stum).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
            this.startupExceptionChart = this._addPerc(this._fillHourGaps(stud, this.params.start!, effectiveEnd), stuc);
            this._patchSessionCountData('STARTUP');
            this._rebuildSessionSummaries();
        }
        // batchTopJobsTable : pas de graphique associé
    }

    isRecentlyStarted(server: LastServerStart): boolean {
        if (!server.lastStart || server.end) return false;
        return (Date.now() - new Date(server.lastStart).getTime()) < 3_600_000;
    }

    private _rebuildInsightsAllClear(): void {
        this.sessionInitErrors = this.sessionCountData.find(d => d.type === 'STARTUP')?.errors ?? 0;
        this.sessionWebErrors  = this.sessionCountData.find(d => d.type === 'VIEW')?.errors ?? 0;
        this.sessionTestErrors = this.sessionCountData.find(d => d.type === 'TEST')?.errors ?? 0;
        this._cdr.markForCheck();
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
        const rangestatusMap: Record<string, string> = {
            ServerError: '5xx',
            ClientError: '4xx',
        };
        const rangestatus = key === 'rest' ? (rangestatusMap[errorType] ?? '0xx') : 'Ko';
        this._router.navigate([target], {
            queryParams: {
                env: this.params.env,
                start: this.params.start?.toISOString(),
                end: this.params.end?.toISOString(),
                rangestatus,
                ...(key !== 'rest' || !rangestatusMap[errorType] ? { q: errorType } : {}),
                server: this.params.serveurs,
            }
        });
    }

    navigateToInstancesWithFilter(term: string): void {
        this.instanceSearchQuery = term;
        this.selectedInsights = new Set();
        this.showOverview = true;
    }

    navigateToSessionByType(sessionType: string, errorType?: string, serverOverride?: string): void {
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
                server: serverOverride ?? this.params.serveurs,
                rangestatus: ['Ko'],
                ...(errorType ? { q: errorType } : {}),
            }
        });
    }

    navigateToException(type: string, tab: 'rest' | 'batch' | 'view') {
        if (tab === 'view') {
            this.navigateToSessionByType('VIEW', type);
            return;
        }
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
            this.showOverview = true;
        } else {
            this.selectedInsights = new Set([key]);
            this.showOverview = false;
            this.instanceSearchQuery = '';
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

    get detailContext(): DashboardDetailContext {
        return {
            selectedInsights: this.selectedInsights,
            protocolDefs: this.protocolDefs,
            topErrors: this.topErrors,
            kpiLoading: this.kpiLoading,
            tabRequests: this.tabRequests,
            topSessionErrors: this.topSessionErrors,
            topBatchErrors: this.topBatchErrors,
            topViewErrors: this.topViewErrors,
            topStartupErrors: this.topStartupErrors,
            sessionExceptionChart: this.sessionExceptionChart,
            batchExceptionChart: this.batchExceptionChart,
            viewExceptionChart: this.viewExceptionChart,
            startupExceptionChart: this.startupExceptionChart,
            sessExcLineConfig: this.sessExcLineConfig,
            sessionCountLoading: this.sessionCountLoading,
            sessionInitErrors: this.sessionInitErrors,
            sessionWebErrors: this.sessionWebErrors,
            sessionTestErrors: this.sessionTestErrors,
            chartRequests: this.chartRequests,
            sparklinePercs: this.sparklinePercs,
            sparklineTitles: this.sparklineTitles,
        };
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

    private _rebuildProtocolSummaries(): void {
        const entries = [
            { key: 'rest', label: 'HTTP', reqKey: 'restRequestExceptionsTable', rate: this.sparklinePercs.rest },
            { key: 'jdbc', label: 'JDBC', reqKey: 'databaseRequestExceptionsTable', rate: this.sparklinePercs.jdbc },
            { key: 'ftp', label: 'FTP', reqKey: 'ftpRequestExceptionsTable', rate: this.sparklinePercs.ftp },
            { key: 'smtp', label: 'SMTP', reqKey: 'smtpRequestExceptionsTable', rate: this.sparklinePercs.smtp },
            { key: 'ldap', label: 'LDAP', reqKey: 'ldapRequestExceptionsTable', rate: this.sparklinePercs.ldap },
        ];
        this.protocolSummaries = entries
            .map(p => {
                const loading = this.chartRequests[p.reqKey]?.isLoading ?? false;
                const s = this.sumcounts(this.chartRequests[p.reqKey]?.chart ?? []);
                const title = `${this._decimalPipe.transform(s.countok, '1.0-0')} requêtes · ${this._decimalPipe.transform(s.count, '1.0-0')} erreurs`;
                return { key: p.key, label: p.label, rate: p.rate, count: s.count, total: s.countok, loading, title };
            })
            .filter(p => p.loading || p.total > 0);
        this._rebuildServerHealth();
    }

    private _rebuildSessionSummaries(): void {
        const types = [
            { key: 'SERVICE', type: 'REST', label: 'Services exposés' },
            { key: 'BATCH', type: 'BATCH', label: 'Tâches planifiées' },
            { key: 'STARTUP', type: 'STARTUP', label: 'Initialisation' },
            { key: 'VIEW', type: 'VIEW', label: 'Parcours client' },
            { key: 'TEST', type: 'TEST', label: 'Test' },
        ];
        this.sessionTotal = this.sessionCountData.reduce((s, d) => s + d.total, 0) + this.restSessionCount.total;
        const overallTotal = this.sessionTotal;
        this.sessionSummaries = types
            .map(t => {
                let total: number; let errors: number; let loading = false;
                if (t.type === 'REST') { total = this.restSessionCount.total; errors = this.restSessionCount.errors; loading = this.restSessionCountLoading; }
                else { const found = this.sessionCountData.find(d => d.type === t.type); total = found?.total ?? 0; errors = found?.errors ?? 0; }
                const title = `${this._decimalPipe.transform(total, '1.0-0')} sessions · ${this._decimalPipe.transform(errors, '1.0-0')} erreurs`;
                return { key: t.key, label: t.label, errors, total, rate: total > 0 ? (errors * 100) / total : 0, barPct: overallTotal > 0 ? (total * 100) / overallTotal : 0, loading, title };
            })
            .filter(s => s.loading || s.total > 0);
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

    groupBypropertyRest(property: string, array: any[]) {
        let helper: any = {};
        return array.reduce((acc: any, item: any) => {
            if (helper[item[property]]) {
                if (item.errorType) {
                    helper[item[property]].count += item['count'];
                }
            } else {
                helper[item[property]] = { ...item };
                helper[item[property]].count = item.errorType ? item.count : 0;
                acc.push(helper[item[property]]);
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

    private _fillFluxGaps(chart: any[], groupedBy: string, start: Date, end: Date): any[] {
        const now = new Date();
        const effectiveEnd = end > now ? now : end;
        if (groupedBy === 'date') {
            const map = new Map(chart.map(d => [d.stringDate, d]));
            const result: any[] = [];
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            while (d < effectiveEnd) {
                const label = this._datePipe.transform(d, 'd MMM yy');
                result.push(map.get(label) ?? { stringDate: label, count: null, countok: 0, perc: 0, _noData: true });
                d.setDate(d.getDate() + 1);
            }
            return result;
        }
        if (groupedBy === 'hour') {
            const map = new Map(chart.map(d => [d.stringDate, d]));
            const result: any[] = [];
            const startH = start.getHours();
            const isToday = start.toDateString() === now.toDateString();
            const endH = isToday ? now.getHours() : 23;
            for (let h = startH; h <= endH; h++) {
                const label = this._datePipe.transform(new Date(2000, 1, 1, h), 'shortTime');
                result.push(map.get(label) ?? { stringDate: label, count: null, countok: 0, perc: 0, _noData: true });
            }
            return result;
        }
        return chart;
    }

    private buildExceptionObservable(
        source$: Observable<any[]>,
        groupedBy: string,
        label: string,
        key: 'rest' | 'jdbc' | 'ftp' | 'smtp' | 'ldap',
        start?: Date,
        end?: Date
    ): Observable<{ chart: any[]; data: any[] }> {
        return source$.pipe(
            map((result: any[]) => {
                formatters[groupedBy](result, this._datePipe, 'stringDate');
                const sorted = this.groupBypropertyRest('stringDate', result)
                    .map((d: any) => ({ ...d, perc: (d.count * 100) / d.countok }))
                    .sort((a: any, b: any) => {
                        if (a.year !== undefined && b.year !== undefined && a.year !== b.year) {
                            return a.year - b.year;
                        }
                        return a.date - b.date;
                    });
                const chart = start && end ? this._fillFluxGaps(sorted, groupedBy, start, end) : sorted;
                const data = result.filter((a: any) => a.errorType != null);
                const sumRes = sorted.length ? this.sumcounts(sorted) : null;
                return { chart, data, sumRes };
            }),
            tap(({ sumRes }) => {
                this.sparklinePercs[key] = sumRes ? (sumRes.count * 100) / sumRes.countok : 0;
                const plural = sumRes && sumRes.countok > 1 ? 's' : '';
                this.sparklineTitles[key] = {
                    title: sumRes ? `${label}: ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%` : `${label}: 0.00%`,
                    subtitle: sumRes ? `sur ${this._decimalPipe.transform(sumRes.countok)} requ\u00eate${plural}` : 'sur 0 requ\u00eate'
                };
            }),
            map(({ chart, data }) => ({ chart, data }))
        );
    }

    TAB_REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        const groupedBy = this.groupedBy; // capturé une fois à la création
        return {
            sessionExceptionsTable: {
                observable: this._sessionService.getSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, server: app_name })
                    .pipe(map((result: any[]) => {
                        formatters[groupedBy](result, this._datePipe, 'stringDate');
                        return result.filter(r => r.errorType != null && r.status >= 400);
                    }))
            },
            batchExceptionTable: {
                observable: this._mainService.getMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map((result: ExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe, 'stringDate');
                        const dateMap = new Map<string, number>();
                        (result as any[]).forEach(r => { if (r.stringDate != null && r.countok != null) dateMap.set(r.stringDate, r.countok); });
                        this._sessionCountByType['BATCH'] = {
                            total: Array.from(dateMap.values()).reduce((s, v) => s + v, 0),
                            errors: result.filter(r => r.errorType != null).reduce((s, r) => s + r.count, 0)
                        };
                        return result.filter(r => r.errorType != null);
                    }))
            },
            batchTopJobsTable: {
                observable: this._mainService.getTopBatchJobErrors({ env: env, start: start, end: end, app_name: app_name })
            },
            viewExceptionTable: {
                observable: this._mainService.getViewExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map((result: ExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe, 'stringDate');
                        const dateMap = new Map<string, number>();
                        (result as any[]).forEach(r => { if (r.stringDate != null && r.countok != null) dateMap.set(r.stringDate, r.countok); });
                        this._sessionCountByType['VIEW'] = {
                            total: Array.from(dateMap.values()).reduce((s, v) => s + v, 0),
                            errors: result.filter(r => r.errorType != null).reduce((s, r) => s + r.count, 0)
                        };
                        return result.filter(r => r.errorType != null);
                    }))
            },
            startupExceptionTable: {
                observable: this._mainService.getStartupExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map((result: ExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe, 'stringDate');
                        const dateMap = new Map<string, number>();
                        (result as any[]).forEach(r => { if (r.stringDate != null && r.countok != null) dateMap.set(r.stringDate, r.countok); });
                        this._sessionCountByType['STARTUP'] = {
                            total: Array.from(dateMap.values()).reduce((s, v) => s + v, 0),
                            errors: result.filter(r => r.errorType != null).reduce((s, r) => s + r.count, 0)
                        };
                        return result.filter(r => r.errorType != null);
                    }))
            }
        }
    }
    REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        const groupedBy = periodManagement(start, end);
        const p = { env, start, end, groupedBy, app_name };
        return {
            restRequestExceptionsTable: { observable: this.buildExceptionObservable(this._restService.getRestExceptions1(p), groupedBy, 'REST', 'rest', start, end) },
            databaseRequestExceptionsTable: { observable: this.buildExceptionObservable(this._datebaseService.getJdbcRestSessionExceptions(p), groupedBy, 'JDBC', 'jdbc', start, end) },
            ftpRequestExceptionsTable: { observable: this.buildExceptionObservable(this._ftpService.getftpSessionExceptions(p), groupedBy, 'FTP', 'ftp', start, end) },
            smtpRequestExceptionsTable: { observable: this.buildExceptionObservable(this._smtpService.getSmtpExceptions(p), groupedBy, 'SMTP', 'smtp', start, end) },
            ldapRequestExceptionsTable: { observable: this.buildExceptionObservable(this._ldapService.getLdapSessionExceptions(p), groupedBy, 'LDAP', 'ldap', start, end) },
        };
    }

    ngOnInit(): void {
        this._pageTitleService.set({
            icon: Constants.MAPPING_TYPE['dashboard']?.icon || 'deployed_code',
            title: Constants.MAPPING_TYPE['dashboard']?.title || 'Vue d\'ensemble',
            iconOutlined: true
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.chartSubscriptions.forEach(s => s.unsubscribe());
        this.tabSubscriptions.forEach(s => s.unsubscribe());
        this._serverHealthSub?.unsubscribe();
        this._applicationsSub?.unsubscribe();
        if(this._dialog){
            this._dialog.closeAll();
        }
        this._pageTitleService.clear();
    }
}
