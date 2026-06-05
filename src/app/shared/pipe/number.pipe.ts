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

/**
 * Formate un nombre en notation compacte lisible, max 4 caractères.
 * Exemples : 999 → "999", 1400 → "1.4k", 12034 → "12k", 1_500_000 → "1.5M"
 */
export function compactNumber(value: number): string {
    if (value == null) return '';
    const fmt = (v: number, suffix: string): string => {
        const r = parseFloat(v.toFixed(1));
        return (r >= 10 ? Math.round(v).toString() : r.toFixed(1)) + suffix;
    };
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return fmt(value / 1_000_000_000, 'G');
    if (abs >= 1_000_000) return fmt(value / 1_000_000, 'M');
    if (abs >= 1_000) return fmt(value / 1_000, 'k');
    return String(value);
}

@Pipe({ name: 'compact' })
export class CompactNumberPipe implements PipeTransform {
    transform(value: number): string {
        return compactNumber(value);
    }
}