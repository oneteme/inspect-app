import {inject, Pipe, PipeTransform} from "@angular/core";
import {DecimalPipe} from "@angular/common";

/** Logique pure de formatage d'une durée en secondes — utilisable hors pipe (ex: searchValue). */
export function formatDuration(seconds: number): string {
    if (!seconds && seconds !== 0) return 'En cours';

    const days    = Math.floor(seconds / 86400);
    const hours   = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs    = Math.floor(seconds % 60);
    const ms      = Math.round((seconds % 1) * 1000);

    if (days > 0)    return `${days}j ${hours > 0 ? hours + 'h' : ''}`.trim();
    if (hours > 0)   return `${hours}h ${minutes > 0 ? minutes + 'min' : ''}`.trim();
    if (minutes > 0) return `${minutes}min ${secs > 0 ? secs + 's' : ''}`.trim();
    if (secs > 0)    return ms > 0 ? `${secs}s ${ms}ms` : `${secs}s`;
    return `${ms}ms`;
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

