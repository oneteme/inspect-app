import {Component, inject} from '@angular/core';
import {finalize, map, Observable} from 'rxjs';
import {TableProvider} from "@oneteme/jquery-table";
import {HttpErrorResponse} from "@angular/common/http";
import {SessionEventDto} from "../../../../model/request.model";
import {SESSION_EVENT_TABLE_CONFIG} from "../../../../shared/_component/table/table.config";
import {shallowEqual} from "../../request/search-request.view";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {IPeriod, IStep, IStepFrom, QueryParams} from "../../../../model/conf.model";
import {EnvRouter} from "../../../../service/router.service";
import {ActivatedRoute, Params} from "@angular/router";
import {
    getDefaultRelativePeriod, getQuickRangeDates, getQuickRangeStep,
    isDefaultRelativePeriod, PERIOD_QUICK_RANGES, PeriodQuickRange,
    toDisplayedPeriodEnd
} from "../../../../shared/period-filter";
import {app} from "../../../../../environments/environment";
import {extractPeriod} from "../../../../shared/util";
import {Constants, EVENT_LOG, EVENT_USER} from "../../../constants";
import {InstanceService} from "../../../../service/jquery/instance.service";
import {Location} from "@angular/common";
import {PageTitleService} from "../../../../service/page-title.service";
import {SessionEventService} from "../../../../service/session-event.service";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../../shared/material/custom-date-range-selection-strategy";

