import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { combineLatest, finalize, forkJoin, map, Observable, Subscription } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { application, makePeriod } from 'src/environments/environment';
import { EnvRouter } from "../../service/router.service";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Constants } from '../constants';
import { formatters, periodManagement } from 'src/app/shared/util';
import { MatDialog } from '@angular/material/dialog';
import { ProtocolExceptionComponent } from './components/protocol-exception-modal/protocol-exception-modal.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { InstanceService } from 'src/app/service/jquery/instance.service';
import { RestSessionService } from 'src/app/service/jquery/rest-session.service';
import { MainSessionService } from 'src/app/service/jquery/main-session.service';
import { RestRequestService } from 'src/app/service/jquery/rest-request.service';
import { DatabaseRequestService } from 'src/app/service/jquery/database-request.service';
import { FtpRequestService } from 'src/app/service/jquery/ftp-request.service';
import { LdapRequestService } from 'src/app/service/jquery/ldap-request.service';
import { FtpMainExceptionsByPeriodAndappname, FtpSessionExceptionsByPeriodAndappname, JdbcMainExceptionsByPeriodAndappname, JdbcSessionExceptionsByPeriodAndappname, LdapMainExceptionsByPeriodAndappname, LdapSessionExceptionsByPeriodAndappname, RestMainExceptionsByPeriodAndappname, RestSessionExceptionsByPeriodAndappname, SessionExceptionsByPeriodAndAppname, SmtpMainExceptionsByPeriodAndappname, SmtpSessionExceptionsByPeriodAndappname } from 'src/app/model/jquery.model';
import { smtpRequestService } from 'src/app/service/jquery/smtp-request.service';
import { ChartProvider } from "@oneteme/jquery-core";
@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent implements AfterViewInit  {
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
    private _dialog = inject(MatDialog)

    MAPPING_TYPE = Constants.MAPPING_TYPE;
    serverStartDisplayedColumns: string[] = ["appName", "version", "duree"];
    sessionExceptionsDisplayedColumns: string[] = ["date", "errorType", "count"];
    batchExceptionDisplayedColumns: string[] = ["date", "error", "count"];
    paramsSubscription: any;
    today: Date = new Date();
    subscriptions: Subscription[] = [];
    tabRequests: { [key: string]: { observable?: Observable<Object>, data?: MatTableDataSource<any[]>, isLoading?: boolean, key?: string } } = {};
    chartRequests: { [key: string]: { observable?: Observable<Object>, chartData?: any[], tableData?: MatTableDataSource<any[]>, isLoading?: boolean, key?: string } } = {};
    charts: any = {}
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


    @ViewChild('sessionExceptionsTablePaginator') sessionExceptionsTablePaginator: MatPaginator;
    @ViewChild('batchExceptionTablePaginator') batchExceptionTablePaginator: MatPaginator;
    @ViewChild('serverStartTablePaginator') serverStartTablePaginator: MatPaginator;

    @ViewChild('serverStartTableSort') serverStartTableSort: MatSort;
    @ViewChild('sessionExceptionsTableSort') sessionExceptionsTableSort: MatSort;
    @ViewChild('batchExceptionTableSort') batchExceptionTableSort: MatSort;




    constructor() {
        this.paramsSubscription = combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.env = v.queryParams.env || application.default_env;
                this.params.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.home.default_period || makePeriod(0, 1)).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.home.default_period || makePeriod(0, 1)).end;
                this.params.serveurs = Array.isArray(v.queryParams['appname']) ? v.queryParams['appname'] : v.queryParams['appname'] ? [v.queryParams['appname']] : []
                if (this.params.serveurs.length > 0) {
                    this.patchServerValue(this.params.serveurs);
                }
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.subscriptions.push(this._instanceService.getApplications('SERVER')
                    .pipe(finalize(() => this.serverNameIsLoading = false))
                    .subscribe({
                        next: (appNames: { appName: string }[]) => {
                            this.nameDataList = appNames.map(r => r.appName);
                            this.patchServerValue(this.params.serveurs);
                        }, error: (e) => {
                            console.log(e)
                        }
                    }));
                this.initTab();
                this.initCharts();


                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${this.params.serveurs.length > 0 ? '&' + this.params.serveurs.map(name => `appname=${name}`).join('&') : ''}`)
            }
        });
    }
    ngAfterViewInit(): void {
        //this.initTab();
    }

    initCharts() { //TODO REFACTO
        this.setChartDialogEvent()
        let serverParam = this.createServerFilter();
        this.chartRequests = {...this.REQUESTS(this.params.env, this.params.start, this.params.end, serverParam.app_name)};
        Object.keys(this.chartRequests).forEach(k => {
            this.chartRequests[k].isLoading = true;
            this.chartRequests[k].observable
                .pipe(finalize(() => {   this.chartRequests[k].isLoading = false;  }))
                .subscribe({
                    next: (res: any) => {
                        this.chartRequests[k].chartData = [...res.chart];
                        console.log(this.chartRequests[k])
                    }
                })
        })
    }

    init() {

    }

    initTab() {
        let that: any = this;
        let serverParam = this.createServerFilter();
        this.tabRequests = this.TAB_REQUESTS(this.params.env, this.params.start, this.params.end, serverParam.app_name);
        Object.keys(this.tabRequests).forEach(k => {
      
            this.tabRequests[k].isLoading = true;
            this.tabRequests[k].observable
                .pipe(finalize(() => { this.tabRequests[k].isLoading = false;   }))
                .subscribe({
                    next: (res: any[]) => {
                        this.tabRequests[k].data = new MatTableDataSource(res);
                        this.tabRequests[k].data.sort = that[`${k}Sort`];
                        this.tabRequests[k].data.paginator = that[`${k}Paginator`];
                    }
                })

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
                this.initCharts();
                this.initTab();

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
            return { app_name: `instance.app_name.in(${this.params.serveurs.map(v => `"${v}"`).join(',')})` };
        }
        return { app_name: '' };
    }

    setChartDialogEvent() { // todo fix 
        let dis = this;
        [this.constants.REST_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE].forEach((p: ChartProvider<string, number> | ChartProvider<Date, number>) => {
            // p = Object.assign({}, p);
            // p.options.title.text = `${p.options.chart.data.type}: `;
            // p.options.subtitle.Text = ''; 
            p.options.chart.toolbar = {
                show: true,
                tools: {
                    customIcons: [{
                        icon: '<img src="../../../../../assets/detail.png" width="25">',
                        title: 'Détail',
                        class: 'custom-icon',
                        click: function (chart: any, options: any, e: any) {
                            dis.openProtocolDialog({ observable: dis.chartRequests[p.options.chart.data.name], type: p.options.chart.data.type });
                        }
                    }],
                }
            }
            return p
        })
    }

    removePackage(errorType: string) {
        const index = errorType.lastIndexOf('.') + 1;
        return errorType?.substring(index);
    }

    openProtocolDialog(exceptions: { observable: any, type: string }) {
        exceptions.observable.data.data = exceptions.observable.data.data.filter((d: any) => d.count > 0);
        if (exceptions.observable.data.data.length > 0) {

            const dialog = this._dialog.open(ProtocolExceptionComponent, {
                width: "70%",
                data: exceptions
            })

            dialog.afterClosed().subscribe(result => {
            })
        }
    }

    patchServerValue(servers: any[]) {
        this.serverFilterForm.patchValue({
            appname: servers
        }, { emitEvent: false })
    }

    setChartData(data: any[], type: string, chartName: string, configName: string, groupedBy: string) {
        let c: any = this.constants;
        let title = `${c[configName].options.chart.data.type}: `
        let subtitle = ''
        formatters[groupedBy](data, this._datePipe)

        let arr: any[] = this.groupByProperty("date", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } });
        if (arr.length) {
            let sumRes = this.sumcounts(arr);
            title = `${type}:  ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%`;
            subtitle = `sur ${sumRes.countok} requête(s)`;
        }
        let config = { ...c[configName] }
        config.options.title.text = title
        config.options.subtitle.text = subtitle
        c[configName] = config
        return {chart: arr, table: data};
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
        let serverStartAppName = "";
        if (app_name) {
            serverStartAppName = `.and(${app_name})`;
        }
        return {
            // Server start
            serverStartTable: { observable: this._instanceService.getServerStart({ env: env, start: start, end: end, app_name: serverStartAppName }) },

            //   Rest-Main Sessions exceptions 
            sessionExceptionsTable: {
                observable: this._sessionService.getSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: SessionExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe)
                        // result.map( )
                        return result.filter(r => r.errorType != null); // rename errorType to errType in backend
                    })))
            },

            batchExceptionTable: {
                observable: this._mainService.getMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                    .pipe(map(((result: SessionExceptionsByPeriodAndAppname[]) => {
                        formatters[groupedBy](result, this._datePipe)
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
                observable: forkJoin({
                    restSession: this._restService.getrestSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name }),
                    mainSession: this._restService.getrestMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                })
                    .pipe(map(((result: { restSession: RestSessionExceptionsByPeriodAndappname[]; mainSession: RestMainExceptionsByPeriodAndappname[]; }) => {
                        let r = [...result.restSession, ...result.mainSession]
                        return this.setChartData(r, 'REST', 'restRequestExceptionsTable', 'REST_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                    })))
            },

            databaseRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._datebaseService.getJdbcRestSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name }),
                    mainSession: this._datebaseService.getJdbcMainSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                })
                    .pipe(map(((result: { restSession: JdbcSessionExceptionsByPeriodAndappname[]; mainSession: JdbcMainExceptionsByPeriodAndappname[]; }) => {
                        let r = [...result.restSession, ...result.mainSession]
                        return this.setChartData(r, 'JDBC', 'databaseRequestExceptionsTable', 'DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                    })))
            },
            ftpRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._ftpService.getftpSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name }),
                    mainSession: this._ftpService.getftpMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                })
                    .pipe(map(((result: { restSession: FtpSessionExceptionsByPeriodAndappname[]; mainSession: FtpMainExceptionsByPeriodAndappname[]; }) => {
                        let r = [...result.restSession, ...result.mainSession]
                        return this.setChartData(r, 'FTP', 'ftpRequestExceptionsTable', 'FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                    })))
            },
            smtpRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._smtpService.getsmtpSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name }),
                    mainSession: this._smtpService.getsmtpMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                })
                    .pipe(map(((result: { restSession: SmtpSessionExceptionsByPeriodAndappname[]; mainSession: SmtpMainExceptionsByPeriodAndappname[]; }) => {
                        let r = [...result.restSession, ...result.mainSession]
                        return this.setChartData(r, 'SMTP', 'smtpRequestExceptionsTable', 'SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                    })))
            },
            ldapRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._ldapService.getLdapSessionExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name }),
                    mainSession: this._ldapService.getLdapMainExceptions({ env: env, start: start, end: end, groupedBy: groupedBy, app_name: app_name })
                })
                    .pipe(map(((result: { restSession: LdapSessionExceptionsByPeriodAndappname[]; mainSession: LdapMainExceptionsByPeriodAndappname[]; }) => {
                        let r = [...result.restSession, ...result.mainSession]
                        return this.setChartData(r, 'LDAP', 'ldapRequestExceptionsTable', 'LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                    })))
            },
        }
    }
}




// old restsession  batch session exception requests
/*sessionExceptionsTable: {
                observable: combineLatest({
                    countError: this._statsService.getRestSession({ 'column': `count:count,err_type,start.${groupedBy}:date,start.year:year`, 'err_type.notNull': '', 'join': 'instance', 'instance.environement': env, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': `date.desc`, 'limit': 10 }),
                    countOk: this._statsService.getRestSession({ 'column': `count:count,start.${groupedBy}:date,start.year:year`, 'join': 'instance', 'instance.environement': env, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': `date.desc`, 'limit': 10 })
                })
                    .pipe(map(((result: { countError: any[], countOk: any[] }) => {
                        formatters[groupedBy](result.countError, this._datePipe)
                        formatters[groupedBy](result.countOk, this._datePipe)

                        result.countError.forEach((e) => {
                            e['countok'] = result.countOk.find(a => a.date == e.date).count
                        })
                        return result.countError;
                    })))
            },*/

/*batchExceptionTable: {
    observable: combineLatest({
        countError: this._statsService.getMainSession({ 'column': `count:count,err_type,start.${groupedBy}:date,start.year:year`, 'err_type.notNull': '', 'main_session.type': 'BATCH', 'join': 'instance', 'instance.environement': env, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': `date.desc`, 'limit': 10 }),
        countOk:    this._statsService.getMainSession({ 'column': `count:count,start.${groupedBy}:date,start.year:year`, 'main_session.type': 'BATCH', 'join': 'instance', 'instance.environement': env, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': `date.desc`, 'limit': 10 })
    })
        .pipe(map(((result: { countError: any[], countOk: any[] }) => {
            formatters[groupedBy](result.countError, this._datePipe)
            formatters[groupedBy](result.countOk, this._datePipe)

            result.countError.forEach((e) => {
                e['countok'] = result.countOk.find(a => a.date == e.date).count
            })

            console.log(result.countError)

            return result.countError;
        })))
},*/





//-------CHART     



/*
 
restRequestExceptionsChart: {
    observable: forkJoin({
        restSession: this._statsService.getRestRequest({ 'column': `count:countok,exception.count_exception:count,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'date.asc' }),
        mainSession: this._statsService.getRestRequest({ 'column': `count:countok,exception.count_exception:count,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,main_session,main_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'date.asc' })
    })
        .pipe(map(((result: { restSession: any[]; mainSession: any[]; }) => {
            let r = [...result.restSession, ...result.mainSession];
            formatters[groupedBy](r, this._datePipe)
            r = this.groupByProperty("date", r);
            r.sort((a, b) => a.date.localeCompare(b.date));
            this.constants.REST_REQUEST_EXCEPTION_BY_PERIOD_LINE.options.title.text = "100%"
            console.log(r)
            return r;
        })))
},
 
 
databaseRequestExceptionsChart: {
    observable: this._statsService.getDatabaseRequest({ 'column': `count:countok,exception.count_exception:count,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,database_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'date.asc' })
        .pipe(map(((r: any[]) => {
            formatters[groupedBy](r, this._datePipe)
            return r;
        })))
},
ftpRequestExceptionsChart: {
    observable: this._statsService.getFtpRequest({ 'column': `count:countok,exception.count_exception:count,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,ftp_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'date.asc' })
        .pipe(map(((r: any[]) => {
            formatters[groupedBy](r, this._datePipe)
            return r;
        })))
},
smtpRequestExceptionsChart: {
    observable: this._statsService.getSmtpRequest({ 'column': `count:countok,exception.count_exception:count,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,smtp_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'date.asc' })
        .pipe(map(((r: any[]) => {
            formatters[groupedBy](r, this._datePipe)
            return r;
        })))
},
ldapRequestExceptionsChart: {
    observable: this._statsService.getLdapRequest({ 'column': `count:countok,exception.count_exception:count,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,ldap_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'date.asc' })
        .pipe(map(((r: any[]) => {
            formatters[groupedBy](r, this._datePipe)
            return r;
        })))
},*/











