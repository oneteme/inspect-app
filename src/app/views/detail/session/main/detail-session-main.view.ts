import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {EnvRouter} from "../../../../service/router.service";
import {Location} from "@angular/common";
import {combineLatest, defer, finalize, map, merge, of, Subject, switchMap, takeUntil} from "rxjs";
import {app} from "../../../../../environments/environment";
import {Constants} from "../../../constants";
import {AnalyticService} from "../../../../service/analytic.service";
import {MainSessionView} from "../../../../model/request.model";
import {InstanceEnvironment} from "../../../../model/trace.model";

@Component({
    templateUrl: './detail-session-main.view.html',
    styleUrls: ['./detail-session-main.view.scss'],
})
export class DetailSessionMainView implements OnInit, OnDestroy {
    private readonly _activatedRoute = inject(ActivatedRoute);
    private readonly _traceService = inject(TraceService);
    private readonly _analyticService = inject(AnalyticService);
    private readonly _location = inject(Location);
    private readonly $destroy = new Subject<void>();
    protected readonly _router = inject(EnvRouter);
    MAPPING_TYPE = Constants.MAPPING_TYPE;
    session: MainSessionView;
    completedSession: MainSessionView;
    instance: InstanceEnvironment;
    isLoading: boolean = false;
    env: string;
    type: string;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || app.defaultEnv;
                this.type = params.type_main;
                this.getSession(params.id_session);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

    getSession(id: string) {
        this.$destroy.next();
        this.isLoading = true;
        this.session = null;
        this.completedSession = null;
        this._traceService.getMainSession(id).pipe(
                takeUntil(this.$destroy),
                switchMap(s => {
                    return of(s).pipe(
                        map(s=>{
                            this.session = { ...s };
                        }),
                        switchMap((v)=> {
                            return merge( 
                                this._traceService.getInstance(this.session.instanceId).pipe(map(d=>(this.instance = d))),
                                this.session.type === 'VIEW' ? defer(() => {this.session.userActions = []; return this._analyticService.getUserActionsBySession(this.session.id).pipe(map(d=>(this.session.userActions = d)))}) : of(),
                                (this.session.requestsMask & 4) > 0 ? defer(()=> {this.session.restRequests = []; return this._traceService.getRestRequests(this.session.id).pipe(map(d=>(this.session.restRequests = d)))}) : of(),
                                (this.session.requestsMask & 2) > 0 ? defer(()=> {this.session.databaseRequests = []; return this._traceService.getDatabaseRequests(this.session.id).pipe(map(d=>{this.session.databaseRequests = d;}))}) : of(),
                                (this.session.requestsMask & 1) > 0 ? defer(()=> {this.session.localRequests = []; return this._traceService.getLocalRequests(this.session.id).pipe(map(d=>(this.session.localRequests = d)))}) : of(),
                                (this.session.requestsMask & 8) > 0 ? defer(()=> {this.session.ftpRequests = []; return this._traceService.getFtpRequests(this.session.id).pipe(map(d=>(this.session.ftpRequests = d)))}) : of(),
                                (this.session.requestsMask & 16) > 0 ? defer(()=> {this.session.mailRequests = []; return this._traceService.getSmtpRequests(this.session.id).pipe(map(d=>(this.session.mailRequests = d)))}) : of(),
                                (this.session.requestsMask & 32) > 0 ? defer(()=> {this.session.ldapRequests = []; return this._traceService.getLdapRequests(this.session.id).pipe(map(d=>(this.session.ldapRequests = d)))}) : of(),
                                defer(()=> {this.session.logEntries = []; return this._traceService.getLogEntryBySession(this.session.id).pipe(map(d=>(this.session.logEntries = d)))})
                            )
                        }));
                }),
                finalize(() => {this.completedSession = this.session; this.isLoading = false;})
            )
            .subscribe();
    }

    getDate(start: number, complete: boolean) {
        let date = new Date(start);
        if(complete) {return date;}
        else { return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0, 0); }
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }

    navigateOnStatusIndicator(event: MouseEvent) {
      var date = new Date(this.session.start * 1000);
      this._router.navigateOnClick(event, ['/supervision', this.instance.type.toLowerCase(), this.instance.id], { queryParams: {start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString(), end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0).toISOString(), env: this.instance?.env} });
    }
}