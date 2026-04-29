import {Component, inject, OnDestroy, OnInit, ViewContainerRef} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Params} from "@angular/router";
import {combineLatest, finalize, Subscription} from "rxjs";
import {Location} from "@angular/common";
import {SessionKpiComponentResolverService} from "./session-kpi-component-resolver.service";
import {EnvRouter} from "../../../service/router.service";
import {IPeriod, QueryParams} from "../../../model/conf.model";
import {app, makeDatePeriod} from "../../../../environments/environment";
import {Constants} from "../../constants";
import {RestSessionService} from "../../../service/jquery/rest-session.service";
import {MainSessionService} from "../../../service/jquery/main-session.service";

@Component({
  templateUrl: './session-kpi.view.html',
  styleUrls: ['./session-kpi.view.scss']
})
export class SessionKpiView implements OnInit, OnDestroy {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(EnvRouter);
  private readonly _componentResolver = inject(SessionKpiComponentResolverService);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _restSessionService = inject(RestSessionService);
  private readonly _mainSessionService = inject(MainSessionService);

  private readonly _location = inject(Location);

  MAPPING_TYPE = Constants.MAPPING_TYPE;

  serverNameIsLoading: boolean;
  nameDataList: any[] = [];
  filterForm = new FormGroup({
    host: new FormControl([""]),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });
  hostSubscription: Subscription;
  params: Partial<{type: 'rest' | 'batch', queryParams: QueryParams}> = {};
  serviceType: { [key: string]: {service : RestSessionService | MainSessionService }  } = {
    "rest": { service: this._restSessionService },
    "batch": { service: this._mainSessionService }
  };

  ngOnInit() {
    combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams}).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {
        this.params.type = v.params.session_type;
        this.params.queryParams = new QueryParams(new IPeriod(v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(0, 1).start, v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(0, 1).end), v.queryParams.env || app.defaultEnv,null,!v.queryParams.host ? [] : Array.isArray(v.queryParams.host) ? v.queryParams.host : [v.queryParams.host])
        this.patchDateValue(this.params.queryParams.period.start, new Date(this.params.queryParams.period.end.getFullYear(), this.params.queryParams.period.end.getMonth(), this.params.queryParams.period.end.getDate() - 1));
        this.getHosts();
        if(this.params.type) {
          const componentType = this._componentResolver.resolveComponent(this.params.type);
          this.loadComponent(componentType);
        }
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.params.queryParams.buildPath()}`);
      }
    });
  }

  ngOnDestroy() {
    if(this.hostSubscription) {
      this.hostSubscription.unsubscribe();
    }
  }

  onChangeEnd() {
    this.search();
  }

  patchDateValue(start: Date, end: Date) {
    this.filterForm.controls.dateRange.patchValue({
      start: start,
      end: end
    }, {emitEvent: false, onlySelf: true});
  }

  private loadComponent(componentType: any): void {
    this._viewContainerRef.clear();
    let componentRef = this._viewContainerRef.createComponent(componentType);
    componentRef.setInput('queryParams', this.params.queryParams);
  }

  getHosts(){
    if(this.hostSubscription){
      this.hostSubscription.unsubscribe();
    }
    this.nameDataList = null;
    this.serverNameIsLoading = true;
    this.hostSubscription = this.serviceType[this.params.type].service.getHosts({ env: this.params.queryParams.env, start: this.params.queryParams.period.start, end: this.params.queryParams.period.end})
        .pipe(finalize(()=> this.serverNameIsLoading = false))
        .subscribe({
          next: res => {
            this.nameDataList = res.map(r => r.host);
            this.patchHostValue(this.params.queryParams.hosts);
          }, error: (e) => {
            console.log(e)
          }
        });
  }

  patchHostValue(hosts: any[]) {
    this.filterForm.patchValue({
      host: hosts
    },{ emitEvent: false })
  }

  search(){
    if(this.filterForm.valid) {
      let start = this.filterForm.controls.dateRange.controls.start.value;
      let end = this.filterForm.controls.dateRange.controls.end.value;
      this.params.queryParams.period = new IPeriod(start, new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1));
      this._router.navigate([], {
        relativeTo: this._activatedRoute,
        queryParams: this.params.queryParams.buildParams()
      });
    }
  }

  onChangeHost() {
    if (this.filterForm.controls.host.value.includes('global')) {
      // Si "Global" est sélectionné, vider le tableau des hosts
      this.params.queryParams.hosts = [];
    } else {
      // Sinon, utiliser les valeurs sélectionnées
      this.params.queryParams.hosts = [...this.filterForm.controls.host.value];
    }
  }

  onHostopenedChange() {
    let doSearch = this.params.queryParams.hosts != this.filterForm.controls.host.value;
    this.params.queryParams.hosts = [...this.filterForm.controls.host.value];
    doSearch && this.search();
  }
}

