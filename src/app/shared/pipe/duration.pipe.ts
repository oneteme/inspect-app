import {inject, Pipe, PipeTransform} from "@angular/core";
import {DecimalPipe} from "@angular/common";

export function formatDuration(seconds: number, msPrecision: number = 2): string {
    if (!seconds && seconds !== 0) return 'En cours';

    const factor = Math.pow(10, msPrecision);
    const totalUnits = Math.round(seconds * 1000 * factor);
    const fracPart = totalUnits % factor;
    const totalMs = Math.floor(totalUnits / factor);
    const ms = totalMs % 1000;
    const totalSecs = Math.floor(totalMs / 1000);
    const secs = totalSecs % 60;
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const days = Math.floor(totalSecs / 86400);

    const msStr = (msPrecision > 0 && fracPart > 0)
        ? `${ms}.${String(fracPart).padStart(msPrecision, '0')}ms`
        : `${ms}ms`;

    if (days > 0) return `${days}j ${hours > 0 ? hours + 'h' : ''}`.trim();
    if (hours > 0) return `${hours}h ${minutes > 0 ? minutes + 'min' : ''}`.trim();
    if (minutes > 0) return `${minutes}min ${secs > 0 ? secs + 's' : ''}`.trim();
    if (secs > 0) return (ms > 0 || fracPart > 0) ? `${secs}s ${msStr}` : `${secs}s`;
    return msStr;
}

@Pipe({
    name:"duration"
})
export class DurationPipe implements PipeTransform {
     _decimalPipe = inject(DecimalPipe);

    transform(value: {start: number, end: number} | number, msPrecision: number = 2): string {
        const time = typeof value === 'object' ? value.end - value.start : value;
        return formatDuration(time, msPrecision);
    }
}

