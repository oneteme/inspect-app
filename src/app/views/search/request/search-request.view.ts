import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Location} from '@angular/common';
import {ActivatedRoute, Params} from '@angular/router';
import {BehaviorSubject, finalize, Observable, Subscription} from 'rxjs';
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
  private _router = inject(EnvRouter);
  private _instanceService = inject(InstanceService);
  private _restRequestService = inject(RestRequestService);
  private _databaseRequestService = inject(DatabaseRequestService);
  private _ftpRequestService = inject(FtpRequestService);
  private _smtpRequestService = inject(smtpRequestService);
  private _ldapRequestService = inject(LdapRequestService);
  private _activatedRoute = inject(ActivatedRoute);
  private _location = inject(Location);


  MAPPING_TYPE = Constants.MAPPING_TYPE;
  filterConstants = FilterConstants;
  nameDataList: any[];
  displayedColumns: string[] = ['status', 'app_name', 'method/path', 'query', 'start', 'durée', 'user'];
  dataSource: MatTableDataSource<RestRequest|DatabaseRequest|FtpRequest|MailRequest|NamingRequest> = new MatTableDataSource();
  isLoading = true;
  serverNameIsLoading = true;
  
  requestFilterForm = new FormGroup({
    appname: new FormControl([]),
    requestType : new FormControl('REST'),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  filterTable = new Map<string, any>();
  queryParams: Partial<QueryParams> = {};
  subscriptions: Subscription[] = [];
  subscription: Subscription;

  seviceType: { [key: string]: (params :any) => Observable<RestRequest[]|DatabaseRequest[]|FtpRequest[]|MailRequest[]|NamingRequest[]> } =
      {
        "REST": (params) => this._restRequestService.getRestRequests(params),
        "JDBC": (params) => this._databaseRequestService.getDatabaseRequest(params),
        "FTP": (params) => this._ftpRequestService.getftp(params),
        "SMTP": (params) => this._smtpRequestService.getsmtp(params),
        "LDAP": (params) => this._ldapRequestService.getLdap(params),
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
  }

  onChangeServer($event){
    this.queryParams.servers = this.requestFilterForm.controls.appname.value;
  }

  onChangeRequestType($event){
    this.queryParams.requestType = this.requestFilterForm.controls.requestType.value;
  }

  constructor() {

    this.subscriptions.push(this._activatedRoute.queryParams
      .subscribe({
        next: (params: Params) => {
           if(params.start && params.end) this.queryParams = new QueryParams(new IPeriod(new Date(params.start), new Date(params.end)), params.env ||  app.defaultEnv, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server],!params.requestType ? "REST" : params.requestType)
           if(!params.start && !params.end)  {
            let period;
            if(params.step && params.from){
                period = new IStepFrom(params.step, params.from);
            } else if(params.step){
                period = new IStep(params.step);
            }
            this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), params.env || app.defaultEnv, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server],!params.requestType ? "REST" : params.requestType);
          }
          this.patchRequestTypeValue(this.queryParams.requestType);
          this.patchServerValue(this.queryParams.servers);
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));


          this.subscriptions.push(this._instanceService.getApplications('SERVER')
            .pipe(finalize(()=> this.serverNameIsLoading = false))
            .subscribe({
              next: res => {
                this.nameDataList = res.map(r => r.appName);
                this.patchServerValue(this.queryParams.servers);
              }, error: (e) => {
                console.log(e)
              }
            }));
          // add type
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

  getRequests() {
    if(this.subscription) this.subscription.unsubscribe();
    let params = {
      'env': this.queryParams.env,
      'appname': this.queryParams.servers,
      'start': this.queryParams.period.start.toISOString(),
      'end': this.queryParams.period.end.toISOString()
    };

    this.isLoading = true;
    this.dataSource = new MatTableDataSource([]);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.subscription = this.seviceType[this.queryParams.requestType](params)
      .subscribe({
        next: (d: any) => {
          if (d) {
            this.dataSource = new MatTableDataSource(d);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = sortingDataAccessor;
            this.dataSource.filterPredicate = filterPredicate;
            this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
            this.dataSource.paginator.pageIndex = 0;
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

  patchServerValue(servers: any[]) {
    this.requestFilterForm.patchValue({
      appname: servers
    },{ emitEvent: false })
  }

  patchRequestTypeValue(requestType: string){
    this.requestFilterForm.patchValue({
      requestType: requestType,
    },  { emitEvent: false });
  }

  selectedRequest(event: MouseEvent, row: any) {
    if (event.ctrlKey) {
      this._router.open(`#/session/rest/${row}`, '_blank')
    } else {
      this._router.navigate(['/session/rest', row], {
        queryParams: { 'env': this.queryParams.env }
      });
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterTable.set('filter', filterValue.trim().toLowerCase());
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleFilter(filter: string[]) {
    this.filterTable.set('status', filter);
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
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
    } else if (key == 'status') {
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


