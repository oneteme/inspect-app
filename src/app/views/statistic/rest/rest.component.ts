import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { JQueryService } from "src/app/service/jquery.service";
import { DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Params } from "@angular/router";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subscription, combineLatest, filter, finalize, map } from "rxjs";
import { Constants, FilterConstants, FilterMap, FilterPreset } from "../../constants";
import { Utils, formatters, groupingBy, periodManagement, mapParams, } from "src/app/shared/util";
import { application, makePeriod } from "src/environments/environment";
import { FilterService } from "src/app/service/filter.service";
import {EnvRouter} from "../../../service/router.service";

@Component({
    templateUrl: './rest.component.html',
    styleUrls: ['./rest.component.scss']
})
export class RestComponent implements OnInit, OnDestroy {
    constants = Constants;
    filterConstants = FilterConstants;
    private _activatedRoute = inject(ActivatedRoute);
    private _statsService = inject(JQueryService);
    private _router = inject(EnvRouter);
    private _location = inject(Location);
    private _datePipe = inject(DatePipe);
    private _filter = inject(FilterService);

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    subscriptions: Subscription[] = [];

    env: any;
    name: string;
    start: Date;
    end: Date;
    advancedParams: Partial<{ [key: string]: any }> = {}
    focusFieldName: any;

    requests: { [key: string]: { observable: Observable<Object>, data?: any[], isLoading?: boolean } } = {};

