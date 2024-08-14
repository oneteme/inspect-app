import {inject, Pipe, PipeTransform} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {Period} from "../../model/trace.model";

@Pipe({
    name:"duration"
})

export class DurationPipe implements PipeTransform {
     _decimalPipe = inject(DecimalPipe);

    transform(value: Period | number, ...args: any[]):string {
        if(value == null) return 'N/A';
        let time = typeof value == "object" ? value.end - value.start : value;

        const remainingSeconds = this._decimalPipe.transform(Math.round((time % 60) * 1000) / 1000);
        const minutes = Math.floor((time % 3600) / 60);
        const hours = Math.floor(time/3600);

        const hourString = hours > 0 ? `${hours}h` : ''
        const minuteString = minutes > 0 ? `${minutes}min` : ''
        const secondString = `${remainingSeconds}s`

        if (hours > 0) {
            return `${hourString}, ${minuteString || '0 min'} ${secondString && `: ${secondString}`}`
        } else if (!hours && minutes > 0) {
            return `${minuteString} ${secondString && `: ${secondString}`}`
        }
        return secondString;
    }
}