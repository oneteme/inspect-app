import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceMainSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {EnvRouter} from "../../../../service/router.service";
import {Location} from "@angular/common";
import {combineLatest, defer, finalize, map, merge, of, Subject, Subscription, switchMap, takeUntil} from "rxjs";
import {app} from "../../../../../environments/environment";
import {Constants} from "../../../constants";
import {AnalyticService} from "../../../../service/analytic.service";

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
    session: InstanceMainSession;
    instance: InstanceEnvironment;
    completedSession: InstanceMainSession;
    isLoading: boolean = false;
    env: string;
    type: string;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).pipe(takeUntil(this.$destroy)).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || app.defaultEnv;
                this.type = params.type_main;
                this.getSession(params.id_session);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

    getSession(id: string) {
        this.isLoading = true;
        this.session = null;
        this.completedSession = null;
        this._traceService.getMainSession(id).pipe(
                takeUntil(this.$destroy),
                switchMap(s => {
                    return of(s).pipe(
                        map(s=>{
                            this.session = s;
                        }),
                        switchMap((v)=> {
                            return merge( 
                                this._traceService.getInstance(this.session.instanceId).pipe(map(d=>(this.instance=d))),
                                this.session.type === 'VIEW' ? defer(() => {this.session.userActions = []; return this._analyticService.getUserActionsBySession(this.session.id).pipe(map(d=>(this.session.userActions = d)))}) : of(),
                                (this.session.mask & 4) > 0 ? defer(()=> {this.session.restRequests = []; return this._traceService.getRestRequests(this.session.id).pipe(map(d=>(this.session.restRequests = d)))}) : of(),
                                (this.session.mask & 2) > 0 ? defer(()=> {this.session.databaseRequests = []; return this._traceService.getDatabaseRequests(this.session.id).pipe(map(d=>{this.session.databaseRequests = d;}))}) : of(),
                                (this.session.mask & 1) > 0 ? defer(()=> {this.session.stages = []; return this._traceService.getLocalRequests(this.session.id).pipe(map(d=>(this.session.stages = d)))}) : of(),
                                (this.session.mask & 8) > 0 ? defer(()=> {this.session.ftpRequests = []; return this._traceService.getFtpRequests(this.session.id).pipe(map(d=>(this.session.ftpRequests = d)))}) : of(),
                                (this.session.mask & 16) > 0 ? defer(()=> {this.session.mailRequests = []; return this._traceService.getSmtpRequests(this.session.id).pipe(map(d=>(this.session.mailRequests = d)))}) : of(),
                                (this.session.mask & 32) > 0 ? defer(()=> {this.session.ldapRequests = []; return this._traceService.getLdapRequests(this.session.id).pipe(map(d=>(this.session.ldapRequests = d)))}) : of()
                            )
                        }))
                }),
                finalize(() => {this.completedSession = this.session; this.isLoading = false;})
            )
            .subscribe();
    }

    getDate(start: number) {
        return new Date(start);
    }

    ngOnDestroy() {
        this.$destroy.next();
        this.$destroy.complete();
    }
}