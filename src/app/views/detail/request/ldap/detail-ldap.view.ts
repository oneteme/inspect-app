import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {DataGroup, DataItem, TimelineOptions} from "vis-timeline";
import {catchError, combineLatest, finalize, forkJoin, of, Subject, switchMap, takeUntil} from "rxjs";
import {DatePipe} from "@angular/common";
import {app} from "../../../../../environments/environment";
import {DurationPipe} from "../../../../shared/pipe/duration.pipe";
import {EnvRouter} from "../../../../service/router.service";
import {Constants, INFINITY} from "../../../constants";
import {
    DirectoryRequest,
    DirectoryRequestStage,
    ExceptionInfo,
    InstanceEnvironment
} from "../../../../model/trace.model";
import {RequestType} from "../../../../model/request.model";

@Component({
    templateUrl: './detail-ldap.view.html',
    styleUrls: ['./detail-ldap.view.scss'],
})
export class DetailLdapView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _traceService: TraceService = inject(TraceService);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly pipe = new DatePipe('fr-FR');
    private readonly durationPipe = new DurationPipe();
    private readonly $destroy = new Subject<void>();

    private params: Partial<{idLdap: string, env: string}> = {};

    REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;
    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    request: DirectoryRequest;
    stages: DirectoryRequestStage[];
    exception: ExceptionInfo;
    instance: InstanceEnvironment;
    isLoading: boolean;

    sessionParent: { id: string, type: string };
    parentLoading: boolean = false;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.params = {idLdap: params.id_request, env: queryParams.env || app.defaultEnv};
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
        this.instance = null;
        this.isLoading = true;
        this.parentLoading = true;
        this.sessionParent = null;
        this._traceService.getSessionParent(RequestType.LDAP, this.params.idLdap).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent = d);
        forkJoin([
            this._traceService.getLdapRequest(this.params.idLdap),
            this._traceService.getLdapRequestStages(this.params.idLdap)
        ]).pipe(
          takeUntil(this.$destroy),
          switchMap(s => {
              return forkJoin({
                  request: of(s[0]),
                  stages: of(s[1]),
                  instance: this._traceService.getInstance(s[0].instanceId)
              })
          }),
          finalize(() => this.isLoading = false)
        ).subscribe({
            next: (result) => {
                this.instance = result.instance;
                this.request = result.request;
                this.stages = result.stages;
                this.exception = result.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        });
    }

    createTimeline() {
        let timelineStart = Math.trunc(this.request.start * 1000);
        let timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : timelineStart + 3600000;

        let items = this.stages.map((a: DirectoryRequestStage, i: number) => {
            let start= Math.trunc(a.start * 1000);
            let end = a.end? Math.trunc(a.end * 1000) : INFINITY;
            return {
                group: `${i}`,
                start: start,
                end: end,
                type: end <= start ? 'point' : 'range',
                content: '',
                className: "ldap",
                title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end , 'HH:mm:ss.SSS')}</span> (${this.durationPipe.transform((end/1000) - (start/1000))})<br>
                        <span>${a?.args ? a.args.join('</br>') : ''}</span>`
            };
        });
        items.splice(0,0,{
            title: "",
            group: 'parent',
            start: timelineStart,
            end: timelineEnd,
            content: (this.request.host || 'N/A'),
            className: "overflow",
            type: "background"
        });

        let groups: any[] = this.stages.map((a:DirectoryRequestStage, i:number) => ({ id: i, content: a?.name,treeLevel: 2}));
        groups.splice(0, 0, {id: 'parent', content: this.request.threadName, treeLevel: 1, nestedGroups:groups.map(g=>(g.id))});
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
        };
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

    getDate(start: number) {
        return new Date(start);
    }
}