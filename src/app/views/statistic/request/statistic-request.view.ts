import {Component, inject, OnDestroy, OnInit, ViewContainerRef} from "@angular/core";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Params} from "@angular/router";
import {EnvRouter} from "../../../service/router.service";
import {IPeriod, QueryParams} from "../../../model/conf.model";
import {app, makeDatePeriod} from "../../../../environments/environment";
import {StatisticComponentResolverService} from "./statistic-component-resolver.service";
import {DatabaseRequestService} from "../../../service/jquery/database-request.service";
import {combineLatest, finalize, Subscription} from "rxjs";
import {RestRequestService} from "../../../service/jquery/rest-request.service";
import {FtpRequestService} from "../../../service/jquery/ftp-request.service";
import {SmtpRequestService} from "../../../service/jquery/smtp-request.service";
import {LdapRequestService} from "../../../service/jquery/ldap-request.service";

@Component({
  templateUrl: './statistic-request.view.html',
  styleUrls: ['./statistic-request.view.scss']
})
export class StatisticRequestView implements OnInit, OnDestroy {
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(EnvRouter);
  private readonly _componentResolver = inject(StatisticComponentResolverService);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _restRequestService = inject(RestRequestService);
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private readonly _ftpRequestService = inject(FtpRequestService);
  private readonly _smtpRequestService = inject(SmtpRequestService);
  private readonly _ldapRequestService = inject(LdapRequestService);
  private readonly _datebaseService = inject(DatabaseRequestService);


  isOpen: boolean = false;



  nameDataList: any[] =[];
  filterForm = new FormGroup({
    group: new FormControl(),
    cross: new FormControl(),
    host: new FormControl([""]),
    type: new FormControl<'jdbc' | 'ftp' | 'smtp' | 'ldap' | 'rest' | null>(null, [Validators.required]),
    dateRange: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });
  serverNameIsLoading:boolean;
  hostSubscription: Subscription;
  params: Partial<{type: 'jdbc' | 'ftp' | 'smtp' | 'ldap' | 'rest', queryParams: QueryParams}> = {};
  seviceType: { [key: string]: {service : RestRequestService | DatabaseRequestService | FtpRequestService | SmtpRequestService | LdapRequestService, } } =
      {
        "rest": { service: this._restRequestService },
        "jdbc": { service: this._databaseRequestService },
        "ftp" :  { service: this._ftpRequestService },
        "smtp": { service: this._smtpRequestService },
        "ldap": { service: this._ldapRequestService },
      }



  ngOnInit() {
    combineLatest({
      params: this._activatedRoute.params,
      queryParams: this._activatedRoute.queryParams}).subscribe({
      next: (v: { params: Params, queryParams: Params }) => {
        this.params.type = v.params.request_type;
        this.params.queryParams = new QueryParams(new IPeriod(v.queryParams.start ? new Date(v.queryParams.start) : makeDatePeriod(0, 1).start, v.queryParams.end ? new Date(v.queryParams.end) : makeDatePeriod(0, 1).end), v.queryParams.env || app.defaultEnv,null,!v.queryParams.host ? [] : Array.isArray(v.queryParams.host) ? v.queryParams.host : [v.queryParams.host])
        this.patchTypeValue();
        this.params.queryParams.optional = {...this.params.queryParams.optional, cross: v.queryParams.cross || "user", group: v.queryParams.group || "date"};
        this.patchGroupValue(this.params.queryParams.optional.group);
        this.patchCrossValue(this.params.queryParams.optional.cross);
        this.filterForm.controls.group.valueChanges.subscribe({
          next: (value) => {
            this.params.queryParams.optional = {...this.params.queryParams.optional, group: value};
          }
        });
        this.filterForm.controls.cross.valueChanges.subscribe({
          next: (value) =>{
            this.params.queryParams.optional = {...this.params.queryParams.optional, cross: value};
          }
        });

        this.patchDateValue(this.params.queryParams.period.start, new Date(this.params.queryParams.period.end.getFullYear(), this.params.queryParams.period.end.getMonth(), this.params.queryParams.period.end.getDate() - 1));
        this.getHosts();
        if(this.params.type) {
          const componentType = this._componentResolver.resolveComponent(this.params.type);
          this.loadComponent(componentType);
        }
      }
    });
  }

  ngOnDestroy() {

  }



  onChangeEnd(event) {
    this.search();
  }
 on
  patchTypeValue() {
    this.filterForm.patchValue({
      type: this.params.type
    }, {emitEvent: false, onlySelf: true});
  }

  patchDateValue(start: Date, end: Date) {
    this.filterForm.controls.dateRange.patchValue({
      start: start,
      end: end
    }, {emitEvent: false, onlySelf: true});
  }
  onOverlayOutsideClick() {
  //this.isOpen = false;
  }

  onClickFilter() {

    this.isOpen = false;

    this._router.navigate([], {
      relativeTo: this._activatedRoute,
      queryParams: this.params.queryParams.buildParams(),
    });
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
    this.nameDataList =null;
    this.serverNameIsLoading =true;
    this.hostSubscription = this.seviceType[this.params.type].service.getHost(this.params.type, { env: this.params.queryParams.env, start: this.params.queryParams.period.start.toISOString(), end: this.params.queryParams.period.end.toISOString()})
        .pipe(finalize(()=> this.serverNameIsLoading = false))
        .subscribe({
          next: res => {
            this.nameDataList = res;
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

  onChangeHost($event){
    if (this.filterForm.controls.host.value.includes('global')) {
      // Si "Global" est sélectionné, vider le tableau des hosts
      this.params.queryParams.hosts = [];
    } else {
      // Sinon, utiliser les valeurs sélectionnées
      this.params.queryParams.hosts = [...this.filterForm.controls.host.value];
    }
    console.log( this.params.queryParams)
  }

  onHostopenedChange($event){
    let doSearch= this.params.queryParams.hosts != this.filterForm.controls.host.value;
    this.params.queryParams.hosts = [...this.filterForm.controls.host.value];
    doSearch && this.search();
  }

  onGroupChange($event){

    this.params.queryParams.optional = {...this.params.queryParams.optional, group: $event.value};
  }

  onCrossChange($event){

    this.params.queryParams.optional = {...this.params.queryParams.optional, cross: $event.value};
  }

  patchGroupValue(group: string){
    this.filterForm.patchValue({
      group: group
    },{ emitEvent: false })
  }

  patchCrossValue(cross: string){
    this.filterForm.patchValue({
      cross: cross
    },{ emitEvent: false })
  }
}