import {Component, inject} from '@angular/core';
import {finalize} from 'rxjs';
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
import {Constants, STATUS} from "../../../constants";
import {InstanceService} from "../../../../service/jquery/instance.service";
import {Location} from "@angular/common";
import {PageTitleService} from "../../../../service/page-title.service";
import {SessionEventService} from "../../../../service/session-event.service";

@Component({
    templateUrl: './search-main-event.view.html',
    styleUrls: ['./search-main-event.view.scss']
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
        { icon: STATUS['5xx'].icon, label: 'ERROR', color: STATUS['5xx'].color, value: 'ERROR' },
        { icon: STATUS['4xx'].icon, label: 'WARN', color: STATUS['4xx'].color, value: 'WARN' }
    ];

    filters: { icon: string; label: string; color: string; value: any }[] = [...this._baseFilters];

    tableConfig: TableProvider<SessionEventDto> = this.buildTableConfig();

    private buildTableConfig(initialQuery?: string): TableProvider<SessionEventDto> {
        return {
            ...SESSION_EVENT_TABLE_CONFIG,
            search: initialQuery
                ? { ...SESSION_EVENT_TABLE_CONFIG.search, initialQuery, searchColumns: ['exception'] }
                : SESSION_EVENT_TABLE_CONFIG.search,
            onRowSelected: (row, event) => this.selectedRequest(event, row)
        };
    }

    constructor() {
        this._activatedRoute.queryParams.subscribe({
            next: (params: Params) => {
                this._pageTitleService.set({
                    icon: Constants.MAPPING_TYPE['event'].icon,
                    iconOutlined: true,
                    title: (Constants.MAPPING_TYPE['event'].title) + ' ',
                });
                const typeParam = params.type || params.rangestatus;
                const types = !typeParam ? [] : Array.isArray(typeParam) ? typeParam : [typeParam];
                if(params.start && params.end) this.queryParams = new QueryParams(new IPeriod(new Date(params.start), new Date(params.end)), params.namespace ||  app.defaultNamespace, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server], null, null, null, null, types);
                if(!params.start && !params.end)  {
                    let period;
                    if(params.step && params.from){
                        period = new IStepFrom(Number(params.step), Number(params.from));
                    } else if(params.step){
                        period = new IStep(Number(params.step));
                    }
                    this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), params.namespace || app.defaultNamespace, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server], null, null, null, null, types);
                }
                if (params.q) {
                    this.queryParams.optional = { q: params.q };
                    this.tableConfig = this.buildTableConfig(params.q);
                }
                this.patchTypeValue(this.queryParams.types);
                this.patchServerValue(this.queryParams.appname);
                this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

                this._instanceService.getApplications('SERVER', this.queryParams.namespace)
                    .pipe(finalize(()=> this.serverNameIsLoading = false))
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
        const params: any = {};
        if (this.queryParams.namespace) {
            params['instance.namespace'] = this.queryParams.namespace;
        }
        if (this.queryParams.appname && this.queryParams.appname.length > 0 && this.queryParams.appname[0] !== '') {
            params['instance.app_name'] = this.queryParams.appname;
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
        const isLogRoute = this._activatedRoute.snapshot.data['isLogRoute'];

        this._sessionEventService.getSessionEvents(params)
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
                next: d => {

                    const logTypes = new Set(['WARN', 'ERROR']);
                    if (!d) {
                        this.events = [];
                        return;
                    }
                    if (isLogRoute) {
                        this.events = d.filter(event => logTypes.has(event.type));
                    } else {
                        this.events = d.filter(e => !logTypes.has(e.type));
                        this.filters = [...new Set(this.events.map(e => e.type))].map(type => ({
                            icon: STATUS['-1'].icon, label: type, color: STATUS['-1'].color, value: type
                        }));
                    }
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === 413) {
                        this.tableConfig.labels.empty = error.error.message;
                    }
                }
            });
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

    isDefaultPeriod(): boolean {
        return isDefaultRelativePeriod(this.queryParams?.period);
    }

    resetPeriod(): void {
        const defaultPeriod = getDefaultRelativePeriod();
        this.queryParams.period = defaultPeriod;
        this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
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
        if (row && row.sessionId) {
            //TODO: change REST and get the real value with sessionId
            const sessionType = (row as any).sessionType?.toLowerCase() || 'rest';

            this._router.navigateOnClick(event, ['/session', sessionType, row.sessionId], {
                queryParams: { namespace: this.queryParams.namespace }
            });
        }
    }

}
