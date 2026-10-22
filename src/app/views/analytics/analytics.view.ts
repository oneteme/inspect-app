import {Component, inject, OnDestroy} from "@angular/core";
import {SessionEventService} from "../../service/session-event.service";
import {combineLatest, distinctUntilChanged, filter, finalize, Observable, Subject, takeUntil} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {EnvRouter} from "../../service/router.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {PageEvent} from "@angular/material/paginator";
import {CustomDateAdapter} from "../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../shared/shared.module";
import {MainSessionService} from "../../service/jquery/main-session.service";
import {app} from "../../../environments/environment";
import {AnalyticDto} from "../../model/request.model";
import {PageTitleService} from '../../service/page-title.service';

@Component({
    templateUrl: './analytics.view.html',
    styleUrls: ['./analytics.view.scss'],
    providers: [
        {
            provide: DateAdapter, useClass: CustomDateAdapter
        },
        {
            provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS
        }
    ]
})
export class AnalyticsView implements OnDestroy {
    private readonly _sessionEventService = inject(SessionEventService);
    private readonly _activatedRoute = inject(ActivatedRoute);
    private readonly _router = inject(EnvRouter);
    private readonly _mainSessionService = inject(MainSessionService);
    private readonly _pageTitleService = inject(PageTitleService);
    private readonly $destroy = new Subject<void>();
    readonly filterForm = new FormGroup({
        user: new FormControl('', [Validators.required]),
        date: new FormControl(new Date(), [Validators.required])
    });

    $users: Observable<string[]>;

    sessions: AnalyticDto[] = [];
    private _allSessions: AnalyticDto[] = [];
    count: number = 0;
    totalSessions: number = 0;
    readonly pageSize: number =5;
    currentPage: number = 0;
    firstActivity: number | null = null;
    lastActivity: number | null = null;
    totalVisibleDuration: number = 0;
    totalSessionDuration: number = 0;
    presenceMeasuredSessions: number = 0;
    private readonly _visibleDurations = new Map<string, number>();
    private _analysisTimestamp: number = Date.now() / 1000;

    params: Partial<{namespace: string, user: string, date: Date, offset: number, limit: number}> = {};

    loading: boolean;

    constructor() {
        this.onRouteChange();
        this.onChangeForm();
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
        this._pageTitleService.clear();
    }

    getUserActions() {
        this.loading = true;

        this._sessionEventService.getUserActionsByUser(this.params.user, this.params.date)
            .pipe(takeUntil(this.$destroy), finalize(() => this.loading = false))
            .subscribe({
                next: result => {
                    this._allSessions = result.map(session => ({
                        ...session,
                        sessionEvents: [...(session.sessionEvents ?? [])]
                            .sort((first, second) => first.instant - second.instant)
                    }));
                    this.totalSessions = this._allSessions.length;
                    this.currentPage = 0;
                    this.updateDisplayedSessions();
                },
                error: () => {
                    this._allSessions = [];
                    this.sessions = [];
                    this.totalSessions = 0;
                }
            });
    }

    private updateDisplayedSessions(): void {
        const offset = this.currentPage * this.pageSize;
        this.params.offset = offset;
        this.sessions = this._allSessions.slice(offset, offset + this.pageSize);
        this.refreshAnalytics();
    }

    private refreshAnalytics(): void {
        this._analysisTimestamp = Date.now() / 1000;
        this.count = this.sessions.reduce(
                        (total, session) => total + (session.sessionEvents?.length ?? 0),
                        0
                    );
        const instants = this.sessions
            .flatMap(session => session.sessionEvents ?? [])
            .map(sessionEvent => sessionEvent.instant);

        this.firstActivity = instants.length ? Math.min(...instants) : null;
        this.lastActivity = instants.length ? Math.max(...instants) : null;
        this._visibleDurations.clear();
        this.totalSessionDuration = this.sessions.reduce(
            (total, session) => total + this.getSessionDuration(session),
            0
        );
        this.presenceMeasuredSessions = 0;
        this.totalVisibleDuration = this.sessions.reduce((total, session) => {
            const visibleDuration = this.calculateVisibleDuration(session);

            if (visibleDuration === null) {
                return total;
            }

            this._visibleDurations.set(session.id, visibleDuration);
            this.presenceMeasuredSessions++;
            return total + visibleDuration;
        }, 0);
    }

