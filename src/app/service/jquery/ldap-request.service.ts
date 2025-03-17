import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { LdapMainExceptionsByPeriodAndappname, LdapSessionExceptionsByPeriodAndappname } from "src/app/model/jquery.model";


@Injectable({ providedIn: 'root' })
export class LdapRequestService {
    constructor(private http: HttpClient) {

    }

    getLdap<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ldap`;
        return this.http.get<T>(url, { params: params });
    }


    getLdapSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<LdapSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,rest_session,rest_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getLdap(args);
    }

    getLdapMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<LdapMainExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,main_session,main_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getLdap(args);
    }



}