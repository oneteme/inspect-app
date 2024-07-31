import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {BehaviorSubject, combineLatest, Subscription} from 'rxjs';
import { Location } from '@angular/common';
import { Utils } from 'src/app/shared/util';
import { TraceService } from 'src/app/service/trace.service';
import { application, makePeriod } from 'src/environments/environment';
import { FilterConstants, FilterMap, FilterPreset } from '../../constants';
import { FilterService } from 'src/app/service/filter.service';
import { InstanceMainSession } from 'src/app/model/trace.model';
import {EnvRouter} from "../../../service/router.service";


@Component({
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
  filterConstants = FilterConstants;
  utils: Utils = new Utils();
  displayedColumns: string[] = ['status', 'app_name', 'name', 'location', 'start', 'durée', 'user'];
  dataSource: MatTableDataSource<InstanceMainSession> = new MatTableDataSource();
  serverFilterForm = new FormGroup({
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    })
  });
  subscription: Subscription;
  isLoading = false;
  advancedParams: Partial<{[key:string]:any}>
  focusFieldName: any

  filter: string = '';
  params: Partial<{ env: string, start: Date, end: Date, type: string }> = {};

  mappingType = {
    batch: 'BATCH',
    startup: 'Serveur',
    view: 'Vue'
  }
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _router: EnvRouter,
    private _traceService: TraceService,
    private _activatedRoute: ActivatedRoute,
    private _location: Location,
    private _filter: FilterService) {

    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
        next:  ([params, queryParams]) => {
          this.params.env = queryParams['env'] || application.default_env;
          
          this.params.type = params['type_main'];
          this.params.start = queryParams['start'] ? new Date(queryParams['start']) : (application.session.main.default_period || makePeriod(0, 1)).start;
          this.params.end = queryParams['end'] ? new Date(queryParams['end']) : (application.session.main.default_period || makePeriod(0, 1)).end;
          this.patchDateValue(this.params.start, new Date(this.params.end.getFullYear(), this.params.end.getMonth(), this.params.end.getDate() - 1));
          this.getMainRequests();
          this._location.replaceState(`${this._router.url.split('?')[0]}?env=${this.params.env}&start=${this.params.start.toISOString()}&end=${this.params.end.toISOString()}`)
        }
      });
  }


  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getMainRequests() {
    let params = {
      'env': this.params.env,
      'launchmode': this.params.type.toUpperCase(),
      'start': this.params.start.toISOString(),
      'end': this.params.end.toISOString(),
      'lazy': false
    };
    if(this.advancedParams){ 
        Object.assign(params, this.advancedParams);
    }

    this.isLoading = true;
    this.dataSource.data = [];
    this.subscription = this._traceService.getMainSessions(params).subscribe((d: InstanceMainSession[]) => {
      if (d) {
        this.dataSource = new MatTableDataSource(d);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort
        this.dataSource.sortingDataAccessor = (row: any, columnName: string) => {
          if (columnName == "app_name") return row["application"]["name"] as string;
          if (columnName == "name") return row["name"] as string;
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
      let start = this.serverFilterForm.getRawValue().dateRangePicker.start;
      let end = this.serverFilterForm.getRawValue().dateRangePicker.end
      let excludedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1)
      if (this.params.start.toISOString() != start.toISOString()
        || this.params.end.toISOString() != excludedEnd.toISOString()) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: 'merge',
          queryParams: { start: start.toISOString(), end: excludedEnd.toISOString() }
        })
      } else {
        this.getMainRequests();
      }
    }
  }

  patchDateValue(start: Date, end: Date) {
    this.serverFilterForm.patchValue({
      dateRangePicker: {
        start: start,
        end: end
      }
    }, { emitEvent: false });
  }

  selectedRequest(event: MouseEvent, row: any) {
    console.log(row)
    if (event.ctrlKey) {
      this._router.open(`#/session/main/${row.type.toLowerCase()}/${row.id}`, '_blank')
    } else {
      this._router.navigate(['/session/main', row.type.toLowerCase(), row.id], {
        queryParams: { 'env': this.params.env }
      });
    }
  }

  getElapsedTime(end: number, start: number,) {
    return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
  }

  statusBorder(status: number) {
    return Utils.statusBorder(status)
  }


  applyFilter(event: Event) {
    this.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = this.filter;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  resetFilters(){
    this.patchDateValue((application.session.api.default_period || makePeriod(0)).start,(application.session.api.default_period || makePeriod(0, 1)).end);
    this.advancedParams = {};
    this._filter.setFilterMap({})
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


