import {Component, inject, OnDestroy} from "@angular/core";
import {AnalyticService} from "../../service/analytic.service";
import {MainSession, UserAction} from "../../model/trace.model";
import {combineLatest, distinctUntilChanged, filter, Observable, Subject, takeUntil} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {EnvRouter} from "../../service/router.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../shared/shared.module";
import {MainSessionService} from "../../service/jquery/main-session.service";
import {ANALYTIC_MAPPING} from "../constants";
import {app} from "../../../environments/environment";

@Component({
    templateUrl: './analytic.view.html',
    styleUrls: ['./analytic.view.scss'],
    providers: [
        {
            provide: DateAdapter, useClass: CustomDateAdapter
        },
        {
            provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS
        }
    ]
})
export class AnalyticView implements OnDestroy {
    private readonly _analyticService = inject(AnalyticService);
    private readonly _activatedRoute = inject(ActivatedRoute);
    private readonly _router = inject(EnvRouter);
    private readonly _mainSessionService = inject(MainSessionService);
    private readonly $destroy = new Subject<void>();
    protected readonly ANALYTIC_MAPPING = ANALYTIC_MAPPING;

    readonly filterForm = new FormGroup({
        user: new FormControl('', [Validators.required]),
        date: new FormControl(new Date(), [Validators.required])
    });

    $users: Observable<string[]>;

    sessions: MainSession[] = [];
    count: number = 0;

    params: Partial<{env: string, user: string, date: Date, offset: number, limit: number}> = {};

    constructor() {
        this.onRouteChange();
        this.onChangeForm();
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    getUserActions() {
        this._analyticService.getUserActionsByUser(this.params.user, this.params.date, this.params.offset, this.params.limit)
            .pipe(takeUntil(this.$destroy))
            .subscribe({
                next: result => {
                    this.sessions = result;
                    this.count = this.sessions.flatMap(s => s.userActions).length;
                }
            });
    }

    getUsers() {
        this.$users = this._mainSessionService.getUsersView({env: this.params.env, date: this.params.date});
    }

    onRouteChange() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).pipe(takeUntil(this.$destroy)).subscribe({
            next: ([params, queryParams]) => {
                this.params.user = params.user;
                this.params.env = queryParams.env || app.defaultEnv;
                this.params.date = new Date(queryParams.date);
                this.params.offset = 0;
                this.params.limit = 10;
                this.filterForm.patchValue({
                    date: this.params.date,
                    user: this.params.user
                });
                this.getUserActions();
                this.getUsers();
            }
        });
    }

    onChangeForm() {
        this.filterForm.valueChanges.pipe(
            filter(d => d.user != null && d.date != null),
            distinctUntilChanged((prev, curr) => {
                return (
                    prev.user === curr.user &&
                    prev.date.getTime() === curr.date.getTime()
                );
            })
        ).subscribe(d => {
            console.log(d);
            this._router.navigate(['/analytic-poc', d.user], {
                queryParams: {date: d.date.toISOString(), env: this.params.env}
            });
        });
    }

    onClickSession(event: MouseEvent, session: MainSession) {
        if (event.ctrlKey) {
            this._router.open(`#/session/main/view/` + session.id, '_blank')
        } else {
            this._router.navigate(['session', 'main', 'view', session.id]);
        }
    }

    loadMore() {
        this.params.limit += 10;
        this.getUserActions();
    }

    loadLess() {
        this.params.limit = Math.max(10, this.params.limit - 10);
        this.getUserActions();
    }
}