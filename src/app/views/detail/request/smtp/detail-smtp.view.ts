import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {DataGroup, DataItem, TimelineOptions} from "vis-timeline";
import {catchError, combineLatest, finalize, forkJoin, of, Subject, takeUntil} from "rxjs";
import {DatePipe} from "@angular/common";
import {app} from "../../../../../environments/environment";
import {EnvRouter} from "../../../../service/router.service";
import {DurationPipe} from "../../../../shared/pipe/duration.pipe";
import {MatTableDataSource} from "@angular/material/table";
import {INFINITY} from "../../../constants";
import {ExceptionInfo, Mail, MailRequest, MailRequestStage} from "../../../../model/new/trace.model";
import {RequestType} from "../../../../model/new/request.model";

@Component({
    templateUrl: './detail-smtp.view.html',
    styleUrls: ['./detail-smtp.view.scss'],
})
export class DetailSmtpView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _traceService: TraceService = inject(TraceService);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly pipe = new DatePipe('fr-FR');
    private readonly durationPipe = new DurationPipe();
    private readonly $destroy = new Subject<void>();

    private params: Partial<{idSmtp: string, env: string}> = {};

    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    request: MailRequest;
    stages: MailRequestStage[];
    exception: ExceptionInfo;
    isLoading: boolean;

    sessionParent: { id: string, type: string };
    parentLoading: boolean = false;

    displayedColumns: string[] = ['subject', 'from', 'recipients', 'replyTo'];
    dataSource: MatTableDataSource<Mail> = new MatTableDataSource();

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.params = {idSmtp: params.id_request, env: queryParams.env || app.defaultEnv};
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
        this._traceService.getSessionParent(RequestType.SMTP, this.params.idSmtp).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=> this.sessionParent = d);
        forkJoin({
            request: this._traceService.getSmtpRequest(this.params.idSmtp),
            stages: this._traceService.getSmtpRequestStages(this.params.idSmtp),
            mails: this._traceService.getSmtpRequestMails(this.params.idSmtp)
        }).pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: MailRequest, stages: MailRequestStage[], mails: Mail[]}) => {
                this.request = value.request;
                this.stages = value.stages;
                this.request.mails = value.mails;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.dataSource = new MatTableDataSource(this.request.mails);
                this.createTimeline();
            }
        });
    }

    createTimeline() {
        let timelineStart = Math.trunc(this.request.start * 1000);
        let timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : INFINITY;

        let items = this.stages.map((a:MailRequestStage, i:number) => {
            let start = Math.trunc(a.start * 1000);
            let end = a.end? Math.trunc(a.end * 1000) : INFINITY;
            return  {
                group: `${i}`,
                start: start,
                end: end,
                type: end <= start ? 'point' : 'range',
                content: '',
                className: "smtp",
                title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end, 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})`
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
        });

        let groups:any[] = this.stages.map((a:MailRequestStage, i:number) => ({ id: i, content: a?.name,treeLevel: 2}))
        groups.splice(0,0,{id:'parent', content: this.request.threadName,treeLevel: 1, nestedGroups:groups.map(g=>(g.id))})
        let padding = (Math.ceil((timelineEnd - timelineStart)*0.01));
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