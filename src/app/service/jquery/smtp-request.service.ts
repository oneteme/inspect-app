import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import { SmtpMainExceptionsByPeriodAndappname, SmtpSessionExceptionsByPeriodAndappname } from "src/app/model/jquery.model";
import {MailRequest, RestRequest} from "../../model/trace.model";


@Injectable({ providedIn: 'root' })
export class smtpRequestService {
    constructor(private http: HttpClient) {

    }
    server = `${localStorage.getItem('server')}/v3/trace`;

    getsmtp<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/smtp`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<MailRequest>> {
        return this.http.get<Array<MailRequest>>(`${this.server}/request/smtp`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }


    getsmtpSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<SmtpSessionExceptionsByPeriodAndappname[]> {
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
        return this.getsmtp(args);
    }

    getsmtpMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<SmtpMainExceptionsByPeriodAndappname[]> {
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
        return this.getsmtp(args);
    }



}