    constructor() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.name = v.params.name;
                this.env = v.queryParams.env || application.default_env;
                this.start = v.queryParams.start  ? new Date(v.queryParams.start) : (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6)).start;
                this.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
                this.patchDateValue(this.start, new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`);
            }
        });

    }

    ngOnInit() {
        this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
    }

    ngOnDestroy(): void {
        this.unsubscribe();
    }


    init(): void {
        let advancedParams = this.advancedParams;
        if (advancedParams) {
            advancedParams = mapParams(this.filterConstants.STATS_API, advancedParams);
        }
        this.requests = this.API_REQUEST(this.name, this.env, this.start, this.end, advancedParams);
        Object.keys(this.requests).forEach(k => {
            this.requests[k].data = [];
            this.requests[k].isLoading = true;
            this.subscriptions.push(this.requests[k].observable
                .pipe(finalize(() => this.requests[k].isLoading = false))
                .subscribe({
                    next: (res: any) => {
                        this.requests[k].data = res;
                    }
                }));
        });
    }

    unsubscribe() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    search() {
        if (this.serverFilterForm.valid) {
            let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
            let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
            let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
            if (start.toISOString() != this.start.toISOString() || excludedEnd.toISOString() != this.end.toISOString()) {
                this._router.navigate([], {
                    relativeTo: this._activatedRoute,
                    queryParamsHandling: 'merge',
                    queryParams: { start: start.toISOString(), end: excludedEnd.toISOString() }
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

    onClickRow(event: MouseEvent, row: any) {
        if (event.ctrlKey) {
            this._router.open(`#/statistic/rest/${row.name}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`, '_blank')
        } else {
            this._router.navigate(['/statistic/rest', row.name], {
                queryParamsHandling: 'preserve'
            });
        }
    }

    API_REQUEST = (name: string, env: string, start: Date, end: Date, advancedParams: FilterMap) => {
        let now = new Date();
        const groupedBy = periodManagement(start, end);
        return {
            infos: { observable: this._statsService.getRestSession({ 'column.distinct': 'instance.app_name:app', 'instance_env': 'instance.id', 'api_name': name, "instance.environement": env, 'start.ge': start.toISOString(), 'start.lt': end.toISOString() }) },
            repartitionTimeAndTypeResponse: { observable: this._statsService.getRestSession({ 'column': "count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,count_succes:countSucces,count_error_server:countErrorServer,count_error_client:countErrorClient", 'rest_session.instance_env': 'instance.id', 'api_name': name, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'instance.environement': env, ...advancedParams }) },
            repartitionTimeAndTypeResponseByPeriod: {
                observable: this._statsService.getRestSession({ 'column': `count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,rest_session.start.${groupedBy}:date,rest_session.start.year:year`, 'rest_session.instance_env': 'instance.id', 'api_name': name, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'instance.environement': env, 'order': `rest_session.start.year.asc,rest_session.start.${groupedBy}.asc`, ...advancedParams }).pipe(map((r: any[]) => {
                    formatters[groupedBy](r, this._datePipe);
                    return r;
                }))
            },
            repartitionRequestByPeriodLine: { observable: this._statsService.getRestSession({ 'column': `count:count,count_error_server:countErrorServer,count_slowest:countSlowest,rest_session.start.date:date`, 'rest_session.instance_env': 'instance.id', 'api_name': name, 'rest_session.start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'rest_session.start.lt': now.toISOString(), 'instance.environement': env, 'order': 'rest_session.start.date.asc', ...advancedParams }) }, // 7 derniers jours
            repartitionUserPolar: { observable: this._statsService.getRestSession({ 'column': "count:count,instance.user:user", 'rest_session.instance_env': 'instance.id', 'api_name': name, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'instance.environement': env, 'instance.user.not': 'null', 'order': 'count.desc', ...advancedParams }).pipe(map((r: any[]) => r.slice(0, 5))) },
            repartitionUserBar: {
                observable: this._statsService.getRestSession({ 'column': `count:count,rest_session.start.${groupedBy}:date,rest_session.start.year:year,instance.user:user`, 'rest_session.instance_env': 'instance.id', 'api_name': name, 'rest_session.start.ge': start.toISOString(), 'rest_session.start.lt': end.toISOString(), 'instance.environement': env, 'instance.user.not': 'null', 'order': `rest_session.start.year.asc,rest_session.start.${groupedBy}.asc`, ...advancedParams }).pipe(map((r: any[]) => {
                    let groupBy = groupingBy(r, 'user');
                    let results: { count: number, user: string, date: any, year: any }[] = Object.entries(groupBy).map((value: [string, any[]]) => {
                        return {
                            totalCount: value[1].reduce((acc: number, o) => {
                                return acc + o['count'];
                            }, 0),
                            user: value[0],
                            data: value[1]
                        }
                    }).sort((a, b) => {
                        return b.totalCount - a.totalCount
                    }).slice(0, 5).flatMap(r => r.data);
                    return results;
                }),
                    map((r: any[]) => {
                        formatters[groupedBy](r, this._datePipe);
                        return r;
                    }))
            },
            dependenciesTable: { observable: this._statsService.getRestSession({ 'column': "count:count,count_succes:countSucces,count_error_client:countErrClient,count_error_server:countErrServer,api_name:name", 'instance_env': 'instance.id', "id": "rest_request.parent", "rest_request.remote": "rest_session_join.id", 'rest_session_join.api_name': name, 'rest_session_join.start.ge': start.toISOString(), 'rest_session_join.start.lt': end.toISOString(), 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'instance.environement': env, 'api_name.not': 'null', 'order': 'count.desc', ...advancedParams }) },
            dependentsTable: { observable: this._statsService.getRestSession({ 'column': "count:count,count_succes:countSucces,count_error_client:countErrClient,count_error_server:countErrServer,rest_session_join.api_name:name", 'instance_env': 'instance.id', "id": "rest_request.parent", "rest_request.remote": "rest_session_join.id", 'api_name': name, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'rest_session_join.start.ge': start.toISOString(), 'rest_session_join.start.lt': end.toISOString(), 'instance.environement': env, 'rest_session_join.api_name.not': 'null', 'order': 'count.desc', ...advancedParams }) },
            exceptionsTable: { observable: this._statsService.getRestSession({ 'column': 'count,err_type,err_msg', 'instance_env': 'instance.id', 'err.group': '', "status.ge": 500, "instance.environement": env, "api_name": name, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'count.desc', ...advancedParams })}
        };
    }

    resetFilters() {
        this.patchDateValue((application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6)).start,
            (application.dashboard.api.default_period || application.dashboard.default_period || makePeriod(6, 1)).end);
        this.advancedParams = {};
        this._filter.setFilterMap({})
    }


    filtersSupplier(): BehaviorSubject<FilterMap> { //change
        return new BehaviorSubject<FilterMap>({});
    }

    handlePresetSelection(filterPreset: FilterPreset) {

        const formControlNamelist = Object.keys(this.serverFilterForm.controls);
        Object.entries(filterPreset.values).reduce((accumulator: any, [key, value]) => {

            if (formControlNamelist.includes(key)) {
                this.serverFilterForm.patchValue({
                    [key]: value
                })
                delete filterPreset.values[key];
            }
        }, {})
        this.advancedParams = filterPreset.values
        this._filter.setFilterMap(this.advancedParams);
        this.search()
    }

    handlePresetSelectionReset() {
        this.resetFilters();
        this.search();
    }

    handleFilterReset() {
        this.resetFilters();
    }

    focusField(fieldName: string) {
        this.focusFieldName = [fieldName];
    }

    handledialogclose(filterMap: FilterMap) {
        this.advancedParams = filterMap;
        this._filter.setFilterMap(this.advancedParams);
        this.search()
    }

    handleRemovedFilter(filterName: string) {
        if (this.advancedParams[filterName]) {
            delete this.advancedParams[filterName];
            this._filter.setFilterMap(this.advancedParams);
        }
    }
}