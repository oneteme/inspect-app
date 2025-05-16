import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import {JdbcMainExceptionsByPeriodAndappname, JdbcSessionExceptionsByPeriodAndappname, RepartitionRequestByPeriod} from "../../model/jquery.model";
import {DatabaseRequest} from "../../model/trace.model";

@Injectable({ providedIn: 'root' })
export class DatabaseRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/trace`;

    getDatabaseRequest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<DatabaseRequest>> {
        return this.http.get<Array<DatabaseRequest>>(`${this.server}/request/database`, { params: params });
    }

    getRequestsById(id: string): Observable<DatabaseRequest> {
        return this.http.get<DatabaseRequest>(`${this.server}/request/database/${id}`);
    }

    getHost(filters: { env: string, start: Date, end: Date, type: string }): Observable<{ host: string }[]> {
        let arg  = {
            'column.distinct': 'host',
            'host.notNull': '',
            'instance.type': filters.type,
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'host.asc'
        }
        return forkJoin({
            rest: this.getDatabaseRequest({...arg,'join': 'rest_session,rest_session.instance'}),
            main: this.getDatabaseRequest({...arg,'join': 'main_session,main_session.instance',})
        }).pipe(map((result: {rest:any,main:any})=> ([...new Set([...result.rest.map(r=>(r.host)), ...result.main.map(r=>(r.host))])])))
    }

    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, database: string, env: string}): Observable<RepartitionRequestByPeriod> {
        let args: any = {
            'column': `count:count,count_request_error:countErrorServer,count_slowest:countSlowest,start.${filters.groupedBy}:date,start.year:year`,
            'parent': 'rest_session.id',
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            'rest_session.instance_env': 'instance.id',
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
            'parent': 'rest_session.id',
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
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
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            'rest_session.instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database,
            'order': `year.asc,date.asc`
        }
        return this.getDatabaseRequest(args);
    }

    getJdbcRestSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<JdbcSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,rest_session,rest_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
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