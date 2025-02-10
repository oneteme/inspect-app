import { Pipe, PipeTransform } from "@angular/core";
import { Filter } from "src/app/views/constants";
import { groupingBy } from "../util";

@Pipe({
    name: 'numberFormat'
})
export class NumberFormatterPipe implements PipeTransform {
    transform(value: number, pointer?: number, suffix?: string): string{
        let p = pointer ?? 1;
        let s = suffix ?? '';
        if(value){
            if(value >= 1_000_000){
                return `${s}${(value / 1_000_000).toFixed(p)}M`; 
            }else if(value >= 1_000){
                return `${s}${(value / 1_000).toFixed(p)}K`;
            }
            return value.toString();
        }
        return "";
    }
}