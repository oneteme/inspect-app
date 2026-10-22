import {Component, OnInit, inject} from '@angular/core';
import {finalize} from 'rxjs';
import {TraceService} from '../../../../service/trace.service';
import {TableProvider} from "@oneteme/jquery-table";
import {HttpErrorResponse} from "@angular/common/http";
import {SessionEventDto} from "../../../../model/request.model";
import {SESSION_EVENT_TABLE_CONFIG} from "../../../../shared/_component/table/table.config";
import {shallowEqual} from "../../request/search-request.view";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {IPeriod, IStep, QueryParams} from "../../../../model/conf.model";
import {EnvRouter} from "../../../../service/router.service";
import {ActivatedRoute} from "@angular/router";
import {
    getDefaultRelativePeriod,
    isDefaultRelativePeriod, PERIOD_QUICK_RANGES,
    toDisplayedPeriodEnd
} from "../../../../shared/period-filter";

@Component({
  templateUrl: './search-main-event.view.html',
  styleUrls: ['./search-main-event.view.scss']
})
export class SearchMainEventView implements OnInit {
    private readonly _router = inject(EnvRouter);
    private readonly _traceService = inject(TraceService);
    private readonly _activatedRoute = inject(ActivatedRoute);
    readonly periodQuickRanges = PERIOD_QUICK_RANGES;
    serverNameIsLoading = true;
    nameDataList: any[];




    tableConfig: TableProvider<SessionEventDto> = SESSION_EVENT_TABLE_CONFIG;
  events: SessionEventDto[];
  isLoading = false;
  queryParams: Partial<QueryParams> = {};

    ngOnInit() {
    this._activatedRoute.queryParams.subscribe(queryParams => {
      this.namespace = queryParams.namespace;
      this.getEvents();
    });
  }

  namespace: string;

  getEvents() {
    this.isLoading = true;
    this.events = [];
    const params = this.namespace ? {'instance.namespace': this.namespace} : {};
    this._traceService.getSessionEvents(params)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: d => {
            this.events = d;
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 413) {
              this.tableConfig.labels.empty = error.error.message;
            }
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
                this.getEvents();
            }
        }
    }

    serverFilterForm = new FormGroup({
        appname: new FormControl([""]),
        rangestatus: new FormControl([]),
        dateRangePicker: new FormGroup({
            start: new FormControl<Date | null>(null, [Validators.required]),
            end: new FormControl<Date | null>(null, [Validators.required]),
        })
    });

    patchDateValue(start: Date, end: Date) {
        this.serverFilterForm.patchValue({
            dateRangePicker: {
                start: start,
                end: end
            }
        }, {emitEvent: false});
    }

    isDefaultPeriod(): boolean {
        return isDefaultRelativePeriod(this.queryParams?.period);
    }

    resetPeriod(): void {
        const defaultPeriod = getDefaultRelativePeriod();
        this.queryParams.period = defaultPeriod;
        this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
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
}
