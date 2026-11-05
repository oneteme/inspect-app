import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class ExceptionService {
    constructor(private http: HttpClient) {

    }

    getException<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/exception`;
        return this.http.get<T>(url, { params: params });
    }

    getExceptions(id: string, type: number): Observable<{ type: string, message: string, offset: number, hasStack: boolean }[]> {
        let params = {
            'select': 'err_type:type,err_msg:message,order:offset,has_stack:hasStack',
            'parent': id,
            'trace_type': type
        };
        return this.getException(params);
    }

    getStacktrace(id: string, offset: number, type: number): Observable<{ stacktrace: string, cause: string }> {
        let params = {
            'select': 'stacktrace:stacktrace,cause:cause',
            'parent': id,
            'trace_type': type
        };
        return this.getException<{ stacktrace: any, cause: any }[]>(params).pipe(
            map(rows => rows.map(row => ({
                stacktrace: row.stacktrace.value,
                cause: row.cause.value
            }))[0])
        );
    }
}
