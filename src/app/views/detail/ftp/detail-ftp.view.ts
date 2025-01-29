import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {DataItem, Timeline} from "vis-timeline";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../service/trace.service";
import {DatePipe} from "@angular/common";
import {combineLatest, finalize, forkJoin, map, Subscription} from "rxjs";
import {application} from "../../../../environments/environment";
import {ExceptionInfo, FtpRequest, FtpRequestStage} from "../../../model/trace.model";
import {EnvRouter} from "../../../service/router.service";
import {Utils} from "../../../shared/util";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";

@Component({
    templateUrl: './detail-ftp.view.html',
    styleUrls: ['./detail-ftp.view.scss'],
})
export class DetailFtpView implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);

    private timeLine: Timeline;
    private subscription: Subscription[] = [];
    private params: Partial<{idSession: string, idFtp: number, typeSession: string, typeMain: string, env: string}> = {};
    private pipe = new DatePipe('fr-FR');
    private durationPipe = new DurationPipe();

    request: FtpRequest;
    exception: ExceptionInfo;
    isLoading: boolean;

    @ViewChild('timeline') timelineContainer: ElementRef;

    ngOnInit() {
        this.subscription.push(combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.data,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, data, queryParams]) => {
                this.params = {idSession: params.id_session, idFtp: params.id_ftp,
                    typeSession: data.type, typeMain: params.type_main, env: queryParams.env || application.default_env};
                this.getRequest();
            }
        }));
    }

    ngOnDestroy() {
        this.subscription.forEach(s => s.unsubscribe());
        this.timeLine.destroy();
    }

    getRequest() {
        this.isLoading = true;
        this.subscription.push(forkJoin({
            request: this._traceService.getFtpRequests(this.params.idSession, this.params.idFtp).pipe(map(f => ({...f, duration: Utils.getElapsedTime(f.start, f.end)}))),
            stages: this._traceService.getFtpRequestStages(this.params.idSession, this.params.idFtp)
        }).pipe(finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: FtpRequest, stages: FtpRequestStage[]}) => {
                this.request = value.request;
                this.request.actions = value.stages;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        }));
    }

    createTimeline() {
        let timeline_start = Math.trunc(this.request.start * 1000);
        let timeline_end = Math.ceil(this.request.end * 1000);

        let items = this.request.actions.map((a: FtpRequestStage, i:number) => {
            let item: DataItem = {
                group: `${i}`,
                start: Math.trunc(a.start * 1000),
                end: Math.trunc(a.end * 1000),
                content: '',
                className: "ftp",
                title: `<span>${this.pipe.transform(new Date(a.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(a.end * 1000), 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform({start: a.start, end: a.end})})<br>
                        <h4>${a?.args ? a.args.join('</br>') : ''}</h4>`
            }

            item.type = item.end <= item.start ? 'point' : 'range';
            if (a.exception?.message || a.exception?.type) {
                item.className = 'bdd-failed';
            }
            return item;
        });

        this.timeLine = new Timeline(this.timelineContainer.nativeElement, items, this.request.actions.map((a: FtpRequestStage, i:number) => ({ id: i, content: a?.name })), {
            start: timeline_start,
            end: timeline_end,
            selectable : false,
            clickToUse: true,
            tooltip: {
                followMouse: true
            }
        });
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