import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute} from '@angular/router';
import {combineLatest, Subscription} from 'rxjs';
import {Location} from '@angular/common';
import {Utils} from 'src/app/shared/util';
import {TraceService} from 'src/app/service/trace.service';
import {application, makePeriod} from 'src/environments/environment';
import {Constants, FilterConstants, FilterMap, FilterPreset} from '../../constants';
import {FilterService} from 'src/app/service/filter.service';
import {InstanceMainSession} from 'src/app/model/trace.model';
import {EnvRouter} from "../../../service/router.service";
import {InstanceService} from "../../../service/jquery/instance.service";


@Component({
    templateUrl: './search-main.view.html',
    styleUrls: ['./search-main.view.scss'],
})
export class SearchMainView implements OnInit, OnDestroy {
    private _router = inject(EnvRouter);
    private _traceService = inject(TraceService);
    private _activatedRoute = inject(ActivatedRoute);
    private _location = inject(Location);
    private _filter = inject(FilterService);

    MAPPING_TYPE = Constants.MAPPING_TYPE;
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
    advancedParams: Partial<{ [key: string]: any }>
    focusFieldName: any
    filterTable = new Map<string, any>();
    filter: string = '';
    params: Partial<{ env: string, start: Date, end: Date, type: string }> = {};

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    constructor() {

        combineLatest([
            this._activatedRoute.params,
            this._activatedRoute.queryParams
        ]).subscribe({
            next: ([params, queryParams]) => {
                console.log(params.type_main, 'test')
                this.params.env = queryParams['env'] || application.default_env;
                this.params.type = params.type_main;
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
        if (this.advancedParams) {
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
                    if (columnName == "app_name") return row["appName"] as string;
                    if (columnName == "name") return row["name"] as string;
                    if (columnName == "location") return row['location'] as string;
                    if (columnName == "start") return row['start'] as string;
                    if (columnName == "durée") return (row["end"] - row["start"])

                    var columnValue = row[columnName as keyof any] as string;
                    return columnValue;
                }
                this.dataSource.filterPredicate = (data: InstanceMainSession, filter: string) => {
                    var map: Map<string, any> = new Map(JSON.parse(filter));
                    let isMatch = true;
                    for (let [key, value] of map.entries()) {
                        if (key == 'filter') {
                            isMatch = isMatch && (value == '' || (data.appName?.toLowerCase().includes(value) ||
                                data.name?.toLowerCase().includes(value) || data.location?.toLowerCase().includes(value) ||
                                data.user?.toLowerCase().includes(value)));
                        } else if (key == 'status') {
                            const s = data.exception?.type || data.exception?.message ? "KO" : "OK";
                            isMatch = isMatch && (!value.length || (value.some((status: any) => {
                                return s == status;
                            })));
                        }
                    }
                    return isMatch;
                }
                this.dataSource.filter = JSON.stringify(Array.from(this.filterTable.entries()));
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
                    queryParams: {start: start.toISOString(), end: excludedEnd.toISOString()}
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
        }, {emitEvent: false});
    }

    selectedRequest(event: MouseEvent, row: any) {
        console.log(row)
        if (event.ctrlKey) {
            this._router.open(`#/session/main/${row.type.toLowerCase()}/${row.id}`, '_blank')
        } else {
            this._router.navigate(['/session/main', row.type.toLowerCase(), row.id], {
                queryParams: {'env': this.params.env}
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

    resetFilters() {
        this.patchDateValue((application.session.api.default_period || makePeriod(0)).start, (application.session.api.default_period || makePeriod(0, 1)).end);
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

