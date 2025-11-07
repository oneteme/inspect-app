import {AfterViewInit, Component, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';
import {combineLatest, finalize, map, Observable, Subscription, take} from 'rxjs';
import {DatePipe, DecimalPipe, Location} from '@angular/common';
import {app, makeDatePeriod} from 'src/environments/environment';
import {EnvRouter} from "../../service/router.service";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Constants} from '../constants';
import {formatters, periodManagement} from 'src/app/shared/util';
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
    FtpSessionExceptionsByPeriodAndappname,
    JdbcSessionExceptionsByPeriodAndappname,
    LdapSessionExceptionsByPeriodAndappname,
    RestSessionExceptionsByPeriodAndappname,
    SessionExceptionsByPeriodAndAppname,
    SmtpSessionExceptionsByPeriodAndappname
} from 'src/app/model/jquery.model';
import {smtpRequestService} from 'src/app/service/jquery/smtp-request.service';
import {NumberFormatterPipe} from 'src/app/shared/pipe/number.pipe';
import {LogService} from "@oneteme/inspect-ng-collector";

@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent implements AfterViewInit, OnDestroy  {
    constants = Constants;
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _router: EnvRouter = inject(EnvRouter);
    private _instanceService = inject(InstanceService);
    private _sessionService = inject(RestSessionService);
    private _mainService = inject(MainSessionService);
    private _restService = inject(RestRequestService);
    private _datebaseService = inject(DatabaseRequestService);
    private _ftpService = inject(FtpRequestService);
    private _smtpService = inject(smtpRequestService)
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
                this.initTab();
                this.initCharts();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${this.params.serveurs.length > 0 ? '&' + this.params.serveurs.map(name => `appname=${name}`).join('&') : ''}`)
            }
        }));
    }
    ngAfterViewInit(): void {
        this.initTab();
    }

    initCharts() { //TODO REFACTO
        this.chartSubscriptions.forEach(t => t.unsubscribe());
        Object.keys(this.chartRequests).forEach(k => {
            this.chartRequests[k].chart = [];
            this.chartRequests[k].isLoading = true;
            this.chartSubscriptions.push(this.chartRequests[k].observable
                .pipe(finalize(() => {   this.chartRequests[k].isLoading = false;  })).pipe(take(1))
                .subscribe({
                    next: (res: any) => {
                        this.chartRequests[k].data = res.data;
                        this.chartRequests[k].chart = res.chart
                    }
                }));


        })
    }


    initTab() {
        this.tabSubscriptions.forEach(t => t.unsubscribe());
        Object.keys(this.tabRequests).forEach(i => {
            this.tabRequests[i].data = [];
            this.tabRequests[i].isLoading = true;
            this.tabSubscriptions.push(this.tabRequests[i].observable
                .pipe(finalize(() => {   this.tabRequests[i].isLoading = false;  })).pipe(take(1))
                .subscribe({
                    next: (res: any[]) => {
                        this.tabRequests[i].data = res;
                    }
                }));
        })
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
                data: exceptions
            })
        }
    }

    patchServerValue(servers: any[]) {
        this.serverFilterForm.patchValue({
            appname: servers
        }, { emitEvent: false })
    }

    setTitle(type: string, data: any[]): {title: string, subtitle: string} {
        let title = `${type}: 0.00%`;
        let subtitle = 'sur 0 requête(s)';
        let arr = this.groupByProperty("date", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } }).sort((a,b)=> a.date.localeCompare(b.date));
        if (arr.length) {
            let sumRes = this.sumcounts(arr);
            title = `${type}: ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%`;
            subtitle = `sur ${this._decimalPipe.transform(sumRes.countok)} requête(s)`;
        }
        return {title: title, subtitle: subtitle};
    }

    setChartData(data: any[]) {
        let arr = this.groupByProperty("date", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } }).sort((a,b)=> a.date.localeCompare(b.date));
        data = data.filter((a:any)=> a.count>0)
        return {chart : arr, data :data}
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

    TAB_REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        let groupedBy = periodManagement(start, end);
        return {
            // Server start
            serverStartTable: { observable: this._instanceService.getServerStart({ env: env, start: start, end: end, app_name: app_name }) },

            //   Rest-Main Sessions exceptions 
            sessionExceptionsTable: {
                observable: this._sessionService.getSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, server: app_name })
                    .pipe(map(((result: SessionExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe, 'stringDate');
                        return result.filter(r => r.errorType != null); // rename errorType to errType in backend
                    })))
            },

            batchExceptionTable: {
                observable: this._mainService.getMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: SessionExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe, 'stringDate')
                        return result.filter(r => r.errorType != null);
                    })))
            },

        }
    }
    REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        let groupedBy = periodManagement(start, end);

        return {
            //------- TABLE + CHART
            restRequestExceptionsTable: {
                observable: this._restService.getRestExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: RestSessionExceptionsByPeriodAndappname[]) => {
                        formatters[groupedBy](result, this._datePipe)
                        this.sparklineTitles.rest = this.setTitle('REST', [...result]);
                        return this.setChartData([...result])
                    })))
            },

            databaseRequestExceptionsTable: {
                observable: this._datebaseService.getJdbcRestSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: JdbcSessionExceptionsByPeriodAndappname[]) => {
                        formatters[groupedBy](result, this._datePipe);
                        this.sparklineTitles.jdbc = this.setTitle('JDBC', [...result]);
                        return this.setChartData(result)
                    })))
            },
            ftpRequestExceptionsTable: {
                observable: this._ftpService.getftpSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: FtpSessionExceptionsByPeriodAndappname[]) => {
                        formatters[groupedBy](result, this._datePipe);
                        this.sparklineTitles.ftp = this.setTitle('FTP', [...result]);
                        return this.setChartData(result)
                    })))
            },
            smtpRequestExceptionsTable: {
                observable: this._smtpService.getSmtpExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: SmtpSessionExceptionsByPeriodAndappname[]) => {
                        formatters[groupedBy](result, this._datePipe);
                        this.sparklineTitles.smtp = this.setTitle('SMTP', [...result]);
                        return this.setChartData(result)
                    })))
            },
            ldapRequestExceptionsTable: {
                observable: this._ldapService.getLdapExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: LdapSessionExceptionsByPeriodAndappname[]) => {
                        formatters[groupedBy](result, this._datePipe);
                        this.sparklineTitles.ldap = this.setTitle('LDAP', [...result]);
                        return  this.setChartData(result)
                    })))
            },
        }
    }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    LogService.info("destroy")
  }
}











