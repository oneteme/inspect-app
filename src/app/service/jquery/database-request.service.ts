import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {
    JdbcMainExceptionsByPeriodAndappname,
    JdbcExceptionsByPeriodAndAppname,
    RepartitionRequestByPeriod, RepartitionTimeAndTypeResponseByPeriod, SessionExceptionsByPeriodAndAppname
} from "../../model/jquery.model";
import {DatabaseRequestDto} from "../../model/request.model";

@Injectable({ providedIn: 'root' })
export class DatabaseRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getDatabaseRequest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<DatabaseRequestDto>> {
        return this.http.get<Array<DatabaseRequestDto>>(`${this.server}/request/database`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getRepartitionTimeAndTypeResponseByPeriod(filters: {env: string, start: Date, end: Date, groupedBy: string}): Observable<{countSuccess: number, countError: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[]> {
        let args: any = {
            'column': `count_request_success:countSuccess,count_request_error:countError,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': `year.asc,date.asc`
        }
        return this.getDatabaseRequest(args);
    }

    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, database: string, env: string}): Observable<RepartitionRequestByPeriod> {
        let args: any = {
            'column': `count:count,count_request_error:countErrorServer,count_slowest:countSlowest,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database,
            'order': 'year.asc,date.asc'
        }
        return this.getDatabaseRequest(args);
    }

    getRepartitionTime(filters: {start: Date, end: Date, database: string, env: string}): Observable<{elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number}[]> {
        let args: any = {
            'column': 'count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest',
            'join': 'instance',
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
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database,
            'order': `year.asc,date.asc`
        }
        return this.getDatabaseRequest(args);
    }

    getJdbcExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, appName?: string }): Observable<JdbcExceptionsByPeriodAndAppname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'date.asc'
        }
        if(filters.appName) {
            args['instance.app_name.in'] = filters.appName;
        }
        return this.getDatabaseRequest(args);
    }

    getJdbcMainSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<JdbcMainExceptionsByPeriodAndappname[]>{
        let args = { 
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
             'join': 'exception,main_session,main_session.instance',
              'start.ge': filters.start.toISOString(),
              'start.lt': filters.end.toISOString(),
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString(),
              [filters.app_name]: '', 
              'order': 'date.asc' }
        return this.getDatabaseRequest(args);
    }
}