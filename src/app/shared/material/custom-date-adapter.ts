import {NativeDateAdapter} from "@angular/material/core";
import {Injectable} from "@angular/core";

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
    parse(value: any, parseFormat?: any): Date | null {
        if (typeof value === 'string') {
            // Custom parsing logic to handle both date and time.
            const dateTimeRegex = /^([0-9][1-9])\/(0[1-9]|1[0-2])\/(\d{4}) ([0-1][0-9]|2[0-3]):([0-5]\d):([0-5]\d)$/;
            const match = value.match(dateTimeRegex);
            if (match) {
                return new Date(
                    parseInt(match[3], 10),
                    parseInt(match[2], 10) - 1,  // Month is 0-based
                    parseInt(match[1], 10),
                    parseInt(match[4], 10),
                    parseInt(match[5], 10),
                    parseInt(match[6], 10)
                );
            }
        }
        return null;
    }

    compareDate(first: Date, second: Date): number {
        return (
            this.getYear(first) - this.getYear(second) ||
            this.getMonth(first) - this.getMonth(second) ||
            this.getDate(first) - this.getDate(second) ||
            this.getHours(first) - this.getHours(second) ||
            this.getMinutes(first) - this.getMinutes(second) ||
            this.getSeconds(first) - this.getSeconds(second)
        );
    }

    getHours(date: Date): number {
        return date.getHours();
    }

    getMinutes(date: Date): number {
        return date.getMinutes();
    }

    getSeconds(date: Date): number {
        return date.getSeconds();
    }
}