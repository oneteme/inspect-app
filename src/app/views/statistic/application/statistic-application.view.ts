import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {DatePipe, Location} from '@angular/common';
import {ActivatedRoute, Params} from "@angular/router";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {BehaviorSubject, combineLatest, finalize, forkJoin, map, Observable, of, Subscription, switchMap} from "rxjs";
import {Constants, FilterConstants, FilterMap, FilterPreset} from "../../constants";
import {formatters, mapParams, periodManagement} from "src/app/shared/util";
import {application, makePeriod} from "src/environments/environment";
import {FilterService} from "src/app/service/filter.service";
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {RestSessionService} from "../../../service/jquery/rest-session.service";
import {countByFields, groupByField} from "../rest/statistic-rest.view";
import {MainSessionService} from "../../../service/jquery/main-session.service";

@Component({
    templateUrl: './statistic-application.view.html',
    styleUrls: ['./statistic-application.view.scss']
})
export class StatisticApplicationView implements OnInit, OnDestroy {
    private _activatedRoute = inject(ActivatedRoute);
    private _restSessionService = inject(RestSessionService);
    private _mainSessionService = inject(MainSessionService);
    private _instanceService = inject(InstanceService);
    private _router = inject(EnvRouter);
    private _location = inject(Location);
    private _datePipe = inject(DatePipe);
    private _filter = inject(FilterService);

    constants = Constants
    filterConstants = FilterConstants;

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

    requests: { [key: string]: { observable: Observable<Object>, data?: any, isLoading?: boolean } } = {};

    constructor() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.name = v.params.server_name;
                this.env = v.queryParams.env || application.default_env;
                this.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.app.default_period || application.dashboard.default_period || makePeriod(6)).start;
                this.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.app.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
                this.patchDateValue(this.start, new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate() - 1));
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
        let advancedParams = this.advancedParams
        if (advancedParams) {
            advancedParams = mapParams(this.filterConstants.STATS_APP, advancedParams);
        }
        this.APP_REQUEST(this.name, this.env, this.start, this.end, advancedParams).subscribe({
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

    onClickRow(event: MouseEvent, row: any) {
        if (event.ctrlKey) {
            this._router.open(`#/dashboard/server/${row.name}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`, '_blank')
        } else {
            this._router.navigate(['/dashboard/server', row.name], {
                queryParamsHandling: 'preserve'
            });
        }
    }

    APP_REQUEST = (name: string, env: string, start: Date, end: Date, advancedParams: FilterMap) => {
        let now = new Date();
        let groupedBy = periodManagement(start, end);
        return this._instanceService.getIds(env, end, name).pipe(map(data => {
            let ids = data.map(d => `"${d.id}"`).join(',');
            return {
                repartitionTimeAndTypeResponseByPeriod: {
                    observable: this._restSessionService.getRepartitionTimeAndTypeResponseByPeriod({start: start, end: end, groupedBy: groupedBy, advancedParams: advancedParams, ids: ids}).pipe(map(r => {
                            formatters[groupedBy](r, this._datePipe);
                            let combiner = (args: any[], f: string)=> args.reduce((acc, o) => {
                                acc += o[f];
                                return acc;
                            }, 0);
                            return {
                                pie: [countByFields(r, combiner, ['countSucces', 'countErrorClient', 'countErrorServer', 'elapsedTimeSlowest', 'elapsedTimeSlow', 'elapsedTimeMedium', 'elapsedTimeFast', 'elapsedTimeFastest'])],
                                bar: r
                            }
                    }))
                },
                repartitionRequestByPeriodLine: { observable: this._restSessionService.getRepartitionRequestByPeriod({now: now, advancedParams: advancedParams, ids: ids}) },
                repartitionUser: { observable:
                    this._restSessionService.getRepartitionUserByPeriod({start: start, end: end, groupedBy: groupedBy, advancedParams: advancedParams, ids: ids})
                        .pipe(map(r => {
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
                        }))
                },
                repartitionApiBar: { observable: this._restSessionService.getRepartitionApi({start: start, end: end, advancedParams: advancedParams, ids: ids}) },
                dependenciesTable: { observable: forkJoin({
                        restSession : this._restSessionService.getDependencies({start: start, end: end, advancedParams: advancedParams, ids: ids}),
                        mainSession : this._mainSessionService.getDependencies({start: start, end: end, advancedParams: advancedParams, ids: ids})
                    }).pipe(map(res => {
                        console.log("test", [res.restSession, res.mainSession.map(res => ({count: res.count, countSucces: 0, countErrClient: 0, countErrServer: 0, name: res.name}))].flat())
                        return [res.restSession, res.mainSession].flat().sort((a, b) => b.count - a.count);
                    })) },
                dependentsTable: { observable: this._restSessionService.getDependents({start: start, end: end, advancedParams: advancedParams, ids: ids}) },
                exceptionsTable: { observable: this._restSessionService.getExceptions({start: start, end: end, advancedParams: advancedParams, ids: ids})}
            }
        }));
    };

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