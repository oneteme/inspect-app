import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../service/trace.service";
import {Timeline} from "vis-timeline";
import {combineLatest, finalize, forkJoin, Subscription} from "rxjs";
import {ExceptionInfo, NamingRequest, NamingRequestStage} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";
import {app} from "../../../../environments/environment";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import {EnvRouter} from "../../../service/router.service";

const INFINIT = new Date(9999,12,31).getTime();

@Component({
    templateUrl: './detail-ldap.view.html',
    styleUrls: ['./detail-ldap.view.scss'],
})
export class DetailLdapView implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);

    private timeLine: Timeline;
    private subscription: Subscription[] = [];
    private params: Partial<{idSession: string, idLdap: number, typeSession: string, typeMain: string, env: string}> = {};
    private pipe = new DatePipe('fr-FR');
    private durationPipe = new DurationPipe();

    request: NamingRequest;
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
                this.params = {idSession: params.id_session, idLdap: params.id_ldap,
                    typeSession: data.type, typeMain: params.type_main, env: queryParams.env || app.defaultEnv};
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
            request: this._traceService.getLdapRequests(this.params.idSession, this.params.idLdap),
            stages: this._traceService.getLdapRequestStages(this.params.idSession, this.params.idLdap)
        }).pipe(finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: NamingRequest, stages: NamingRequestStage[]}) => {
                this.request = value.request;
                this.request.actions = value.stages;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        }));
    }

    createTimeline() {
        let timeline_start = Math.trunc(this.request.start * 1000);
        let timeline_end = this.request.end ? Math.trunc(this.request.end * 1000) : INFINIT;

        let items = this.request.actions.map((a: NamingRequestStage, i: number) => {
            let start= Math.trunc(a.start * 1000);
            let end = a.end? Math.trunc(a.end * 1000) :INFINIT;
            return {
                group: `${i}`,
                start: start,
                end: end,
                type: end <= start ? 'point' : 'range',
                content: '',
                className: "ldap",
                title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end , 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})<br>
                        <span>${a?.args ? a.args.join('</br>') : ''}</span>`
            }
        });
        items.splice(0,0,{
            title:"",
            group:'parent',
            start: timeline_start,
            end: timeline_end,
            content: (this.request.host || 'N/A'),
            className: "overflow",
            type:"background"
           })

        let groups:any[] = this.request.actions.map((a:NamingRequestStage, i:number) => ({ id: i, content: a?.name,treeLevel: 2}));
        groups.splice(0,0,{id:'parent', content: this.request.threadName,treeLevel: 1, nestedGroups:groups.map(g=>(g.id))})
        let padding = (Math.ceil((timeline_end - timeline_start)*0.01));
        let options = {
            start: timeline_start - padding,
            end: timeline_end + padding,
            selectable : false,
            clickToUse: true,
            tooltip: {
                followMouse: true
            }
        }

        if (this.timeLine) {
            this.timeLine.destroy();
        }
        this.timeLine = new Timeline(this.timelineContainer.nativeElement, items, groups,options);
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