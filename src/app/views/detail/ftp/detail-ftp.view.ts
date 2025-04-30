import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {DataGroup, DataItem, TimelineOptions} from "vis-timeline";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../service/trace.service";
import {DatePipe} from "@angular/common";
import {combineLatest, finalize, forkJoin, map, Subject, takeUntil} from "rxjs";
import {app} from "../../../../environments/environment";
import {ExceptionInfo, FtpRequest, FtpRequestStage} from "../../../model/trace.model";
import {EnvRouter} from "../../../service/router.service";
import {getErrorClassName, Utils} from "../../../shared/util";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import {INFINITY} from "../../constants";

@Component({
    templateUrl: './detail-ftp.view.html',
    styleUrls: ['./detail-ftp.view.scss'],
})
export class DetailFtpView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _traceService: TraceService = inject(TraceService);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly pipe = new DatePipe('fr-FR');
    private readonly durationPipe = new DurationPipe();
    private readonly $destroy = new Subject<void>();

    private params: Partial<{idSession: string, idFtp: number, typeSession: string, typeMain: string, env: string}> = {};

    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    request: FtpRequest;
    exception: ExceptionInfo;
    isLoading: boolean;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.data,
            this._activatedRoute.queryParams
        ]).pipe(takeUntil(this.$destroy)).subscribe({
            next: ([params, data, queryParams]) => {
                this.params = {idSession: params.id_session, idFtp: params.id_ftp,
                    typeSession: data.type, typeMain: params.type_main, env: queryParams.env || app.defaultEnv};
                this.getRequest();
            }
        });
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    getRequest() {
        this.request = null;
        this.isLoading = true;
        forkJoin({
            request: this._traceService.getFtpRequests(this.params.idSession, this.params.idFtp).pipe(map(f => ({...f, duration: Utils.getElapsedTime(f.start, f.end)}))),
            stages: this._traceService.getFtpRequestStages(this.params.idSession, this.params.idFtp)
        }).pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: FtpRequest, stages: FtpRequestStage[]}) => {
                this.request = value.request;
                this.request.actions = value.stages;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        });
    }

    createTimeline() {
        let timelineStart = Math.trunc(this.request.start * 1000);
        let timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : INFINITY;
        let items = this.request.actions.map((a: FtpRequestStage, i:number) => {
            let start = Math.trunc(a.start * 1000);
            let end = a.end ? Math.trunc(a.end * 1000) : INFINITY;
            return {
                group: `${i}`,
                start: start,
                end: end,
                type:  end <= start ? 'point' : 'range',
                content: `${a?.args ? a.args.join(', ') : ''}`,
                className: `ftp overflow ${getErrorClassName(a)}`,
                title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end, 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})<br>
                        <span>${a?.args ? a.args.join('</br>') : ''}</span>`
            }

        });
        items.splice(0,0,{
            title: '',
            group:'parent',
            start: timelineStart,
            end: timelineEnd,
            content: (this.request.host || 'N/A'),
            className: "overflow",
            type:"background"
           })

        let groups:any[]= this.request.actions.map((a: FtpRequestStage, i:number) => ({ id: i, content: a?.name, treeLevel: 2}))
        groups.splice(0,0,{id:'parent', content: this.request.threadName,treeLevel: 1, nestedGroups:groups.map(g=>(g.id))})
        let padding = Math.ceil((timelineEnd - timelineStart)*0.01);
        this.dataItems = items;
        this.dataGroups = groups;
        this.options = {
            start: timelineStart - padding,
            end: timelineEnd + padding,
            selectable : false,
            clickToUse: true,
            tooltip: {
                followMouse: true
            }
        }
    }

    navigate(event: MouseEvent, targetType: string, extraParam?: string) {
        let params: any[] = [];
        switch (targetType) {
            case "parent":
                if(this.params.typeMain) params.push('session', this.params.typeSession, this.params.typeMain, this.params.idSession);
                else params.push('session', this.params.typeSession, this.params.idSession);
        }
        if (event.ctrlKey) {
            this._router.open(`#/${params.join('/')}`, '_blank')
        } else {
            this._router.navigate(params, {
                queryParams: {env: this.params.env}
            });
        }
    }
}