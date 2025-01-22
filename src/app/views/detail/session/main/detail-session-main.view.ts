import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceMainSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {EnvRouter} from "../../../../service/router.service";
import {Location} from "@angular/common";
import {combineLatest, finalize, map, merge, of, Subscription, switchMap} from "rxjs";
import {application} from "../../../../../environments/environment";
import {Constants} from "../../../constants";

@Component({
    templateUrl: './detail-session-main.view.html',
    styleUrls: ['./detail-session-main.view.scss'],
})
export class DetailSessionMainView implements OnInit, OnDestroy {
    private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private readonly _traceService: TraceService = inject(TraceService);
    private readonly _router: EnvRouter = inject(EnvRouter);
    private readonly _location: Location = inject(Location);

    MAPPING_TYPE = Constants.MAPPING_TYPE;
    session: InstanceMainSession;
    instance: InstanceEnvironment;
    completedSession: InstanceMainSession;
    isLoading: boolean = false;
    subscriptions: Array<Subscription> = [];
    queryBySchema: any[];
    env: string;
    type: string;

    ngOnInit() {
        this.subscriptions.push(combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.env = queryParams.env || application.default_env;
                this.type = params.type_main;
                this.getSession(params.id_session);
                this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.env}`)
            }
        }));
    }

    getSession(id: string) {
        this.isLoading = true;
        this.session = null;
        this.completedSession =null;
        this.queryBySchema = null;
        this._traceService.getMainSession(id).pipe(
                switchMap(s => {
                    return of(s).pipe(
                        map(s=>{
                            this.session = {...s, restRequests:[],databaseRequests:[],stages:[],ftpRequests:[],mailRequests:[],ldapRequests:[]};
                        }),
                        switchMap((v)=> {
                            return merge( 
                                this._traceService.getInstance(this.session.instanceId).pipe(map(d=>(this.instance=d))),
                                (this.session.mask & 4) > 0 ? this._traceService.getRestRequests(this.session.id).pipe(map(d=>(this.session.restRequests = d))): of(),
                                (this.session.mask & 2) > 0 ? this._traceService.getDatabaseRequests(this.session.id).pipe(map(d=>{this.session.databaseRequests=d;this.groupQueriesBySchema();})) : of(),
                                (this.session.mask & 1) > 0 ? this._traceService.getLocalRequests(this.session.id).pipe(map(d=>(this.session.stages=d))) : of(),
                                (this.session.mask & 8) > 0 ? this._traceService.getFtpRequests(this.session.id).pipe(map(d=>(this.session.ftpRequests=d))) : of(),
                                (this.session.mask & 16) > 0 ? this._traceService.getSmtpRequests(this.session.id).pipe(map(d=>(this.session.mailRequests=d))) : of(),
                                (this.session.mask & 32) > 0 ? this._traceService.getLdapRequests(this.session.id).pipe(map(d=>(this.session.ldapRequests=d))) : of()
                            )
                        }))
                }),
                finalize(() => {this.completedSession = this.session; this.isLoading = false;})
            )
            .subscribe();
    }

    groupQueriesBySchema() {
        if (this.session.databaseRequests) {
            this.queryBySchema = this.session.databaseRequests.reduce((acc: any, item) => {
                if(item.name) {
                    if (!acc[item.name]) {
                        acc[item.name] = []
                    }
                    acc[item.name].push(item);
                }
                return acc;
            }, []);
        }
    }

    navigate(event: MouseEvent, targetType: string, extraParam?: string) {
        let params: any[] = [];
        switch (targetType) {
            case "rest":
                params.push('statistic', 'rest', this.session.name);
                break;
            case "app":
                params.push('statistic', 'app', this.session.appName)
                break;
            case "tree":
                params.push('session', 'main', this.session.type, this.session.id, 'tree')
                break;
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
        this.subscriptions.forEach(s => s.unsubscribe());
    }
}