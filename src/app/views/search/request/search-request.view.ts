import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Location} from '@angular/common';
import {ActivatedRoute, Params} from '@angular/router';
import {BehaviorSubject, combineLatest, finalize, Observable, Subscription} from 'rxjs';
import {extractPeriod, Utils} from 'src/app/shared/util';
import {TraceService} from 'src/app/service/trace.service';
import {app, makeDatePeriod,} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset} from '../../constants';
import {FilterService} from 'src/app/service/filter.service';
import {
  DatabaseRequest,
  FtpRequest,
  InstanceRestSession,
  Label,
  MailRequest, NamingRequest,
  RestRequest
} from 'src/app/model/trace.model';
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {DateAdapter, MAT_DATE_FORMATS,} from "@angular/material/core";
import {CustomDateAdapter} from "../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../shared/material/custom-date-range-selection-strategy";
import {IPeriod, IStep, IStepFrom, QueryParams} from "../../../model/conf.model";
import {RestRequestService} from "../../../service/jquery/rest-request.service";
import {DatabaseRequestService} from "../../../service/jquery/database-request.service";
import {FtpRequestService} from "../../../service/jquery/ftp-request.service";
import {smtpRequestService} from "../../../service/jquery/smtp-request.service";
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
  private readonly _smtpRequestService = inject(smtpRequestService);
  private readonly _ldapRequestService = inject(LdapRequestService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);


  REQUEST_TYPE = Constants.REQUEST_MAPPING_TYPE;
  nameDataList: any[];
  displayedColumns: string[] = ['rangestatus', 'app_name', 'method/path', 'query', 'start', 'durée', 'user'];
  requests:any[];
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

  filterTable = new Map<string, any>();

  queryParams: Partial<QueryParams> = {};
  params: Partial<Params> = {};
  subscriptions: Subscription[] = [];
  hostSubscription: Subscription;
  RequestSubscription: Subscription;
  seviceType: { [key: string]: {service : RestRequestService | DatabaseRequestService | FtpRequestService | smtpRequestService | LdapRequestService,
                                filters: {icon: string, label: string,color: string, value: any}[]
  }
  } =
      {
        "rest": { service: this._restRequestService, filters:  [{icon: 'warning', label: '5xx',color:'#bb2124', value:'5xx'}, {icon: 'error', label: '4xx',color:'#f9ad4e', value:'4xx'}, {icon: 'done', label: '2xx',color:'#22bb33', value:'2xx'}]},
        "database": { service: this._databaseRequestService, filters:  [{icon: 'warning', label: 'KO',color:'#bb2124', value: false}, {icon: 'done', label: 'OK',color:'#22bb33', value: true}] },
        "ftp" :  { service: this._ftpRequestService, filters:  [{icon: 'warning', label: 'KO',color:'#bb2124', value: false}, {icon: 'done', label: 'OK',color:'#22bb33', value: true}] },
        "smtp": { service: this._smtpRequestService, filters:  [{icon: 'warning', label: 'KO',color:'#bb2124', value: false}, {icon: 'done', label: 'OK',color:'#22bb33', value: true}] },
        "ldap": { service: this._ldapRequestService, filters:  [{icon: 'warning', label: 'KO',color:'#bb2124', value: false}, {icon: 'done', label: 'OK',color:'#22bb33', value: true}] },
      }

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  onChangeStart(event) {
    this.requestFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({onlySelf: true})
    let start = this.requestFilterForm.controls.dateRangePicker.controls.start.value;
    let end = this.requestFilterForm.controls.dateRangePicker.controls.end.value || null;
    console.log(this.requestFilterForm.controls.dateRangePicker.controls.end.valid)
    this.queryParams.period = new IPeriod(start, end);
    if(start && end /*&& this.requestFilterForm.controls.dateRangePicker.controls.end.valid && start != this.queryParams.period.start*/){
      console.log("getting host from start ")
      this.getHosts()
    }

  }


  onChangeEnd(event) {
    this.requestFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({onlySelf: true})
    let start = this.requestFilterForm.controls.dateRangePicker.controls.start.value || null;
    let end = this.requestFilterForm.controls.dateRangePicker.controls.end.value;

    this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
    if(start && end /*&& end != this.queryParams.period.end*/){
      console.log("getting host from end ")
      this.getHosts()
    }
  }

  onChangeHost($event){
    this.queryParams.hosts = this.requestFilterForm.controls.host.value;
  }
  onChangeStatus($event){
    /*if(this.requestFilterForm.controls.rangestatus.value.length == this.seviceType[this.params.type].filters.length) { // might remove this ? or improve it ?
      this.requestFilterForm.controls.rangestatus.setValue([]);
    }*/
    this.queryParams.rangestatus = this.requestFilterForm.controls.rangestatus.value && this.requestFilterForm.controls.rangestatus.value.map((f:{icon: string, label: string,color: string, value: any}) => f.value)

    console.log(this.queryParams.buildParams())
  }



  constructor() {

    this.subscriptions.push(combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
      ]).subscribe({
      next: ([params, queryParams]) => {
          this.params.type = params.type || 'rest';
          if(queryParams.start && queryParams.end) this.queryParams = new QueryParams(new IPeriod(new Date(queryParams.start), new Date(queryParams.end)), queryParams.env ||  app.defaultEnv,null,!queryParams.host ? [] : Array.isArray(queryParams.host) ? queryParams.host : [queryParams.host],!queryParams.rangestatus ? [/*this.seviceType[this.params.type].filters[0].value*/]: Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus] )
          if(!queryParams.start && !queryParams.end){
            let period;
            if(queryParams.step && queryParams.from){
                period = new IStepFrom(queryParams.step, queryParams.from);
            } else if(queryParams.step){
                period = new IStep(queryParams.step);
            }
            this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), queryParams.env || app.defaultEnv, null, !queryParams.host ? [] : Array.isArray(queryParams.host) ? queryParams.host : [queryParams.host],!queryParams.rangestatus ? [/*this.seviceType[this.params.type].filters[0].value*/]: Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus] );
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
  }

  search() {
    if (this.requestFilterForm.valid) {
      this.queryParams.buildParams()
      console.log(this.queryParams)
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
    this.hostSubscription = this.seviceType[this.params.type].service.getHost({ env: this.queryParams.env, start: this.queryParams.period.start, end: this.queryParams.period.end, type: 'SERVER'})
        .pipe(finalize(()=> this.serverNameIsLoading = false))
        .subscribe({
          next: res => {
            this.nameDataList = res.map(r => r.host);
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
    let params = {
      'env': this.queryParams.env,
      'host': this.queryParams.hosts,
      'rangestatus': this.queryParams.rangestatus,
      'start': this.queryParams.period.start.toISOString(),
      'end': this.queryParams.period.end.toISOString()
    };
    this.requests = null;
    this.isLoading = true;
    this.RequestSubscription = (<any>this.seviceType[this.params.type]).service.getRequests(params)
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
      rangestatus: this.seviceType[this.params.type].filters.filter((f:any)=> rangestatus.includes(f.value))
    },{ emitEvent: false })
  }

  selectedRestRequest(event: { event: MouseEvent, row: any }) {
    event.event.stopPropagation();
    if (event.event.ctrlKey) {
      this._router.open(`#/session/rest/${event.row}`, '_blank')
    } else {
      this._router.navigate(['/session/rest', event.row]);
    }
  }


  selectedSmtp(event: { event: MouseEvent, row: any }) { // TODO finish this
    console.log(event)
    if (event.row) {
      let segment = 'rest';
      if(event.row.type) segment = `main/${event.row.type}`;
      if (event.event.ctrlKey) {
        this._router.open(`#/session/${segment}/${event.row.id}/smtp/${event.row.idRequest}`, '_blank',)
      } else {
        console.log(`#/session/${segment}/${event.row.id}/smtp/${event.row.idRequest}`)
        this._router.navigate([`/session/${segment}`, event.row.id, 'smtp', event.row.idRequest], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
  }

  selectedLdap(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      let segment = 'rest';
      if(event.row.type) segment = `main/${event.row.type}`;
      if (event.event.ctrlKey) {
        this._router.open(`#/session/${segment}/${event.row.id}/ldap/${event.row.idRequest}`, '_blank',)
      } else {
        this._router.navigate([`/session/${segment}`, event.row.id, 'ldap', event.row.idRequest], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
  }

  selectedFtp(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      let segment = 'rest';
      if(event.row.type) segment = `main/${event.row.type}`;
      if (event.event.ctrlKey) {
        this._router.open(`#/session/${segment}/${event.row.id}/ftp/${event.row.idRequest}`, '_blank',)
      } else {
        this._router.navigate([`/session/${segment}`, event.row.id, 'ftp', event.row.idRequest], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
  }

  selectedQuery(event: { event: MouseEvent, row: any }) { // TODO finish this
    if (event.row) {
      let segment = 'rest';
      if(event.row.type) segment = `main/${event.row.type}`;
      if (event.event.ctrlKey) {
        this._router.open(`#/session/${segment}/${event.row.id}/database/${event.row.idRequest}`, '_blank',)
      } else {
        this._router.navigate([`/session/${segment}`, event.row.id, 'database', event.row.idRequest], {
          queryParams: { env: this.queryParams.env }
        });
      }
    }
}



}

const sortingDataAccessor = (row: any, columnName: string) => {
  if (columnName == "app_name") return row["appName"] as string;
  if (columnName == "name/port") return row["host"] + ":" + row["port"] as string;
  if (columnName == "method/path") return row['path'] as string;
  if (columnName == "start") return row['start'] as string;
  if (columnName == "durée") return (row["end"] - row["start"])

  return row[columnName as keyof any] as string;
};

const filterPredicate = (data: InstanceRestSession, filter: string) => {
  var map: Map<string, any> = new Map(JSON.parse(filter));
  let isMatch = true;
  for (let [key, value] of map.entries()) {
    if (key == 'filter') {
      isMatch = isMatch && (value == '' || (data.appName?.toLowerCase().includes(value) ||
          data.method?.toLowerCase().includes(value) || data.query?.toLowerCase().includes(value) ||
          data.user?.toLowerCase().includes(value) || data.path?.toLowerCase().includes(value)));
    } else if (key == 'statusx') {
      const s = data.status.toString();
      isMatch = isMatch && (!value.length || (value.some((status: any) => {
        return s.startsWith(status[0]);
      })));
    }
  }
  return isMatch;
};



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


