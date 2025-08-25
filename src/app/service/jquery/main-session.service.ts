import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {map, Observable} from "rxjs";
import { FilterMap } from "../../views/constants";
import {
    MainExceptionsByPeriodAndAppname,
    RepartitionTimeAndTypeResponseByPeriod,
    SessionExceptionsByPeriodAndAppname
} from "src/app/model/jquery.model";

@Injectable({ providedIn: 'root' })
export class MainSessionService {
    constructor(private http: HttpClient) {

    }

    getMainSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get<T>(url, { params: params });
    }

    getInfos(filters: { start: Date, end: Date, user: string, env: string }): Observable<{ name: string, date: number, elapsedtime: number, location: string, appName: string }[]> {
        let args = {
            'column': "name:name,start:date,elapsedtime:elapsedtime,location:location,instance.app_name:appName",
            'main_session.instance_env': 'instance.id',
            'user': filters.user,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'type': 'VIEW',
            'order': 'date.desc'
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

    getDependents(filters: {env: string, start: Date, end: Date, appName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string}[]> {
        return this.getMainSession({
            'column': 'rest_request.count:count,rest_request.count_succes:countSucces,rest_request.count_error_client:countErrClient,rest_request.count_error_server:countErrServer,instance_join.app_name:name',
            'instance.id': 'instance_env',
            'instance.app_name': `"${filters.appName}"`,
            'instance.environement': filters.env,
            'instance.type': 'CLIENT',
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
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
            'column': 'rest_request.count:count,rest_request.size_out.sum:sum,instance.app_name:origin,instance_join.app_name:target',
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

    getRepartitionTimeAndTypeResponseByPeriodNew(filters: {server: string, env: string, start: Date, end: Date, groupedBy: string, apiNames: string, users: string, versions: string}): Observable<RepartitionTimeAndTypeResponseByPeriod> {
        let args: any = {
            'column': `count_no_exception:countSucces,count_exception:countError,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'instance.app_name': filters.server,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': 'BATCH',
            'order': `year.asc,date.asc`,
        }
        if(filters.apiNames) {
            args['name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getMainSession(args);
    }

    getUsersByPeriod(filters: {server: string, env: string, start: Date, end: Date, groupedBy: string, apiNames: string, users: string, versions: string }): Observable<{user: string, date: number, year: number}[]> {
        let args = {
            'column.distinct': `user,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': filters.server,
            'instance.type': 'SERVER'
        };
        if(filters.apiNames) {
            args['name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getMainSession(args);
    }

    getBatchNames(filters: {env: string, appName: string, start: Date, end: Date}): Observable<string[]> {
        return this.getMainSession({
            'column.distinct': 'name',
            'join': 'instance',
            'name.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'SERVER',
            'type': 'BATCH'
        }).pipe(map((data: {name: string}[]) => (data.map(d => d.name))));
    }

    getDependentsNew(filters: {server: string, env: string, start: Date, end: Date, apiNames: string, users: string, versions: string }): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, appName: string}[]> {
        let args: any = {
            'column': `rest_session_join.count:count,rest_session_join.count_succes:countSucces,rest_session_join.count_error_client:countErrClient,rest_session_join.count_error_server:countErrServer,instance_join.app_name`,
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.instance_env': 'instance_join.id',
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance_env': 'instance.id',
            'instance.app_name': filters.server,
            'instance.environement': filters.env,
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        }
        if(filters.apiNames) {
            args['name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getMainSession(args);
    }

    getSessionExceptions(filters : {env: string, start:Date, end: Date,groupedBy:string, app_name: string }): Observable<SessionExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'join': 'instance',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.desc,count.desc'
        }
        return this.getMainSession(args);
    }

    getUsers(filters: {env: string, appName: string, start: Date, end: Date}): Observable<string[]> {
        return this.getMainSession({
            'column.distinct': 'user',
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': 'BATCH',
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'SERVER'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }

    getUsersView(filters: {env: string, date: Date}): Observable<string[]> {
        return this.getMainSession({
            'column.distinct': 'user',
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.date.toISOString(),
            'type': 'VIEW',
            'instance.environement': filters.env,
            'instance.type': 'CLIENT'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }
}