import {AfterViewInit, Component, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {combineLatest, finalize, map, Observable, Subscription} from 'rxjs';
import {DatePipe, DecimalPipe, Location} from '@angular/common';
import {app, makeDatePeriod} from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Constants} from '../constants';
import {formatters, periodManagement, recreateDate} from 'src/app/shared/util';
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

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent implements AfterViewInit, OnDestroy  {
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
    globalKpi: { globalErrorRate: number; totalSessions: number; totalErrors: number } | null = null;
    kpiLoading = true;
    sparklinePercs: { rest: number; jdbc: number; ftp: number; smtp: number; ldap: number } = { rest: 0, jdbc: 0, ftp: 0, smtp: 0, ldap: 0 };
    topErrors: Record<string, { type: string; count: number }[]> = {};
    showInactiveProtocols = false;
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
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${this.params.serveurs.length > 0 ? '&' + this.params.serveurs.map(name => `appname=${name}`).join('&') : ''}`)
            }
        }));
    }
    ngAfterViewInit(): void {
        this.initTab();
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
        this.tabSubscriptions.forEach(t => t.unsubscribe());
        this.selectedExceptionTab = 0;
        Object.keys(this.tabRequests).forEach(i => {
            this.tabRequests[i].data = [];
            this.tabRequests[i].isLoading = true;
            this.tabSubscriptions.push(this.tabRequests[i].observable
                .pipe(finalize(() => {
                    this.tabRequests[i].isLoading = false;
                    this._autoSelectTab();
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
    }

    loadServerHealth(env: string) {
        this.serverHealthLoading = true;
        this.serverHealthData = [];
        this.subscriptions.push(
            this._instanceService.getLastServerStart({ env })
                .pipe(finalize(() => this.serverHealthLoading = false))
                .subscribe({ next: (data: LastServerStart[]) => this.serverHealthData = data })
        );
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

    get inactiveProtocolsCount(): number {
        const keys = ['restRequestExceptionsTable', 'databaseRequestExceptionsTable', 'ftpRequestExceptionsTable', 'smtpRequestExceptionsTable', 'ldapRequestExceptionsTable'];
        return keys.filter(k => !this.chartRequests[k]?.isLoading && !this.chartRequests[k]?.data?.length).length;
    }

    get quietProtocols(): typeof this.protocolDefs {
        return this.protocolDefs.filter(p =>
            !this.chartRequests[p.reqKey].isLoading &&
            !this.chartRequests[p.reqKey].data?.length
        );
    }

    get unstableServers(): LastServerStart[] {
        return this.serverHealthData
            .filter(s => s.restart > 1)
            .sort((a, b) => b.restart - a.restart)
            .slice(0, 5);
    }

    get versionSummary(): { version: string; count: number }[] {
        if (!this.serverHealthData.length) return [];
        const map: Record<string, number> = {};
        this.serverHealthData.forEach(s => {
            const v = s.version ?? '?';
            map[v] = (map[v] ?? 0) + 1;
        });
        return Object.entries(map)
            .map(([version, count]) => ({ version, count }))
            .sort((a, b) => b.count - a.count);
    }

    get stoppedServers(): LastServerStart[] {
        return this.serverHealthData
            .filter(s => s.end !== null && s.end !== undefined)
            .sort((a, b) => b.end - a.end)
            .slice(0, 5);
    }

    get divergentBranches(): { branch: string; count: number; servers: string[] }[] {
        if (!this.serverHealthData.length) return [];
        const map: Record<string, string[]> = {};
        this.serverHealthData.forEach(s => {
            const b = s.branch ?? '?';
            if (b === 'main' || b === 'master') return;
            if (!map[b]) map[b] = [];
            map[b].push(s.appName);
        });
        return Object.entries(map)
            .map(([branch, servers]) => ({ branch, count: servers.length, servers }))
            .sort((a, b) => b.count - a.count);
    }

    get exceptionsAllEmpty(): boolean {
        return !this.tabRequests.sessionExceptionsTable?.isLoading
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

    get topSessionErrors(): { type: string; count: number }[] {
        const data: any[] = this.tabRequests['sessionExceptionsTable']?.data ?? [];
        const map: Record<string, number> = {};
        data.forEach(d => { if (d.errorType) map[d.errorType] = (map[d.errorType] ?? 0) + d.count; });
        return Object.entries(map)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }

    get topBatchErrors(): { type: string; count: number }[] {
        const data: any[] = this.tabRequests['batchExceptionTable']?.data ?? [];
        const map: Record<string, number> = {};
        data.forEach(d => { if (d.errorType) map[d.errorType] = (map[d.errorType] ?? 0) + d.count; });
        return Object.entries(map)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }

    navigateToDeploiment() {
        this._router.navigate(['/deploiment'], { queryParams: { env: this.params.env } });
    }

    getProtoBarWidth(count: number): number {
        if (!this.globalKpi?.totalErrors) return 0;
        return Math.min(Math.round((count / this.globalKpi.totalErrors) * 100), 100);
    }

    getErrBarWidth(list: { count: number }[], count: number): number {
        return list?.[0]?.count ? Math.round((count / list[0].count) * 100) : 0;
    }

    isRecentlyStarted(server: LastServerStart): boolean {
        if (!server.lastStart || server.end) return false;
        return (Date.now() - new Date(server.lastStart).getTime()) < 3_600_000;
    }

    get insightsAllClear(): boolean {
        return !this.serverHealthLoading
            && !this.unstableServers.length
            && !this.stoppedServers.length
            && !this.divergentBranches.length
            && this.tabRequests.sessionExceptionsTable?.isLoading === false
            && this.tabRequests.batchExceptionTable?.isLoading === false
            && !this.topSessionErrors.length
            && !this.topBatchErrors.length;
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
            rest:  'restRequestExceptionsTable',
            jdbc:  'databaseRequestExceptionsTable',
            ftp:   'ftpRequestExceptionsTable',
            smtp:  'smtpRequestExceptionsTable',
            ldap:  'ldapRequestExceptionsTable'
        };
        Object.entries(defs).forEach(([key, reqKey]) => {
            const data: any[] = this.chartRequests[reqKey]?.data ?? [];
            const map: Record<string, number> = {};
            data.forEach((d: any) => { if (d.errorType) map[d.errorType] = (map[d.errorType] ?? 0) + d.count; });
            this.topErrors[key] = Object.entries(map)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
        });
    }

    get protocolSummaries(): { label: string; rate: number; count: number; total: number }[] {
        const entries = [
            { label: 'REST',  reqKey: 'restRequestExceptionsTable',     rate: this.sparklinePercs.rest  },
            { label: 'JDBC',  reqKey: 'databaseRequestExceptionsTable',  rate: this.sparklinePercs.jdbc  },
            { label: 'FTP',   reqKey: 'ftpRequestExceptionsTable',       rate: this.sparklinePercs.ftp   },
            { label: 'SMTP',  reqKey: 'smtpRequestExceptionsTable',      rate: this.sparklinePercs.smtp  },
            { label: 'LDAP',  reqKey: 'ldapRequestExceptionsTable',      rate: this.sparklinePercs.ldap  },
        ];
        return entries.map(p => {
            const s = this.sumcounts(this.chartRequests[p.reqKey]?.chart ?? []);
            return { label: p.label, rate: p.rate, count: s.count, total: s.countok };
        }).filter(p => p.count > 0).sort((a, b) => b.count - a.count);
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
        let subtitle = 'sur 0 requête(s)';
        let arr = this.groupByProperty("stringDate", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } }).sort((a,b)=> a.stringDate.localeCompare(b.stringDate));
        if (arr.length) {
            let sumRes = this.sumcounts(arr);
            title = `${type}: ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%`;
            subtitle = `sur ${this._decimalPipe.transform(sumRes.countok)} requête(s)`;
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
                title:    sumRes ? `${label}: ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%` : `${label}: 0.00%`,
                subtitle: sumRes ? `sur ${this._decimalPipe.transform(sumRes.countok)} requête(s)` : 'sur 0 requête(s)'
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
            restRequestExceptionsTable:     { observable: this.buildExceptionObservable(this._restService.getRestExceptions1(p),                          groupedBy, 'REST',  'rest')  },
            databaseRequestExceptionsTable: { observable: this.buildExceptionObservable(this._datebaseService.getJdbcRestSessionExceptions(p),           groupedBy, 'JDBC',  'jdbc')  },
            ftpRequestExceptionsTable:      { observable: this.buildExceptionObservable(this._ftpService.getftpSessionExceptions(p),                      groupedBy, 'FTP',   'ftp')   },
            smtpRequestExceptionsTable:     { observable: this.buildExceptionObservable(this._smtpService.getSmtpExceptions(p),                          groupedBy, 'SMTP',  'smtp')  },
            ldapRequestExceptionsTable:     { observable: this.buildExceptionObservable(this._ldapService.getLdapSessionExceptions(p),                   groupedBy, 'LDAP',  'ldap')  },
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











