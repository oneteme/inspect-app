import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { combineLatest, finalize, forkJoin, map, Observable, Subscription } from 'rxjs';
import { DatePipe, Location } from '@angular/common';
import { application, makePeriod } from 'src/environments/environment';
import { EnvRouter } from "../../service/router.service";
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Constants } from '../constants';
import { formatters, periodManagement } from 'src/app/shared/util';
import { JQueryService } from 'src/app/service/jquery.service';
import { MatDialog } from '@angular/material/dialog';
import { ProtocolExceptionComponent } from './components/protocol-exception-modal/protocol-exception-modal.component';
import { cp } from 'fs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
@Component({
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],

})
export class DashboardComponent {
    constants = Constants;
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _router: EnvRouter = inject(EnvRouter);
    private _location: Location = inject(Location);
    private _statsService: JQueryService = inject(JQueryService);
    private _datePipe = inject(DatePipe);
    private _dialog = inject(MatDialog)


    MAPPING_TYPE = Constants.MAPPING_TYPE;
    serverStartDisplayedColumns: string[] = ["appName","version", "duree"];
    sessionExceptionsDisplayedColumns: string[] = ["date", "errorType", "count"];
    batchExceptionDisplayedColumns: string[] = ["date", "error", "count"];
    paramsSubscription: any;
    today: Date = new Date();
    subscriptions: Subscription[] = [];
    requests: { [key: string]: { observable?: Observable<Object>, data?: MatTableDataSource<any[]>, isLoading?: boolean, key?: string } } = {};
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
                this.subscriptions.push(this._statsService.getInstance({ 'column.distinct': 'app_name', 'order': 'app_name.asc' })
                    .pipe(finalize(() => this.serverNameIsLoading = false))
                    .subscribe({
                        next: (appNames: { appName: string }[]) => {
                            this.nameDataList = appNames.map(r => r.appName);
                            this.patchServerValue(this.params.serveurs);
                        }, error: (e) => {
                            console.log(e)
                        }
                    }));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${this.params.serveurs.length > 0 ? '&' + this.params.serveurs.map(name => `appname=${name}`).join('&') : ''}`)
            }
        });
    }

    init() {
        let that: any = this;
        this.setChartDialogEvent()
        let serverParam = this.createServerFilter();
        this.requests = this.REQUESTS(this.params.env, this.params.start, this.params.end, serverParam.app_name);
        Object.keys(this.requests).forEach(k => {
            this.charts[k] = [];
            this.requests[k].isLoading = true;
            this.subscriptions.push(this.requests[k].observable
                .pipe(finalize(() => { this.requests[k].isLoading = false; }))
                .subscribe({
                    next: (res: any) => {

                        /*this.requests[k].data.sortingDataAccessor = (row: any, columnName: string) => {

                            if (columnName == "count") return ((row['count']*100) / row['countok']).toFixed(0);

                          //  return row[columnName as keyof any] as string;
              
                          }*/

                        // if(["serverStartTable","sessionExceptionsTable","batchExceptionTable"].indexOf(k)>-1){
                        this.requests[k].data = new MatTableDataSource(res);
                        this.requests[k].data.sort = that[`${k}Sort`];
                        this.requests[k].data.paginator = that[`${k}Paginator`];
                        // }
                    }
                }))
        })
    }

    search() { // TODO: finish search button
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
                this.init();
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

    setChartDialogEvent() {
        let dis = this;
        [this.constants.REST_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE,
        this.constants.LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE].forEach(p => {
            p.options.chart.toolbar = {
                show: true,
                tools: {
                    customIcons: [{
                        icon: '<img src="../../../../../assets/detail.png" width="25">',
                        title: 'Détail',
                        class: 'custom-icon',
                        click: function (chart: any, options: any, e: any) {
                            dis.openProtocolDialog({ observable: dis.requests[p.options.chart.data.name], type: p.options.chart.data.type });
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
        return ''
    }

    openProtocolDialog(exceptions: { observable: any, type: string }) {
        if (exceptions.observable.data.data.length > 0 && exceptions.observable.data.data.some((d: any) => d.count > 0)) {

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

        let arr = this.groupByProperty("date", data).map((d: any) => { return { ...d, perc: (d.count * 100) / d.countok } });
        if (arr.length) {
            let sumRes = this.sumcounts(arr);
            title = `${type}:  ${((sumRes.count * 100) / sumRes.countok).toFixed(2)}%`;
            subtitle = `sur ${sumRes.countok} requête(s)`;
        }
        let config = { ...c[configName] }
        config.options.title.text = title
        config.options.subtitle.text = subtitle
        c[configName] = config
        this.charts[chartName] = arr;

        return data;
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


    REQUESTS = (env: string, start: Date, end: Date, app_name: string) => {
        let groupedBy = periodManagement(start, end);
        let serverStartAppName = "";
        if (app_name) {
            serverStartAppName = `.and(${app_name})`;
        }
        return {

            // Server start
            serverStartTable: { observable: this._statsService.getInstance({ 'column': `view1.appName,view1.version,view1.start`, 'view': `select(app_name,version,start,rank.over(partition(environement,app_name).order(start.desc)):rk).filter(type.eq(SERVER).and(environement.eq(${env})).and(start.ge(${start.toISOString()})).and(start.lt(${end.toISOString()}))${serverStartAppName}):view1`, 'view1.rk': '1', 'order': 'view1.start.desc' }) },

            //   Rest-Main Sessions exceptions 
            sessionExceptionsTable: {
                observable: this._statsService.getRestSession({ "column": `start.${groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`, 'join': 'instance', 'instance.environement': env, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', "order": "date.desc,count.desc" })
                    .pipe(map(((result: any[]) => {
                        formatters[groupedBy](result, this._datePipe)
                        //                  result.map( )
                        return result.filter(r => r.errorType != null);
                    })))


            },

            batchExceptionTable: {
                observable: this._statsService.getMainSession({ "column": `start.${groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`, 'main_session.type': 'BATCH', 'join': 'instance', 'instance.environement': env, 'start.ge': start.toISOString(), [app_name]: '', 'start.lt': end.toISOString(), "order": "date.desc,count.desc" })
                    .pipe(map(((result: any[]) => {
                        formatters[groupedBy](result, this._datePipe)
                        return result.filter(r => r.errorType != null);
                    })))
            },

            //------- TABLE + CHART
            restRequestExceptionsTable: {
                observable: combineLatest({
                    restSession: this._statsService.getRestRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,rest_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), [app_name]: '', 'start.lt': end.toISOString(), 'order': 'date.asc' }),
                    mainSession: this._statsService.getRestRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,rest_request.main_session,main_session.instance', 'start.ge': start.toISOString(), [app_name]: '', 'start.lt': end.toISOString(), 'order': 'date.asc' })
                })
                    .pipe(map(((result: { restSession: any[]; mainSession: any[]; }) => {
                        let r = this.setChartData([...result.restSession, ...result.mainSession], 'REST', 'restRequestExceptionsTable', 'REST_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                        return r;
                    })))
            },

            databaseRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._statsService.getDatabaseRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,database_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' }),
                    mainSession: this._statsService.getDatabaseRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,database_request.main_session,main_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' })
                })
                    .pipe(map(((result: { restSession: any[]; mainSession: any[]; }) => {
                        let r = this.setChartData([...result.restSession, ...result.mainSession], 'JDBC', 'databaseRequestExceptionsTable', 'DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                        return r;
                    })))
            },
            ftpRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._statsService.getFtpRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,ftp_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' }),
                    mainSession: this._statsService.getFtpRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,ftp_request.main_session,main_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' })
                })
                    .pipe(map(((result: { restSession: any[]; mainSession: any[]; }) => {
                        let r = this.setChartData([...result.restSession, ...result.mainSession], 'FTP', 'ftpRequestExceptionsTable', 'FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                        return r;
                    })))
            },
            smtpRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._statsService.getSmtpRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,smtp_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' }),
                    mainSession: this._statsService.getSmtpRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,smtp_request.main_session,main_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' })
                })
                    .pipe(map(((result: { restSession: any[]; mainSession: any[]; }) => {
                        let r = this.setChartData([...result.restSession, ...result.mainSession], 'SMTP', 'smtpRequestExceptionsTable', 'SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                        return r;
                    })))
            },
            ldapRequestExceptionsTable: {
                observable: forkJoin({
                    restSession: this._statsService.getLdapRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,ldap_request.rest_session,rest_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' }),
                    mainSession: this._statsService.getLdapRequest({ 'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${groupedBy}:date,start.year:year`, 'instance.environement': env, 'join': 'exception,ldap_request.main_session,main_session.instance', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), [app_name]: '', 'order': 'date.asc' })
                })
                    .pipe(map(((result: { restSession: any[]; mainSession: any[]; }) => {
                        let r = this.setChartData([...result.restSession, ...result.mainSession], 'LDAP', 'ldapRequestExceptionsTable', 'LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE', groupedBy)
                        return r;
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











