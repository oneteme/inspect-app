import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../service/trace.service";
import {DataItem, Timeline} from "vis-timeline";
import {combineLatest, finalize, forkJoin, Subscription} from "rxjs";
import {ExceptionInfo, Mail, MailRequest, MailRequestStage} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";
import {application} from "../../../../environments/environment";
import {EnvRouter} from "../../../service/router.service";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import {MatTableDataSource} from "@angular/material/table";

const INFINIT = new Date(9999,12,31).getTime();

@Component({
    templateUrl: './detail-smtp.view.html',
    styleUrls: ['./detail-smtp.view.scss'],
})
export class DetailSmtpView implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);

    private timeLine: Timeline;
    private subscription: Subscription[] = [];
    private params: Partial<{idSession: string, idSmtp: number, typeSession: string, typeMain: string, env: string}> = {};
    private pipe = new DatePipe('fr-FR');
    private durationPipe = new DurationPipe();

    request: MailRequest;
    exception: ExceptionInfo;
    isLoading: boolean;

    displayedColumns: string[] = ['subject', 'from', 'recipients', 'replyTo'];
    dataSource: MatTableDataSource<Mail> = new MatTableDataSource();

    @ViewChild('timeline') timelineContainer: ElementRef;

    ngOnInit() {
        this.subscription.push(combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.data,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, data, queryParams]) => {
                this.params = {idSession: params.id_session, idSmtp: params.id_smtp,
                    typeSession: data.type, typeMain: params.type_main, env: queryParams.env || application.default_env};
                this.request = null;
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
            request: this._traceService.getSmtpRequests(this.params.idSession, this.params.idSmtp),
            stages: this._traceService.getSmtpRequestStages(this.params.idSession, this.params.idSmtp),
            mails: this._traceService.getSmtpRequestMails(this.params.idSession, this.params.idSmtp)
        }).pipe(finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: MailRequest, stages: MailRequestStage[], mails: Mail[]}) => {
                this.request = value.request;
                this.request.actions = value.stages;
                this.request.mails = value.mails;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.dataSource = new MatTableDataSource(this.request.mails);
                this.createTimeline();
            }
        }));
    }

    createTimeline() {
        let timeline_start = Math.trunc(this.request.start * 1000);
        let timeline_end = Math.trunc(this.request.start * 1000);

        let items = this.request.actions.map((a:MailRequestStage, i:number) => {
            let end = a.end? Math.trunc(a.end * 1000) :INFINIT; 
            let item: any = {
                group: `${i}`,
                start: Math.trunc(a.start * 1000),
                end: end,
                content: '',
                className: "smtp",
                title: `<span>${this.pipe.transform(new Date(a.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(end), 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform({start: a.start, end: a.end/1000})})`
            }
            item.type = item.end <= item.start ? 'point' : 'range';
            if (item.end > timeline_end && item.end != INFINIT) {
                timeline_end = item.end
            }
            return item;
        });

        items.splice(0,0,{
            group:'parent',
            start: timeline_start,
            end: (this.request.end *1000) ||INFINIT,
            content: (this.request.host || 'N/A'),
            className: "overflow",
            type:"background"
           })

        let groups:any[]=this.request.actions.map((a:MailRequestStage, i:number) => ({ id: i, content: a?.name,treeLevel: 2, }))
        groups.splice(0,0,{id:'parent', content: this.request.threadName,treeLevel: 1, nestedGroups:groups.map(g=>(g.id))})
        let options = {
            start: timeline_start - (Math.ceil((timeline_end - timeline_start)*0.01)),
            end: timeline_end + (Math.ceil((timeline_end - timeline_start)*0.01)),
            selectable : false,
            clickToUse: true,
            tooltip: {
                followMouse: true
            }
        }
        if (this.timeLine) {  // destroy if exists 
            this.timeLine.destroy();
        }
        this.timeLine = new Timeline(this.timelineContainer.nativeElement, items, groups, options);
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