import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {FilterMap} from "../../views/constants";

@Injectable({ providedIn: 'root' })
export class MainSessionService {
    constructor(private http: HttpClient) {

    }

    getMainSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get<T>(url, { params: params });
    }

    getInfos(filters: {start: Date, end: Date, advancedParams: FilterMap, user: string, env: string}): Observable<{name: string, date: number, elapsedtime: number, location: string, appName: string}[]> {
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

    getDependencies(filters: {start: Date, end: Date, advancedParams: FilterMap, ids: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string, appName: string}[]> {
        let args: any = {
            'column': `rest_request.count:count,rest_request.count_succes:countSucces,rest_request.count_error_client:countErrClient,rest_request.count_error_server:countErrServer,instance.app_name:name`,
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
}