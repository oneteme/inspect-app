import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
    RepartitionTimeAndTypeResponseByPeriod,
    RestMainExceptionsByPeriodAndappname,
    RestSessionExceptionsByPeriodAndappname
} from "src/app/model/jquery.model";
import {FilterMap} from "../../views/constants";
import {InstanceRestSession, RestRequest} from "../../model/trace.model";


@Injectable({ providedIn: 'root' })
export class RestRequestService {
    constructor(private http: HttpClient) {

    }
    server = `${localStorage.getItem('server')}/v3/trace`;

    getRestRequest<T>(params?: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get<T>(url, { params: params });
    }

    getRestRequests(params: any): Observable<Array<RestRequest>> {
        return this.http.get<Array<RestRequest>>(`${this.server}/request/rest`, { params: params });
    }



    getrestSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'join': 'exception,rest_session,rest_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getRestRequest(args);
    }

    getrestMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestMainExceptionsByPeriodAndappname[]>{
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,main_session,main_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getRestRequest(args);
    }

    getCountByDate(filters: {env: string, start: Date, end: Date, appName: string, groupedBy: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, countUnavailableServer: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, date: number, year: number}[]> {
        return this.getRestRequest({
            'column': `count:count,count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_unavailable_server:countUnavailableServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,start.${filters.groupedBy}:date,start.year:year`,
            'parent': 'main_session.id',
            'main_session.instance_env': 'instance.id',
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'order': 'year.asc,date.asc'
        });
    }

}