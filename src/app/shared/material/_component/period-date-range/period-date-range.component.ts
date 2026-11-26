import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {
  DEFAULT_PERIOD_QUICK_RANGES,
  getDefaultTodayPeriod,
  getQuickRangeDates,
  getQuickRangeStep,
  isDefaultTodayPeriod,
  PeriodQuickRange,
  toDisplayedPeriodEnd
} from "../../../period-filter";
import {IPeriod, IStep, IStepFrom} from "../../../../model/conf.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-period-date-range',
  templateUrl: './period-date-range.component.html',
  styleUrls: ['./period-date-range.component.scss']
})
export class PeriodDateRangeComponent implements OnInit, OnDestroy {
  protected readonly periodQuickRanges = DEFAULT_PERIOD_QUICK_RANGES;

  @Input() formGroup: FormGroup<{start: FormControl<Date | null>, end: FormControl<Date | null>}> = new FormGroup({
    start: new FormControl<Date | null>(null, [Validators.required]),
    end: new FormControl<Date | null>(null, [Validators.required])
  });

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  isDefaultPeriod(): boolean {
    return isDefaultTodayPeriod(new IPeriod(this.formGroup.controls.start.value, this.formGroup.controls.end.value));
  }

  resetPeriod(): void {
    const defaultPeriod = getDefaultTodayPeriod();
    this.patchDateValue(defaultPeriod.start, toDisplayedPeriodEnd(defaultPeriod.end));
  }

  patchDateValue(start: Date, end: Date) {
    this.formGroup.patchValue({
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
    this.patchDateValue(period.start, toDisplayedPeriodEnd(period.end));
  }
}