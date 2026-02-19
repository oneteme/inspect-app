import { DatePipe } from "@angular/common";
import { ChartGroup } from "../model/chart.model";
import { Filter, FilterMap, Operation } from "../views/constants";
import { makeDateTimePeriod, makeDateTimePeriodFrom } from "src/environments/environment";

export class Utils {


    reIcon: any = {

    }
    dbactionIcon: any =
        {
            'CONNECTION': '#1423DC',
            'METADATA': '#2134CB',
            'STATEMENT': '#2E45BA',
            'EXECUTE': '#3B56A9',
            'RESULTSET': "#486798",
            'SELECT': '#557887',
            'UPDATE': '#628976',
            'BATCH': '#6F9A65',
            'COMMIT': '#7CAB54',
            'ROLLBACK': '#89BC43',
            'FETCH': '#96CD32',
            ' ': '#e9ecef'
        };
    protocol: any = {
        'http': 'fa-solid fa-lock-open',
        'https': 'fa-solid fa-lock'
    }
    os: any = {
        'Windows 10.0': 'fa-brands fa-windows',
        'Windows 10': 'fa-brands fa-windows',
        'Linux': 'fa-brands fa-linux fa-xl',
    }
    re: any = {
        'firefox': 'fa-brands fa-firefox-browser fa-xl',
        'chrome': 'fa-brands fa-chrome fa-xl',
        'java': 'fa-brands fa-java fa-xl',
    }

    static getStateColor(status: number) { // put it in util class 

        if (status >= 200 && status < 300)
            return "green"

        if (status >= 300 && status < 500)
            return "orange"

        if (status >= 500)
            return 'red';
        return "gray"
    }

    static getStateColorBool(completed: boolean) {
        if (completed)
            return 'green'
        return 'red';
    }

    static statusBorder(completed: any): { [key: string]: string } {
        if (typeof completed == "boolean") {
            return { 'box-shadow': '4px 0px 0px 0px ' + this.getStateColorBool(completed) + ' inset' };
        }
        return { 'box-shadow': '4px 0px 0px 0px ' + this.getStateColor(completed) + ' inset' };
    }

    static statusBorderCard(failed: any): { [key: string]: string } {
        if (typeof failed == "boolean") {
            return { 'border-left': '4px solid ' + this.getStateColorBool(!failed) };
        }
        return { 'border-left': '4px solid ' + this.getStateColor(failed) };
    }

    convertSeconds = (seconds: number): string => {
        const hours = Math.round(Math.floor(seconds / 3600))
        const minutes = Math.round(Math.floor((seconds % 3600) / 60))
        const remainingSeconds = Math.round(seconds % 60)

        const hourString = hours > 0 ? `${hours}h` : ''
        const minuteString = minutes > 0 ? `${minutes}min` : ''
        const secondString = `${remainingSeconds}s`

        if (hours > 0) {
            return `${hourString}, ${minuteString || '0 min'} ${secondString && `: ${secondString}`}`
        } else if (!hours && minutes > 0) {
            return `${minuteString} ${secondString && `: ${secondString}`}`
        }

        return secondString
    }

    getRe(re: string) {

        let result = re
        if (re) {
            Object.keys(this.re).forEach(element => {
                const startIndex = re.indexOf(element);
                if (startIndex != -1) {
                    const endIndex = startIndex + element.length;
                    const icon = re.substring(startIndex, endIndex);
                    result = '<i class="' + this.re[icon] + '"></i> ' + re
                }
            });
        }
        return result;
    }

    static getSessionUrl(selectedSession: any) {
        return `${selectedSession?.protocol ? selectedSession?.protocol + '://' : ''}${selectedSession?.host ? selectedSession?.host : ''}${selectedSession?.port > 0 ? ':' + selectedSession?.port : ''}${selectedSession?.path ? selectedSession?.path : ''}${selectedSession?.query ? '?' + selectedSession?.query : ''}`
    }

    static getElapsedTime(end: number, start: number,) {
        return (new Date(end * 1000).getTime() - new Date(start * 1000).getTime()) / 1000
    }

}

export function groupingBy(arr: any[], field: string): {[key: string]: any[]} {
    return arr.reduce((acc, o) => {
        var key = o[field];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(o);
        return acc;
    }, {})
}

export function recreateDate(chartGroup: string, row: any, start: Date): {start: Date, end: Date} {
    switch (chartGroup) {
        case "hour": {
            const hour = parseInt(row['date']);
            const startDate = new Date(start);
            const endDate = new Date(startDate);
            startDate.setHours(hour, 0, 0, 0);
            endDate.setHours(hour + 1, 0, 0, 0);
            return { start: startDate, end: endDate };
        }
        case "date": {
            const startDate = new Date(row["date"]);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            return { start: startDate, end: endDate };
        }
        case "week": {
            const weekNumber = row['date'];
            const year = row['year'];

            // Calculer le premier jour de la semaine ISO (lundi)
            const jan4 = new Date(year, 0, 4);
            const dayOfWeek = jan4.getDay() || 7;
            const startDate = new Date(jan4);
            startDate.setDate(jan4.getDate() - dayOfWeek + 1 + (weekNumber - 1) * 7);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);

            return { start: startDate, end: endDate };
        }
        case "month": {
            const month = row['date'] - 1; // Les mois sont 0-indexés en JS
            const year = row['year'];

            const startDate = new Date(year, month, 1, 0, 0, 0, 0);
            const endDate = new Date(year, month + 1, 1, 0, 0, 0, 0);

            return { start: startDate, end: endDate };
        }
        case "year": {
            const year = row['date'];

            const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
            const endDate = new Date(year + 1, 0, 1, 0, 0, 0, 0);

            return { start: startDate, end: endDate };
        }
        default:
            return null;
    }
}

