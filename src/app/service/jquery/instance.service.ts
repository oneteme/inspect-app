import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
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

    getApplications(): Observable<{ appName: string }[]> {
        let args = {
            'column.distinct': 'app_name:appName',
            'order': 'app_name.asc'
        }
        return this.getInstance(args);
    }

    getServerStart(filters : {env: string, start:Date, end: Date,groupedBy:string, app_name: string }): Observable<ServerStartByPeriodAndAppname> {
        return this.getInstance({
            'column': `view1.appName,view1.version,view1.start`,
            'view': `select(app_name,version,start,rank.over(partition(environement,app_name).order(start.desc)):rk).filter(type.eq(SERVER).and(environement.eq(${filters.env})).and(start.ge(${filters.start.toISOString()})).and(start.lt(${filters.end.toISOString()}))${filters.app_name}):view1`,
            'view1.rk': '1', 'order': 'view1.start.desc' });
    }
}