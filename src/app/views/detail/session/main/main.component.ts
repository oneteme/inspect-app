import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceMainSession, InstanceRestSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {EnvRouter} from "../../../../service/router.service";
import {Location} from "@angular/common";
import {catchError, combineLatest, finalize, forkJoin, of, Subscription, switchMap} from "rxjs";
import {application} from "../../../../../environments/environment";

@Component({
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);
    private _location: Location = inject(Location);

    session: InstanceMainSession;
    instance: InstanceEnvironment;
    isLoading: boolean = false;
    subscriptions: Array<Subscription> = [];
    queryBySchema: any[];
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
        this.session = null;
        this._traceService.getMainSession(id).pipe(
                switchMap(s => {
                    return forkJoin({
                        session: of(s),
                        instance: this._traceService.getInstance(s.instanceId),
                        requests: this._traceService.getRestRequests(s.id),
                        queries: this._traceService.getDatabaseRequests(s.id),
                        stages: this._traceService.getLocalRequests(s.id),
                        ftps: this._traceService.getFtpRequests(s.id),
                        mails: this._traceService.getSmtpRequests(s.id),
                        ldaps: this._traceService.getLdapRequests(s.id)
                    });
                }),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: (result) => {
                    if(result){
                        this.session = result.session;
                        this.session.requests = result.requests;
                        this.session.queries = result.queries;
                        this.session.stages = result.stages;
                        this.session.ftpRequests = result.ftps;
                        this.session.mailRequests = result.mails;
                        this.session.ldapRequests = result.ldaps;
                        this.instance = result.instance;
                        this.groupQueriesBySchema();
                    }
                }
            });
    }

    groupQueriesBySchema() {
        if (this.session.queries) {
            this.queryBySchema = this.session.queries.reduce((acc: any, item) => {
                if (!acc[item.name]) {
                    acc[item.name] = []
                }
                acc[item.name].push(item);
                return acc;
            }, []);
        }
    }

    selectedRequest(event: { event: MouseEvent, row: any }) {
        console.log(event)
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/main/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session', 'main', event.row], { queryParams: { env: this.env } }); // TODO remove env FIX BUG
            }
        }
    }

    selectedFtp(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/main/${this.session.id}/ftp/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/main', this.session.id, 'ftp', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedLdap(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/main/${this.session.id}/ldap/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/main', this.session.id, 'ldap', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedSmtp(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/main/${this.session.id}/smtp/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/main', this.session.id, 'smtp', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
        }
    }

    selectedQuery(event: { event: MouseEvent, row: any }) { // TODO finish this
        if (event.row) {
            if (event.event.ctrlKey) {
                this._router.open(`#/session/main/${this.session.type}/${this.session.id}/database/${event.row}`, '_blank',)
            } else {
                this._router.navigate(['/session/main', this.session.type, this.session.id, 'database', event.row], {
                    queryParams: { env: this.instance.env }
                });
            }
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