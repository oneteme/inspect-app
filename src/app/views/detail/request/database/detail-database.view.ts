import {Component, inject, OnDestroy, OnInit} from '@angular/core';

import {ActivatedRoute} from '@angular/router';
import {catchError, combineLatest, finalize, forkJoin, of, Subject, switchMap, takeUntil} from "rxjs";
import {DataGroup, DataItem, Timeline, TimelineOptions} from 'vis-timeline';
import {DatePipe} from '@angular/common';
import {TraceService} from '../../../../service/trace.service';
import {app} from '../../../../../environments/environment';
import {EnvRouter} from "../../../../service/router.service";
import {DurationPipe} from "../../../../shared/pipe/duration.pipe";
import {getErrorClassName, showifnotnull, getDataForRange} from '../../../../shared/util';
import {Constants, INFINITY} from "../../../constants";
import {DatabaseRequest, DatabaseRequestStage, ExceptionInfo, InstanceEnvironment} from "../../../../model/trace.model";
import {RequestType} from "../../../../model/request.model";
import {TabData} from "../../session/_component/detail-session.component";

@Component({
  templateUrl: './detail-database.view.html',
  styleUrls: ['./detail-database.view.scss'],
})
export class DetailDatabaseView implements OnInit, OnDestroy {
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _traceService: TraceService = inject(TraceService);
  private readonly _router: EnvRouter = inject(EnvRouter);
  private readonly pipe = new DatePipe('fr-FR');
  private readonly durationPipe = new DurationPipe();
  private readonly $destroy = new Subject<void>();

  tabs: TabData[] = [];
  selectedTabIndex: number = 0;

  REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;

  params: Partial<{ idJdbc: string, env: string }> = {};

  options: TimelineOptions;
  dataItems: DataItem[];
  dataGroups: DataGroup[];
  dataArray: any[] = [];
  request: DatabaseRequest;
  stages: DatabaseRequestStage[];
  exception: ExceptionInfo;
  instance: InstanceEnvironment;

  sessionParent: { id: string, type: string };
  parentLoading: boolean = false;

  isLoading: boolean = false;
  timelineStart: number
  timelineEnd: number

  jdbcActionDescription: { [key: string]: string } =
    {
      'CONNECTION': 'Etablir une connexion avec la base de données',
      'DISCONNECTION': '',
      'STATEMENT': 'Création et validation de la requête SQL',
      'EXECUTE': 'Exécution de la requête',
      'METADATA': "",
      'DATABASE': '',
      'SCHEMA': '',
      'BATCH': '',
      'COMMIT': 'This command is used to permanently save all changes made during the current transaction. Once a transaction is committed, it cannot be undone',
      'ROLLBACK': ' Used to undo transactions that have not yet been committed. It can revert the database to the last committed state',
      'FETCH': 'Parcours et récupération de résultats',
      'MORE': '',
      'SAVEPOINT': 'This command allows you to set a savepoint within a transaction'
    };

