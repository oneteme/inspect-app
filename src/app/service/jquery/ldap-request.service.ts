import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {LdapSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {DirectoryRequestDto} from "../../model/request.model";


@Injectable({ providedIn: 'root' })
export class LdapRequestService {
    constructor(private readonly http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getLdap<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ldap`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<DirectoryRequestDto>> {
        return this.http.get<Array<DirectoryRequestDto>>(`${this.server}/request/ldap`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getLdapSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string, host?: string[],command?: string[]  }): Observable<LdapSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `start.${filters.groupedBy}:date,count.sum.over(partition(date)):countok,exception.count_exception:count,count.divide(countok).multiply(100).round(2):pct,exception.err_type.coalesce():errorType,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
        }
        if(filters.command){
            args['command'] = filters.command.toString();
        }
        return this.getLdap(args);
    }


    getLdapExceptions(data: { column: string; order?: string },filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string, hosts?: string[],command?: string[]  }): Observable<LdapSessionExceptionsByPeriodAndappname[]> {
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
        return this.getLdap(args);
    }


    getRepartitionTimeAndTypeResponseByPeriod(data: { column: string; order?: string }, filters: {env: string, start: Date, end: Date, groupedBy: string, hosts: string[],command?: string[]}): Observable<{countSuccess: number, countError: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[]> {
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
        return this.getLdap(args);
    }
}