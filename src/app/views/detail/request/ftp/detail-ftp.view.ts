import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {DataGroup, DataItem, TimelineOptions} from "vis-timeline";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {DatePipe} from "@angular/common";
import {catchError, combineLatest, finalize, forkJoin, map, of, Subject, takeUntil} from "rxjs";
import {app} from "../../../../../environments/environment";
import {EnvRouter} from "../../../../service/router.service";
import {getErrorClassName, Utils} from "../../../../shared/util";
import {DurationPipe} from "../../../../shared/pipe/duration.pipe";
import {Constants, INFINITY} from "../../../constants";
import {ExceptionInfo, FtpRequest, FtpRequestStage} from "../../../../model/trace.model";
import {RequestType} from "../../../../model/request.model";

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

    private params: Partial<{idFtp: string, env: string}> = {};
    REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;
    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    request: FtpRequest;
    stages: FtpRequestStage[];
    exception: ExceptionInfo;
    isLoading: boolean;

    sessionParent: { id: string, type: string };
    parentLoading: boolean = false;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.params = {idFtp: params.id_request, env: queryParams.env || app.defaultEnv};
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
        this.parentLoading = true;
        this.sessionParent = null;

        this._traceService.getSessionParent(RequestType.FTP, this.params.idFtp).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent = d);
        forkJoin({
            request: this._traceService.getFtpRequest(this.params.idFtp).pipe(map(f => ({...f, duration: Utils.getElapsedTime(f.start, f.end)}))),
            stages: this._traceService.getFtpRequestStages(this.params.idFtp)
        }).pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: FtpRequest, stages: FtpRequestStage[]}) => {
                this.request = value.request;
                this.stages = value.stages;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        });
    }

    createTimeline() {
        let timelineStart = Math.trunc(this.request.start * 1000);
        let timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : timelineStart + 3600000;
        let items = this.stages.map((a: FtpRequestStage, i:number) => {
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

        let groups:any[]= this.stages.map((a: FtpRequestStage, i:number) => ({ id: i, content: a?.name, treeLevel: 2}))
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
                params.push('session', this.sessionParent.type.toLowerCase(), this.sessionParent.id);
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