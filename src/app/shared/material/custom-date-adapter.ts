import {NativeDateAdapter} from "@angular/material/core";
import {Injectable} from "@angular/core";

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
    parse(value: any, parseFormat?: any): Date | null {
        console.log("parse", value, parseFormat, super.parse(value, parseFormat));
        return super.parse(value, parseFormat);
    }

    format(date: Date, displayFormat: Object): string {
        console.log("format", date, displayFormat);
        return super.format(date, displayFormat);
    }
}