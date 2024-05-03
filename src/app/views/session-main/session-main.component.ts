import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { Mainrequest } from 'src/app/shared/model/trace.model';
import { Utils } from 'src/app/shared/util';
import { TraceService } from 'src/app/shared/services/trace.service';
import { EnvRouter } from '../session-detail/session-detail.component';
import { application, makePeriod } from 'src/environments/environment';
import { FilterConstants, FilterMap, FilterPreset } from '../constants';
import { FilterService } from 'src/app/shared/services/filter.service';


@Component({
  templateUrl: './session-main.component.html',
  styleUrls: ['./session-main.component.scss'],
})
export class SessionMainComponent implements OnInit, OnDestroy {
  filterConstants = FilterConstants;
  currentEnv: string;
  utilInstance: Utils = new Utils();
  displayedColumns: string[] = ['status', 'app_name', 'session', 'location', 'start', 'Durée', 'user'];
  dataSource: MatTableDataSource<Mainrequest> = new MatTableDataSource();
  mainRequestList: Mainrequest[];
  serverFilterForm = new FormGroup({
    launchmode: new FormControl(""),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    })
  });
  subscription: Subscription;
  isLoading = false;

  DEFAULT_START: Date;
  DEFAULT_END: Date;
  advancedParams: Partial<{[key:string]:any}>
  focusFieldName: any

  filter: string = '';
  params: Partial<{ env: string, start: any, end: any, endExclusive: any, launchMode: string }> = {};

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _router: EnvRouter,
    private _traceService: TraceService,
    private _activatedRoute: ActivatedRoute,
    private _location: Location,
    private _filter: FilterService) {

    this._activatedRoute.queryParams
      .subscribe({
        next: (params: Params) => {
          this.params.env = params['env'] || application.default_env;
          
          this.params.launchMode = params['name'] || '';
          this.patchLaunchValue(this.params.launchMode);
          this.params.start = params['start'] || (application.session.main.default_period || makePeriod(0)).start.toISOString();
          this.params.end = params['end'] || (application.session.main.default_period || makePeriod(0)).end.toISOString();
          this.params.endExclusive = new Date(this.params.end);
          this.params.endExclusive.setDate(this.params.endExclusive.getDate() + 1);
          this.params.endExclusive = this.params.endExclusive.toISOString();
          this.patchDateValue(this.params.start, this.params.end);
          this.getMainRequests();
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start}&end=${this.params.end}${this.params.launchMode !== '' ? '&name=' + this.params.launchMode : ''}`)
        }
      });
  }


  ngOnInit(): void {
    this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  configQueryParamFilter(start: Date, end: Date, name: string) {
    this._router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: { name: name, start: start.toISOString(), end: end.toISOString() },
      relativeTo: this._activatedRoute
    });
  }

  getMainRequests() {
    let params = {
      'env': this.params.env,
      'launchmode': this.params.launchMode,
      'start': this.params.start,
      'end': this.params.endExclusive,
      'lazy': false
    };
    if(this.advancedParams){ 
        Object.assign(params, this.advancedParams);
    }

    this.isLoading = true;
    this.dataSource.data = [];
    this.subscription = this._traceService.getMainRequestByCriteria(params).subscribe((d: Mainrequest[]) => {
      if (d) {
        this.dataSource = new MatTableDataSource(d);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort
        this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {
          if (columnName == "app_name") return row["application"]["name"] as string;
          if (columnName == "session") return row["name"] as string;
          if (columnName == "location") return row['location'] as string;
          if (columnName == "start") return row['start'] as string;
          if (columnName == "Durée") return (row["end"] - row["start"])

          var columnValue = row[columnName as keyof any] as string;
          return columnValue;
        }
        this.dataSource.filter = this.filter;
        this.dataSource.paginator.pageIndex = 0;
        this.isLoading = false;
      }
    }, error => {
      this.isLoading = false;
    })
  }


  search() {
    if (this.serverFilterForm.valid) {
      let name = this.serverFilterForm.getRawValue().launchmode;
      let start = this.serverFilterForm.getRawValue().dateRangePicker.start.toISOString();
      let end = this.serverFilterForm.getRawValue().dateRangePicker.end.toISOString()

      if (this.params.start != start
        || this.params.end != end
        || this.params.launchMode != name) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { ...(name !== undefined && { name }), start: start, end: end }
        })
      } else {
        this.getMainRequests();
      }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: new Date(start),
        end: new Date(end)
      }
    }, { emitEvent: false });
  }

  patchLaunchValue(launchMode: string) {
    this.serverFilterForm.patchValue({
      launchmode: launchMode
    })
  }


  selectedRequest(event: MouseEvent, row: any) {
    if (event.ctrlKey) {
      this._router.open(`#/session/main/${row}`, '_blank')
    } else {
      this._router.navigate(['/session/main', row], {
        queryParams: { 'env': this.params.env }
      });
    }
  }

  getElapsedTime(end: number, start: number,) {
    return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
  }

  statusBorder(status: number) {
    return this.utilInstance.statusBorder(status)
  }


  applyFilter(event: Event) {
    this.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = this.filter;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  resetFilters(){
    this.patchDateValue((application.session.api.default_period || makePeriod(0)).start,(application.session.api.default_period || makePeriod(0)).end);
    this.patchLaunchValue("");
    this.advancedParams = {};
    this._filter.setFilterMap({})
  }

  filtersSupplier(): BehaviorSubject<FilterMap> { //change
    return new BehaviorSubject<FilterMap>({ 'launchmode': this.serverFilterForm.getRawValue().launchmode });
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