@Component({
    templateUrl: './search-main-event.view.html',
    styleUrls: ['./search-main-event.view.scss'],
    providers: [
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
        { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
    ]
})
export class SearchMainEventView {
    private readonly _router = inject(EnvRouter);
    private readonly _pageTitleService = inject(PageTitleService);
    private readonly _sessionEventService = inject(SessionEventService);
    private readonly _instanceService = inject(InstanceService);
    private readonly _activatedRoute = inject(ActivatedRoute);
    private readonly _location = inject(Location);
    readonly periodQuickRanges = PERIOD_QUICK_RANGES;
    serverNameIsLoading = true;
    nameDataList: any[];
    events: SessionEventDto[];
    isLoading = false;
    queryParams: Partial<QueryParams> = {};

    private readonly _baseFilters: { icon: string; label: string; color: string; value: any }[] = [
        {icon: EVENT_LOG['INFO'].icon, label: 'INFO', color: EVENT_LOG['INFO'].color, value: 'INFO'},
        {icon: EVENT_LOG['ERROR'].icon, label: 'ERROR', color: EVENT_LOG['ERROR'].color, value: 'ERROR'},
        {icon: EVENT_LOG['WARN'].icon, label: 'WARN', color: EVENT_LOG['WARN'].color, value: 'WARN'},
    ];

    private readonly _userFilters: { icon?: string; label: string; color: string; value: any }[] =
        Object.keys(EVENT_USER).map(type => ({label: EVENT_USER[type].label, color: EVENT_USER[type].color, value: type}));

    filters: { icon?: string; label: string; color: string; value: any }[] = [...this._baseFilters];

    tableConfig: TableProvider<SessionEventDto> = this.buildTableConfig();
    /** Critères de la requête de base, rejoués avec les colonnes lazy. */
    private _criteria: Record<string, any> = {};
    /** Colonnes lazy déjà demandées : la requête de base les inclut, pour que `data` les contienne. */
    private _lazyColumns: string[] = [];
    private readonly _logTypes = new Set(['INFO', 'WARN', 'ERROR']);
    private readonly _userTypes = new Set(Object.keys(EVENT_USER));

    private buildTableConfig(initialQuery?: string): TableProvider<SessionEventDto> {
        return {
            ...SESSION_EVENT_TABLE_CONFIG,
            lazyLoader: columns => this.loadLazyColumns(columns),
            search: initialQuery
                ? {...SESSION_EVENT_TABLE_CONFIG.search, initialQuery, searchColumns: ['exception']}
                : SESSION_EVENT_TABLE_CONFIG.search
        };
    }

    constructor() {
        this._activatedRoute.queryParams.subscribe({
            next: (params: Params) => {
                this._pageTitleService.set({
                    icon: this._activatedRoute.snapshot.data['isLogRoute'] ? Constants.MAPPING_TYPE['log'].icon : Constants.MAPPING_TYPE['user'].icon,
                    iconOutlined: true,
                    title: (Constants.MAPPING_TYPE['event'].title) + ' ',
                    subtitle: this._activatedRoute.snapshot.data['isLogRoute'] ? Constants.MAPPING_TYPE['log'].subtitle : Constants.MAPPING_TYPE['user'].subtitle,
                });
                const typeParam = params.type || params.rangestatus;
                const types = !typeParam ? [] : Array.isArray(typeParam) ? typeParam : [typeParam];
                const isLogRoute = this._activatedRoute.snapshot.data['isLogRoute'];
                this.filters = isLogRoute ? [...this._baseFilters] : [...this._userFilters];
                if (params.start && params.end) this.queryParams = new QueryParams(new IPeriod(new Date(params.start), new Date(params.end)), params.namespace || app.defaultNamespace, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server], null, null, types);
                if (!params.start && !params.end) {
                    let period;
                    if (params.step && params.from) {
                        period = new IStepFrom(Number(params.step), Number(params.from));
                    } else if (params.step) {
                        period = new IStep(Number(params.step));
                    }
                    this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), params.namespace || app.defaultNamespace, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server], null, null, types);
                }
                if (params.q) {
                    this.queryParams.optional = {q: params.q};
                    this.tableConfig = this.buildTableConfig(params.q);
                }
                this.patchTypeValue(this.queryParams.types);
                this.patchServerValue(this.queryParams.appname);
                this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

                this._instanceService.getApplications('SERVER', this.queryParams.namespace)
                    .pipe(finalize(() => this.serverNameIsLoading = false))
                    .subscribe({
                        next: res => {
                            this.nameDataList = res.map(r => r.appName);
                            this.patchServerValue(this.queryParams.appname);
                        }, error: (e) => {
                            console.log(e)
                        }
                    });
                this.getEvents();
                this._location.replaceState(`${this._router.url.split('?')[0]}?${this.queryParams.buildPath()}`);
            }
        });
    }


    getEvents() {
        this.isLoading = true;
        this.events = [];
        const isLogRoute = this._activatedRoute.snapshot.data['isLogRoute'];
        const params: any = {};
        if (this.queryParams.namespace) {
            params['instance.namespace'] = this.queryParams.namespace;
        }
        if (this.queryParams.appname && this.queryParams.appname.length > 0 && this.queryParams.appname[0] !== '') {
            params['instance.app_name'] = this.queryParams.appname;
        }
        if(isLogRoute) {
            params['type.in'] = Array.from(this._logTypes.values());
        } else {
            params['type.in'] = Array.from(this._userTypes.values());
        }
        if (this.queryParams.types && this.queryParams.types.length > 0) {
            params['type'] = this.queryParams.types;
        }
        if (this.queryParams.period?.start) {
            params['start.ge'] = this.queryParams.period.start.toISOString();
        }
        if (this.queryParams.period?.end) {
            params['start.lt'] = this.queryParams.period.end.toISOString();
        }
        this._criteria = params;
        this._sessionEventService.getSessionEvents(params, this._lazyColumns)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: d => {
                    if (!d) {
                        this.events = [];
                        return;
                    }
                    this.events = this.filterByRoute(d, isLogRoute);
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 413) {
                        this.tableConfig.labels.empty = error.error.message;
                    }
                }
            });
    }

    /** `/event/log` garde INFO/WARN/ERROR, `/event/user` garde les autres types. */
    private filterByRoute(rows: SessionEventDto[], isLogRoute: boolean): SessionEventDto[] {
        if(isLogRoute) {
            return rows.filter(e => this._logTypes.has(e.type));
        }
        return rows.filter(e => this._userTypes.has(e.type));
    }

    private loadLazyColumns(columns: string[]): Observable<SessionEventDto[]> {
        this._lazyColumns = [...columns];
        const isLogRoute = this._activatedRoute.snapshot.data['isLogRoute'];
        return this._sessionEventService.getSessionEvents(this._criteria, this._lazyColumns)
            .pipe(map(rows => this.filterByRoute(rows ?? [], isLogRoute)));
    }

    search() {
        if (this.serverFilterForm.valid) {
            if (!shallowEqual(this._activatedRoute.snapshot.queryParams, this.queryParams.buildParams())) {
                this._router.navigate([], {
                    relativeTo: this._activatedRoute,
                    queryParams: this.queryParams.buildParams()
                });
            } else {
                if (this.queryParams.period instanceof IStep) {
                    this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));
                }
                this.getEvents();
            }
        }
    }

    serverFilterForm = new FormGroup({
        appname: new FormControl([""]),
        type: new FormControl([]),
        dateRangePicker: new FormGroup({
            start: new FormControl<Date | null>(null, [Validators.required]),
            end: new FormControl<Date | null>(null, [Validators.required]),
        })
    });

    patchDateValue(start: Date, end: Date) {
        this.serverFilterForm.patchValue({
            dateRangePicker: {
                start: start,
                end: end
            }
        }, {emitEvent: false});
    }


    onChangeStart(event) {
        this.serverFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({onlySelf: true})
        let start = this.serverFilterForm.controls.dateRangePicker.controls.start.value;
        let end = this.serverFilterForm.controls.dateRangePicker.controls.end.value || null;
        this.queryParams.period = new IPeriod(start, end);
    }

    onChangeEnd(event) {
        this.serverFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({onlySelf: true})
        let start = this.serverFilterForm.controls.dateRangePicker.controls.start.value || null;
        let end = this.serverFilterForm.controls.dateRangePicker.controls.end.value;
        this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
    }

    onChangeServer($event) {
        this.queryParams.appname = this.serverFilterForm.controls.appname.value;
    }

    onChangeType($event) {
        this.queryParams.types = this.serverFilterForm.controls.type.value?.map((f: {
            icon: string,
            label: string,
            color: string,
            value: any
        }) => f.value);
    }

    isDefaultPeriod(): boolean {
        return isDefaultRelativePeriod(this.queryParams?.period);
    }

    resetPeriod(): void {
        const defaultPeriod = getDefaultRelativePeriod();
        this.queryParams.period = defaultPeriod;
        this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
    }

    applyQuickRange(range: PeriodQuickRange): void {
        let period;
        if (range === 'yesterday') {
            const dates = getQuickRangeDates(range);
            period = new IPeriod(dates.start, dates.end);
        } else {
            period = getQuickRangeStep(range);
        }
        this.queryParams.period = period;
        this.patchDateValue(period.start, toDisplayedPeriodEnd(period.end));
    }

    patchTypeValue(types: any[]): void {
        this.serverFilterForm.patchValue({
            type: this.filters.filter((f: any) => types.toString().includes(f.value))
        }, { emitEvent: false });
        this.queryParams.types = types;
    }

    patchServerValue(servers: any[]): void {
        this.serverFilterForm.patchValue({ appname: servers }, { emitEvent: false });
        this.queryParams.appname = servers;
    }


    selectedRequest(event: MouseEvent, row: SessionEventDto) {
        if (!row?.sessionId)
            return;
        this._sessionEventService.getMainSessionType(row.sessionId).subscribe({
            next: (res) => {
                const type = res?.type?.toLowerCase();
                this.navigateToSession(event, type, row.sessionId);
            },
            error: () => {
                this.navigateToSession(event, 'rest', row.sessionId);
            }
        });
    }

    private navigateToSession(event: MouseEvent, type: string, sessionId: string) {
        this._router.navigateOnClick(event, ['/session', type, sessionId], {
            queryParams: {...this.queryParams.period.buildParams(), namespace: this.queryParams.namespace }
        });
    }

}
