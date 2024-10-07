import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class ExceptionService {
    constructor(private http: HttpClient) {

    }

    getException<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/exception`;
        return this.http.get<T>(url, { params: params });
    }

    getDatabaseException(filters: {start: Date, end: Date, database: string, env: string}): Observable<{count: number, errorType: string, errorMessage: string}[]> {
        let args = {
            'column': 'count:count,err_type:errType,err_msg:errMsg',
            'parent': 'database_request.id',
            'database_request.db': filters.database,
            'database_request.start.ge': filters.start.toISOString(),
            'database_request.start.lt': filters.end.toISOString(),
            'database_request.parent': 'rest_session.id',
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            'rest_session.instance_env': 'instance.id',
            'instance.environement': filters.env,
            'type': 'JDBC',
            'order': 'count.desc'
        }
        return this.getException(args);
    }
}