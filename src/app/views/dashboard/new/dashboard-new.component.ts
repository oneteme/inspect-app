import {ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit} from "@angular/core";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../../shared/material/custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared/shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../../shared/material/custom-date-range-selection-strategy";
import {
  getDefaultTodayPeriod, getQuickRangeDates, getQuickRangeStep,
  isDefaultTodayPeriod,
  PERIOD_QUICK_RANGES, PeriodQuickRange,
  toDisplayedPeriodEnd
} from "../../../shared/period-filter";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {IPeriod, IStep, IStepFrom} from "../../../model/conf.model";
import {app} from "../../../../environments/environment";
import {periodManagement, shallowEqual} from "../../../shared/util";
import {ActivatedRoute, Params} from "@angular/router";
import {EnvRouter} from "../../../service/router.service";

@Component({
  templateUrl: './dashboard-new.component.html',
  styleUrls: ['./dashboard-new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
  ]
})
class DashboardNewComponent implements OnInit, OnDestroy {
  private readonly _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private readonly _router: EnvRouter = inject(EnvRouter);

  protected readonly periodQuickRanges = PERIOD_QUICK_RANGES;

  params: Partial<{ namespace: string, start: Date, end: Date }> = {};
  period: IPeriod | IStep | IStepFrom;
  periodFilterForm = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required])
  });

  ngOnInit(): void {
    // Initialization logic here
  }

  ngOnDestroy(): void {
    // Cleanup logic here
  }

  resetPeriod(): void {
    const defaultPeriod = getDefaultTodayPeriod();
    this.period = defaultPeriod;
    this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
  }

  isDefaultPeriod(): boolean {
    return isDefaultTodayPeriod(this.period);
  }

  patchDateValue(start: Date, end: Date) {
    this.periodFilterForm.patchValue({
      start: start,
      end: end
    }, { emitEvent: false });
  }

  onChangeStart(event: any) {
    this.periodFilterForm.controls.end.updateValueAndValidity({ onlySelf: true });
    const start = this.periodFilterForm.controls.start.value;
    const end = this.periodFilterForm.controls.end.value || null;
    if (!start) {
      return;
    }
    this.period = new IPeriod(start, end || start);
  }

  onChangeEnd(event: any) {
    this.periodFilterForm.controls.start.updateValueAndValidity({ onlySelf: true });
    const start = this.periodFilterForm.controls.start.value || null;
    const end = this.periodFilterForm.controls.end.value;
    if (!start) return;
    if (!end) {
      this.period = new IPeriod(start, start);
      return;
    }
    this.period = new IPeriod(
        start,
        new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1)
    );
  }

  applyQuickRange(range: PeriodQuickRange): void {
    let period;
    if (range === 'yesterday') {
      const dates = getQuickRangeDates(range);
      period = new IPeriod(dates.start, dates.end);
    } else {
      period = getQuickRangeStep(range);
    }
    this.period = period;
    this.patchDateValue(period.start, toDisplayedPeriodEnd(period.end));
  }

  search() {
    if (this.periodFilterForm.valid) {
      const start = this.periodFilterForm.getRawValue().start;
      const end = this.periodFilterForm.getRawValue().end;

      if (!start || !end) return;

      if (!(this.period instanceof IStep) && !(this.period instanceof IStepFrom)) {
        this.period = new IPeriod(
            start,
            new Date(end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes() + 1)
        );
      }

      const queryParams = this.buildQueryParams();
      if (!shallowEqual(this._activatedRoute.snapshot.queryParams, queryParams)) {
        this._router.navigate([], {
          relativeTo: this._activatedRoute,
          queryParams
        });
      } else {
        if (this.period instanceof IStep || this.period instanceof IStepFrom) {
          this.params.start = this.period.start;
          this.params.end = this.period.end;
          this.patchDateValue(this.params.start, toDisplayedPeriodEnd(this.params.end));
        }
      }
    }
  }

  private buildQueryParams(): Params {
    return {
      namespace: this.params.namespace,
      ...this.period.buildParams()
    };
  }
}