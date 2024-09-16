import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {RepartitionRequestByPeriod} from "../../model/jquery.model";

@Injectable({ providedIn: 'root' })
export class DatabaseRequestService {
    constructor(private http: HttpClient) {

    }

    getDatabaseRequest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get<T>(url, { params: params });
    }

    getRepartitionRequestByPeriod(filters: {now: Date, database: string, env: string}): Observable<RepartitionRequestByPeriod> {
        let start = new Date(filters.now.getFullYear(), filters.now.getMonth(), filters.now.getDate() - 6).toISOString();
        let end = filters.now.toISOString();
        let args: any = {
            'column': "count:count,count_error_server:countErrorServer,count_slowest:countSlowest,start.date:date",
            'parent': 'rest_session.id',
            'rest_session.start.ge': start,
            'rest_session.start.lt': end,
            'rest_session.instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': start,
            'start.lt': end,
            'db': filters.database,
            'order': 'date.asc'
        }
        return this.getDatabaseRequest(args);
    }

    getRepartitionTime(filters: {start: Date, end: Date, database: string, env: string}): Observable<{elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number}[]> {
        let args: any = {
            'column': 'count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest',
            'parent': 'rest_session.id',
            'rest_session.start.ge': filters.start,
            'rest_session.start.lt': filters.end,
            'rest_session.instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database
        }
        return this.getDatabaseRequest(args);
    }

    getRepartitionTimeByPeriod(filters: {start: Date, end: Date, groupedBy: string, database: string, env: string}): Observable<{elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[]> {
        let args: any = {
            'column': `count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'parent': 'rest_session.id',
            'rest_session.start.ge': filters.start,
            'rest_session.start.lt': filters.end,
            'rest_session.instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database,
            'order': `year.asc,date.asc`
        }
        return this.getDatabaseRequest(args);
    }
}