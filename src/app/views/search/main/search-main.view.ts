import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, combineLatest, finalize, Subject, takeUntil} from 'rxjs';
import {DatePipe, Location} from '@angular/common';
import {extractPeriod,} from 'src/app/shared/util';
import {TraceService} from 'src/app/service/trace.service';
import {app, makeDatePeriod} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset, INFINITY} from '../../constants';
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
    dataSource: MatTableDataSource<MainSessionDto> = new MatTableDataSource();
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
    filters: {icon: string, label: string,color: string, value: any} [] = [{icon: 'warning', label: 'KO',color:'#bb2124', value: false}, {icon: 'done', label: 'OK',color:'#22bb33', value: true}]
    advancedParams: Partial<{ [key: string]: any }>
    focusFieldName: any
    filterTable = new Map<string, any>();
    filter: string = '';

    queryParams: Partial<QueryParams> = {};
    type: string = '';

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor() {
        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                this.type = params.type_main;
                if(queryParams.start && queryParams.end) this.queryParams = new QueryParams(new IPeriod(new Date(queryParams.start), new Date(queryParams.end)), queryParams.env || app.defaultEnv, !queryParams.server ? [] : Array.isArray(queryParams.server) ? queryParams.server : [queryParams.server],null,!queryParams.rangestatus ? []: Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus] )
                if(!queryParams.start && !queryParams.end)  {
                    let period;
                    if(queryParams.step && queryParams.from){
                        period = new IStepFrom(queryParams.step, queryParams.from);
                    } else if(queryParams.step){
                        period = new IStep(queryParams.step);
                    }
                    this.queryParams = new QueryParams(period || extractPeriod(app.gridViewPeriod, "gridViewPeriod"), queryParams.env || app.defaultEnv, !queryParams.server ? [] : Array.isArray(queryParams.server) ? queryParams.server : [queryParams.server],null, !queryParams.rangestatus ? []: Array.isArray(queryParams.rangestatus) ? queryParams.rangestatus : [queryParams.rangestatus] );
                }
                this.patchStatusValue(this.queryParams.rangestatus)
                this.patchServerValue(this.queryParams.appname);
                this.patchDateValue(this.queryParams.period.start, new Date(this.queryParams.period.end.getFullYear(), this.queryParams.period.end.getMonth(), this.queryParams.period.end.getDate(), this.queryParams.period.end.getHours(), this.queryParams.period.end.getMinutes(), this.queryParams.period.end.getSeconds(), this.queryParams.period.end.getMilliseconds() - 1));

                this._instanceService.getApplications(this.type == 'view' ? 'CLIENT' : 'SERVER', this.queryParams.env )
                    .pipe(finalize(()=> this.serverNameIsLoading = false))
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

    onChangeServer($event){
        this.queryParams.appname = this.serverFilterForm.controls.appname.value;
    }

    onChangeStatus($event){
        this.queryParams.rangestatus = this.serverFilterForm.controls.rangestatus.value && this.serverFilterForm.controls.rangestatus.value.map((f:{icon: string, label: string,color: string, value: any}) => f.value)
    }

    ngOnInit() {
        this._filter.registerGetallFilters(this.filtersSupplier.bind(this));
    }

    filtersSupplier(): BehaviorSubject<FilterMap> { //change
        return new BehaviorSubject<FilterMap>({'appname': this.serverFilterForm.getRawValue().appname, 'rangestatus': this.serverFilterForm.getRawValue().rangestatus.map(r=>(r.value))});
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
            'rangestatus': this.queryParams.rangestatus,
            'start': this.queryParams.period.start.toISOString(),
            'end': this.queryParams.period.end.toISOString(),
            'lazy': false
        };
        if (this.advancedParams) {
            Object.assign(params, this.advancedParams);
        }

        this.isLoading = true;
        this.dataSource.data = [];
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort
        this._traceService.getMainSessions(params)
          .pipe(takeUntil(this.$destroy))
          .subscribe({
            next: d => {
                if (d) {
                    this.dataSource = new MatTableDataSource(d);
                    this.dataSource.paginator = this.paginator;
                    this.dataSource.sort = this.sort
                    this.dataSource.sortingDataAccessor = this.sortingDataAccessor;
                    this.dataSource.filterPredicate = this.filterPredicate;
                    this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
                    this.dataSource.paginator.pageIndex = 0;
                    this.isLoading = false;
                }
            },
            error: err => {
                this.isLoading = false;
            }
          });
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
        },{ emitEvent: false })
        this.queryParams.appname = appname

    }

    patchStatusValue(rangestatus:any[]){
        this.serverFilterForm.patchValue({
            rangestatus: this.filters.filter((f:any)=> rangestatus.toString().includes(f.value))
        },{ emitEvent: false })
        this.queryParams.rangestatus = rangestatus;
    }

    selectedRequest(event: MouseEvent, row: any) {
        if (event.ctrlKey) {
            this._router.open(`#/session/${row.type.toLowerCase()}/${row.id}`, '_blank')
        } else {
            this._router.navigate(['/session', row.type.toLowerCase(), row.id], {
                queryParams: {'env': this.queryParams.env}
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

    sortingDataAccessor = (row: any, columnName: string) => {
        if (columnName == "app_name") return row["appName"] as string;
        if (columnName == "name") return row["name"] as string;
        if (columnName == "location") return row['location'] as string;
        if (columnName == "start") return row['start'] as string;
        if (columnName == "durée") return row['end'] ? row["end"] - row["start"] : INFINITY;

        return row[columnName as keyof any] as string;
    };

    filterPredicate = (data: MainSessionDto, filter: string) => {
        var map: Map<string, any> = new Map(JSON.parse(filter));
        let isMatch = true;
        let date = new Date(data.start * 1000);
        for (let [key, value] of map.entries()) {
            if (key == 'filter') {
                isMatch = isMatch && (value == '' || (data.appName?.toLowerCase().includes(value) ||
                        data.name?.toLowerCase().includes(value) || data.location?.toLowerCase().includes(value) ||
                        data.user?.toLowerCase().includes(value)) ||
                    this.pipe.transform(date,"dd/MM/yyyy").toLowerCase().includes(value) ||
                    this.pipe.transform(date,"HH:mm:ss.SSS").toLowerCase().includes(value) ||
                    data.exception?.message?.toString().toLowerCase().includes(value) ||
                    data.exception?.type?.toString().toLowerCase().includes(value));
            } else if (key == 'status') {
                const s = data.exception?.type || data.exception?.message ? "KO" : "OK";
                isMatch = isMatch && (!value.length || (value.some((status: any) => {
                    return s == status;
                })));
            }
        }
        return isMatch;
    };


}



