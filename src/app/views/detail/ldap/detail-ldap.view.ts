import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../service/trace.service";
import {DataItem, Timeline} from "vis-timeline";
import {combineLatest, finalize, forkJoin, Subscription} from "rxjs";
import {ExceptionInfo, NamingRequest, NamingRequestStage} from "../../../model/trace.model";
import {DatePipe} from "@angular/common";
import {application} from "../../../../environments/environment";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import {EnvRouter} from "../../../service/router.service";

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
        let timeline_end = Math.ceil(this.request.end * 1000);

        let items = this.request.actions.map((a: NamingRequestStage, i: number) => {
            let item: DataItem = {
                group: `${i}`,
                start: Math.trunc(a.start * 1000),
                end: Math.trunc(a.end * 1000),
                content: '',
                className: "ldap",
                title: `<span>${this.pipe.transform(a.start * 1000, 'HH:mm:ss.SSS')} - ${this.pipe.transform(a.end * 1000, 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform({start: a.start, end: a.end})})<br>
                        <span>${a?.args ? a.args.join('</br>') : ''}</span>`
            }
            item.type = item.end <= item.start ? 'point' : 'range';
            if (a.exception?.message || a.exception?.type) {
                item.className += ' bdd-failed';
            }
            return item;
        });

        if (this.timeLine) {  // destroy if exists 
            this.timeLine.destroy();
        }
        this.timeLine = new Timeline(this.timelineContainer.nativeElement, items, this.request.actions.map((a:NamingRequestStage, i:number) => ({ id: i, content: a?.name })), {
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