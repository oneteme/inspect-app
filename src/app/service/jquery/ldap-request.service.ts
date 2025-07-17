import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import { LdapMainExceptionsByPeriodAndappname, LdapSessionExceptionsByPeriodAndappname } from "src/app/model/jquery.model";
import { NamingRequest} from "../../model/trace.model";


@Injectable({ providedIn: 'root' })
export class LdapRequestService {
    constructor(private readonly http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getLdap<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ldap`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<NamingRequest>> {
        return this.http.get<Array<NamingRequest>>(`${this.server}/request/ldap`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getLdapExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<LdapSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getLdap(args);
    }
}