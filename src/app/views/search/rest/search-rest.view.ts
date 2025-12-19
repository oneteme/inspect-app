import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {DatePipe, Location} from '@angular/common';
import {ActivatedRoute, Params} from '@angular/router';
import {BehaviorSubject, finalize, Subject, takeUntil} from 'rxjs';
import {extractPeriod, Utils} from 'src/app/shared/util';
import {TraceService} from 'src/app/service/trace.service';
import {app, makeDatePeriod,} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset, INFINITY} from '../../constants';
import {FilterService} from 'src/app/service/filter.service';
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {DateAdapter, MAT_DATE_FORMATS,} from "@angular/material/core";
import {CustomDateAdapter} from "../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../shared/material/custom-date-range-selection-strategy";
import {IPeriod, IStep, IStepFrom, QueryParams} from "../../../model/conf.model";
import {RestSessionDto} from "../../../model/request.model";


@Component({
  templateUrl: './search-rest.view.html',
  styleUrls: ['./search-rest.view.scss'],
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
export class SearchRestView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _instanceService = inject(InstanceService);
  private readonly _traceService = inject(TraceService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);
  private readonly _filter = inject(FilterService);
  private readonly $destroy = new Subject<void>();
  private readonly pipe = new DatePipe('fr-FR');

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  filterConstants = FilterConstants;
  nameDataList: any[];
  displayedColumns: string[] = ['status', 'app_name', 'method/path', 'query', 'start', 'durée', 'user'];
  dataSource: MatTableDataSource<RestSessionDto> = new MatTableDataSource();
  isLoading = true;
  serverNameIsLoading = true;
  serverFilterForm = new FormGroup({
    appname: new FormControl([]),
    rangestatus: new FormControl([]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  filterTable = new Map<string, any>();
  filterValue: string = '';
  filters: {icon: string, label: string,color: string, value: any} [] =[{icon: 'warning', label: '5xx',color:'#bb2124', value:'5xx'}, {icon: 'error', label: '4xx',color:'#f9ad4e', value:'4xx'}, {icon: 'done', label: '2xx',color:'#22bb33', value:'2xx'}, {icon: 'pending', label: 'En cours',color:'#2196F3', value:'0'}]
  advancedParams: Partial<{ [key: string]: any }> ={}
  queryParams: Partial<QueryParams> = {};
  focusFieldName: any;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  onChangeStart(event) {
    this.serverFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({onlySelf: true})
    let start = this.serverFilterForm.controls.dateRangePicker.controls.start.value;
    let end = this.serverFilterForm.controls.dateRangePicker.controls.end.value || null;
    this.queryParams.period = new IPeriod(start, end);
  }


  onChangeEnd(event) {
    this.serverFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({onlySelf: true})
    let start = this.serverFilterForm.controls.dateRangePicker.controls.start.value || null;
    let end = this.serverFilterForm.controls.dateRangePicker.controls.end.value;
    this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
  }

  onChangeServer($event){
    this.queryParams.appname = this.serverFilterForm.controls.appname.value;
  }

  onChangeStatus($event){
    this.queryParams.rangestatus = this.serverFilterForm.controls.rangestatus.value && this.serverFilterForm.controls.rangestatus.value.map((f:{icon: string, label: string,color: string, value: any}) => f.value)
  }

  constructor() {

    this._activatedRoute.queryParams
        .subscribe({
        next: (params: Params) => {
           if(params.start && params.end) this.queryParams = new QueryParams(new IPeriod(new Date(params.start), new Date(params.end)), params.env ||  app.defaultEnv, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server],null,!params.rangestatus ? []: Array.isArray(params.rangestatus) ? params.rangestatus : [params.rangestatus] )
           if(!params.start && !params.end)  {
            let period;
            if(params.step && params.from){
                period = new IStepFrom(params.step, params.from);
            } else if(params.step){
                period = new IStep(params.step);
            }
            this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), params.env || app.defaultEnv, !params.server ? [] : Array.isArray(params.server) ? params.server : [params.server], null, !params.rangestatus ? []: Array.isArray(params.rangestatus) ? params.rangestatus : [params.rangestatus]);
          }
           if(params.q){
             this.queryParams.optional = { 'q': params.q }
           }
          this.patchStatusValue(this.queryParams.rangestatus)
          this.patchServerValue(this.queryParams.appname);
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

          this._instanceService.getApplications('SERVER', this.queryParams.env)
            .pipe(finalize(()=> this.serverNameIsLoading = false))
            .subscribe({
              next: res => {
                this.nameDataList = res.map(r => r.appName);
                this.patchServerValue(this.queryParams.appname);
              }, error: (e) => {
                console.log(e)
              }
            });
          this.getIncomingRequest();
          this._location.replaceState(`${this._router.url.split('?')[0]}?${this.queryParams.buildPath()}`);
        }
      });
  }

  ngOnInit(): void {
    this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  search() {
    if (this.serverFilterForm.valid) {
      if(!shallowEqual(this._activatedRoute.snapshot.queryParams, this.queryParams.buildParams())) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParams: this.queryParams.buildParams()
        });
      } else {
        if(this.queryParams.period instanceof IStep) {
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));
        }
        this.getIncomingRequest();
      }
    }
  }

  getIncomingRequest() {
    this.$destroy.next();
    let params = {
      'env': this.queryParams.env,
      'appname': this.queryParams.appname,
      'rangestatus': this.queryParams.rangestatus,
      'start': this.queryParams.period.start.toISOString(),
      'end': this.queryParams.period.end.toISOString()
    };
    if(this.advancedParams){
      Object.assign(params, this.advancedParams);
    }

    this.isLoading = true;
    this.dataSource = new MatTableDataSource([]);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this._traceService.getRestSessions(params)
      .pipe(takeUntil(this.$destroy))
      .subscribe({
        next: d => {
          if (d) {
            this.dataSource = new MatTableDataSource(d);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
            this.dataSource.filterPredicate = this.filterPredicate;

            // Appliquer le filtre q s'il existe
            if (this.queryParams.optional?.['q']) {
              this.filterValue = this.queryParams.optional['q'];
              this.filterTable.set('filter', this.filterValue.trim().toLowerCase());
            }

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
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: start,
        end: end
      }
    }, { emitEvent: false });
  }

  patchServerValue(servers: any[]) {
    this.serverFilterForm.patchValue({
      appname: servers
    },{ emitEvent: false })
    this.queryParams.appname = servers
  }

  patchStatusValue(rangestatus:any[]){
    this.serverFilterForm.patchValue({
      rangestatus: this.filters.filter((f:any)=> rangestatus.toString().includes(f.value))
    },{ emitEvent: false })
    this.queryParams.rangestatus = rangestatus;
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

  statusBorder(status: number) {

    return Utils.statusBorder(status)
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterTable.set('filter', filterValue.trim().toLowerCase());
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters(){
    this.patchDateValue((extractPeriod(app.gridViewPeriod, "gridViewPeriod")|| makeDatePeriod(0)).start,(extractPeriod(app.gridViewPeriod, "gridViewPeriod") || makeDatePeriod(0, 1)).end);
    this.patchServerValue([]);
    this.patchStatusValue([]);
    this.advancedParams = {};
    this._filter.setFilterMap({})
  }

  filtersSupplier(): BehaviorSubject<FilterMap> { 
    return new BehaviorSubject<FilterMap>({ 'appname': this.serverFilterForm.getRawValue().appname, 'rangestatus': this.serverFilterForm.getRawValue().rangestatus.map(r=>(r.value)) });
  }

  handlePresetSelection(filterPreset: FilterPreset) {
    const formControlNamelist = Object.keys(this.serverFilterForm.controls);
    Object.entries(filterPreset.values).reduce((accumulator: any, [key, value]) => {
    
      if (formControlNamelist.includes(key)) {
        this.serverFilterForm.patchValue({
          [key]: value
        })
        this.queryParams[key] = value;
        delete filterPreset.values[key];
     }
    },{})
    this.advancedParams = filterPreset.values
    this._filter.setFilterMap(this.advancedParams);
    this.search()
  }

  handlePresetSelectionReset() {    
    this.resetFilters();
    this.search();
  }
  
  handleFilterReset(){
    this.resetFilters();
  }

  focusField(fieldName: string) {
    this.focusFieldName = [fieldName];
  }

  handledialogclose(filterMap: FilterMap) {
    this.advancedParams = filterMap;
    this._filter.setFilterMap(this.advancedParams);
    this.search()
  }

  handleRemovedFilter(filterName: string) {
    if(this.advancedParams[filterName]){
      delete this.advancedParams[filterName];
      this._filter.setFilterMap(this.advancedParams);
    }
  }

   sortingDataAccessor = (row: any, columnName: string) => {
    if (columnName == "app_name") return row["appName"] as string;
    if (columnName == "name/port") return row["host"] + ":" + row["port"] as string;
    if (columnName == "method/path") return row['path'] as string;
    if (columnName == "start") return row['start'] as string;
    if (columnName == "durée") return row['end'] ? row["end"] - row["start"] : INFINITY;

    return row[columnName as keyof any] as string;
  };

   filterPredicate = (data: RestSessionDto, filter: string) => {
    var map: Map<string, any> = new Map(JSON.parse(filter));
    let isMatch = true;
    let date = new Date(data.start * 1000)
    for (let [key, value] of map.entries()) {
      if (key == 'filter') {
        isMatch = isMatch && (value == '' || (data.appName?.toLowerCase().includes(value) ||
                data.method?.toLowerCase().includes(value) || data.query?.toLowerCase().includes(value) ||
                data.user?.toLowerCase().includes(value) || data.path?.toLowerCase().includes(value)) ||
                this.pipe.transform(date,"dd/MM/yyyy").toLowerCase().includes(value) ||
                this.pipe.transform(date,"HH:mm:ss.SSS").toLowerCase().includes(value) ||
                data.exception?.message?.toString().toLowerCase().includes(value) ||
                data.exception?.type?.toString().toLowerCase().includes(value));
      } else if (key == 'status') {
        const s = data.status.toString();
        isMatch = isMatch && (!value.length || (value.some((status: any) => {
          return s.startsWith(status[0]);
        })));
      }
    }
    return isMatch;
  };

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


