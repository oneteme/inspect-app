import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, combineLatest, delay, finalize, of, Subject, takeUntil} from 'rxjs';
import {DatePipe, Location} from '@angular/common';
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
// TODO: REMOVE MOCK — dépannage serveur uniquement
import {generateMockMainSessions} from './search-main.mock';
const USE_MOCK = true;
const MOCK_DATA: MainSessionDto[] = USE_MOCK ? generateMockMainSessions(2000) : [];
import {col, TableProvider} from "@oneteme/jquery-table";

interface SearchMainTableRow {
  app_name: string;
  name: string;
  location: string;
  start: string;
  durée: string;
  user: string;
  status: string;
  exception_info?: string;
  raw: MainSessionDto;
}

@Component({
  templateUrl: './search-main.view.html',
  styleUrls: ['./search-main.view.scss'],
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
export class SearchMainView implements OnInit, OnDestroy {
  private readonly _router = inject(EnvRouter);
  private readonly _traceService = inject(TraceService);
  private readonly _instanceService = inject(InstanceService);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _location = inject(Location);
  private readonly _filter = inject(FilterService);
  private readonly $destroy = new Subject<void>();
  private readonly pipe = new DatePipe('fr-FR');

  MAPPING_TYPE = Constants.MAPPING_TYPE;
  filterConstants = FilterConstants;
  displayedColumns: string[] = ['app_name', 'name', 'location', 'start', 'durée', 'user'];
  readonly columnLabels: Record<string, string> = {
    app_name: 'Hôte',
    name: 'Nom',
    location: 'Ressource',
    start: 'Début',
    durée: 'Durée',
    user: 'Utilisateur'
  };
  tableRows: SearchMainTableRow[] = [];
  filteredTableRows: SearchMainTableRow[] = [];
  tableConfig: TableProvider<SearchMainTableRow> = {
    columns: [
      col<SearchMainTableRow>('app_name', 'Hôte'),
      col<SearchMainTableRow>('name', 'Nom'),
      col<SearchMainTableRow>('location', 'Ressource'),
      col<SearchMainTableRow>('start', 'Début'),
      col<SearchMainTableRow>('durée', 'Durée'),
      { ...col<SearchMainTableRow>('user', 'Utilisateur'), optional: true },
      { ...col<SearchMainTableRow>('status', 'Status'), optional: true },
      {
        key: 'exception_info',
        header: 'Exception (lazy)',
        sortable: true,
        optional: true,
        lazy: true,
        // Simule une requête HTTP : attend Xs puis retourne une valeur par ligne
        fetchFn: () => {
          const rows = this.tableConfig.data as SearchMainTableRow[];
          return of(
            rows.map(r =>
              r.raw?.exception?.type
                ? `${r.raw.exception.type}${r.raw.exception.message ? ': ' + r.raw.exception.message : ''}`
                : '—'
            )
          ).pipe(delay(7000));
        }
      },
    ],
    // slices: [
    //   { title: 'Status', columnKey: 'status' },
    //   { title: 'Utilisateur', columnKey: 'user' },
    //   { title: 'Nom',    columnKey: 'name' }
    // ],
    data: [],
    enableSearchBar: true,
    enableViewButton: true,
    allowColumnRemoval: false,
    enablePagination: true,
    pageSize: 10,
    enableColumnDragDrop: false,
    pageSizeOptions: [5, 10, 15, 20, 100],
    pageSizeOptionsGroupBy: [20, 50, 100, 200],
    emptyStateLabel: 'Aucun résultat',
    loadingStateLabel: 'Chargement des données...',
    rowClass: (row: SearchMainTableRow) => {
      if (row.status === 'OK') return 'row-ok';
      if (row.status === 'KO') return 'row-ko';
      if (row.status === 'En cours') return 'row-in-progress';
      return '';
    },
  };
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
  filterValue: string = '';

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
          this.queryParams.optional = {'q': queryParams.q}
        }
        this.patchStatusValue(this.queryParams.rangestatus)
        this.patchServerValue(this.queryParams.appname);
        this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

        // TODO: REMOVE MOCK
        if (USE_MOCK) {
          this.serverNameIsLoading = false;
        } else {
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
        }
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
    this.tableRows = [];
    this.filteredTableRows = [];
    this.updateTableConfig();

    // TODO: REMOVE MOCK — remplacer par l'appel ci-dessous quand le serveur est dispo
    if (USE_MOCK) {
      this.tableRows = MOCK_DATA.map((row) => this.toTableRow(row));
      if (this.queryParams.optional?.['q']) {
        this.filterValue = this.queryParams.optional['q'];
      }
      this.applyTableFilter();
      this.isLoading = false;
      this.updateTableConfig();
      return;
    }

    this._traceService.getMainSessions(params)
    .pipe(takeUntil(this.$destroy))
    .subscribe({
      next: d => {
        if (d) {
          this.tableRows = d.map((row) => this.toTableRow(row));
          if (this.queryParams.optional?.['q']) {
            this.filterValue = this.queryParams.optional['q'];
          }
          this.applyTableFilter();
        } else {
          this.tableRows = [];
          this.filteredTableRows = [];
          this.updateTableConfig();
        }
        this.isLoading = false;
        this.updateTableConfig();
      },
      error: err => {
        this.tableRows = [];
        this.filteredTableRows = [];
        this.updateTableConfig();
        this.isLoading = false;
        this.updateTableConfig();
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

  applyFilter(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value;
    this.applyTableFilter();
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

  onTableRowSelected(row: SearchMainTableRow) {
    if (row?.raw) {
      this.selectedRequest(row.raw);
    }
  }

  private applyTableFilter() {
    const query = (this.filterValue || '').trim().toLowerCase();
    if (!query) {
      this.filteredTableRows = [...this.tableRows];
      this.updateTableConfig();
      return;
    }

    this.filteredTableRows = this.tableRows.filter((row) =>
      row.app_name.toLowerCase().includes(query) ||
      row.name.toLowerCase().includes(query) ||
      row.location.toLowerCase().includes(query) ||
      row.user.toLowerCase().includes(query) ||
      row.start.toLowerCase().includes(query) ||
      row.durée.toLowerCase().includes(query) ||
      row.status.toLowerCase().includes(query) ||
      row.raw.exception?.message?.toString().toLowerCase().includes(query) ||
      row.raw.exception?.type?.toString().toLowerCase().includes(query)
    );

    this.updateTableConfig();
  }

  private updateTableConfig() {
    this.tableConfig = {
      ...this.tableConfig,
      data: this.filteredTableRows,
      isLoading: this.isLoading
    };
  }

  private toTableRow(row: MainSessionDto): SearchMainTableRow {
    const startDate = new Date(row.start * 1000);
    const datePart = this.pipe.transform(startDate, 'dd/MM/yyyy') || '';
    const timePart = this.pipe.transform(startDate, 'HH:mm:ss.SSS') || '';
    const hasException = !!(row.exception?.type || row.exception?.message);
    let status = 'En cours';
    if (row.end) {
      if (hasException) { status = 'KO';
      } else { status = 'OK' }
    }

    return {
      app_name: row.appName || 'N/A',
      name: row.name || 'N/A',
      location: row.location || 'N/A',
      start: `${datePart} ${timePart}`.trim(),
      durée: row.end ? this.formatDuration(row.start, row.end) : 'En cours...',
      user: row.user || 'N/A',
      status,
      raw: row
    };
  }

  private formatDuration(startSeconds: number, endSeconds: number): string {
    const totalSeconds = Math.max(0, endSeconds - startSeconds);
    if (totalSeconds < 60) {
      return `${totalSeconds.toLocaleString('fr-FR', {minimumFractionDigits: 3, maximumFractionDigits: 3})}s`;
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;
    if (minutes < 60) {
      return `${minutes}min : ${seconds.toLocaleString('fr-FR', {minimumFractionDigits: 3, maximumFractionDigits: 3})}s`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min : ${seconds.toLocaleString('fr-FR', {minimumFractionDigits: 3, maximumFractionDigits: 3})}s`;
  }

  
}



