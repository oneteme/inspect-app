import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceMainSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {EnvRouter} from "../../../../service/router.service";
import {Location} from "@angular/common";
import {combineLatest, finalize, forkJoin, map, merge, of, Subscription, switchMap} from "rxjs";
import {application} from "../../../../../environments/environment";
import {Constants} from "../../../constants";

@Component({
    templateUrl: './detail-session-main.view.html',
    styleUrls: ['./detail-session-main.view.scss'],
})
export class DetailSessionMainView implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);
    private _location: Location = inject(Location);

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
                    return merge(
                        of(s).pipe(map(s=>{this.session = {...s, restRequests:[],databaseRequests:[],stages:[],ftpRequests:[],mailRequests:[],ldapRequests:[]};})),
                        this._traceService.getInstance(s.instanceId).pipe(map(d=>(this.instance=d))),
                        (s.mask & 4) > 0 ? this._traceService.getRestRequests(s.id).pipe(map(d=>(this.session.restRequests.push(...d)))): of(),
                        (s.mask & 2) > 0 ? this._traceService.getDatabaseRequests(s.id).pipe(map(d=>{this.session.databaseRequests.push(...d);this.groupQueriesBySchema();})) : of(),
                        (s.mask & 1) > 0 ? this._traceService.getLocalRequests(s.id).pipe(map(d=>(this.session.stages.push(...d)))) : of(),
                        (s.mask & 8) > 0 ? this._traceService.getFtpRequests(s.id).pipe(map(d=>(this.session.ftpRequests.push(...d)))) : of(),
                        (s.mask & 16) > 0 ? this._traceService.getSmtpRequests(s.id).pipe(map(d=>(this.session.mailRequests.push(...d)))) : of(),
                        (s.mask & 32) > 0 ? this._traceService.getLdapRequests(s.id).pipe(map(d=>(this.session.ldapRequests.push(...d)))) : of()
                    );
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