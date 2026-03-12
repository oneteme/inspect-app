import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, combineLatest, finalize, Subject, takeUntil} from 'rxjs';
import {Location} from '@angular/common';
import {extractPeriod,} from 'src/app/shared/util';
import {TraceService} from 'src/app/service/trace.service';
import {app, makeDatePeriod} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset} from '../../constants';
import {FilterService} from 'src/app/service/filter.service';
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../shared/material/custom-date-range-selection-strategy";
import {IPeriod, IStep, IStepFrom, QueryParams} from "../../../model/conf.model";
import {shallowEqual} from "../rest/search-rest.view";
import {MainSessionDto} from "../../../model/request.model";
import {TableProvider} from "@oneteme/jquery-table";

interface SearchMainTableRow {
  app_name: string;
  name: string;
  location: string;
  start: string;
  durée: string;
  user: string;
  status: string;
  raw: MainSessionDto;
}

@Component({
  templateUrl: './search-main.view.html',
  styleUrls: ['./search-main.view.scss'],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
  ]
})
export class SearchMainView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _traceService = inject(TraceService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);
  private readonly _filter = inject(FilterService);
  private readonly $destroy = new Subject<void>();

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  filterConstants = FilterConstants;
  tableConfig: TableProvider<MainSessionDto> = {
    columns: [
      { key: 'appName', header: 'Hôte', sortable: true, icon: 'dns',  width: '13%' },
      { key: 'name', header: 'Nom', sortable: true, icon: 'label',  width: '13%' },
      { key: 'location', header: 'Ressource', sortable: true, icon: 'category' },
      { key: 'start', header: 'Début', sortable: true, groupable: false, icon: 'schedule',  width: '13%' },
      { key: 'duration', header: 'Durée', sortable: true, groupable: false, icon: 'timer',  width: '13%',
        sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
      },
      { key: 'user', header: 'Utilisateur', sortable: true, icon: 'person',  width: '13%' },
      { key: 'status', header: 'Status', sortable: true, optional: true, icon: 'task_alt', width: '13%',
        value: (row: MainSessionDto) => {
          if(!row.end) return 'En cours...';
          if(row.exception) return 'KO';
          if(!row.exception) return 'OK';
        }
      },
      { key: 'exception', header: 'Exception', sortable: true, optional: true, icon: 'error_outline', width: '13%',
        value: (row: MainSessionDto) => {
          return row.exception?.type;
        }
      }
    ],
    slices: [
      {
        title: 'Durée',
        columnKey: 'duration',
        categories: [
          { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
          { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
          { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
          { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
          { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
          { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null },
        ]
      }],
    enableSearchBar: true,
    enableViewButton: true,
    allowColumnRemoval: true,
    enablePagination: true,
    pageSize: 10,
    enableColumnDragDrop: false,
    pageSizeOptions: [5, 10, 15, 20, 100],
    pageSizeOptionsGroupBy: [20, 50, 100, 200],
    defaultSort: { active: 'start', direction: 'desc' },
    emptyStateLabel: 'Aucun résultat',
    loadingStateLabel: 'Chargement des données...',
    rowClass: (row: MainSessionDto) => {
      if(!row.end) return '';
      if (row.end && !row.exception) return 'row-ok';
      if (row.end && row.exception) return 'row-ko';
    },
    onRowSelected: (row: MainSessionDto) => this.selectedRequest(row)
  };
  sessions: MainSessionDto[];

  serverNameIsLoading = true;
  serverFilterForm = new FormGroup({
    appname: new FormControl([""]),
    rangestatus: new FormControl([]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required]),
    })
  });
  nameDataList: any[];
  isLoading = false;
  filters: { icon: string, label: string, color: string, value: any } [] = [{
    icon: 'warning',
    label: 'KO',
    color: '#bb2124',
    value: 'Ko'
  }, {icon: 'done', label: 'OK', color: '#22bb33', value: 'Ok'}, {
    icon: 'pending',
    label: 'En cours',
    color: '#2196F3',
    value: 'lazy'
  }];
  advancedParams: Partial<{ [key: string]: any }>
  focusFieldName: any
  queryParams: Partial<QueryParams> = {};
  type: string = '';

  constructor() {
    combineLatest([
      this._activatedRoute.params,
      this._activatedRoute.queryParams
    ]).subscribe({
      next: ([params, queryParams]) => {
        this.type = params.type_main;
        if (queryParams.start && queryParams.end) this.queryParams = new QueryParams(new IPeriod(new Date(queryParams.start), new Date(queryParams.end)), queryParams.env || app.defaultEnv, !queryParams.server ? [] : Array.isArray(queryParams.server) ? queryParams.server : [queryParams.server], null, !queryParams.rangestatus ? [] : Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus])
        if (!queryParams.start && !queryParams.end) {
          let period;
          if (queryParams.step && queryParams.from) {
            period = new IStepFrom(queryParams.step, queryParams.from);
          } else if (queryParams.step) {
            period = new IStep(queryParams.step);
          }
          this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), queryParams.env || app.defaultEnv, !queryParams.server ? [] : Array.isArray(queryParams.server) ? queryParams.server : [queryParams.server], null, !queryParams.rangestatus ? [] : Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus]);
        }
        if (queryParams.q) {
          this.tableConfig = {
            ...this.tableConfig,
            initialSearchQuery: queryParams.q
          }
        }
        this.patchStatusValue(this.queryParams.rangestatus)
        this.patchServerValue(this.queryParams.appname);
        this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

        this._instanceService.getApplications(this.type == 'view' ? 'CLIENT' : 'SERVER', this.queryParams.env)
          .pipe(finalize(() => this.serverNameIsLoading = false))
          .subscribe({
            next: res => {
              this.nameDataList = res.map(r => r.appName);
              this.patchServerValue(this.queryParams.appname);
            }, error: (e) => {
              console.log(e)
            }
          });
        this.getMainRequests();
        this._location.replaceState(`${this._router.url.split('?')[0]}?${this.queryParams.buildPath()}`);
      }
    });
  }

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

  onChangeServer($event) {
    this.queryParams.appname = this.serverFilterForm.controls.appname.value;
  }

  onChangeStatus($event) {
    this.queryParams.rangestatus = this.serverFilterForm.controls.rangestatus.value && this.serverFilterForm.controls.rangestatus.value.map((f: {
      icon: string,
      label: string,
      color: string,
      value: any
    }) => f.value)
  }

  ngOnInit() {
    this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
  }

  filtersSupplier(): BehaviorSubject<FilterMap> { //change
    return new BehaviorSubject<FilterMap>({
      'appname': this.serverFilterForm.getRawValue().appname,
      'rangestatus': this.serverFilterForm.getRawValue().rangestatus.map(r => (r.value))
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  getMainRequests() {
    this.$destroy.next();
    let params = {
      'appname': this.queryParams.appname,
      'env': this.queryParams.env,
      'launchmode': this.type.toUpperCase(),
      'failed': this.queryParams.rangestatus.filter(r => r != 'lazy').map(r => {
        if (r == 'Ok') return true;
        if (r == 'Ko') return false;
        return r;
      }),
      'lazy': !!this.queryParams.rangestatus.find(r => r == 'lazy'),
      'start': this.queryParams.period.start.toISOString(),
      'end': this.queryParams.period.end.toISOString()
    };
    if (this.advancedParams) {
      Object.assign(params, this.advancedParams);
    }

    this.isLoading = true;
    this._traceService.getMainSessions(params)
    .pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false))
    .subscribe({
      next: d => {
        this.sessions = d;
      }
    });
  }


  search() {
    if (this.serverFilterForm.valid) {
      if (!shallowEqual(this._activatedRoute.snapshot.queryParams, this.queryParams.buildParams())) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParams: this.queryParams.buildParams()
        });
      } else {
        if (this.queryParams.period instanceof IStep) {
          this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));
        }
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
    }, {emitEvent: false});
  }

  patchServerValue(appname: any[]) {
    this.serverFilterForm.patchValue({
      appname: appname
    }, {emitEvent: false})
    this.queryParams.appname = appname

  }

  patchStatusValue(rangestatus: any[]) {
    this.serverFilterForm.patchValue({
      rangestatus: this.filters.filter((f: any) => rangestatus.toString().includes(f.value))
    }, {emitEvent: false})
    this.queryParams.rangestatus = rangestatus;
  }

  selectedRequest(row: MainSessionDto) {
    this._router.navigate(['/session', row.type.toLowerCase(), row.id], {
      queryParams: {'env': this.queryParams.env}
    });
  }

  resetFilters() {
    this.patchDateValue((extractPeriod(app.gridViewPeriod, "gridViewPeriod") || makeDatePeriod(0)).start, (extractPeriod(app.gridViewPeriod, "gridViewPeriod") || makeDatePeriod(0, 1)).end);
    this.patchServerValue([]);
    this.patchStatusValue([]);
    this.advancedParams = {};
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
        this.queryParams[key] = value;
        delete filterPreset.values[key];
      }
    }, {})
    this.advancedParams = filterPreset.values
    this._filter.setFilterMap(this.advancedParams);
    this.search()
  }

  handlePresetSelectionReset() {
    this.resetFilters();
    this.search();
  }

  handleFilterReset() {
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
    if (this.advancedParams[filterName]) {
      delete this.advancedParams[filterName];
      this._filter.setFilterMap(this.advancedParams);
    }
  }
}



