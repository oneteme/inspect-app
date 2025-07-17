import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {FtpSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {FtpRequest} from "../../model/trace.model";


@Injectable({ providedIn: 'root' })
export class FtpRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

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

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }


    getftpSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<FtpSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.asc'
        }
        return this.getftp(args);
    }
}