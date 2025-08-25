import {Component, inject, OnDestroy, OnInit} from '@angular/core';

import {ActivatedRoute} from '@angular/router';
import {catchError, combineLatest, finalize, forkJoin, of, Subject, takeUntil} from "rxjs";
import {DataGroup, DataItem, TimelineOptions} from 'vis-timeline';
import {DatePipe} from '@angular/common';
import {TraceService} from '../../../../service/trace.service';
import {app} from '../../../../../environments/environment';
import {EnvRouter} from "../../../../service/router.service";
import {DurationPipe} from "../../../../shared/pipe/duration.pipe";
import {getErrorClassName} from '../../../../shared/util';
import {Constants, INFINITY} from "../../../constants";
import {DatabaseRequest, DatabaseRequestStage, ExceptionInfo} from "../../../../model/trace.model";
import {RequestType} from "../../../../model/request.model";

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

    REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;

    params: Partial<{idJdbc: string, env: string}> = {};

    options: TimelineOptions;
    dataItems: DataItem[];
    dataGroups: DataGroup[];

    request: DatabaseRequest;
    stages: DatabaseRequestStage[];
    exception: ExceptionInfo;

    sessionParent: { id: string, type: string };
    parentLoading: boolean = false;

    isLoading: boolean = false;

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

    getRequest(){
        this.request = null;
        this.isLoading = true;
        this.parentLoading = true;
        this.sessionParent = null;
        this._traceService.getSessionParent(RequestType.JDBC, this.params.idJdbc).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent = d);
        forkJoin({
            request: this._traceService.getDatabaseRequest(this.params.idJdbc),
            stages: this._traceService.getDatabaseRequestStages(this.params.idJdbc)
        }).pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: DatabaseRequest, stages: DatabaseRequestStage[]}) => {
                this.request = value.request;
                this.stages = value.stages;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        });
    }

    createTimeline() {
        let timelineEnd = this.request.end ? Math.trunc(this.request.end * 1000) : INFINITY;
        let timelineStart = Math.trunc(this.request.start * 1000);
        let items = this.stages.map((c: DatabaseRequestStage, i: number) => {
            let start = Math.trunc(c.start * 1000);
            let end = c.end ? Math.trunc(c.end * 1000) : INFINITY;
            return {
                group: `${i}`,
                start: start,
                end: end,
                type: end <= start ? 'point' : 'range',
                content: c.commands? `${this.getCommmand(c.commands)}` : "",
                className: `database overflow ${getErrorClassName(c)}` ,
                title: `<span>${this.pipe.transform(start, 'HH:mm:ss.SSS')} - ${this.pipe.transform(end, 'HH:mm:ss.SSS')}</span>  (${this.durationPipe.transform((end / 1000) - (start / 1000))})<br>
                        <span>${c.count ? 'count: ' + c.count : ''}</span>`
            }
        })
        items.splice(0, 0, {
            title: '',
            group: 'parent',
            start: timelineStart,
            end: timelineEnd,
            content: (this.request.schema || this.request.name || 'N/A'),
            className: "overflow",
            type: "background"
        });

        let groups: any[] = this.stages.map((g: DatabaseRequestStage,i:number ) => ({ id: `${i}`, content: g?.name + (g.count? ` (${g.count})`:''), title: this.jdbcActionDescription[g?.name], treeLevel: 2 }));
        groups.splice(0, 0, {id: 'parent', content: this.request.threadName, treeLevel: 1, nestedGroups: groups.map(g=> (g.id))})
        let padding = (Math.ceil((timelineEnd - timelineStart) * 0.01))

        this.dataGroups = groups;
        this.dataItems = items;
        this.options =  {
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

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    getCommmand(commands?: string[]): string{
        let command ="";
        if(commands){
            let distinct = new Set();
            commands.forEach(c => {
                distinct.add(c);
            })
            command = Array.from(distinct).join(", ");
        }
        return command;
    }
}

