import {Component, inject, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, Subscription} from "rxjs";
import {app, makeDatePeriod} from "../../../../environments/environment";
import {InstanceService} from "../../../service/jquery/instance.service";
import {HttpParams} from "./_component/rest-tab/rest-tab.component";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {RestSessionService} from "../../../service/jquery/rest-session.service";
import {IPeriod, QueryParams} from "../../../model/conf.model";
import {extractPeriod} from "../../../shared/util";
import {EnvRouter} from "../../../service/router.service";
import {Location} from "@angular/common";
import {MainSessionService} from "../../../service/jquery/main-session.service";

@Component({
    templateUrl: './statistic-server.view.html',
    styleUrls: ['./statistic-server.view.scss']
})
export class StatisticServerView implements OnInit, OnDestroy {
    private _activatedRoute = inject(ActivatedRoute);
    private _router = inject(EnvRouter);
    private _location = inject(Location);
    private _instanceService = inject(InstanceService);
    private _restSessionService = inject(RestSessionService);
    private _mainSessionService = inject(MainSessionService);
    private subscriptions: Subscription[] = [];

    dateRangePicker = new FormGroup({
        start: new FormControl<Date | null>(null, [Validators.required]),
        end: new FormControl<Date | null>(null, [Validators.required]),
    })

    $httpParams: HttpParams;
    $lastServerInfo: {appName: string, version: string, collector: string, start: number};
    $countServerStart: number = 0;
    $countVersions: number = 0;

    $apiVersionFilter: string[] = [];
    $apiNameFilter: string[] = [];
    $apiUserFilter: string[] = [];
    $batchVersionFilter: string[] = [];
    $batchNameFilter: string[] = [];
    $batchUserFilter: string[] = [];

    apiNameSelected: string[] = [];
    apiNameSelectedCopy: string[] = [];

    batchNameSelected: string[] = [];
    batchNameSelectedCopy: string[] = [];

    apiVersionSelected: string[] = [];
    apiVersionSelectedCopy: string[] = [];

    batchVersionSelected: string[] = [];
    batchVersionSelectedCopy: string[] = [];

    apiUserSelected: string[] = [];
    apiUserSelectedCopy: string[] = [];

    batchUserSelected: string[] = [];
    batchUserSelectedCopy: string[] = [];

    indexTab: number = 0;

    params: Partial<{server: string, queryParams: QueryParams}> = {};

    isOpen: boolean = false;

    ngOnInit() {
        combineLatest({
            params: this._activatedRoute.params,
            queryParams: this._activatedRoute.queryParams
        }).subscribe({
            next: (v: { params: Params, queryParams: Params }) => {
                if(v.queryParams.start && v.queryParams.end) this.params = { server: v.params.server_name, queryParams: new QueryParams(new IPeriod(new Date(v.queryParams.start), new Date(v.queryParams.end)), v.queryParams.env || app.defaultEnv, []) };
                if(!v.queryParams.start && !v.queryParams.end)  {
                    this.params = { server: v.params.server_name, queryParams: new QueryParams(new IPeriod(makeDatePeriod(0, 1).start, makeDatePeriod(0, 1).end), v.queryParams.env || app.defaultEnv, []) };
                }
                this.indexTab = v.queryParams.tab || 0;
                if(this.indexTab == 0) this.params.queryParams.optional = {tab: '0', api_name:  !v.queryParams.api_name ? [] : Array.isArray(v.queryParams.api_name) ? v.queryParams.api_name : [v.queryParams.api_name], api_version: !v.queryParams.api_version ? [] : Array.isArray(v.queryParams.api_version) ? v.queryParams.api_version : [v.queryParams.api_version], api_user: !v.queryParams.api_user ? [] : Array.isArray(v.queryParams.api_user) ? v.queryParams.api_user : [v.queryParams.api_user] };
                else this.params.queryParams.optional = {tab: '1', batch_name:  !v.queryParams.batch_name ? [] : Array.isArray(v.queryParams.batch_name) ? v.queryParams.batch_name : [v.queryParams.batch_name], batch_version: !v.queryParams.batch_version ? [] : Array.isArray(v.queryParams.batch_version) ? v.queryParams.batch_version : [v.queryParams.batch_version], batch_user: !v.queryParams.batch_user ? [] : Array.isArray(v.queryParams.batch_user) ? v.queryParams.batch_user : [v.queryParams.batch_user] };
                this.patchDateValue(this.params.queryParams.period.start, new Date(this.params.queryParams.period.end.getFullYear(), this.params.queryParams.period.end.getMonth(), this.params.queryParams.period.end.getDate() - 1));
                this.$httpParams = {server: `"${this.params.server}"`, params: this.params.queryParams};
                this.init();
            }
        });
    }

