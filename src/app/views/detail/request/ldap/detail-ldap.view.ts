import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {DataGroup, DataItem, Timeline, TimelineOptions} from "vis-timeline";
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
import {getDataForRange, getErrorClassName, showifnotnull} from "../../../../shared/util";
import {TabData} from "../../session/_component/detail-session.component";

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
    dataArray: any[] = [];
    request: DirectoryRequest;
    stages: DirectoryRequestStage[];
    exception: ExceptionInfo;
    instance: InstanceEnvironment;
    isLoading: boolean;
    tabs: TabData[] = [];
    selectedTabIndex: number = 0;
    sessionParent: { id: string, type: string };
    parentLoading: boolean = false;
    timelineStart: number
    timelineEnd: number

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.params = {idLdap: params.id_request, env: queryParams.env || app.defaultEnv};
                this.initTabs();
                this.getRequest();
            }
        });
    }

  initTabs() {
    this.tabs = [
      {
        label: 'Stages',
        icon: 'view_object_track',
        count: 0,
        visible: true,
        type: 'stage',
        hasError: false,
        errorCount: 0
      },
      {
        label: 'Chronologie',
        icon: 'view_timeline',
        count: 0,
        visible: true,
        type: 'timeline',
        hasError: false,
        errorCount: 0
      }
    ]
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
        this.timelineStart = Math.trunc(this.request.start * 1000);
        this.timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : this.timelineStart + 3600000;

        this.dataArray = this.stages.map((a: DirectoryRequestStage, i: number) => {
            let start= Math.trunc(a.start * 1000);
            let end = a.end? Math.trunc(a.end * 1000) : INFINITY;
            return {
                group: `${i}`,
                start: start,
                end: end,
                type: end <= start ? 'point' : 'range',
                content: `<div class="content" style="display: flex; align-items: center; gap: 0.5rem; flex-direction: row;">
                                <span class="command" style="color: #1565c0; font-weight: 600; text-transform: uppercase; font-size: 0.75rem;">${showifnotnull(a.command, ()=> a.command)}</span>
                                <span>${showifnotnull(a.args, ()=> a.args.join(', '))}</span>
                         </div>`,
                className: `ldap ${getErrorClassName(a)}`,
                title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end , 'HH:mm:ss.SSS')}</span> (⏱ ${this.durationPipe.transform((end/1000) - (start/1000))})<br>
                        <span>${showifnotnull(a.command, ()=> a.command)} ${showifnotnull(a.args, ()=> a.args.join(', '))}</span>`
            };
        });
        this.dataArray.splice(0,0,{
            title: "",
            group: 'parent',
            start: this.timelineStart,
            end: this.timelineEnd,
            content: (this.request.host || 'N/A'),
            className: "overflow",
            type: "background"
        });

        let groups: any[];
        let padding = (Math.ceil((this.timelineEnd - this.timelineStart)*0.01));

        if(this.dataArray.length > 50) {
            this.timelineStart = this.dataArray[0].start;
            this.timelineEnd = this.dataArray[50].start;
            this.dataItems = getDataForRange(this.dataArray, this.timelineStart, this.timelineEnd);
            groups = getDataForRange(this.dataArray, this.timelineStart, this.timelineEnd).map((a:DirectoryRequestStage, i:number) => ({ id: i, content: a?.name,treeLevel: 2}));
        }else {
            this.dataItems = this.dataArray
            groups = this.stages.map((a:DirectoryRequestStage, i:number) => ({ id: i, content: a?.name,treeLevel: 2}));
        }
        groups.splice(0, 0, {id: 'parent', content: this.request.threadName, treeLevel: 1, nestedGroups:groups.map(g=>(g.id))});
        this.dataGroups = groups;
        this.options = {
            start: this.timelineStart - padding,
            end: this.timelineEnd + padding,
            selectable : false,
            clickToUse: true,
            tooltip: {
                followMouse: true
            }
        };
    }

    navigateOnStatusIndicator(event: MouseEvent) {
      var date = new Date(this.request.start * 1000);
      this._router.navigateOnClick(event, ['/supervision', this.instance.type.toLowerCase(), this.instance.id], { queryParams: {start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString(), env: this.instance?.env} });
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

    onTimelineCreate(timeline: Timeline) {
        timeline.on('rangechanged', (props)=>{
            let d = getDataForRange( this.dataArray, props.start.getTime(), props.end.getTime());
            let groups:any[]= getDataForRange(this.stages.map(s=>({...s, start:Math.trunc(s.start*1000), end: s.end ? Math.trunc(s.end*1000 ) : INFINITY })), props.start.getTime() , props.end.getTime()).map((a: DirectoryRequestStage, i:number) => ({ id: `${d[i+1].group}`, content: a?.name, treeLevel: 2}))
            groups.splice(0,0,{id:'parent', content: this.request.threadName,treeLevel: 1, nestedGroups:groups.map(g=>(g.id))})
            timeline.setGroups(groups);
            timeline.setItems(d);
        });
    }
}