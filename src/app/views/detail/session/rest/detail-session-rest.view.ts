import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceRestSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {Location} from "@angular/common";
import {
    catchError,
    combineLatest,
    finalize,
    of,
    Subscription,
    switchMap,
    merge,
    map,
    defer,
    Subject,
    takeUntil
} from "rxjs";
import {app} from "../../../../../environments/environment";
import {Utils} from "../../../../shared/util";
import {EnvRouter} from "../../../../service/router.service";

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

    session: InstanceRestSession;
    instance: InstanceEnvironment;
    completedSession: InstanceRestSession
    sessionParent: { id: string, type: string };
    isLoading: boolean = false;
    parentLoading: boolean = false;
    env: string;

    ngOnInit() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).pipe(takeUntil(this.$destroy)).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || app.defaultEnv;
                this.getSession(params.id_session);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

    getSession(id: string) {
        this.isLoading = true;
        this.parentLoading = true;
        this.session = null;
        this.completedSession =null;
        this.sessionParent=null;
        this._traceService.getSessionParent(id).pipe(takeUntil(this.$destroy), catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent = d);
        this._traceService.getRestSession(id)
            .pipe(
                takeUntil(this.$destroy),
                switchMap(s => {
                    return of(s).pipe(
                        map(s=>{
                            this.session = s;
                        }),
                        switchMap((v)=> {
                            return merge( 
                                this._traceService.getInstance(this.session.instanceId).pipe(map(d=>(this.instance=d))),
                                (this.session.mask & 4) > 0 ? defer(()=> {this.session.restRequests = []; return this._traceService.getRestRequests(this.session.id).pipe(map(d=>(this.session.restRequests=d)))}) : of(),
                                (this.session.mask & 2) > 0 ? defer(()=> {this.session.databaseRequests = []; return this._traceService.getDatabaseRequests(this.session.id).pipe(map(d=>(this.session.databaseRequests=d)))}) : of(),
                                (this.session.mask & 1) > 0 ? defer(()=> {this.session.stages = []; return this._traceService.getLocalRequests(this.session.id).pipe(map(d=>(this.session.stages=d)))}) : of(),
                                (this.session.mask & 8) > 0 ? defer(()=> {this.session.ftpRequests = []; return this._traceService.getFtpRequests(this.session.id).pipe(map(d=>(this.session.ftpRequests=d)))}) : of(),
                                (this.session.mask & 16) > 0 ? defer(()=> {this.session.mailRequests = []; return this._traceService.getSmtpRequests(this.session.id).pipe(map(d=>(this.session.mailRequests=d)))}) : of(),
                                (this.session.mask & 32) > 0 ? defer(()=> {this.session.ldapRequests = []; return this._traceService.getLdapRequests(this.session.id).pipe(map(d=>(this.session.ldapRequests=d)))}) : of()
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
}