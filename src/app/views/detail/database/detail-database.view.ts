import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {ActivatedRoute} from '@angular/router';
import {combineLatest, finalize, forkJoin, Subscription} from "rxjs";
import {Timeline} from 'vis-timeline';
import {DatePipe} from '@angular/common';
import {TraceService} from 'src/app/service/trace.service';
import {app, application} from 'src/environments/environment';
import {DatabaseRequest, DatabaseRequestStage, ExceptionInfo} from 'src/app/model/trace.model';
import {EnvRouter} from "../../../service/router.service";
import {DurationPipe} from "../../../shared/pipe/duration.pipe";
import { getErrorClassName } from 'src/app/shared/util';


const INFINIT = new Date(9999,12,31).getTime();

@Component({
    templateUrl: './detail-database.view.html',
    styleUrls: ['./detail-database.view.scss'],
})
export class DetailDatabaseView implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);

    private params: Partial<{idSession: string, idJdbc: number, typeSession: string, typeMain: string, env: string}> = {};
    private subscription: Subscription[] = [];
    private pipe = new DatePipe('fr-FR');
    private durationPipe = new DurationPipe();

    timeLine: Timeline;
    request: DatabaseRequest;
    exception: ExceptionInfo;

    isComplete: boolean = true;
    isLoading: boolean = false;

    @ViewChild('timeline') timelineContainer: ElementRef;

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
        this.subscription.push(combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.data,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, data, queryParams]) => {
                this.params = {idSession: params.id_session, idJdbc: params.id_jdbc,
                    typeSession: data.type, typeMain: params.type_main, env: queryParams.env || app.defaultEnv};
                this.request = null;
                this.getRequest();
            }
        }))
    }

    getRequest(){
        this.isLoading = true;
        this.subscription.push(forkJoin({
            request: this._traceService.getDatabaseRequests(this.params.idSession, this.params.idJdbc),
            stages: this._traceService.getDatabaseRequestStages(this.params.idSession, this.params.idJdbc)
        }).pipe(finalize(() => this.isLoading = false)).subscribe({
            next: (value: {request: DatabaseRequest, stages: DatabaseRequestStage[]}) => {
                this.request = value.request;
                this.request.actions = value.stages;
                this.exception = value.stages.find(s => s.exception?.type || s.exception?.message)?.exception;
                this.createTimeline();
            }
        }))
    }

    createTimeline() {
        let timeline_end = Math.trunc(this.request.start * 1000);
        let timeline_start = Math.trunc(this.request.start * 1000);
        let items = this.request.actions.map((c: DatabaseRequestStage, i: number) => {
            let end = c.end? Math.trunc(c.end * 1000) :INFINIT; 
            let item:any  = {
                group: `${i}`,
                start: Math.trunc(c.start * 1000),
                end: end,
                content: c.commands? `${this.getCommmand(c.commands)}` : "",
                className: `database overflow ${getErrorClassName(c)}` ,
                title: `<span>${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(end), 'HH:mm:ss.SSS')}</span>  (${this.durationPipe.transform({start: c.start, end: end / 1000})})<br>
                        <span>${c.count ?'count: ' + c.count : ''}</span>`
            }
            item.type = item.end <= item.start ? 'point' : 'range' // TODO : change this to equals dh_dbt is set to timestamps(6), currently set to timestmap(3)
            if (item.end > timeline_end && item.end != INFINIT) {
                  timeline_end = item.end
            }
            return item;
        })
        items.splice(0,0,{
            group:'parent',
            start: timeline_start,
            end: (this.request.end *1000) ||INFINIT,
            content: (this.request.schema || this.request.name || 'N/A'),
            className: "overflow",
            type:"background"
           })

        let groups:any[]= this.request.actions.map((g: DatabaseRequestStage,i:number ) => ({ id: `${i}`, content: g?.name + (g.count? ` (${g.count})`:''), title: this.jdbcActionDescription[g?.name], treeLevel: 2, }));
        groups.splice(0,0,{id:'parent', content: this.request.threadName,treeLevel: 1, nestedGroups:groups.map(g=>(g.id))})
        let options=  {
            start: timeline_start - (Math.ceil((timeline_end - timeline_start)*0.01)),
            end: timeline_end + (Math.ceil((timeline_end - timeline_start)*0.01)),
            selectable : false,
            clickToUse: true,
            tooltip: {
                followMouse: true
            }
        }
        if (this.timeLine) {
            this.timeLine.destroy();
        }
        this.timeLine = new Timeline(this.timelineContainer.nativeElement,items,groups,options);

    }

    navigate(event: MouseEvent, targetType: string, extraParam?: string) {
        let params: any[] = [];
        switch (targetType) {
            case "parent":
                if(this.params.typeMain) params.push('session', this.params.typeSession, this.params.typeMain, this.params.idSession)
                else params.push('session', this.params.typeSession, this.params.idSession)
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
        this.subscription.forEach(s => s.unsubscribe());
        this.timeLine.destroy();
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

