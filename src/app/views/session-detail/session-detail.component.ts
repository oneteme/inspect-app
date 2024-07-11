import { Component, Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Observable, combineLatest, finalize, forkJoin, map, of, switchMap } from "rxjs";
import { Utils } from 'src/app/shared/util';
import { Location } from '@angular/common';
import { TraceService } from 'src/app/shared/services/trace.service';
import { application } from 'src/environments/environment';
import { InstanceEnvironment, InstanceMainSession, InstanceRestSession } from 'src/app/shared/model/v3/trace.model';

type SessionType = 'main' | 'rest';

@Component({
    templateUrl: './session-detail.component.html',
    styleUrls: ['./session-detail.component.scss'],

})
export class SessionDetailComponent implements OnDestroy {
    selectedSession: InstanceMainSession | InstanceRestSession; // IncomingRequest | Mainrequest | OutcomingRequest;
    instance: InstanceEnvironment;
    selectedSessionType: string;
    sessionParent: { id: string, type: SessionType };
    isLoading: boolean = false;
    paramsSubscription: any;
    queryBySchema: any[];
    env: any;

    constructor(private _activatedRoute: ActivatedRoute,
        private _traceService: TraceService,
        private _router: EnvRouter,
        private _location: Location) {

        this.paramsSubscription = combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || application.default_env;
                this.selectedSessionType = params.type;
                this.getSessionById(params.id);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        });
    }

    getSessionById(id: string) {
        this.isLoading = true;
        var traceService = (this.selectedSessionType == "main" ? this._traceService.getMainSession(id) : this._traceService.getRestSession(id));
        traceService
            .pipe(
                switchMap((s: InstanceMainSession | InstanceRestSession) => {
                    return forkJoin({
                        session: of(s), 
                        instance: this._traceService.getInstance(s.instanceId),
                        requests: this._traceService.getRestRequests(s.id),
                        queries: this._traceService.getDatabaseRequests(s.id),
                        stages: this._traceService.getLocalRequests(s.id)
                    });
                }), 
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (result) => {
                    this.selectedSession = result.session;
                    this.selectedSession.requests = result.requests;
                    this.selectedSession.queries = result.queries;
                    this.selectedSession.stages = result.stages;
                    this.instance = result.instance;
                    if (this.selectedSession) {
                        this.groupQueriesBySchema();
                        // Check if parent exist
                        this.sessionParent = null;
                        if (this.selectedSessionType == "api") {
                            this._traceService.getSessionParentByChildId(id).subscribe({
                                next: (data: { id: string, type: SessionType }) => {
                                    this.sessionParent = data;
                                },
                                error: err => {}
                            })
                        }
                    }
                }
            });
    }

    selectedRequest(event: { event: MouseEvent, row: any }) {
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/api/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session', 'api', event.row], { queryParams: { env: this.env } }); // TODO remove env FIX BUG
            }
        }
    }

    selectedQuery(event: { event: MouseEvent, row: any }) { // TODO finish this 
        console.log(event);
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/${this.selectedSessionType}/${this.selectedSession.id}/database/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session', this.selectedSessionType, this.selectedSession.id, 'database', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    getStateColor() {
        return Utils.getStateColor((<InstanceRestSession>this.selectedSession)?.status)
    }
    
    getElapsedTime(end: number, start: number,) {
        return end - start;
    }

    getSessionDetailBorder() {
        if (this.selectedSessionType == "api")
            return Utils.statusBorderCard((<InstanceRestSession>this.selectedSession)?.status)
        if (this.selectedSessionType == "main")
            return Utils.statusBorderCard(!!(<InstanceMainSession>this.selectedSession)?.exception?.message)

    }

    groupQueriesBySchema() {
        if (this.selectedSession.queries) {
            this.queryBySchema = this.selectedSession.queries.reduce((acc: any, item) => {
                if (!acc[item.name]) {
                    acc[item.name] = []
                }

                acc[item.name].push(item);
                return acc;
            }, []);
        }
    }

    getSessionUrl() {
        return Utils.getSessionUrl(<InstanceRestSession>this.selectedSession);
    }

    navigate(event: MouseEvent, targetType: string, extraParam?: string) {
        let params: any[] = [];
        switch (targetType) {
            case "api":
                params.push('dashboard', 'api', this.selectedSession.name);
                break;
            case "app":
                params.push('dashboard', 'app', this.selectedSession.appName)
                break;
            case "tree":
                params.push('session/api', this.selectedSession.id, 'tree')
                break;
            case "parent":
                params.push('session', this.sessionParent.type, this.sessionParent.id)
        }
        if (event.ctrlKey) {
            this._router.open(`#/${params.join('/')}`, '_blank')
        } else {
            this._router.navigate(params, {
                queryParams: { env: this.instance.env }
            });
        }
    }

    ngOnDestroy() {
        if (this.paramsSubscription) {
            this.paramsSubscription.unsubscribe();
        }
    }
}

@Injectable()
export class EnvRouter {

    private _env: string;

    constructor(private router: Router) { }

    set env(env: string) {
        this._env = env
    }

    get events(): Observable<any> {
        return this.router.events;
    };

    get url(): string {
        return this.router.url;
    }


    navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
        if (!extras?.queryParams?.env) {
            if (this._env) {
                if (!extras) {
                    extras = {}
                }
                if (!extras.queryParams) {
                    extras.queryParams = {}
                }
                extras.queryParams.env = this._env;
            }
        }
        else {
            this.env = extras.queryParams.env;
        }
        return this.router.navigate(commands, extras);
        // return Promise.resolve(true);
    }

    open(url?: string | URL, target?: string, features?: string): WindowProxy | null {
        return window.open(url, target, features);
    }

}