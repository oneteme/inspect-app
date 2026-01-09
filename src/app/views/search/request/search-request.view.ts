import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort'
import {Location} from '@angular/common';
import {ActivatedRoute, Params} from '@angular/router';
import {combineLatest, finalize, Subscription} from 'rxjs';
import {extractPeriod} from 'src/app/shared/util';
import {app} from 'src/environments/environment';
import {Constants} from '../../constants';
import {EnvRouter} from "../../../service/router.service";
import {DateAdapter, MAT_DATE_FORMATS,} from "@angular/material/core";
import {CustomDateAdapter} from "../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../shared/material/custom-date-range-selection-strategy";
import {IPeriod, IStep, IStepFrom, QueryParams} from "../../../model/conf.model";
import {RestRequestService} from "../../../service/jquery/rest-request.service";
import {DatabaseRequestService} from "../../../service/jquery/database-request.service";
import {FtpRequestService} from "../../../service/jquery/ftp-request.service";
import {SmtpRequestService} from "../../../service/jquery/smtp-request.service";
import {LdapRequestService} from "../../../service/jquery/ldap-request.service";



@Component({
  templateUrl: './search-request.view.html',
  styleUrls: ['./search-request.view.scss'],
  providers: [
    {
      provide: DateAdapter, useClass: CustomDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS
    },
    {
      provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy
    }
  ]
})
export class SearchRequestView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _restRequestService = inject(RestRequestService);
  private readonly _databaseRequestService = inject(DatabaseRequestService);
  private readonly _ftpRequestService = inject(FtpRequestService);
  private readonly _smtpRequestService = inject(SmtpRequestService);
  private readonly _ldapRequestService = inject(LdapRequestService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);


  REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;
  nameDataList: any[];
  displayedColumns: string[] = ['rangestatus', 'app_name', 'method/path', 'query', 'start', 'durée', 'user'];
  requests: any[];
  isLoading = true;
  serverNameIsLoading = true;
  requestFilterForm = new FormGroup({
    host: new FormControl([]),
    rangestatus: new FormControl([]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  queryParams: Partial<QueryParams> = {};
  params: Partial<Params> = {};
  subscriptions: Subscription[] = [];
  hostSubscription: Subscription;
  RequestSubscription: Subscription;
  seviceType: { [key: string]: {service : RestRequestService | DatabaseRequestService | FtpRequestService | SmtpRequestService | LdapRequestService,
                                filters: {icon: string, label: string,color: string, value: any}[]
  }
  } =
      {
        "rest": { service: this._restRequestService, filters:  [{icon: 'warning', label: '5xx', color:'#bb2124', value: '5xx'}, {icon: 'error', label: '4xx',color:'#f9ad4e', value:'4xx'}, {icon: 'done', label: '2xx',color:'#22bb33', value:'2xx'}, {icon: 'priority_high', label: '0', color:'gray', value:'0xx'}, {icon: 'pending', label: 'En cours', color:'#2196F3', value:'lazy'}]},
        "jdbc": { service: this._databaseRequestService, filters:  [{icon: 'warning', label: 'KO', color:'#bb2124', value: 'Ok'}, {icon: 'done', label: 'OK',color:'#22bb33', value: 'Ko'}, {icon: 'pending', label: 'En cours', color:'#2196F3', value:'lazy'}] },
        "ftp" :  { service: this._ftpRequestService, filters:  [{icon: 'warning', label: 'KO', color:'#bb2124', value: 'Ok'}, {icon: 'done', label: 'OK',color:'#22bb33', value: 'Ko'}, {icon: 'pending', label: 'En cours', color:'#2196F3', value:'lazy'}] },
        "smtp": { service: this._smtpRequestService, filters:  [{icon: 'warning', label: 'KO', color:'#bb2124', value: 'Ok'}, {icon: 'done', label: 'OK',color:'#22bb33', value: 'Ko'}, {icon: 'pending', label: 'En cours', color:'#2196F3', value:'lazy'}] },
        "ldap": { service: this._ldapRequestService, filters:  [{icon: 'warning', label: 'KO', color:'#bb2124', value: 'Ok'}, {icon: 'done', label: 'OK',color:'#22bb33', value: 'Ko'}, {icon: 'pending', label: 'En cours', color:'#2196F3', value:'lazy'}] },
      }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  onChangeStart(event) {
    this.requestFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({onlySelf: true})
    let start = this.requestFilterForm.controls.dateRangePicker.controls.start.value;
    let end = this.requestFilterForm.controls.dateRangePicker.controls.end.value || null;
    this.queryParams.period = new IPeriod(start, end);
  }

  onChangeEnd(event) {
    this.requestFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({onlySelf: true})
    let start = this.requestFilterForm.controls.dateRangePicker.controls.start.value || null;
    let end = this.requestFilterForm.controls.dateRangePicker.controls.end.value;
    this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
    if(start && end){
      this.getHosts()
    }
  }

  onChangeHost($event){
    this.queryParams.hosts = this.requestFilterForm.controls.host.value;
  }
  onChangeStatus($event){
    this.queryParams.rangestatus = this.requestFilterForm.controls.rangestatus.value && this.requestFilterForm.controls.rangestatus.value.map((f:{icon: string, label: string,color: string, value: any}) => f.value)
  }



  constructor() {

    this.subscriptions.push(combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
      ]).subscribe({
      next: ([params, queryParams]) => {
          this.params.type = params.type || 'rest';
          if(queryParams.start && queryParams.end) this.queryParams = new QueryParams(new IPeriod(new Date(queryParams.start), new Date(queryParams.end)), queryParams.env ||  app.defaultEnv,null,!queryParams.host ? [] : Array.isArray(queryParams.host) ? queryParams.host : [queryParams.host],!queryParams.rangestatus ? []: Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus] )
          if(!queryParams.start && !queryParams.end){
            let period;
            if(queryParams.step && queryParams.from){
                period = new IStepFrom(queryParams.step, queryParams.from);
            } else if(queryParams.step){
                period = new IStep(queryParams.step);
            }
            this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), queryParams.env || app.defaultEnv, null, !queryParams.host ? [] : Array.isArray(queryParams.host) ? queryParams.host : [queryParams.host],!queryParams.rangestatus ? [/*this.seviceType[this.params.type].filters[0].value*/]: Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus] );
          }
          if(queryParams.q){
            this.queryParams.optional = { 'q': queryParams.q }
          }
          this.patchStatusValue(this.queryParams.rangestatus)
          this.patchHostValue(this.queryParams.hosts);
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));
          this.getHosts();
          this.getRequests();
          this._location.replaceState(`${this._router.url.split('?')[0]}?${this.queryParams.buildPath()}`);
        }
      }));
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.hostSubscription.unsubscribe();
    this.RequestSubscription.unsubscribe();
  }

  search() {
    if (this.requestFilterForm.valid) {
      this.queryParams.buildParams()
      if(!shallowEqual(this._activatedRoute.snapshot.queryParams, this.queryParams.buildParams())) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParams: this.queryParams.buildParams()
        });
      } else {
        if(this.queryParams.period instanceof IStep) {
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));
        }
        this.getRequests();
      }
    }
  }

  getHosts(){
    if(this.hostSubscription){
        this.hostSubscription.unsubscribe();
    }
    this.nameDataList =null;
    this.serverNameIsLoading =true;
    this.hostSubscription = this.seviceType[this.params.type].service.getHost(this.params.type, { env: this.queryParams.env, start: this.queryParams.period.start.toISOString(), end: this.queryParams.period.end.toISOString()})
        .pipe(finalize(()=> this.serverNameIsLoading = false))
        .subscribe({
          next: res => {
            this.nameDataList = res;
            this.patchHostValue(this.queryParams.hosts);
          }, error: (e) => {
            console.log(e)
          }
        });
  }

  getRequests() {

    if(this.RequestSubscription){
      this.RequestSubscription.unsubscribe();
      this.isLoading =false;
    }
    this.requests = null;
    this.isLoading = true;
    this.RequestSubscription = (<any>this.seviceType[this.params.type]).service.getRequests({
      'env': this.queryParams.env,
      'host': this.queryParams.hosts,
      'rangestatus': this.queryParams.rangestatus.filter(r => r != 'lazy').map(r => {
        if(r == 'Ok') return true;
        if(r == 'Ko') return false;
        return r;
      }),
      'lazy': !!this.queryParams.rangestatus.find(r => r == 'lazy'),
      'start': this.queryParams.period.start.toISOString(),
      'end': this.queryParams.period.end.toISOString()
    })
      .pipe(finalize(()=> this.isLoading = false))
      .subscribe({
        next: (d: any) => {
          if (d) {
            this.requests = d
          }
          this.isLoading = false;
        },
        error: err => {
          this.isLoading = false;
        }
      });
  }

  patchDateValue(start: Date, end: Date) {
    this.requestFilterForm.patchValue({
      dateRangePicker: {
        start: start,
        end: end
      }
    }, { emitEvent: false });
  }

  patchHostValue(hosts: any[]) {
    this.requestFilterForm.patchValue({
      host: hosts
    },{ emitEvent: false })
  }

  patchStatusValue(rangestatus:any[]){
    this.requestFilterForm.patchValue({
      rangestatus: this.seviceType[this.params.type].filters.filter((f:any)=> rangestatus.toString().includes(f.value))
    },{ emitEvent: false })
  }

  selectedRemote(event: { event: MouseEvent, row: any }) {
    event.event.stopPropagation();
    if (event.event.ctrlKey) {
      this._router.open(`#/session/rest/${event.row}`, '_blank')
    } else {
      this._router.navigate(['/session/rest', event.row]);
    }
  }

  selectedRest(event: { event: MouseEvent, row: any }) {
    event.event.stopPropagation();
    if (event.event.ctrlKey) {
      this._router.open(`#/request/rest/${event.row}`, '_blank')
    } else {
      this._router.navigate(['/request/rest', event.row], {
        queryParams: { env: this.queryParams.env }
      });
    }
  }

  selectedSmtp(event: { event: MouseEvent, row: any }) {
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/smtp/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/smtp`, event.row], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
  }

  selectedLdap(event: { event: MouseEvent, row: any }) {
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/ldap/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/ldap`, event.row], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
  }

  selectedFtp(event: { event: MouseEvent, row: any }) {
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/ftp/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/ftp`, event.row], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
  }

  selectedQuery(event: { event: MouseEvent, row: any }) {
    if (event.row) {
      if (event.event.ctrlKey) {
        this._router.open(`#/request/jdbc/${event.row}`, '_blank',)
      } else {
        this._router.navigate([`/request/jdbc`, event.row], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
}

}



export function shallowEqual(
    a: {[key: string | symbol]: any},
    b: {[key: string | symbol]: any},
): boolean {
  // While `undefined` should never be possible, it would sometimes be the case in IE 11
  // and pre-chromium Edge. The check below accounts for this edge case.
  const k1 = a ? getDataKeys(a) : undefined;
  const k2 = b ? getDataKeys(b) : undefined;
  if (!k1 || !k2 || k1.length != k2.length) {
    return false;
  }
  let key: string | symbol;
  for (let i = 0; i < k1.length; i++) {
    key = k1[i];
    if (!equalArraysOrString(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Gets the keys of an object, including `symbol` keys.
 */
export function getDataKeys(obj: Object): Array<string | symbol> {
  return [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)];
}

/**
 * Test equality for arrays of strings or a string.
 */
export function equalArraysOrString(a: string | string[], b: string | string[]) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    const aSorted = [...a].sort();
    const bSorted = [...b].sort();
    return aSorted.every((val, index) => bSorted[index] === val);
  } else {
    return a === b;
  }
}


