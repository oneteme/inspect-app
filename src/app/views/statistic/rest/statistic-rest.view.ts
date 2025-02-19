import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {DatePipe, Location} from '@angular/common';
import {ActivatedRoute, Params} from "@angular/router";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {
    BehaviorSubject,
    combineLatest,
    finalize,
    forkJoin,
    map,
    Observable,
    of,
    Subscription,
    switchMap,
    tap
} from "rxjs";
import {Constants, FilterConstants, FilterMap, FilterPreset} from "../../constants";
import {formatters, mapParams, periodManagement,} from "src/app/shared/util";
import {application, makeDatePeriod} from "src/environments/environment";
import {FilterService} from "src/app/service/filter.service";
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {RestSessionService} from "../../../service/jquery/rest-session.service";

@Component({
    templateUrl: './statistic-rest.view.html',
    styleUrls: ['./statistic-rest.view.scss']
})
export class StatisticRestView implements OnInit, OnDestroy {
    private _activatedRoute = inject(ActivatedRoute);
    private _restSessionService = inject(RestSessionService);
    private _instanceService = inject(InstanceService);
    private _router = inject(EnvRouter);
    private _location = inject(Location);
    private _datePipe = inject(DatePipe);
    private _filter = inject(FilterService);

    constants = Constants;
    filterConstants = FilterConstants;

    serverFilterForm = new FormGroup({
        dateRangePicker: new FormGroup({
            start: new FormControl<Date>(null, Validators.required),
            end: new FormControl<Date>(null, Validators.required)
        })
    });

    subscriptions: Subscription[] = [];
    advancedParams: Partial<{ [key: string]: any }> = {}
    params: Partial<{serverName: string, restName: string, env: string, start: Date, end: Date}> = {};
    focusFieldName: any;

    requests: { [key: string]: { observable: Observable<Object>, data?: any, isLoading?: boolean } } = {};

    constructor() {
        this.subscriptions.push(combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params.serverName = v.params.server_name;
                this.params.restName = v.params.rest_name;
                this.params.env = v.queryParams.env || application.default_env;
                this.params.start = v.queryParams.start  ? new Date(v.queryParams.start) : (application.dashboard.api.default_period || application.dashboard.default_period || makeDatePeriod(6)).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.api.default_period || application.dashboard.default_period || makeDatePeriod(6, 1)).end;
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`);
            }
        }));

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
            advancedParams = mapParams(this.filterConstants.STATS_API, advancedParams);
        }
        this.subscriptions.push(this.API_REQUEST(this.params.serverName, this.params.restName, this.params.env, this.params.start, this.params.end, advancedParams).subscribe({
            next: obs => {
                this.requests = obs;
                Object.keys(this.requests).forEach(k => {
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
        }));

    }


    search() {
        if (this.serverFilterForm.valid) {
            let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
            let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
            let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
            if (start.toISOString() != this.params.start.toISOString() || excludedEnd.toISOString() != this.params.end.toISOString()) {
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
            this._router.open(`#/dashboard/server/${row.appName}/rest/${row.name}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`, '_blank')
        } else {
            this._router.navigate(['/dashboard/server', row.appName, 'rest', row.name], {
                queryParamsHandling: 'preserve'
            });
        }
    }

    API_REQUEST = (serverName: string, restName: string, env: string, start: Date, end: Date, advancedParams: FilterMap) => {
        const groupedBy = periodManagement(start, end);
        return this._instanceService.getIds(env, end, serverName).pipe(map((data: {id: string}[]) => {
                    let ids = data.map(d => `"${d.id}"`).join(',');
                    return {
                        repartitionTimeAndTypeResponseByPeriod: {
                            observable: this._restSessionService.getRepartitionTimeAndTypeResponseByPeriod({start: start, end: end, groupedBy: groupedBy, advancedParams: advancedParams, ids: ids, apiName: restName}).pipe(map(r => {
                                formatters[groupedBy](r, this._datePipe);
                                let combiner = (args: any[], f: string)=> args.reduce((acc, o) => {
                                    acc += o[f];
                                    return acc;
                                }, 0);
                                return {
                                    pie: [countByFields(r, combiner, ['countSucces', 'countErrorClient', 'countErrorServer', 'countUnavailableServer', 'elapsedTimeSlowest', 'elapsedTimeSlow', 'elapsedTimeMedium', 'elapsedTimeFast', 'elapsedTimeFastest'])],
                                    bar: r
                                }
                            }))
                        },
                        repartitionRequestByPeriodLine: {
                            observable: this._restSessionService.getRepartitionRequestByPeriod({start: start, end: end, groupedBy: groupedBy, advancedParams: advancedParams, ids: ids, apiName: restName}).pipe(tap(r => {
                                formatters[groupedBy](r, this._datePipe);
                            }))
                        },
                        repartitionUser: { observable: this._restSessionService.getRepartitionUserByPeriod({start: start, end: end, groupedBy: groupedBy, advancedParams: advancedParams, ids: ids, apiName: restName}).pipe(map(r => {
                            formatters[groupedBy](r, this._datePipe);
                            let bar = Object.values(groupByField(r, "date")).flatMap(g=> {
                                let other = g.slice(6).reduce((acc, o)=> {
                                    if(acc) {
                                        acc = {count: o['count'], date: o['date'], year: o['year'], user: 'Autres'};
                                    } else {
                                        acc['count'] += o['count'];
                                    }
                                    return acc;
                                }, {});
                                return g.slice(6).length ? [g.slice(0,5), other].flat(): g.slice(0,5);
                            });
                            let groupByUser = groupByField(r, "user");
                            let pie = Object.keys(groupByUser).map(k => {
                                let count = groupByUser[k].reduce((acc, o) => {
                                    acc += o['count'];
                                    return acc;
                                }, 0);
                                return {user: k, count: count};
                            }).sort((a, b) => b.count - a.count).slice(0, 5);
                            return {
                                bar: bar,
                                pie: pie
                            };
                        }))},
                        dependenciesTable: { observable: this._restSessionService.getDependencies({start: start, end: end, advancedParams: advancedParams, ids: ids, apiName: restName}) },
                        dependentsTable: { observable: this._restSessionService.getDependents({start: start, end: end, advancedParams: advancedParams, ids: ids, apiName: restName}) },
                        exceptionsTable: {
                            observable: this._restSessionService.getExceptions({start: start, end: end, advancedParams: advancedParams, ids: ids, apiName: restName}).pipe(map(res => {
                                return res.slice(0, 5).map((r: {count: number, errorType: string}) => {
                                    const index = r?.errorType.lastIndexOf('.') + 1;
                                    return { count: r.count, label: r?.errorType?.substring(index) };
                                });
                            }))
                        }
                    }}))
    };


    resetFilters() {
        this.patchDateValue((application.dashboard.api.default_period || application.dashboard.default_period || makeDatePeriod(6)).start,
            (application.dashboard.api.default_period || application.dashboard.default_period || makeDatePeriod(6, 1)).end);
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
export declare type DataProvider<T> = (o: any, idx: number) => T;

export function groupByField(arr: any[], field: string): {[key: string]: any[]}{
    return arr.reduce((acc: {[key: string]: any[]}, o)=> {
        let key: string = o[field];
        (acc[key] = acc[key] || []).push(o);
        return acc;
    }, {});
}


export function countByFields<T>(arr: any[], combiner: (args: any[], o: string)=> T, fields: string[]): {[key: string]: T}{
    return fields.reduce((acc: {[key: string]: T}, o)=> {
        acc[o] = combiner(arr, o);
        return acc;
    }, {});
}