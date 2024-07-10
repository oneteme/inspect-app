import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { EnvRouter } from "../session-detail/session-detail.component";
import { StatsService } from "src/app/shared/services/stats.service";
import { ActivatedRoute, Params } from "@angular/router";
import { DatePipe, Location } from '@angular/common';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subscription, combineLatest, finalize, map } from "rxjs";
import { Constants, FilterConstants, FilterMap, FilterPreset } from "../constants";
import { application, makePeriod } from "src/environments/environment";
import { FilterService } from "src/app/shared/services/filter.service";
import { mapParams, formatters, periodManagement } from "src/app/shared/util";

@Component({
    templateUrl: './stats-user.component.html',
    styleUrls: ['./stats-user.component.scss']
})
export class StatsUserComponent implements OnInit, OnDestroy {
    constants = Constants;
    filterConstants = FilterConstants;

    private _activatedRoute = inject(ActivatedRoute);
    private _statsService = inject(StatsService);
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
                this.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6)).start;
                this.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
                this.patchDateValue(this.start,  new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`)
            }
        });

    }

    ngOnInit() {
        this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    init(): void {
        let advancedParams = this.advancedParams;
        if (advancedParams) {
            advancedParams = mapParams(this.filterConstants.STATS_APP, advancedParams);
        }
        this.requests = this.USER_REQUEST(this.name, this.env, this.start, this.end, advancedParams);
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

    // Stats en fonction du navigateur et du systeme
    USER_REQUEST = (name: string, env: string, start: Date, end: Date, advancedParams: FilterMap) => {
        let now = new Date();
        var groupedBy = periodManagement(start, end);
        return {
            repartitionTimeAndTypeResponse: { observable: this._statsService.getRestSession({ 'column': "count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,count_succes:countSucces,count_error_server:countErrorServer,count_error_client:countErrorClient", 'rest_session.instance_env': 'instance.id', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'instance.environement': env, 'instance.user': name,  ...advancedParams }) },
            repartitionTimeAndTypeResponseByPeriod: {
                observable: this._statsService.getRestSession({ 'column': `count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${groupedBy}:date,start.year:year`, 'rest_session.instance_env': 'instance.id', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'instance.user': name, 'instance.environement': env, 'order': `start.year.asc,start.${groupedBy}.asc`, ...advancedParams }).pipe(map(((r: any[]) => {
                    formatters[groupedBy](r, this._datePipe);
                    return r;
                })))
            },
            repartitionRequestByPeriodLine: { observable: this._statsService.getRestSession({ 'column': "count:count,count_error_server:countErrorServer,count_slowest:countSlowest,start.date:date", 'rest_session.instance_env': 'instance.id', 'start.ge': new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString(), 'start.lt': now.toISOString(), 'instance.environement': env, 'instance.user': name, 'order': 'start.date.asc', ...advancedParams }) },
            repartitionApiBar: { observable: this._statsService.getRestSession({ 'column': "count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,api_name", 'rest_session.instance_env': 'instance.id', 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'instance.environement': env, 'instance.user': name, 'api_name.not': 'null', 'order': 'count.desc', ...advancedParams }).pipe(map((d: any) => d.slice(0, 5))) },
            // exceptionsTable: { observable: this._statsService.getException({ 'column': 'count,err_type,err_msg', 'err.group': '', "status.ge": 500, "environement": env, 'user': name, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'order': 'count.desc', ...advancedParams })},
            sessionTable: { observable: this._statsService.getMainSession({ 'column': "name,start:date,elapsedtime,location,instance.app_name", 'main_session.instance_env': 'instance.id', 'instance.user': name, 'start.ge': start.toISOString(), 'start.lt': end.toISOString(), 'instance.environement': env, 'order': 'start.date.desc' }) }
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