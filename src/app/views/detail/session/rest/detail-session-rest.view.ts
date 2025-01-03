import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {InstanceEnvironment, InstanceRestSession} from "../../../../model/trace.model";
import {ActivatedRoute} from "@angular/router";
import {TraceService} from "../../../../service/trace.service";
import {Location} from "@angular/common";
import {catchError, combineLatest, finalize, forkJoin, Observable, of, Subscription, switchMap, EMPTY} from "rxjs";
import {application} from "../../../../../environments/environment";
import {Utils} from "../../../../shared/util";
import {EnvRouter} from "../../../../service/router.service";

@Component({
    templateUrl: './detail-session-rest.view.html',
    styleUrls: ['./detail-session-rest.view.scss'],
})
export class DetailSessionRestView implements OnInit, OnDestroy {
    private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
    private _traceService: TraceService = inject(TraceService);
    private _router: EnvRouter = inject(EnvRouter);
    private _location: Location = inject(Location);

    session: InstanceRestSession;
    instance: InstanceEnvironment;
    sessionParent: { id: string, type: string };
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
        this._traceService.getRestSession(id)
            .pipe(
                switchMap(s => {
                    return forkJoin({
                        session: of(s),
                        instance: this._traceService.getInstance(s.instanceId),
                        parent: this._traceService.getSessionParent(id).pipe(catchError(() => of(null))),
                        requests: (s.mask & 4) > 0 ? this._traceService.getRestRequests(s.id) : of([]),
                        queries: (s.mask & 2) > 0 ? this._traceService.getDatabaseRequests(s.id) : of([]),
                        stages: (s.mask & 1) > 0 ? this._traceService.getLocalRequests(s.id) : of([]),
                        ftps: (s.mask & 8) > 0 ? this._traceService.getFtpRequests(s.id) : of([]),
                        mails: (s.mask & 16) > 0 ? this._traceService.getSmtpRequests(s.id) : of([]),
                        ldaps: (s.mask & 32) > 0 ? this._traceService.getLdapRequests(s.id) : of([])
                    });
                }),
                finalize(() => this.isLoading = false)
            )
            .subscribe({
                next: result => {
                    this.session = result.session;
                    this.session.restRequests = result.requests;
                    this.session.databaseRequests = result.queries;
                    this.session.stages = result.stages;
                    this.session.ftpRequests = result.ftps;
                    this.session.mailRequests = result.mails;
                    this.session.ldapRequests = result.ldaps;
                    this.instance = result.instance;
                    this.sessionParent = result.parent;
                    this.groupQueriesBySchema();
                }
            });
    }

    selectedRequest(event: { event: MouseEvent, row: any }) {
        console.log(event)
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
        console.log(event)
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
            console.log(this.queryBySchema)
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