import { Component, ElementRef,NgZone, OnDestroy, ViewChild } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import {  combineLatest } from "rxjs";
import { Timeline } from 'vis-timeline';
import { DatabaseAction } from 'src/app/shared/model/trace.model';
import { Utils } from 'src/app/shared/util';
import { DatePipe, Location } from '@angular/common';
import { TraceService } from 'src/app/shared/services/trace.service';
import { application } from 'src/environments/environment';
import { EnvRouter } from '../session-detail/session-detail.component';


export interface UserData {
    id: string;
    name: string;
    progress: string;
    fruit: string;
}

@Component({
    templateUrl: './db-request-detail.component.html',
    styleUrls: ['./db-request-detail.component.scss'],

})
export class DbRequestDetailComponent implements OnDestroy {
    utils: Utils = new Utils;
    selectedQuery: any;
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


    constructor(private _activatedRoute: ActivatedRoute,
        private _traceService: TraceService,
        private zone: NgZone,
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
                this.getDbRequestById(this.dbQueryId);
            }
        }); 
    } 





    getDbRequestById(id: number) {
        this.isLoading = true;
        this._traceService.getDbRequestById(id).subscribe({
            next: (d: any) => {
                if (d) {
                    this.selectedQuery = d;
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
        let timeline_end = +(this.selectedQuery.end * 1000) 
        let timeline_start = +this.selectedQuery.start * 1000
        let dataArray = this.selectedQuery.actions;
        this.sortInnerArrayByDate(dataArray);

        let g = new Set()
         dataArray.forEach((c: any) =>{
            g.add(c.type);
         });
        let groups = Array.from(g).map((g: string) => ({ id: g, content: g }))
        
        dataArray = dataArray.map((c: any, i: number) => {
            let e:any = {
                group: c.type,
               // content: "c.type",
                start: Math.trunc(c.start * 1000),
                end: Math.trunc(c.end * 1000),
                title: `<span>${this.pipe.transform(new Date(c.start * 1000), 'HH:mm:ss.SSS')} - ${this.pipe.transform(new Date(c.end * 1000), 'HH:mm:ss.SSS')}</span><br>
                        <h4>${c.type}${c?.count? '('+c?.count+')': ''}:  ${this.getElapsedTime(c.end, c.start).toFixed(3)}s </h4>`,
                //className : 'vis-dot',  
            }

            e.type = e.start == e.end ? 'point' : 'range'
            if(c?.exception?.message || c?.exception?.classname){
                e.className ='bdd-failed';
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
                //stack:false,
               // min: timeline_start,
               // max: timeline_end,
               selectable : false,
                clickToUse: true,
                tooltip: {
                    followMouse: true
                },
                //order: (a, b) => {
                //     return b.start - a.start // inverser l'ordre  
                // }
            });
    }

    getElapsedTime(end: number, start: number,) {
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


    configDbactions(query: any) {
        query.actions.forEach((db: any, i: number) => {
            if (query.actions[i + 1]) {
                let diffElapsed = new Date(db.end * 1000).getTime() - new Date(query.actions[i + 1].start * 1000).getTime();

                if (diffElapsed != 0) {
                    query.actions.splice(i + 1, 0, { 'type': ' ', 'exception': { 'classname': null, 'message': null }, 'start': db.end, 'end': query.actions[i + 1].start })
                }
            }
        });
    }

    getSessionUrl(selectedSession: any) {
        return Utils.getSessionUrl(selectedSession);
    }


    navigate(event:MouseEvent,targetType: string,extraParam?:string) {
        let params: any[] = [];
        switch (targetType) {
            case "parent":
                params.push('session', this.dbQueryParentType, this.dbQueryParentId)
        }
        if(event.ctrlKey){
           this._router.open(`#/${params.join('/')}`,'_blank')
          }else {
            this._router.navigate(params, {
                  queryParams: { env: this.env }
            });
        }
    }


    sortInnerArrayByDate(innerArray: any[]): any[] {
        return innerArray.sort((a, b) => {
            if (a.start > b.start)
                return 1;

            if (a.start < b.start)
                return -1;
        });
    }

    isQueryCompleted(query: any): boolean {
        return query.actions.every((a: any) => !a?.exception?.classname && !a?.exception?.message);
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

    getException(actions: DatabaseAction[]): DatabaseAction{
        return actions.filter(a => a?.exception?.message || a?.exception?.classname)[0]
    }

    ngOnDestroy() {
        if (this.paramsSubscription) {
            this.paramsSubscription.unsubscribe();
        }
    }



}