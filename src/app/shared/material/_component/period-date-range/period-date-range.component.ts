import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from "@angular/core";
import {DateAdapter, MAT_DATE_FORMATS} from "@angular/material/core";
import {CustomDateAdapter} from "../../custom-date-adapter";
import {MY_DATE_FORMATS} from "../../../shared.module";
import {MAT_DATE_RANGE_SELECTION_STRATEGY} from "@angular/material/datepicker";
import {CustomDateRangeSelectionStrategy} from "../../custom-date-range-selection-strategy";
import {
  getDefaultTodayPeriod, getQuickRangeDates, getQuickRangeStep,
  isDefaultTodayPeriod, DEFAULT_PERIOD_QUICK_RANGES,
  PeriodQuickRange,
  toDisplayedPeriodEnd
} from "../../../period-filter";
import {IPeriod, IStep, IStepFrom} from "../../../../model/conf.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  templateUrl: './period-date-range.component.html',
  styleUrls: ['./period-date-range.component.scss'],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: CustomDateRangeSelectionStrategy }
  ]
})
export class PeriodDateRangeComponent implements OnInit, OnDestroy {
  protected readonly periodQuickRanges = DEFAULT_PERIOD_QUICK_RANGES;

  period: IPeriod | IStep | IStepFrom;

  periodFormGroup = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required])
  });

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  onChangeStart(event: any) {
    this.periodFormGroup.controls.end.updateValueAndValidity({ onlySelf: true });
    const start = this.periodFormGroup.controls.start.value;
    const end = this.periodFormGroup.controls.end.value || null;
    if (!start) {
      return;
    }
    this.period = new IPeriod(start, end || start);
  }

  onChangeEnd(event: any) {
    this.periodFormGroup.controls.start.updateValueAndValidity({ onlySelf: true });
    const start = this.periodFormGroup.controls.start.value || null;
    const end = this.periodFormGroup.controls.end.value;
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

  isDefaultPeriod(): boolean {
    return isDefaultTodayPeriod(this.period);
  }

  resetPeriod(): void {
    const defaultPeriod = getDefaultTodayPeriod();
    this.period = defaultPeriod;
    this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
  }

  patchDateValue(start: Date, end: Date) {
    this.periodFormGroup.patchValue({
      start: start,
      end: end
    }, { emitEvent: false });
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
}