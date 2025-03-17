import {inject, Pipe, PipeTransform} from "@angular/core";
import {DecimalPipe} from "@angular/common";
import {Period} from "../../model/trace.model";

@Pipe({
    name:"duration"
})

export class DurationPipe implements PipeTransform {
     _decimalPipe = inject(DecimalPipe);

    transform(value: Period | number, ...args: any[]):string {
        let time = typeof value == "object" ? value.end - value.start : value;
        if(!time && time !=0){
            return "?";
        }
        const remainingSeconds = this._decimalPipe.transform(Math.round((time % 60) * 1000) / 1000);
        const minutes = Math.floor((time % 3600) / 60);
        const hours = Math.floor(time/3600);
        const days  = Math.floor(time/86400)

        const dayString = days > 0 ? `${days} jour(s)`:''
        const hourString = hours > 0 ? `${hours}h` : ''
        const minuteString = minutes > 0 ? `${minutes}min` : ''
        const secondString = `${remainingSeconds}s`
    
        if(days > 0 ){
            return `${dayString}`;
        }
        if (hours > 0) {
            return `${hourString}, ${minuteString || '0 min'}`
        } else if (!hours && minutes > 0) {
            return `${minuteString} ${secondString && `: ${secondString}`}`
        }
        return secondString;
    }
}