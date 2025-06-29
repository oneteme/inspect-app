import {Component, ElementRef, inject, OnDestroy, OnInit, Signal, signal, ViewChild} from "@angular/core";
import {combineLatest, finalize, forkJoin, Subject, Subscription, takeUntil} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {DatePipe, Location} from "@angular/common";
import {EnvRouter} from "../../service/router.service";
import {TraceService} from "../../service/trace.service";
import {InstanceMainSession, InstanceRestSession} from "../../model/trace.model";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";
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
    loading = signal(true);

    options: TimelineOptions = {
        margin: {
            item: {
                horizontal: -1
            }
        },
        verticalScroll: true,
        zoomKey: 'ctrlKey',
        maxHeight: 'calc(100vh - 56px - 48px - 1.5em)',
    };

    groups: DataGroup[];
    items: DataItem[];

    params: Partial<{env: string, app: string, date: Date}> = {};

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.params.app = params.app_name;
                this.params.env = queryParams.env;
                this.params.date = new Date(queryParams.date);
                this.groups = [];
                this.items = [];
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&date=${this.params.date.toISOString()}`);
            }
        });
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    getSession(start: Date, end: Date, fn: () => void) {
        this.$destroy.next();
        this.loading.set(true);
        forkJoin(
            [this._traceService.getRestSessionsForDump(this.params.env, this.params.app, start, end), this._traceService.getMainSessionsForDump(this.params.env, this.params.app, start, end)]
        )
            .pipe(takeUntil(this.$destroy), finalize(() =>  this.loading.set(false)))
            .subscribe({
                next: (sessions) => {
                    this.restSessions = sessions[0];
                    this.mainSessions = sessions[1];
                    fn();
                }
            });
    }

    getDataGroups(): DataGroup[] {
        let restGroups = this.restSessions.map(s => ({id: s.threadName, start: s.start}));
        let mainGroups = this.mainSessions.map(s => ({id: s.threadName, start: s.start}));
        return [...new Set([restGroups, mainGroups].flat().sort((a, b) => a.start - b.start).map(g => g.id))].map(g => ({id: g, content: g}));
    }

    getDataItems(): DataItem[] {
        return [this.restSessions.map(s => {
            let item: DataItem = {
                id: `${s.id}_rest`,
                group: s.threadName,
                start: s.start * 1000,
                end: s.end * 1000,
                title: `<span>${this.pipe.transform(new Date(s.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(s.end * 1000), 'HH:mm:ss.SSS')}</span>  (${this.durationPipe.transform({start: s.start, end: s.end})})<br><br>
<span><b>[${s.method}] ${s?.path ? s?.path : ''}<br></br>${s?.query ? '?' + s?.query : ''}</b></span>`,
                content: `[${s.method}] ${s?.path ? s?.path : ''}`,
                className: 'rest overflow'
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
                title: `<span>${this.pipe.transform(new Date(s.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(s.end * 1000), 'HH:mm:ss.SSS')}</span>  (${this.durationPipe.transform({start: s.start, end: s.end})})<br>
<span><b>[${s.type}] ${s?.name}</b></span>`,
                content: `[${s.type}] ${s?.name}`,
                className: 'rest overflow'
            };
            item.type = item.end > item.start ? 'range': 'point';
            if (s.exception?.message || s.exception?.type) {
                item.className += ' error';
            }
            return item;
        })].flat();
    }

    onTimelineCreate(timeline: Timeline) {
        this.getSession(
          new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() - 10, this.params.date.getSeconds()),
          new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() + 10, this.params.date.getSeconds()),
          () => {
              timeline.setOptions(
                {...this.options,
                    zoomMax: 1000 * 60 * 60,
                    start: new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() - 10, this.params.date.getSeconds()),
                    end: new Date(this.params.date.getFullYear(), this.params.date.getMonth(), this.params.date.getDate(), this.params.date.getHours(), this.params.date.getMinutes() + 10, this.params.date.getSeconds())
                });
              timeline.setGroups(this.getDataGroups());
              timeline.setItems(this.getDataItems());
          }
        );

        timeline.on('doubleClick', (props: any)=> {
            if(props.item) {
                let id = props.item.split('_')[0];
                let type_session = props.item.split('_')[1];
                let type_main = props.item.split('_')[2];
                type_session == 'main' ? this._router.open(`#/session/${type_session}/${type_main}/${id}`, '_blank') : this._router.open(`#/session/${type_session}/${id}`, '_blank');
            }
        });

        timeline.on('rangechanged', (props)=>{
            if(props.byUser) {
                this.getSession(
                  new Date(props.start.getTime()),
                  new Date(props.end.getTime()),
                  () => {
                      timeline.setGroups(this.getDataGroups());
                      timeline.setItems(this.getDataItems());
                  });
            }
        });
    }
}