    ngOnDestroy() {
    }

    onChangeEnd(event) {
        let start = this.dateRangePicker.controls.start.value;
        let end = this.dateRangePicker.controls.end.value;
        if(this.dateRangePicker.valid) {
            this.params.queryParams.period = new IPeriod(start, new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1));
            if(this.indexTab == 0) this.params.queryParams.optional = {tab: '0', api_name: [], api_version: [], api_user: [] };
            else this.params.queryParams.optional = {tab: '1', batch_name: [], batch_version: [], batch_user: [] };
            this._router.navigate([], {
                relativeTo: this._activatedRoute,
                queryParams: this.params.queryParams.buildParams(),
                state: { date: new Date().toISOString() }
            });
        }
    }

    patchDateValue(start: Date, end: Date) {
        this.dateRangePicker.patchValue({
            start: start,
            end: end
        }, {emitEvent: false, onlySelf: true});
    }

    getLastServerInfo() {
        return this._instanceService.getLastServerInfo({env: this.params.queryParams.env, appName: this.params.server})
            .subscribe({
                next: res => {
                    this.$lastServerInfo = res;
                }
            });
    }

    getCountVersions() {
        return this._instanceService.getCountVersions({env: this.params.queryParams.env, appName: this.params.server})
          .subscribe({
            next: res => {
                this.$countVersions = res;
            }
        });
    }

    getCountServerStart() {
        return this._instanceService.getCountServerStart({env: this.params.queryParams.env, appName: this.params.server}).subscribe({
            next: res => {
                this.$countServerStart = res;
            }
        })
    }

    // TAB 2
    getBatchNames() {
        return this._mainSessionService.getBatchNames({env: this.params.queryParams.env, appName: this.params.server, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end})
          .subscribe({
              next: res => {
                  this.$batchNameFilter = res;
                  this.batchNameSelected = this.params.queryParams.optional.batch_name || [];
                  this.batchNameSelectedCopy = [...this.batchNameSelected];
              }
          })
    }

    // TAB 1
    getRequestNames() {
        return this._restSessionService.getRequestNames({env: this.params.queryParams.env, appName: this.params.server, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end})
            .subscribe({
            next: res => {
                this.$apiNameFilter = res;
                this.apiNameSelected = this.params.queryParams.optional.api_name || [];
                this.apiNameSelectedCopy = [...this.apiNameSelected];
            }
        });
    }

    getRequestUsers() {
        return this._restSessionService.getUsers({env: this.params.queryParams.env, appName: this.params.server, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end}).subscribe({
            next: res => {
                this.$apiUserFilter = res;
                this.apiUserSelected = this.params.queryParams.optional.api_user || [];
                this.apiUserSelectedCopy = [...this.apiUserSelected];
            }
        });
    }

    getBatchUsers() {
        return this._mainSessionService.getUsers({env: this.params.queryParams.env, appName: this.params.server, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end}).subscribe({
            next: res => {
                this.$batchUserFilter = res;
                this.batchUserSelected = this.params.queryParams.optional.batch_user || [];
                this.batchUserSelectedCopy = [...this.batchUserSelected];
            }
        });
    }

    // TAB 1
    getVersionsRequest() {
        return this._instanceService.getVersionsRestSession({env: this.params.queryParams.env, appName: this.params.server, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end})
          .subscribe({
              next: res => {
                  this.$apiVersionFilter = res;
                  this.apiVersionSelected = this.params.queryParams.optional.api_version || [];
                  this.apiVersionSelectedCopy = [...this.apiVersionSelected];
              }
          });
    }

    // TAB 2
    getVersionsBatch() {
        return this._instanceService.getVersionsMainSession({env: this.params.queryParams.env, appName: this.params.server, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end})
          .subscribe({
              next: res => {
                  this.$batchVersionFilter = res;
                  this.batchVersionSelected = this.params.queryParams.optional.batch_version || [];
                  this.batchVersionSelectedCopy = [...this.batchVersionSelected];
              }
          });
    }

    onClickFilter() {
        this.apiNameSelectedCopy = [...this.apiNameSelected];
        this.batchNameSelectedCopy = [...this.batchNameSelected];
        this.apiVersionSelectedCopy = [...this.apiVersionSelected];
        this.batchVersionSelectedCopy = [...this.batchVersionSelected];
        this.apiUserSelectedCopy = [...this.apiUserSelected];
        this.batchUserSelectedCopy = [...this.batchUserSelected];
        if(this.indexTab == 0) this.params.queryParams.optional = {tab: '0', api_name: this.apiNameSelected, api_version: this.apiVersionSelected, api_user: this.apiUserSelected };
        else this.params.queryParams.optional = {tab: '1', batch_name: this.batchNameSelected, batch_version: this.batchVersionSelected, batch_user: this.batchUserSelected };
        this.$httpParams = {server: `"${this.params.server}"`, params: this.params.queryParams};
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.params.queryParams.buildPath()}`);
        this.isOpen = false;
    }

    onSelectedTabChange($event) {
        this.indexTab = $event.index;
        if(this.indexTab == 0) this.params.queryParams.optional = {tab: '0', api_name: this.apiNameSelected, api_version: this.apiVersionSelected, api_user: this.apiUserSelected };
        else this.params.queryParams.optional = {tab: '1', batch_name: this.batchNameSelected, batch_version: this.batchVersionSelected, batch_user: this.batchUserSelected };
        this.$httpParams = {server: `"${this.params.server}"`, params: this.params.queryParams};
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.params.queryParams.buildPath()}`);
    }

    onOverlayOutsideClick() {
        this.apiNameSelected = [...this.apiNameSelectedCopy];
        this.batchNameSelected = [...this.batchNameSelectedCopy];
        this.apiVersionSelected = [...this.apiVersionSelectedCopy];
        this.batchVersionSelected = [...this.batchVersionSelectedCopy];
        this.apiUserSelected = [...this.apiUserSelectedCopy];
        this.batchUserSelected = [...this.batchUserSelectedCopy];
        this.isOpen = false;
    }

    onApiNameSelectedChange($event) {
        this.apiNameSelected = $event;
    }

    onBatchNameSelectedChange($event) {
        this.batchNameSelected = $event;
    }

    onApiVersionSelectedChange($event) {
        this.apiVersionSelected = $event;
    }

    onBatchVersionSelectedChange($event) {
        this.batchVersionSelected = $event;
    }

    onApiUserSelectedChange($event) {
        this.apiUserSelected = $event;
    }

    onBatchUserSelectedChange($event) {
        this.batchUserSelected = $event;
    }

    init() {
        this.subscriptions.forEach(s => s.unsubscribe());
        this.subscriptions.push(this.getLastServerInfo());
        this.subscriptions.push(this.getCountServerStart());
        this.subscriptions.push(this.getCountVersions());
        this.subscriptions.push(this.getRequestNames());
        this.subscriptions.push(this.getRequestUsers());
        this.subscriptions.push(this.getVersionsRequest());
        this.subscriptions.push(this.getBatchNames());
        this.subscriptions.push(this.getBatchUsers());
        this.subscriptions.push(this.getVersionsBatch());
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.params.queryParams.buildPath()}`);
    }
}