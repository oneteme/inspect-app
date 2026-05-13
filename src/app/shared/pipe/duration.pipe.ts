import {inject, Pipe, PipeTransform} from "@angular/core";
import {DecimalPipe} from "@angular/common";

/** Logique pure de formatage d'une durée en secondes — utilisable hors pipe (ex: searchValue). */
export function formatDuration(seconds: number): string {
    if (!seconds && seconds !== 0) return 'En cours';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round((seconds % 60) * 1000) / 1000;
    if (days > 0) return `${days} jour(s)`;
    if (hours > 0) return `${hours}h, ${minutes > 0 ? minutes + 'min' : '0 min'}`;
    if (minutes > 0) {
        const secPart = secs ? ' : ' + secs + 's' : '';
        return minutes + 'min' + secPart;
    }
    return `${secs}s`;
}

@Pipe({
    name:"duration"
})
export class DurationPipe implements PipeTransform {
     _decimalPipe = inject(DecimalPipe);

    transform(value: {start: number, end: number} | number, ...args: any[]): string {
        const time = typeof value === 'object' ? value.end - value.start : value;
        return formatDuration(time);
    }
}