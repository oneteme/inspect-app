import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { RestMainExceptionsByPeriodAndappname, RestSessionExceptionsByPeriodAndappname } from "src/app/model/jquery.model";


@Injectable({ providedIn: 'root' })
export class restRequestService {
    constructor(private http: HttpClient) {

    }

    getrest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get<T>(url, { params: params });
    }


    getrestSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,rest_request.rest_session,rest_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getrest(args);
    }

    getrestMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestMainExceptionsByPeriodAndappname[]>{
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,rest_request.main_session,main_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getrest(args);
    }



}