export function periodManagement(start: Date, end: Date): string {
    var dayDiff = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);

    if (dayDiff <= 1) { // 24 heures
        return ChartGroup.byHour;
    }
    if (dayDiff <= 24) {
        return ChartGroup.byDay;
    }
    if (Math.round(dayDiff / 7) <= 24) {
        return ChartGroup.byWeek;
    }
    if (Math.round(dayDiff / 30) <= 24) {
        return ChartGroup.byMonth;
    }
    return ChartGroup.byYear;
}

export const formatters: any = {

    year: function byYear(r: any[], _datePipe: DatePipe, nameOutput: string = 'date') {
        r.forEach(e => {
            var date = new Date(e['date'], 0);
            e[nameOutput] = _datePipe.transform(date, 'y');
        });
    },

    month: function byMonth(r: any[], _datePipe: DatePipe, nameOutput: string = 'date') {
        r.forEach(e => {
            var date = new Date(e['year'], e['date'] - 1, 1);
            e[nameOutput] = _datePipe.transform(date, 'MMM yy');
        });
    },

    week: function byWeek(r: any[], _datePipe: DatePipe, nameOutput: string = 'date') {
        r.forEach(e => {
            e[nameOutput] = `sem. ${e['date']}, ${e['year']}`
        });
    },

    date: function byDay(r: any[], _datePipe: DatePipe, nameOutput: string = 'date') {
        r.forEach(e => {
            var date = new Date(e['date']);
            e[nameOutput] = _datePipe.transform(date, 'd MMM yy');
        });
    },

    hour: function byHour(r: any[], _datePipe: DatePipe, nameOutput: string = 'date') {
        r.forEach(e => {
            var date = new Date(2000, 1, 1, e['date']);
            e[nameOutput] = _datePipe.transform(date, 'shortTime');
        });
    }
}


export function mapParams(filters: Filter[], filter: FilterMap) {
    return Object.entries(filter).reduce((accumulator: any, [key, value]: any) => {

        const f = filters.find(f => f.key.toLowerCase() == key)

        const val = Array.isArray(value) ? value.join(',') : value
        if (f && f.op.value != Operation.eq.value) {
            accumulator[`${key}.${f.op.value}`] = val;
        } else {
            accumulator[`${key}`] = val;
        }
        return accumulator;
    }, {});
}

export function extractInfo(filterKey: string) {
    const r = /^(.*?)__(.*)$/;
    const match = filterKey.match(r);
    if (match) {
        return {
            controlName: match[1],
            key: match[2]
        }
    }
    return null;
}

export function getElapsedTime(end: number, start: number) {
    return end - start;
}

export function extractPeriod(regPeriod: string, name: string){
    const pattern  = /LAST_(\d+)(_\d+)?/;
    const match = pattern.exec(regPeriod);
    if(!match[1]){
        throw new Error(`bad value ${name}=${regPeriod}, pattern=${pattern}`)
    }
    if(match[2]){
        match[2] = match[2].substring(1);
        return makeDateTimePeriodFrom(+match[1],+match[2])
    }
    return makeDateTimePeriod(+match[1]);
}

export function getErrorClassName(o:any): string{
    if (o.exception?.message || o.exception?.type) {
        return "error"
    }
    return '';
}

export function groupByField(arr: any[], field: string): {[key: string]: any[]}{
    return arr.reduce((acc: {[key: string]: any[]}, o)=> {
        let key: string = o[field];
        (acc[key] = acc[key] || []).push(o);
        return acc;
    }, {});
}


export function countByFields<T>(arr: any[], combiner: (args: any[], o: string)=> T, fields: string[]): {[key: string]: T}{
    return fields.reduce((acc: {[key: string]: T}, o)=> {
        acc[o] = combiner(arr, o);
        return acc;
    }, {});
}

export function showifnotnull(value: any,fn: (value:any)=>any) {
    if(value)
        return fn(value);
    return "";
}

export function getDataForRange(items: any[], start: number, end: number) {
    return items.filter(c=> (c.end>= start && c.start <=end))
}


export function groupByColor<T>(array: T[], fn: (o: T) => any): { [name: string]: T[] } { // todo : refacto
  var colors = ["#22577a", "#38a3a5", "#57cc99", "#80ed99", "#c7f9cc"];
  let i = 0;
  return array.reduce((acc: any, item: any) => {
    let id = fn(item);
    if (id) {
      if (!acc[id]) {
        if (i == 4) {
          i = 0;
        }
        acc[id] = colors[i];
        i++;
      }
    }
    return acc;
  }, {})
}

export function   getStringOrCall(o?: any | (() => any)) {
    return typeof o === "function" ? o() : o;
}