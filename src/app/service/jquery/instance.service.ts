import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {filter, Observable} from "rxjs";
import { LastServerStart, ServerStartByPeriodAndAppname } from "src/app/model/jquery.model";

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
            'column.distinct': 'id',
            'app_name.in': `"${appName}"`,
            'environement': env,
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

    getlastServerStart(filters : {env: string}): Observable<LastServerStart>{
        return this.getInstance({
            'column': `view1.appName,view1.version,view1.start,view1.collector`,
            'view': `select(app_name,version,start,collector,rank.over(partition(environement,app_name).order(start.desc)):rk).filter(type.eq(SERVER).and(environement.eq(${filters.env}))):view1`,
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

    getVersionStart(filters : {env: string, start: Date, end: Date, appName: string }): Observable<{collector: string, start: number}[]> {
        return this.getInstance({
            'column': `view1.collector,view1.start`,
            'view': `select(collector,start,rank.over(partition(environement,app_name).order(start.asc)):rk).filter(type.eq(CLIENT).and(environement.eq(${filters.env})).and(start.ge(${filters.start.toISOString()})).and(start.lt(${filters.end.toISOString()}))):view1`,
            'view1.rk': '1', 'order': 'view1.start.desc' });
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
}