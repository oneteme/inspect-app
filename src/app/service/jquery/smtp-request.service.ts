import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SmtpMainExceptionsByPeriodAndappname, SmtpSessionExceptionsByPeriodAndappname } from "src/app/model/jquery.model";


@Injectable({ providedIn: 'root' })
export class smtpRequestService {
    constructor(private http: HttpClient) {

    }

    getsmtp<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/smtp`;
        return this.http.get<T>(url, { params: params });
    }


    getsmtpSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<SmtpSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,smtp_request.rest_session,rest_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getsmtp(args);
    }

    getsmtpMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<SmtpMainExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():err_type,start.${filters.groupedBy}:date,start.year:year`,
            'instance.environement': filters.env,
            'join': 'exception,smtp_request.main_session,main_session.instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getsmtp(args);
    }



}