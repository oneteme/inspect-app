import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {MainSessionService} from "../../../service/jquery/main-session.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {combineLatest, finalize, map, Observable, of, Subscription, tap} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";
import {application, makePeriod} from "../../../../environments/environment";
import {formatters, periodManagement} from "../../../shared/util";
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {EnvRouter} from "../../../service/router.service";
import {DatePipe, Location} from "@angular/common";
import {Constants} from "../../constants";
import {RestRequestService} from "../../../service/jquery/rest-request.service";
import {countByFields, groupByField} from "../rest/statistic-rest.view";
import {ChartProvider} from "@oneteme/jquery-core";

@Component({
    templateUrl: './statistic-client.view.html',
    styleUrls: ['./statistic-client.view.scss']
})
export class StatisticClientView implements OnInit, OnDestroy {
    private _activatedRoute = inject(ActivatedRoute);
    private _instanceService = inject(InstanceService);
    private _mainSessionService = inject(MainSessionService);
    private _restRequestService = inject(RestRequestService);
    private _router = inject(EnvRouter);
    private _location = inject(Location);
    private _datePipe = inject(DatePipe);

    protected readonly constants = Constants;

    filterForm = new FormGroup({
       dateRangePicker: new FormGroup({
           start: new FormControl<Date>(null, Validators.required),
           end: new FormControl<Date>(null, Validators.required)
       })
    });
    requests: { [key: string]: { observable: Observable<Object>, data?: any, isLoading?: boolean } } = {};
    params: Partial<{name: string, env: string, start: Date, end: Date}> = {};
    subscriptions: Subscription[] = [];

    ngOnInit() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.params = {name: v.params.client_name, env: v.queryParams.env || application.default_env};
                this.params.start = v.queryParams.start ? new Date(v.queryParams.start) : (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6)).start;
                this.params.end = v.queryParams.end ? new Date(v.queryParams.end) : (application.dashboard.database.default_period || application.dashboard.default_period || makePeriod(6, 1)).end;
                this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`)
            }
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    init() {
        this.requests = this.REQUEST(this.params.name, this.params.env, this.params.start, this.params.end);
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

    search() {
        if (this.filterForm.valid) {
            let start = this.filterForm.getRawValue().dateRangePicker.start;
            let end = this.filterForm.getRawValue().dateRangePicker.end;
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
        this.filterForm.patchValue({
            dateRangePicker: {
                start: start,
                end: end
            }
        }, { emitEvent: false });
    }

    onClickRow(event: MouseEvent, row: any) {
        if (event.ctrlKey) {
            this._router.open(`#/dashboard/server/${row.name}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`, '_blank')
        } else {
            this._router.navigate(['/dashboard/server', row.name], {
                queryParamsHandling: 'preserve'
            });
        }
    }

    REQUEST = (name: string, env: string, start: Date, end: Date) => {
        let now = new Date();
        let groupedBy = periodManagement(start, end);
        return {
            countSessionByDate: {
                observable: this._mainSessionService.getCountSessionByDateAndUser({env: env, start: start, end: end, groupedBy: groupedBy, appName: name}).pipe(map(res => {
                    formatters[groupedBy](res, this._datePipe);
                    console.log(res)
                    let groupByDate = groupByField(res, "date");
                    return {
                        view: Object.keys(groupByDate).map(k => {
                            let count = groupByDate[k].reduce((acc, o) => {
                                acc += o['count'];
                                return acc;
                            }, 0);
                            return {date: k, count: count};
                        }),
                        user: Object.keys(groupByDate).map(k => ({date: k, count: groupByDate[k].length}))
                    };
                }))
            },
            countByPage: { observable: this._mainSessionService.getCountByPage({env: env, start: start, end: end, appName: name})},
            countInstanceByRe: { observable: this._instanceService.getCountByRe({env: env, start: start, end: end, appName: name}) },
            countRestRequestByDate: {
                observable: this._restRequestService.getCountByDate({env: env, start: start, end: end, appName: name, groupedBy: groupedBy}).pipe(map(res => {
                    formatters[groupedBy](res, this._datePipe);
                    let combiner = (args: any[], f: string)=> args.reduce((acc, o) => {
                        acc += o[f];
                        return acc;
                    }, 0);
                    return {
                        pie: [countByFields(res, combiner, ['countSucces', 'countErrorClient', 'countErrorServer', 'countUnavailableServer', 'elapsedTimeSlowest', 'elapsedTimeSlow', 'elapsedTimeMedium', 'elapsedTimeFast', 'elapsedTimeFastest'])],
                        bar: res
                    }
                }))
            },
            dependents: { observable: this._mainSessionService.getDependents({env: env, start: start, end: end, appName: name}) },
            exceptions: {
                observable: this._mainSessionService.getCountByException({env: env, start: start, end: end, appName: name}).pipe(map(res => {
                    return res.map(r => ({count: r.count, label: `${r.errorMessage ? r.errorMessage : '[Aucun message]'}`}))
                }))
            }
        };
    }

}