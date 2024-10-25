import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {FilterMap} from "../../views/constants";
import {
    RepartitionRequestByPeriod,
    RepartitionTimeAndTypeResponse,
    RepartitionTimeAndTypeResponseByPeriod,
    SessionExceptionsByPeriodAndAppname
} from "../../model/jquery.model";

@Injectable({ providedIn: 'root' })
export class RestSessionService {
    constructor(private http: HttpClient) {

    }

    getRestSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/rest`;
        return this.http.get<T>(url, { params: params });
    }

    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string }): Observable<RepartitionTimeAndTypeResponse>;
    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<RepartitionTimeAndTypeResponse>;
    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date, advancedParams: FilterMap, user: string, env: string}): Observable<RepartitionTimeAndTypeResponse>;
    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string, user: string, env: string}): Observable<RepartitionTimeAndTypeResponse> {
        let args: any = {
            'column': 'count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,count_succes:countSucces,count_error_server:countErrorServer,count_error_client:countErrorClient',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            ...filters.advancedParams
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if (filters.apiName) {
                args['api_name'] = `"${filters.apiName}"`;
            }
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string}): Observable<RepartitionTimeAndTypeResponseByPeriod>
    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string, apiName: string}): Observable<RepartitionTimeAndTypeResponseByPeriod>
    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, user: string, env: string}): Observable<RepartitionTimeAndTypeResponseByPeriod>
    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string, apiName: string, user: string, env: string}): Observable<RepartitionTimeAndTypeResponseByPeriod> {
        let args: any = {
            'column': `count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_unavailable_server:countUnavailableServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': `year.asc,date.asc`,
            ...filters.advancedParams
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if (filters.apiName) {
                args['api_name'] = `"${filters.apiName}"`;
            }
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string}): Observable<RepartitionRequestByPeriod>;
    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string, apiName: string}): Observable<RepartitionRequestByPeriod>;
    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, user: string, env: string}): Observable<RepartitionRequestByPeriod>;
    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string, apiName: string, user: string, env: string}): Observable<RepartitionRequestByPeriod> {
        let args: any = {
            'column': `count:count,count_error_server:countErrorServer,count_slowest:countSlowest,start.${filters.groupedBy}:date,start.year:year`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'year.asc,date.asc',
            ...filters.advancedParams
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if (filters.apiName) {
                args['api_name'] = `"${filters.apiName}"`;
            }
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getRepartitionUser(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{count: number, user: string}[]>;
    getRepartitionUser(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, user: string}[]>;
    getRepartitionUser(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, user: string}[]> {
        let args: any = {
            'column': 'count:count,user',
            'instance_env.in': filters.ids,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'user.notNull': '',
            'order': 'count.desc',
            'limit': 5,
            ...filters.advancedParams
        }
        if (filters.apiName) {
            args['api_name'] = `"${filters.apiName}"`;
        }
        return this.getRestSession(args);
    }

    getRepartitionUserByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string}): Observable<{count: number, date: number, year: number, user: string}[]>;
    getRepartitionUserByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, date: number, year: number, user: string}[]>;
    getRepartitionUserByPeriod(filters: {start: Date, end: Date, groupedBy: string, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, date: number, year: number, user: string}[]> {
        let args: any = {
            'column': `count:count,start.${filters.groupedBy}:date,start.year:year,user`,
            'instance_env.in': filters.ids,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'user.notNull': '',
            'order': `year.asc,date.asc,count.desc`,
            ...filters.advancedParams
        }
        if(filters.apiName) {
            args['api_name'] = `"${filters.apiName}"`;
        }
        return this.getRestSession(args);
    }

    getRepartitionApi(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, apiName: string}[]>;
    getRepartitionApi(filters: {start: Date, end: Date, advancedParams: FilterMap, user: string, env: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, apiName: string}[]>;
    getRepartitionApi(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, user: string, env: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, apiName: string}[]> {
        let args: any = {
            'column': 'count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,api_name',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'api_name.notNull': '',
            'order': 'count.desc',
            'limit': 5,
            ...filters.advancedParams
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getDependencies(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, type: string}[]>;
    getDependencies(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, appName: string, type: string}[]> ;
    getDependencies(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, appName: string, type: string}[]> {
        let args: any = {
            'column': `rest_request.count:count,rest_request.count_succes:countSucces,rest_request.count_error_client:countErrClient,rest_request.count_error_server:countErrServer,${filters.apiName ? 'api_name:name,instance.app_name' : 'instance.app_name:name'},instance.type`,
            'instance.id':  'instance_env',
            'id': 'rest_request.parent',
            'rest_request.remote': 'rest_session_join.id',
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'rest_session_join.instance_env.in': filters.ids,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'view': 'rest_session:rest_session_join',
            'order': 'count.desc',
            ...filters.advancedParams
        }
        if(filters.apiName) {
            args['rest_session_join.api_name'] = `"${filters.apiName}"`;
            args['rest_session_join.api_name.notNull'] = ``;
        }
        return this.getRestSession(args);
    }

    getDependents(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, type: string}[]>;
    getDependents(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, appName: string, type: string}[]>;
    getDependents(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, appName: string, type: string}[]> {
        let args: any = {
            'column': `rest_session_join.count:count,rest_session_join.count_succes:countSucces,rest_session_join.count_error_client:countErrClient,rest_session_join.count_error_server:countErrServer,${filters.apiName ? 'rest_session_join.api_name:name,instance_join.app_name' : 'instance_join.app_name:name'},instance_join.type`,
            'id': 'rest_request.parent',
            'rest_request.remote': 'rest_session_join.id',
            'rest_session_join.instance_env': 'instance_join.id',
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance_env.in': filters.ids,
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc',
            ...filters.advancedParams
        }
        if(filters.apiName) {
            args['api_name'] = `"${filters.apiName}"`;
            args['api_name.notNull'] = ``;
        }
        return this.getRestSession(args);
    }

    getExceptions(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{count: number, errorType: string}[]>;
    getExceptions(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string}): Observable<{count: number, errorType: string}[]>;
    getExceptions(filters: {start: Date, end: Date, advancedParams: FilterMap, user: string, env: string}): Observable<{count: number, errorType: string}[]>;
    getExceptions(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string, apiName: string, user: string, env: string}): Observable<{count: number, errorType: string}[]> {
        let args: any = {
            'column': 'count:count,err_type',
            'status.ge': 500,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc',
            'limit': 5,
            ...filters.advancedParams
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if(filters.apiName) args['api_name'] = `"${filters.apiName}"`;
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getSessionExceptions(filters : {env: string, start:Date, end: Date,groupedBy:string, app_name: string }): Observable<SessionExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
             'join': 'instance',
              'instance.environement': filters.env,
               'start.ge': filters.start.toISOString(), 
               'start.lt': filters.end.toISOString(),
                [filters.app_name]: '', 
                "order": "date.desc,count.desc" 
        }
        return this.getRestSession(args);
    }
}