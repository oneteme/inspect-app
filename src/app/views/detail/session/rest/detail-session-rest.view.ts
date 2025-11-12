import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {Location} from "@angular/common";
import {catchError, combineLatest, defer, finalize, map, merge, of, Subject, switchMap, takeUntil} from "rxjs";
import {app} from "../../../../../environments/environment";
import {Utils} from "../../../../shared/util";
import {EnvRouter} from "../../../../service/router.service";
import {RequestType, RestSessionView} from "../../../../model/request.model";
import {HttpSessionStage, InstanceEnvironment, StackTraceRow} from "../../../../model/trace.model";
import {MatDialog} from "@angular/material/dialog";
import {StageDialogComponent} from "./stage-dialog/stage-dialog.component";

@Component({
    templateUrl: './detail-session-rest.view.html',
    styleUrls: ['./detail-session-rest.view.scss'],
})
export class DetailSessionRestView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _traceService: TraceService = inject(TraceService);
    private readonly _location: Location = inject(Location);
    private readonly $destroy = new Subject<void>();
    protected readonly _router: EnvRouter = inject(EnvRouter);
    private readonly _dialog = inject(MatDialog);

    session: RestSessionView;
    stages: HttpSessionStage[];
    instance: InstanceEnvironment;
    completedSession: RestSessionView;
    sessionParent: { id: string, type: string };
    isLoading: boolean = false;
    parentLoading: boolean = false;
    env: string;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || app.defaultEnv;
                this.getSession(params.id_session);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

    getSession(id: string) {
        this.$destroy.next();
        this.isLoading = true;
        this.parentLoading = true;
        this.session = null;
        this.completedSession = null;
        this.sessionParent = null;
        this._traceService.getSessionParent(RequestType.REST, id).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent = d);
        this._traceService.getRestSession(id)
            .pipe(
                takeUntil(this.$destroy),
                switchMap(s => {
                    return of(s).pipe(
                        map(s=>{
                            this.session = {...s};
                        }),
                        switchMap((v)=> {
                            return merge(
                                this._traceService.getInstance(this.session.instanceId).pipe(map(d=>(this.instance=d))),
                                this._traceService.getRestSessionStages(this.session.id).pipe(map(d=>(this.stages=d))),
                                (this.session.requestsMask & 4) > 0 ? defer(()=> {this.session.restRequests = []; return this._traceService.getRestRequests(this.session.id).pipe(map(d=>(this.session.restRequests=d)))}) : of(),
                                (this.session.requestsMask & 2) > 0 ? defer(()=> {this.session.databaseRequests = []; return this._traceService.getDatabaseRequests(this.session.id).pipe(map(d=>(this.session.databaseRequests=d)))}) : of(),
                                (this.session.requestsMask & 1) > 0 ? defer(()=> {this.session.localRequests = []; return this._traceService.getLocalRequests(this.session.id).pipe(map(d=>(this.session.localRequests=d)))}) : of(),
                                (this.session.requestsMask & 8) > 0 ? defer(()=> {this.session.ftpRequests = []; return this._traceService.getFtpRequests(this.session.id).pipe(map(d=>(this.session.ftpRequests=d)))}) : of(),
                                (this.session.requestsMask & 16) > 0 ? defer(()=> {this.session.mailRequests = []; return this._traceService.getSmtpRequests(this.session.id).pipe(map(d=>(this.session.mailRequests=d)))}) : of(),
                                (this.session.requestsMask & 32) > 0 ? defer(()=> {this.session.ldapRequests = []; return this._traceService.getLdapRequests(this.session.id).pipe(map(d=>(this.session.ldapRequests=d)))}) : of(),
                                defer(()=> {this.session.logEntries = []; return this._traceService.getLogEntryBySession(this.session.id).pipe(map(d=>(this.session.logEntries = d)))})
                            )
                        }))
                }),
                finalize(() =>{ this.completedSession = this.session; this.isLoading = false;})
            )
            .subscribe();
    }

    getSessionUrl() {
        return Utils.getSessionUrl(this.session);
    }

    getDate(start: number) {
        return new Date(start);
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    openStages() {
        this._dialog.open(StageDialogComponent, {
           data: {session: this.session, stages: this.stages}
        });
    }
}