    getVisibleDuration(session: AnalyticDto): number {
        return this._visibleDurations.get(session.id) ?? 0;
    }

    hasPresenceMeasurement(session: AnalyticDto): boolean {
        return this._visibleDurations.has(session.id);
    }

    getPresencePercentage(session: AnalyticDto): number {
        const sessionDuration = this.getSessionDuration(session);

        if (!sessionDuration) {
            return 0;
        }

        return Math.min(100, Math.round((this.getVisibleDuration(session) / sessionDuration) * 100));
    }

    isSessionInProgress(session: AnalyticDto): boolean {
        const end = Number(session.end);
        return !Number.isFinite(end) || end < session.start;
    }

    getSessionEnd(session: AnalyticDto): number {
        return this.isSessionInProgress(session) ? this._analysisTimestamp : session.end;
    }

    getSessionDuration(session: AnalyticDto): number {
        return Math.max(0, this.getSessionEnd(session) - session.start);
    }

    formatElapsedDuration(durationInSeconds: number): string {
        const durationInMilliseconds = Math.max(0, Math.round(durationInSeconds * 1000));

        if (durationInMilliseconds < 1000) {
            return `${durationInMilliseconds} ms`;
        }

        if (durationInMilliseconds < 60000) {
            return `${(durationInMilliseconds / 1000).toFixed(1)} s`;
        }

        const minutes = Math.floor(durationInMilliseconds / 60000);
        const seconds = Math.floor((durationInMilliseconds % 60000) / 1000);
        return `${minutes} min ${seconds.toString().padStart(2, '0')} s`;
    }

    private calculateVisibleDuration(session: AnalyticDto): number | null {
        const visibilityEvents = (session.sessionEvents ?? []).filter(sessionEvent =>
            sessionEvent.type === 'DOC_VISIBLE' || sessionEvent.type === 'DOC_HIDDEN'
        );

        if (!visibilityEvents.length) {
            return null;
        }

        let visibleSince: number | null = null;
        let visibleDuration = 0;

        for (let index = 0; index < visibilityEvents.length; index++) {
            const sessionEvent = visibilityEvents[index];

            if (sessionEvent.type === 'DOC_VISIBLE' && visibleSince === null) {
                visibleSince = sessionEvent.instant;
            }

            if (sessionEvent.type === 'DOC_HIDDEN' && visibleSince !== null) {
                visibleDuration += Math.max(0, sessionEvent.instant - visibleSince);
                visibleSince = null;
            } else if (sessionEvent.type === 'DOC_HIDDEN' && index === 0) {
                visibleDuration += Math.max(0, sessionEvent.instant - session.start);
            }
        }

        if (visibleSince !== null) {
            visibleDuration += Math.max(0, this.getSessionEnd(session) - visibleSince);
        }

        return visibleDuration;
    }


    getUsers() {
        this.$users = this._mainSessionService.getUsersView({namespace: this.params.namespace, date: this.params.date});
    }

    onRouteChange() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.params.user = params.user;
                this._pageTitleService.set({
                    icon: 'web_traffic',
                    iconOutlined: true,
                    title: 'Parcours de l\'utilisateur ' + params.user
                });
                this.params.namespace = queryParams.namespace || app.defaultNamespace;
                this.params.date = new Date(queryParams.date);
                this.params.offset = 0;
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
            this._router.navigate(['/analytics', d.user], {
                queryParams: {date: d.date.toISOString(), env: this.params.namespace}
            });
        });
    }

    onClickSession(event: MouseEvent, session: AnalyticDto) {
        if (event.ctrlKey) {
            this._router.open(`#/session/view/` + session.id, '_blank')
        } else {
            this._router.navigate(['session', 'view', session.id]);
        }
    }

    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex;
        this.updateDisplayedSessions();
    }
}