  ngOnInit() {
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, queryParams]) => {
        this.params = {idJdbc: params.id_request, env: queryParams.env || app.defaultEnv};
        this.getRequest();
      }
    });
  }

  initTabs() {
    this.tabs = [
      {
        label: 'Stages',
        icon: 'view_object_track',
        count: this.stages.length || 0,
        visible: true,
        type: 'stage',
        hasError: this.stages.some(s => s.exception),
        errorCount: this.stages.filter(s => s.exception).length || 0
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

  getRequest() {
    this.request = null;
    this.instance = null;
    this.isLoading = true;
    this.parentLoading = true;
    this.sessionParent = null;
    this._traceService.getSessionParent(RequestType.JDBC, this.params.idJdbc).pipe(takeUntil(this.$destroy), catchError(() => of(null)), finalize(() => (this.parentLoading = false))).subscribe(d => this.sessionParent = d);
    forkJoin([
      this._traceService.getDatabaseRequest(this.params.idJdbc),
      this._traceService.getDatabaseRequestStages(this.params.idJdbc)
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
      next: result => {
        this.instance = result.instance;
        this.request = result.request;
        this.stages = result.stages;
        this.exception = result.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
        this.initTabs();
        this.createTimeline();
      }
    });
  }

  createTimeline() {
    this.timelineStart = Math.trunc(this.request.start * 1000);
    this.timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : this.timelineStart + 3600000;
    this.dataArray = this.stages.map((c: DatabaseRequestStage, i: number) => {
      let start = Math.trunc(c.start * 1000);
      let end = c.end ? Math.trunc(c.end * 1000) : INFINITY;
      return {
        group: `${i}`,
        start: start,
        end: end,
        type: end <= start ? 'point' : 'range',
        content: `<div class="content" style="display: flex; align-items: center; gap: 0.5rem; flex-direction: row;">
                                <span class="command" style="color: #1565c0; font-weight: 600; text-transform: uppercase; font-size: 0.75rem;">${showifnotnull(c.command, () => c.command)}</span>
                                <span class="arg" style="color: #7f8c8d; font-style: italic; font-size: 0.7rem;">${showifnotnull(c.args, () => `(${c.args.join(', ')})`)}</span>
                                <span class="count" style="color: #2c3e50; font-weight: 500; font-size: 0.7rem;">${showifnotnull(c.count, () => `×${c.count}`)}</span>
                          </div>`,
        className: `database overflow ${getErrorClassName(c)}`,
        title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end, 'HH:mm:ss.SSS')}</span>  (⏱ ${this.durationPipe.transform((end / 1000) - (start / 1000))})<br>
                        <span>${showifnotnull(c.command, () => c.command)}${showifnotnull(c.args, () => `(${c.args.join(', ')})`)} ${showifnotnull(c.count, () => `×${c.count}`)}</span>`
      }
    })
    this.dataArray.splice(0, 0, {
      title: '',
      group: this.request.command,
      start: this.timelineStart,
      end: this.timelineEnd,
      content: (this.request.schema || this.request.name || 'N/A'),
      className: "overflow",
      type: "background"
    });
    let padding = (Math.ceil((this.timelineEnd - this.timelineStart) * 0.01))
    let groups: any[]
    if (this.dataArray.length > 50) {
      this.timelineStart = this.dataArray[0].start
      this.timelineEnd = this.dataArray[50].start
      this.dataItems = getDataForRange(this.dataArray, this.timelineStart, this.timelineEnd);
      groups = getDataForRange(this.stages, this.timelineStart, this.timelineEnd).map((g: DatabaseRequestStage, i: number) => ({
        id: `${i}`,
        content: g?.name,
        title: this.jdbcActionDescription[g?.name],
        treeLevel: 2
      }));
    } else {
      this.dataItems = this.dataArray;
      groups = this.stages.map((g: DatabaseRequestStage, i: number) => ({
        id: `${i}`,
        content: g?.name,
        title: this.jdbcActionDescription[g?.name],
        treeLevel: 2
      }));
    }
    groups.splice(0, 0, {
      id: this.request.command,
      content: this.request.command,
      treeLevel: 1,
      nestedGroups: groups.map(g => (g.id))
    })
    this.dataGroups = groups;

    this.options = {
      start: this.timelineStart - padding,
      end: this.timelineEnd + padding,
      selectable: false,
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

  navigateOnStatusIndicator(event: MouseEvent) {
    var date = new Date(this.request.start * 1000);
    this._router.navigateOnClick(event, ['/supervision', this.instance.type.toLowerCase(), this.instance.id], { queryParams: {start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString(), env: this.instance?.env} });
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  getDate(start: number) {
    return new Date(start);
  }

  onTimelineCreate(timeline: Timeline) {
    timeline.on('rangechanged', (props) => {
      let d = getDataForRange(this.dataArray, props.start.getTime(), props.end.getTime());
      let groups: any[] = getDataForRange(this.stages.map(s => ({
        ...s,
        start: Math.trunc(s.start * 1000),
        end: s.end ? Math.trunc(s.end * 1000) : INFINITY
      })), props.start.getTime(), props.end.getTime()).map((g: DatabaseRequestStage, i: number) => ({
        start: g.start,
        id: `${d[i + 1].group}`,
        content: g?.name,
        title: this.jdbcActionDescription[g?.name],
        treeLevel: 2
      }));
      groups.splice(0, 0, {
        id: this.request.command,
        content: this.request.command,
        treeLevel: 1,
        nestedGroups: groups.map(g => (g.id))
      })
      timeline.setGroups(groups);
      timeline.setItems(d);
    });
  }
}

