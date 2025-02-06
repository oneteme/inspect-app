import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceRestSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {Location} from "@angular/common";
import {catchError, combineLatest, finalize, of, Subscription, switchMap, merge, map,defer} from "rxjs";
import {application} from "../../../../../environments/environment";
import {Utils} from "../../../../shared/util";
import {EnvRouter} from "../../../../service/router.service";

@Component({
    templateUrl: './detail-session-rest.view.html',
    styleUrls: ['./detail-session-rest.view.scss'],
})
export class DetailSessionRestView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _traceService: TraceService = inject(TraceService);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly _location: Location = inject(Location);

    session: InstanceRestSession;
    instance: InstanceEnvironment;
    completedSession: InstanceRestSession
    sessionParent: { id: string, type: string };
    isLoading: boolean = false;
    parentLoading: boolean =false;
    subscriptions: Array<Subscription> = [];
    env: string;

    ngOnInit() {
        this.subscriptions.push(combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || application.default_env;
                this.getSession(params.id_session);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        }));
    }

    getSession(id: string) {
        this.isLoading = true;
        this.parentLoading = true;
        this.session = null;
        this.completedSession =null;
        this.sessionParent=null;
        this._traceService.getSessionParent(id).pipe(catchError(() => of(null)),finalize(()=>(this.parentLoading = false))).subscribe(d=>this.sessionParent=d) 
        this._traceService.getRestSession(id)
            .pipe(
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

    selectedRequest(event: { event: MouseEvent, row: any }) {
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/rest/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session', 'rest', event.row], { queryParams: { env: this.env } }); // TODO remove env FIX BUG
            }
        }
    }

    selectedFtp(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/rest/${this.session.id}/ftp/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/rest', this.session.id, 'ftp', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedLdap(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/rest/${this.session.id}/ldap/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/rest', this.session.id, 'ldap', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedSmtp(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/rest/${this.session.id}/smtp/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/rest', this.session.id, 'smtp', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedQuery(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/rest/${this.session.id}/database/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/rest', this.session.id, 'database', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }


    getSessionUrl() {
        return Utils.getSessionUrl(this.session);
    }

    navigate(event: MouseEvent, targetType: string, extraParam?: string) {
        let params: any[] = [];
        switch (targetType) {
            case "rest":
                params.push('statistic', 'rest', this.session.name);
                break;
            case "dump":
                params.push('session', this.instance.name, 'dump')
                break;
            case "tree":
                params.push('session', 'rest', this.session.id, 'tree')
                break;
            case "parent":
                if(this.sessionParent.type == 'rest') {
                    params.push('session', 'rest', this.sessionParent.id)
                } else {
                    params.push('session', 'main', this.sessionParent.type.toLowerCase(), this.sessionParent.id)
                }
        }
        if (event.ctrlKey) {
            this._router.open(`#/${params.join('/')}`, '_blank')
        } else {
            this._router.navigate(params, {
                queryParams: { env: this.instance.env }
            });
        }
    }

    onClickDump(event: MouseEvent) {
        let params: {fragments: string[], queryParams: any} = {
            fragments: ['session', this.instance.name, 'dump'],
            queryParams:  { env: this.instance.env, date: new Date(this.session.start * 1000).toISOString() }
        };
        if (event.ctrlKey) {
            let url = this._router.createUrlTree(params.fragments, {
                queryParams: params.queryParams }
            ).toString();
            this._router.open(`#/${url}`, '_blank');
        } else {
            this._router.navigate(params.fragments, {
                queryParams: params.queryParams
            });
        }
    }

    ngOnDestroy() {
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}