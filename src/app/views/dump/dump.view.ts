import {Component, ElementRef, inject, OnDestroy, OnInit, Signal, signal, ViewChild} from "@angular/core";
import {combineLatest, finalize, forkJoin, Subject, Subscription, takeUntil} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {DatePipe, Location} from "@angular/common";
import {EnvRouter} from "../../service/router.service";
import {TraceService} from "../../service/trace.service";
import {InstanceMainSession, InstanceRestSession} from "../../model/trace.model";
import {DataGroup, DataItem, Timeline} from "vis-timeline";
import {DurationPipe} from "../../shared/pipe/duration.pipe";
import {sign} from "node:crypto";

@Component({
    templateUrl: './dump.view.html',
    styleUrls: ['./dump.view.scss'],
})
export class DumpView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly _location: Location = inject(Location);
    private readonly _traceService: TraceService = inject(TraceService);

    private readonly pipe = new DatePipe('fr-FR');
    private readonly durationPipe = new DurationPipe();
    private readonly $destroy = new Subject<void>();

    restSessions: Array<InstanceRestSession> = [];
    mainSessions: Array<InstanceMainSession> = [];
    loading = signal(false);
    zoomableIn = signal(false);
    groups: DataGroup[];
    items: DataItem[];

    params: Partial<{env: string, app: string, date: Date, step: number}> = {};

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).pipe(takeUntil(this.$destroy)).subscribe({
            next: ([params, queryParams]) => {
                this.params.app = params.app_name;
                this.params.env = queryParams.env;
                this.params.date = new Date(queryParams.date);
                this.params.step = Number.parseInt(queryParams.step) || 10;
                this.getSession();
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&date=${this.params.date.toISOString()}&step=${this.params.step}`);
            }
        });
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    getSession() {
        this.$destroy.next();
        this.loading.set(true);
        this.zoomableIn.set(this.params.step != 1);
        let start = new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() - this.params.step, this.params.date.getSeconds());
        let end = new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() + this.params.step, this.params.date.getSeconds());
        forkJoin(
            [this._traceService.getRestSessionsForDump(this.params.env, this.params.app, start, end), this._traceService.getMainSessionsForDump(this.params.env, this.params.app, start, end)]
        )
            .pipe(takeUntil(this.$destroy), finalize(() =>  {}))
            .subscribe({
                next: (sessions) => {
                    this.restSessions = sessions[0];
                    this.mainSessions = sessions[1];
                    this.initTimeline();
                }
            });
    }

    initTimeline() {
        let restGroups = this.restSessions.map(s => ({id: s.threadName, start: s.start}));
        let mainGroups = this.mainSessions.map(s => ({id: s.threadName, start: s.start}));
        this.groups = [...new Set([restGroups, mainGroups].flat().sort((a, b) => a.start - b.start).map(g => g.id))].map(g => ({id: g, content: g}));
        this.items = [this.restSessions.map(s => {
            let item: DataItem = {
                id: `${s.id}_rest`,
                group: s.threadName,
                start: s.start * 1000,
                end: s.end * 1000,
                title: `<span>${this.pipe.transform(new Date(s.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(s.end * 1000), 'HH:mm:ss.SSS')}</span>  (${this.durationPipe.transform({start: s.start, end: s.end})})<br>`,
                content: `[${s.method}] ${s?.path ? s?.path : ''}${s?.query ? '?' + s?.query : ''}`,
                className: 'rest'
            };
            item.type = item.end > item.start ? 'range': 'point';
            if (s.exception?.message || s.exception?.type) {
                item.className += ' error';
            }
            return item;
        }), this.mainSessions.map(s => {
            let item: DataItem = {
                id: `${s.id}_main_${s.type.toLowerCase()}`,
                group: s.threadName,
                start: s.start * 1000,
                end: s.end * 1000,
                title: `<span>${this.pipe.transform(new Date(s.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(s.end * 1000), 'HH:mm:ss.SSS')}</span>  (${this.durationPipe.transform({start: s.start, end: s.end})})<br>`,
                content: `[${s.type}] ${s?.name}`,
                className: 'rest'
            };
            item.type = item.end > item.start ? 'range': 'point';
            if (s.exception?.message || s.exception?.type) {
                item.className += ' error';
            }
            return item;
        })].flat();
        this.loading.set(false)
    }

    zoomOut() {
        let step = this.params.step + 1;
        this._router.navigate([], {
            relativeTo: this._activatedRoute,
            queryParamsHandling: 'merge',
            queryParams: { step:  step }
        })
    }

    zoomIn() {
        let step = this.params.step - 1;
        this._router.navigate([], {
            relativeTo: this._activatedRoute,
            queryParamsHandling: 'merge',
            queryParams: { step:  step }
        })
    }

    previous() {
        let date = new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() - this.params.step, this.params.date.getSeconds());
        this._router.navigate([], {
            relativeTo: this._activatedRoute,
            queryParamsHandling: 'merge',
            queryParams: { date:  date }
        })
    }

    next() {
        let date = new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() + this.params.step, this.params.date.getSeconds());
        this._router.navigate([], {
            relativeTo: this._activatedRoute,
            queryParamsHandling: 'merge',
            queryParams: { date:  date }
        })
    }
}