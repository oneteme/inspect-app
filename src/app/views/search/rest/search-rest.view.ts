import {Component, inject, LOCALE_ID, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Location} from '@angular/common';
import {ActivatedRoute, Params} from '@angular/router';
import {BehaviorSubject, finalize, Subscription} from 'rxjs';
import {Utils} from 'src/app/shared/util';
import {JQueryService} from 'src/app/service/jquery/jquery.service';
import {TraceService} from 'src/app/service/trace.service';
import {application, makeDatePeriod, makeDateTimePeriod} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset} from '../../constants';
import {FilterService} from 'src/app/service/filter.service';
import {InstanceRestSession} from 'src/app/model/trace.model';
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule} from "@angular/material/core";
import {CustomDateAdapter} from "../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../shared/material/custom-date-range-selection-strategy";

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
  private _router = inject(EnvRouter);
  private _instanceService = inject(InstanceService);
  private _traceService = inject(TraceService);
  private _activatedRoute = inject(ActivatedRoute);
  private _location = inject(Location);
  private _filter = inject(FilterService);

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  filterConstants = FilterConstants;
  nameDataList: any[];
  displayedColumns: string[] = ['status', 'app_name', 'method/path', 'query', 'start', 'durée', 'user'];
  dataSource: MatTableDataSource<InstanceRestSession> = new MatTableDataSource();
  isLoading = true;
  serverNameIsLoading = true;
  serverFilterForm = new FormGroup({
    appname: new FormControl([""]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  filterTable = new Map<string, any>();

  params: Partial<{ env: string, start: Date, end: Date, serveurs: string[] }> = {};
  advancedParams: Partial<{ [key: string]: any }> ={}
  focusFieldName: any;

  subscriptionServer: Subscription;
  subscriptionSession: Subscription;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  onChangeStart(event) {
    this.serverFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({onlySelf: true})
  }

  onChangeEnd(event) {
    this.serverFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({onlySelf: true})
  }

  constructor() {
    this._activatedRoute.queryParams
      .subscribe({
        next: (params: Params) => {
          this.params.env = params['env'] || application.default_env;
          this.params.start = params['start'] ? new Date(params['start']) : (application.session.api.default_period || makeDateTimePeriod(1)).start;
          this.params.end = params['end'] ? new Date(params['end']) : (application.session.api.default_period || makeDateTimePeriod(1)).end;
          this.params.serveurs = Array.isArray(params['appname']) ? params['appname'] : [params['appname'] || ''];
          if (this.params.serveurs[0] != '') {
            this.patchServerValue(this.params.serveurs)
          }

          this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate(), this.params.end.getHours(), this.params.end.getMinutes(), this.params.end.getSeconds(), this.params.end.getMilliseconds() - 1));
          this.subscriptionServer = this._instanceService.getApplications('SERVER')
            .pipe(finalize(()=> this.serverNameIsLoading = false))
            .subscribe({
              next: res => {
                this.nameDataList = res.map(r => r.appName);
                this.patchServerValue(this.params.serveurs);
              }, error: (e) => {
                console.log(e)
              }
            });
          this.getIncomingRequest();

          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}${this.params.serveurs[0] !== '' ? '&' + this.params.serveurs.map(name => `appname=${name}`).join('&') : ''}`)
        }
      });
  }

  ngOnInit(): void {
    this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  unsubscribe() {
    if(this.subscriptionSession) this.subscriptionSession.unsubscribe();
    if(this.subscriptionServer) this.subscriptionServer.unsubscribe();
  }

  search() {
    if (this.serverFilterForm.valid) {
      if(this.subscriptionSession) this.subscriptionSession.unsubscribe();
      let appname = this.serverFilterForm.getRawValue().appname;
      let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
      let end = this.serverFilterForm.getRawValue().dateRangePicker.end;
      let _end = new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes(), 59, 1000);
      if (this.params.start.toISOString() != start.toISOString()
        || this.params.end.toISOString() != end.toISOString()
        || !this.params?.serveurs?.every((element, index) => element === appname[index])
        || appname.length != this.params?.serveurs?.length) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { ...(appname !== undefined && { appname }), start: start.toISOString(), end: _end.toISOString() }
        })
      } else {
        this.getIncomingRequest();
      }
    }
  }

  getIncomingRequest() {
    let params = {
      'env': this.params.env,
      'appname': this.params.serveurs,
      'start': this.params.start.toISOString(),
      'end': this.params.end.toISOString()
    }; 
    if(this.advancedParams){
      Object.assign(params, this.advancedParams);
    }

    this.isLoading = true;
    this.dataSource = new MatTableDataSource([]);
    this.subscriptionSession = this._traceService.getRestSessions(params)
      .subscribe({
        next: (d: InstanceRestSession[]) => {
          if (d) {
            this.dataSource = new MatTableDataSource(d);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {

              if (columnName == "app_name") return row["appName"] as string;
              if (columnName == "name/port") return row["host"] + ":" + row["port"] as string;
              if (columnName == "method/path") return row['path'] as string;
              if (columnName == "start") return row['start'] as string;
              if (columnName == "durée") return (row["end"] - row["start"])

              return row[columnName as keyof any] as string;

            }
            this.dataSource.filterPredicate = (data: InstanceRestSession, filter: string) => {
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
    console.log(start, end)
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
  }

  selectedRequest(event: MouseEvent, row: any) {
    if (event.ctrlKey) {
      this._router.open(`#/session/rest/${row}`, '_blank')
    } else {
      this._router.navigate(['/session/rest', row], {
        queryParams: { 'env': this.params.env }
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

  toggleFilter(filter: string[]) {
    this.filterTable.set('status', filter);
    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
  }

  resetFilters(){
    this.patchDateValue((application.session.api.default_period || makeDatePeriod(0)).start,(application.session.api.default_period || makeDatePeriod(0, 1)).end);
    this.patchServerValue([]);
    this.advancedParams = {};
    this._filter.setFilterMap({})
  }

  filtersSupplier(): BehaviorSubject<FilterMap> { 
    return new BehaviorSubject<FilterMap>({ 'appname': this.serverFilterForm.getRawValue().appname });
  }

  handlePresetSelection(filterPreset: FilterPreset) {
    const formControlNamelist = Object.keys(this.serverFilterForm.controls);
    Object.entries(filterPreset.values).reduce((accumulator: any, [key, value]) => {
    
      if (formControlNamelist.includes(key)) {
        this.serverFilterForm.patchValue({
          [key]: value
        })
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

}


