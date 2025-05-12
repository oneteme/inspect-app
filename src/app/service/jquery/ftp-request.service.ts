import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import { FtpMainExceptionsByPeriodAndappname, FtpSessionExceptionsByPeriodAndappname } from "src/app/model/jquery.model";
import {FtpRequest, NamingRequest} from "../../model/trace.model";


@Injectable({ providedIn: 'root' })
export class FtpRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/trace`;

    getftp<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ftp`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<FtpRequest>> {
        return this.http.get<Array<FtpRequest>>(`${this.server}/request/ftp`, { params: params });
    }

    getRequestsById(id: string): Observable<FtpRequest> {
        return this.http.get<FtpRequest>(`${this.server}/request/ftp/${id}`);
    }

    getHost(filters: { env: string, start: Date, end: Date, type: string }): Observable<{ host: string }[]> {
        let arg  = {
            'column.distinct': 'host',
            'host.notNull': '',
            'instance.type': filters.type,
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'host.asc'
        }
        return forkJoin({
            rest: this.getftp({...arg,'join': 'rest_session,rest_session.instance'}),
            main: this.getftp({...arg,'join': 'main_session,main_session.instance',})
        }).pipe(map((result: {rest:any,main:any})=> ([...result.rest,...result.main])))
    }


    getftpSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<FtpSessionExceptionsByPeriodAndappname[]> {
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
        return this.getftp(args);
    }

    getftpMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<FtpMainExceptionsByPeriodAndappname[]> {
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
        return this.getftp(args);
    }



}