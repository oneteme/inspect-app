import {inject, Pipe, PipeTransform} from "@angular/core";
import {DecimalPipe} from "@angular/common";

@Pipe({
    name:"duration"
})

export class DurationPipe implements PipeTransform {
     _decimalPipe = inject(DecimalPipe);

    transform(value: any, ...args: any[]):string {
        if(!value && value !== 0) return '';

        const remainingSeconds = this._decimalPipe.transform(Math.round((value % 60) * 1000) / 1000);
        const minutes = Math.floor((value % 3600) / 60);
        const hours = Math.floor(value/3600);

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