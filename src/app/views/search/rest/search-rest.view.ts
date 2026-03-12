import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, finalize, Subject, takeUntil } from 'rxjs';
import { extractPeriod } from 'src/app/shared/util';
import { TraceService } from 'src/app/service/trace.service';
import { app, makeDatePeriod } from 'src/environments/environment';
import { Constants, FilterConstants, FilterMap, FilterPreset } from '../../constants';
import { FilterService } from 'src/app/service/filter.service';
import { EnvRouter } from '../../../service/router.service';
import { InstanceService } from '../../../service/jquery/instance.service';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CustomDateAdapter } from '../../../shared/material/custom-date-adapter';
import { MY_DATE_FORMATS } from '../../../shared/shared.module';
import { MAT_DATE_RANGE_SELECTION_STRATEGY } from '@angular/material/datepicker';
import { CustomDateRangeSelectionStrategy } from '../../../shared/material/custom-date-range-selection-strategy';
import { IPeriod, IStep, IStepFrom, QueryParams } from '../../../model/conf.model';
import {MainSessionDto, RestSessionDto} from '../../../model/request.model';
import { TableProvider } from '@oneteme/jquery-table';


@Component({
  templateUrl: './search-rest.view.html',
  styleUrls: ['./search-rest.view.scss'],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
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

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  filterConstants = FilterConstants;
  nameDataList: any[];
  isLoading = false;
  serverNameIsLoading = true;

  serverFilterForm = new FormGroup({
    appname: new FormControl([]),
    rangestatus: new FormControl([]),
    dateRangePicker: new FormGroup({
      start: new FormControl<Date | null>(null, [Validators.required]),
      end: new FormControl<Date | null>(null, [Validators.required])
    })
  });

  filters: { icon: string; label: string; color: string; value: any }[] = [
    { icon: 'warning', label: '5xx', color: '#bb2124', value: '5xx' },
    { icon: 'error', label: '4xx', color: '#f9ad4e', value: '4xx' },
    { icon: 'done', label: '2xx', color: '#22bb33', value: '2xx' },
    { icon: 'pending', label: 'En cours', color: '#2196F3', value: 'lazy' }
  ];
  advancedParams: Partial<{ [key: string]: any }> = {};
  queryParams: Partial<QueryParams> = {};
  focusFieldName: any;

  tableConfig: TableProvider<RestSessionDto> = {

    columns: [
      { key: 'appName', header: 'Hôte', sortable: true, icon: 'dns', width: '18%' },
      { key: 'path', header: 'Ressource', sortable: true, icon: 'category' },
      { key: 'start', header: 'Début', sortable: true, icon: 'schedule', width: '17%',
        sortValue: (row) => row.start },
      { key: 'duration', header: 'Durée', sortable: true, icon: 'timer', width: '13%',
        sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE },
      { key: 'user', header: 'Utilisateur', sortable: true, icon: 'person', width: '15%' },
      { key: 'status', header: 'Status', sortable: true, optional: true, icon: 'task_alt', width: '13%',
        value: (row: RestSessionDto) => {
          if(!row.end) return 'En cours...';
          return row.status;
        }
      },
      { key: 'exception', header: 'Exception', sortable: true, optional: true, icon: 'error_outline', width: '13%',
        value: (row: RestSessionDto) => {
          return row.exception?.type;
        }
      }
    ],
    slices: [
      { title: 'Status', columnKey: 'status' },
      { title: 'Hôte', columnKey: 'appName' },
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
    loadingStateLabel: 'Chargement des requêtes...',
    rowClass: (row: RestSessionDto) => {
      const code = row.status;
      if (code >= 500) return 'row-ko';
      if (code >= 400) return 'row-warning';
      if (code >= 200) return 'row-ok';
      return '';
    },
    onRowSelected: (row: RestSessionDto) => this.onTableRowSelected(row),
  };
  sessions: RestSessionDto[];

  constructor() {
    this._activatedRoute.queryParams.subscribe({
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
          this.tableConfig = {
            ...this.tableConfig,
            initialSearchQuery: params.q
          }
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

  onChangeStart(event: any): void {
    this.serverFilterForm.controls.dateRangePicker.controls.end.updateValueAndValidity({ onlySelf: true });
    const start = this.serverFilterForm.controls.dateRangePicker.controls.start.value;
    const end = this.serverFilterForm.controls.dateRangePicker.controls.end.value || null;
    this.queryParams.period = new IPeriod(start, end);
  }

  onChangeEnd(event: any): void {
    this.serverFilterForm.controls.dateRangePicker.controls.start.updateValueAndValidity({ onlySelf: true });
    const start = this.serverFilterForm.controls.dateRangePicker.controls.start.value || null;
    const end = this.serverFilterForm.controls.dateRangePicker.controls.end.value;
    this.queryParams.period = new IPeriod(start, end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1) : null);
  }

  onChangeServer($event: any): void {
    this.queryParams.appname = this.serverFilterForm.controls.appname.value;
  }

  onChangeStatus($event: any): void {
    this.queryParams.rangestatus = this.serverFilterForm.controls.rangestatus.value?.map((f: { value: any }) => f.value);
  }

  search(): void {
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
        this.getIncomingRequest();
      }
    }
  }

  getIncomingRequest(): void {
    this.$destroy.next();
    const params: any = {
      env: this.queryParams.env,
      appname: this.queryParams.appname,
      rangestatus: this.queryParams.rangestatus.filter(r => r !== 'lazy'),
      lazy: this.queryParams.rangestatus.some(r => r === 'lazy'),
      start: this.queryParams.period.start.toISOString(),
      end: this.queryParams.period.end.toISOString()
    };
    if (this.advancedParams) {
      Object.assign(params, this.advancedParams);
    }

    this.isLoading = true;

    performance.mark('rest-request-start');

    this._traceService.getRestSessions(params)
      .pipe(takeUntil(this.$destroy), finalize(() => this.isLoading = false))
      .subscribe({
        next: d => {
          performance.mark('rest-data-received');
          this.sessions = d;

          // Laisser un tick pour que le DOM se mette à jour avant de mesurer
          setTimeout(() => {
            performance.mark('rest-render-done');
            performance.measure('⏱ BACK → données reçues (réseau+SQL)',  'rest-request-start',  'rest-data-received');
            performance.measure('⏱ FRONT → traitement JS (map+filter)',  'rest-data-received',  'rest-render-done');
            performance.measure('⏱ TOTAL bout-en-bout',                  'rest-request-start',  'rest-render-done');
            const entries = performance.getEntriesByType('measure')
              .filter(e => e.name.startsWith('⏱'));
            console.group('%c[SearchRest] Mesures de performance', 'color:#2196F3;font-weight:bold');
            entries.forEach(e =>
              console.log(`${e.name.padEnd(45)} ${Math.round(e.duration).toString().padStart(6)} ms`)
            );
            console.groupEnd();
            performance.clearMarks();
            performance.clearMeasures();
          }, 0);

        }
      });
  }

  patchDateValue(start: Date, end: Date): void {
    this.serverFilterForm.patchValue({ dateRangePicker: { start, end } }, { emitEvent: false });
  }

  patchServerValue(servers: any[]): void {
    this.serverFilterForm.patchValue({ appname: servers }, { emitEvent: false });
    this.queryParams.appname = servers;
  }

  patchStatusValue(rangestatus: any[]): void {
    this.serverFilterForm.patchValue({
      rangestatus: this.filters.filter((f: any) => rangestatus.toString().includes(f.value))
    }, { emitEvent: false });
    this.queryParams.rangestatus = rangestatus;
  }

  onTableRowSelected(row: RestSessionDto): void {
    this._router.navigate(['/session/rest', row.id], {
      queryParams: { env: this.queryParams.env }
    });
  }

  resetFilters(): void {
    this.patchDateValue((extractPeriod(app.gridViewPeriod, 'gridViewPeriod') || makeDatePeriod(0)).start, (extractPeriod(app.gridViewPeriod, 'gridViewPeriod') || makeDatePeriod(0, 1)).end);
    this.patchServerValue([]);
    this.patchStatusValue([]);
    this.advancedParams = {};
    this._filter.setFilterMap({});
  }

  filtersSupplier(): BehaviorSubject<FilterMap> {
    return new BehaviorSubject<FilterMap>({
      appname: this.serverFilterForm.getRawValue().appname,
      rangestatus: this.serverFilterForm.getRawValue().rangestatus.map((r: any) => r.value)
    });
  }

  handlePresetSelection(filterPreset: FilterPreset): void {
    const formControlNamelist = Object.keys(this.serverFilterForm.controls);
    Object.entries(filterPreset.values).reduce((acc: any, [key, value]) => {
      if (formControlNamelist.includes(key)) {
        this.serverFilterForm.patchValue({ [key]: value });
        this.queryParams[key] = value;
        delete filterPreset.values[key];
      }
    }, {});
    this.advancedParams = filterPreset.values;
    this._filter.setFilterMap(this.advancedParams);
    this.search();
  }

  handlePresetSelectionReset(): void {
    this.resetFilters();
    this.search();
  }

  handleFilterReset(): void {
    this.resetFilters();
  }

  focusField(fieldName: string): void {
    this.focusFieldName = [fieldName];
  }

  handledialogclose(filterMap: FilterMap): void {
    this.advancedParams = filterMap;
    this._filter.setFilterMap(this.advancedParams);
    this.search();
  }

  handleRemovedFilter(filterName: string): void {
    if (this.advancedParams[filterName]) {
      delete this.advancedParams[filterName];
      this._filter.setFilterMap(this.advancedParams);
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


