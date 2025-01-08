import {DateRange, MatDateRangeSelectionStrategy} from "@angular/material/datepicker";
import {Injectable} from "@angular/core";
import {DateAdapter} from "@angular/material/core";

@Injectable()
export class CustomDateRangeSelectionStrategy implements MatDateRangeSelectionStrategy<Date> {
    constructor(private _dateAdapter: DateAdapter<Date>) {}

    selectionFinished(date: Date, currentRange: DateRange<Date>) {
        let {start, end} = currentRange;

        if (start == null) {
            start = date;
        } else if (end == null && date && this._dateAdapter.compareDate(date, start) >= 0) {
            end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59);
        } else {
            start = date;
            end = null;
        }

        return new DateRange<Date>(start, end);
    }

    createPreview(activeDate: Date | null, currentRange: DateRange<Date>) {
        let start: Date | null = null;
        let end: Date | null = null;

        if (currentRange.start && !currentRange.end && activeDate) {
            start = currentRange.start;
            end = activeDate;
        }

        return new DateRange<Date>(start, end);
    }
}