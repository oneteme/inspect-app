import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { FilterMap } from "../../views/constants";
import { MainExceptionsByPeriodAndAppname } from "src/app/model/jquery.model";

@Injectable({ providedIn: 'root' })
export class MainSessionService {
    constructor(private http: HttpClient) {

    }

    getMainSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get<T>(url, { params: params });
    }

    getInfos(filters: { start: Date, end: Date, advancedParams: FilterMap, user: string, env: string }): Observable<{ name: string, date: number, elapsedtime: number, location: string, appName: string }[]> {
        let args = {
            'column': "name:name,start:date,elapsedtime:elapsedtime,location:location,instance.app_name:appName",
            'main_session.instance_env': 'instance.id',
            'user': filters.user,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'type': 'VIEW',
            'order': 'date.desc',
            ...filters.advancedParams
        }
        return this.getMainSession(args)
    }

    getMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<MainExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'main_session.type': 'BATCH',
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            [filters.app_name]: '',
            'start.lt': filters.end.toISOString(),
            "order": "date.desc,count.desc"
        }
        return this.getMainSession(args);
    }

    getDependencies(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, appName: string, type: string}[]> {
        let args: any = {
            'column': `rest_request.count:count,rest_request.count_succes:countSucces,rest_request.count_error_client:countErrClient,rest_request.count_error_server:countErrServer,instance.app_name:name,instance.type`,
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
        return this.getMainSession(args);
    }

    getDependents(filters: {env: string, start: Date, end: Date, appName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string}[]> {
        return this.getMainSession({
            'column': 'rest_request.count:count,rest_request.count_succes:countSucces,rest_request.count_error_client:countErrClient,rest_request.count_error_server:countErrServer,instance_join.app_name:name',
            'instance.id': 'instance_env',
            'instance.app_name': `"${filters.appName}"`,
            'instance.environement': filters.env,
            'instance.type': 'CLIENT',
            'id': 'rest_request.parent',
            'rest_request.remote': 'rest_session_join.id',
            'rest_session_join.instance_env': 'instance_join.id',
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        });
    }

    getCountByPage(filters: { env: string, start: Date, end: Date, appName: string }): Observable<{count: number, location: string}[]> {
        return this.getMainSession({
            'column': `count:count,location`,
            'join': 'instance',
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc',
            'limit': '5'
        });
    }

    getCountSessionByDateAndUser(filters: { env: string, start: Date, end: Date, groupedBy: string, appName: string }): Observable<{count: number, user: string, date: number}[]> {
        return this.getMainSession({
            'column': `count:count,user,start.${filters.groupedBy}:date`,
            'join': 'instance',
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': 'VIEW',
            'order': 'date.asc'
        });
    }

    getCountByException(filters: { env: string, start: Date, end: Date, appName: string }): Observable<{count: number, errorMessage: string, status: number}[]> {
        return this.getMainSession({
            'column': `exception.count:count,exception.err_msg,rest_request.status`,
            'join': 'instance,rest_request,rest_request.exception',
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_request.status.ge': 400,
            'order': 'count.desc'
        });
    }

    getMainSessionArchitectureForHeatMap(filters: {start: Date, end: Date, env: string}): Observable<{count: number, origin: string, target: string}[]> {
        return this.getMainSession({
            'column': 'rest_request.count:count,instance.app_name:origin,instance_join.app_name:target',
            'instance.id': 'instance_env',
            'id': 'rest_request.parent',
            'rest_request.remote': 'rest_session_join.id',
            'rest_session_join.instance_env': 'instance_join.id',
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'type': 'VIEW',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance_join.environement': filters.env,
            'order': 'origin.asc,target.asc'
        });
    }
}