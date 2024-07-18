import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { combineLatest, forkJoin } from "rxjs";
import { Timeline } from 'vis-timeline';
import { DatabaseAction } from 'src/app/shared/model/trace.model';
import { Utils } from 'src/app/shared/util';
import { DatePipe, Location } from '@angular/common';
import { TraceService } from 'src/app/shared/services/trace.service';
import { application } from 'src/environments/environment';
import { EnvRouter } from '../session-detail/session-detail.component';
import { DatabaseRequest, DatabaseRequestStage } from 'src/app/shared/model/v3/trace.model';

@Component({
    templateUrl: './db-request-detail.component.html',
    styleUrls: ['./db-request-detail.component.scss'],

})
export class DbRequestDetailComponent implements OnDestroy {
    utils: Utils = new Utils;
    selectedQuery: DatabaseRequest;
    dbQueryId: number;
    dbQueryParentId: string;
    dbQueryParentType: string;
    isComplete: boolean = true;
    isLoading: boolean = false;
    paramsSubscription: any;
    timeLine: any;
    env: any;
    pipe = new DatePipe('fr-FR')
    @ViewChild('timeline') timelineContainer: ElementRef;

    jdbcActionDescription: { [key: string]: string }= 
    {
        'CONNECTION': 'établir une connexion avec la base de données',
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
        'SAVEPOINT':'This command allows you to set a savepoint within a transaction'
    };


    constructor(private _activatedRoute: ActivatedRoute,
        private _traceService: TraceService,
        private _router: EnvRouter,
        private _location: Location) {
        this.paramsSubscription = combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.dbQueryId = params.dbid;
                this.dbQueryParentId = params.id;
                this.dbQueryParentType = params.type;
                this.env = queryParams.env || application.default_env;
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
                this.getDbRequestById();
            }
        });
    }

    getDbRequestById() {
        this.isLoading = true;
        forkJoin({
            query: this._traceService.getDatabaseRequests(this.dbQueryParentId, this.dbQueryId),
            stages: this._traceService.getDatabaseRequestStages(this.dbQueryParentId, this.dbQueryId)
        }).subscribe({
            next: res => {
                if (res) {
                    this.selectedQuery = res.query;
                    this.selectedQuery.actions = res.stages;
                    //this.groupQueriesBySchema();
                    // this.configDbactions(this.selectedQuery)
                    this.visjs();
                    this.isLoading = false;
                    this.isComplete = true;
                } else {
                    this.isLoading = false;
                    this.isComplete = false;
                    // navigate to tab incoming
                }
            },
            error: err => {
                this.isLoading = false;
            }
        });
    }

    visjs() {
        let timeline_end = Math.round(+this.selectedQuery.end)* 1000;
        let timeline_start = Math.trunc(+this.selectedQuery.start)* 1000 ;
        let actions = this.selectedQuery.actions;
        this.sortInnerArrayByDate(actions)

        let groups = actions.map((g: DatabaseRequestStage,i:number ) => ({ id: i, content: g?.name, title: this.jdbcActionDescription[g?.name] }))
        groups
        let dataArray = actions.map((c: DatabaseRequestStage, i: number) => {
            let e: any = {
                group: groups[i].id,
                // content: "c.type",
                start: Math.trunc(+c.start * 1000),
                end: Math.trunc(+c.end * 1000),
                title: `<span>${this.pipe.transform(new Date(+c.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(+c.end * 1000), 'HH:mm:ss.SSS')}</span><br>
                        <h4>${c.name}${c?.count ? '(' + c?.count + ')' : ''}:  ${this.getElapsedTime(+c.end, +c.start).toFixed(3)}s </h4>`,
                //className : 'vis-dot',  
            }

             if((c.name == 'FETCH' || c.name =='BATCH' ||c.name == 'EXECUTE') && c.count){ // changed  c.type to c.name 
                e.content  = c.count.toString();
            }
            e.type = e.start == e.end ? 'point' : 'range'
            if (c?.exception?.message || c?.exception?.type) {
                e.className = 'bdd-failed';
                e.title += `<h5 class="error"> ${c?.exception?.message}</h5>`; // TODO : fix css on tooltip
            }


            return e;
        })
        if (this.timeLine) {  // destroy if exists 
            this.timeLine.destroy();
        }
        // Create a Timeline
        this.timeLine = new Timeline(this.timelineContainer.nativeElement, dataArray, groups,
            {
                min: timeline_start,
                max: timeline_end,
                selectable: false,
                clickToUse: true,
                tooltip: {
                    followMouse: true
                },
            });
    }

    getElapsedTime(end: number, start: number) {
        // return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
        return end - start;
    }

    getRe(re: string) {
        return this.utils.getRe(re);
    }

    statusBorder(status: any) {
        return Utils.statusBorder(status);
    }

    getStateColorBool() {
        return Utils.getStateColorBool(this.selectedQuery?.completed)
    }

    getSessionDetailBorder() {

        return Utils.statusBorderCard(!this.selectedQuery?.completed)

    }

    getSessionStatusTooltip(session: any) {
        return session?.completed ? "réussi" : "échoué";
    }


    configDbactions(query: DatabaseRequest) {
        query.actions.forEach((db: any, i: number) => {
            if (query.actions[i + 1]) {
                let diffElapsed = new Date(db.end * 1000).getTime() - new Date(+query.actions[i + 1].start * 1000).getTime();

                if (diffElapsed != 0) {
                    query.actions.splice(i + 1, 0, { 'name': ' ', 'exception': { 'type': null, 'message': null }, 'start': db.end, 'end': query.actions[i + 1].start })
                }
            }
        });
    }

    getSessionUrl(selectedSession: any) {
        return Utils.getSessionUrl(selectedSession);
    }


    navigate(event: MouseEvent, targetType: string, extraParam?: string) {
        let params: any[] = [];
        switch (targetType) {
            case "parent":
                params.push('session', this.dbQueryParentType, this.dbQueryParentId)
        }
        if (event.ctrlKey) {
            this._router.open(`#/${params.join('/')}`, '_blank')
        } else {
            this._router.navigate(params, {
                queryParams: { env: this.env }
            });
        }
    }


    sortInnerArrayByDate(innerArray: any[]): any[] {
        return innerArray.sort((a, b) => {
            return a.start - b.start
        });
    }

    isQueryCompleted(query: DatabaseRequest): boolean {
        return query.actions.every((a: DatabaseRequestStage) => !a?.exception?.type && !a?.exception?.message);
    }

    getCommand(commands: string[]): string {
        let command = ""
        if (commands?.length == 1) {
            command = `[${commands[0]}]`
        } else if (commands?.length > 1) {
            command = "[SQL]"
        }
        return command;
    }

    getException(actions: DatabaseRequestStage[]): DatabaseRequestStage {
        return actions.filter(a => a?.exception?.message || a?.exception?.type)[0]
    }

    ngOnDestroy() {
        if (this.paramsSubscription) {
            this.paramsSubscription.unsubscribe();
        }
    }



}