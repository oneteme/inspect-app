import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {filter, map, Observable} from "rxjs";
import { ServerStartByPeriodAndAppname } from "src/app/model/jquery.model";

@Injectable({ providedIn: 'root' })
export class InstanceService {
    constructor(private http: HttpClient) {

    }

    getInstance<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/instance`;
        return this.http.get<T>(url, { params: params });
    }

    getIds(env: string, end: Date, appName: string): Observable<{ id: string }[]> {
        let args: any = {
            'column': 'id',
            'app_name.in': `"${appName}"`,
            'environement': env,
            'type': 'SERVER',
            'start.lt': end.toISOString(),
        }
        return this.getInstance(args);
    }

    getEnvironments(): Observable<{ environement: string }[]> {
        let args = {
            'column.distinct': 'environement',
            'environement.notNull': '',
            'order': 'environement.asc'
        }
        return this.getInstance(args);
    }

    getApplications(type: string): Observable<{ appName: string }[]> {
        let args = {
            'column.distinct': 'app_name:appName',
            'appName.notNull': '',
            'type': type,
            'order': 'app_name.asc'
        }
        return this.getInstance(args);
    }

    getServerStart(filters : {env: string, start:Date, end: Date, app_name: string }): Observable<ServerStartByPeriodAndAppname> {
        return this.getInstance({
            'column': `view1.appName,view1.version,view1.start`,
            'view': `select(app_name,version,start,rank.over(partition(environement,app_name).order(start.desc)):rk).filter(type.eq(SERVER).and(environement.eq(${filters.env})).and(start.ge(${filters.start.toISOString()})).and(start.lt(${filters.end.toISOString()}))${filters.app_name}):view1`,
            'view1.rk': '1', 'order': 'view1.start.desc' });
    }

    getServerStartHistory(filters : {env: string, start: Date, end: Date, appName: string }): Observable<{version: string, start: number}[]> {
        return this.getInstance({
            'column': `version,start`,
            'environement': filters.env,
            'app_name': `"${filters.appName}"`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'start.desc'
        });
    }

    getCountByRe(filters : {env: string, start: Date, end: Date, appName: string }): Observable<{count: number, re: string}[]>  {
        return this.getInstance({
            'column': `count:count,re`,
            'environement': filters.env,
            'app_name': `"${filters.appName}"`,
            'type': 'CLIENT',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        });
    }

    getMainSessionApplication(start: Date, end: Date, env: string): Observable<{appName: string, type: string}[]> {
        let args = {
            'column.distinct': 'app_name:appName,main_session.type',
            'id': 'main_session.instance_env',
            'main_session.start.ge': start.toISOString(),
            'main_session.start.lt': end.toISOString(),
            'appName.notNull': '',
            'environement': env,
            'main_session.type': 'VIEW',
            'order': 'app_name.asc'
        }
        return this.getInstance(args);
    }

    // new
    getLastServerInfo(filters : {env: string, appName: string }): Observable<{appName: string, version: string, collector: string, start: number}> {
        return this.getInstance({
            'column': `view1.appName,view1.version,view1.collector,view1.start`,
            'view': `select(app_name,version,collector,start,rank.over(partition(environement,app_name).order(start.desc)):rk).filter(type.eq(SERVER).and(environement.eq(${filters.env})).and(app_name.eq("${filters.appName}"))):view1`,
            'view1.rk': '1', 'order': 'view1.start.desc' }).pipe(map(res => res[0]));
    }

    getCountVersions(filters : {env: string, appName: string }): Observable<number> {
        return this.getInstance({
            'column.distinct': 'version',
            'environement': filters.env,
            'app_name': `"${filters.appName}"`,
        }).pipe(map((res: {version: string}[]) => res.length));
    }

    getCountServerStart(filters : {env: string, appName: string }): Observable<number> {
        return this.getInstance({
            'column': 'count:count',
            'environement': filters.env,
            'app_name': `"${filters.appName}"`
        }).pipe(map((res: {count: number}[]) => res[0].count));
    }

    getVersionsRestSession(filters : {env: string, appName: string, start: Date, end: Date }): Observable<string[]> {
        return this.getInstance({
            'column.distinct': 'version',
            'environement': filters.env,
            'app_name': `"${filters.appName}"`,
            'id': 'rest_session.instance_env',
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString()
        }).pipe(map((res: {version: string}[]) => res.map(r => r.version)));
    }

    getVersionsMainSession(filters : {env: string, appName: string, start: Date, end: Date }): Observable<string[]> {
        return this.getInstance({
            'column.distinct': 'version',
            'environement': filters.env,
            'app_name': `"${filters.appName}"`,
            'id': 'main_session.instance_env',
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString()
        }).pipe(map((res: {version: string}[]) => res.map(r => r.version)));
    }
}