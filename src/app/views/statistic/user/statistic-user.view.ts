import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {DatePipe, Location} from '@angular/common';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {BehaviorSubject, combineLatest, finalize, map, Observable, Subscription, tap} from "rxjs";
import {Constants, FilterConstants, FilterMap, FilterPreset} from "../../constants";
import {app, makeDatePeriod} from "src/environments/environment";
import {FilterService} from "src/app/service/filter.service";
import {countByFields, formatters, mapParams, periodManagement} from "src/app/shared/util";
import {EnvRouter} from "../../../service/router.service";
import {RestSessionService} from "../../../service/jquery/rest-session.service";
import {MainSessionService} from "../../../service/jquery/main-session.service";

@Component({
    templateUrl: './statistic-user.view.html',
    styleUrls: ['./statistic-user.view.scss']
})
export class StatisticUserView implements OnInit, OnDestroy {
    private _activatedRoute = inject(ActivatedRoute);
    private _restSessionService = inject(RestSessionService);
    private _mainSessionService = inject(MainSessionService);
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

    env: any;
    name: string;
    start: Date;
    end: Date;

    requests: { [key: string]: { observable: Observable<Object>, data?: any, isLoading?: boolean } } = {};

    constructor() {
        this.subscriptions.push(combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                this.name = v.params.user_name;
                this.env = v.queryParams.env || app.defaultEnv;
                this.start = v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(6).start;
                this.end = v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(6, 1).end;
                this.patchDateValue(this.start,  new Date(this.end.getFullYear(), this.end.getMonth(), this.end.getDate() - 1));
                this.init();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}&start=${this.start.toISOString()}&end=${this.end.toISOString()}`)
            }
        }));
    }

    ngOnInit() {
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(s => s.unsubscribe());
    }

    init(): void {
        this.requests = this.USER_REQUEST(this.name, this.env, this.start, this.end);
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
    USER_REQUEST = (name: string, env: string, start: Date, end: Date) => {
        let groupedBy = periodManagement(start, end);
        return {
            repartitionTimeAndTypeResponseByPeriod: {
                observable: this._restSessionService.getRepartitionTimeAndTypeResponseByPeriod({start: start, end: end, groupedBy: groupedBy, user: name, env: env}).pipe(map(r => {
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
                observable: this._restSessionService.getRepartitionRequestByPeriod({start: start, end: end, groupedBy: groupedBy, user: name, env: env}).pipe(tap(r => {
                    formatters[groupedBy](r, this._datePipe);
                }))
            },
            repartitionApiBar: { observable: this._restSessionService.getRepartitionApi({start: start, end: end, user: name, env: env}) },
            exceptionsTable: { observable: this._restSessionService.getExceptions({start: start, end: end, user: name, env: env})},
            sessionTable: { observable: this._mainSessionService.getInfos({start: start, end: end, user: name, env: env}) }
        };
    }


}