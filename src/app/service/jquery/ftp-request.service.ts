import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {FtpSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {FtpRequestDto} from "../../model/request.model";


@Injectable({ providedIn: 'root' })
export class FtpRequestService {

    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getFtp<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ftp`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<FtpRequestDto>> {
        return this.http.get<Array<FtpRequestDto>>(`${this.server}/request/ftp`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getRepartitionTimeAndTypeResponseByPeriod(data: { column: string; order?: string }, filters: {
        start: Date;
        end: Date;
        groupedBy: string;
        env: string;
        hosts: string[];
        command?: string[];
    }): Observable<{
        countSuccess: number;
        countError: number;
        elapsedTimeSlowest: number;
        elapsedTimeSlow: number;
        elapsedTimeMedium: number;
        elapsedTimeFast: number;
        elapsedTimeFastest: number;
        avg: number;
        max: number;
        date: number;
        year: number
    }[]> {
        let args: any = {
            'column': `count_request_success:countSuccess,count_request_error:countError,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
        }
        if(data?.column){
            args['column'] += `,${data.column}`;
        }
        if(data?.order){
            args['order'] = data.order;
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getFtp(args);
    }

    getftpSessionExceptionsByHost(data: { column: string; order?: string },filters: { env: string, start: Date, end: Date, groupedBy: string, hosts: string[],command?: string[]  }): Observable<FtpSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `exception.err_type.coalesce():errorType`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
        }
        if(data?.column){
            args['column'] += `,${data.column}`;
        }
        if(data?.order){
            args['order'] = data.order;
        }
        if(filters.hosts && filters.hosts.length){
            args['host.in'] = filters.hosts.map(o => `"${o}"`).join(",");
        }
        return this.getFtp(args);
    }


    getftpSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<FtpSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:countok,exception.count_exception:count,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'date.asc'
        }
        if(filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getFtp(args);
    }

}