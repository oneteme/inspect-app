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
}