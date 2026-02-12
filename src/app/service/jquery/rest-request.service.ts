import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {RestSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";


@Injectable({ providedIn: 'root' })
export class RestRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getRestRequest<T>(params?: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get<T>(url, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getRestExceptionsByHost(data: { column: string; order?: string }, filters: { env: string, start: Date, end: Date, groupedBy: string, hosts: string[],command?: string[]  }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:count,error_type`,
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
            args['host.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }

        return this.getRestRequest(args);
    }

    getRepartitionTimeAndTypeResponseByPeriod(data: { column: string; order?: string }, filters: {env: string, start: Date, end: Date, groupedBy: string, hosts: string[], method?: string[] }): Observable<{countSuccess: number, countError: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[]> {
        let args: any = {
            'column': `avg(size_out).trunc(2):sizeOut,avg(size_in).trunc(2):sizeIn,count_succes:countSuccess,count_error_server:countErrorServer,count_error_client:countErrorClient,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,count_unavailable_server:countServerUnavailableRows`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
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
        return this.getRestRequest(args);
    }

    getLatencyByHost(data: { column: string; order?: string }, filters: { env: string, start: Date, end: Date, groupedBy: string, hosts: string[] }): Observable<{ elapsedtime: number}[]> {
        let args: any = {
            'column': `avg(elapsedtime).minus(avg(rest_session.elapsedtime):ep2):elapsedtime`,
            'join': 'instance,rest_session_inner',
            'status.gt': 0,
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
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
        return this.getRestRequest(args);
    }

    getRestExceptions1(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'column': `count:count,count.sum.over(partition(start.${filters.groupedBy}:date,start.year)):countok,error_type,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'exception,instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'date.asc'
        }
        if(filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getRestRequest(args);
    }

    getCountByDate(filters: {env: string, start: Date, end: Date, appName: string, groupedBy: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, countUnavailableServer: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, date: number, year: number}[]> {
        return this.getRestRequest({
            'column': `count:count,count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_unavailable_server:countUnavailableServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,start.${filters.groupedBy}:date,start.year:year`,
            'parent': 'main_session.id',
            'main_session.instance_env': 'instance.id',
            'main_session.start.ge': filters.start.toISOString(),
            'main_session.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'order': 'year.asc,date.asc'
        });
    }

    getUsersByPeriod(filters: {env: string, start: Date, end: Date, groupedBy: string, hosts: string[],method?: string[] }): Observable<{user: string, date: number, year: number}[]> {
      let args = {
        'column.distinct': `user,start.${filters.groupedBy}:date,start.year:year`,
        'instance_env': 'instance.id',
        'user.notNull': '',
        'instance.environement': filters.env,
        'start.ge': filters.start.toISOString(),
        'start.lt': filters.end.toISOString(),
        'order': `year.asc,date.asc`
      };
      if(filters.hosts && filters.hosts.length){
          args['host.in'] =`${filters.hosts.map(o=> `"${o}"` )}`;
      }
      if(filters.method){
        args['method'] = filters.method.toString();
      }
      return this.getRestRequest(args);
    }


    getDependentsNew(filters: { start: Date, end: Date,env: string, hosts: string[],method?: string[] }): Observable<{
        countServerUnavailableRows: number;
        count: number, countSucces: number, countErrClient: number, countErrServer: number, appName: string}[]> {

        let args: any = {
            'column': `count_succes:countSucces,count_error_server:countErrServer,count_error_client:countErrClient,count_unavailable_server:countServerUnavailableRows,instance.app_name:appName`,
            'join': 'instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'order': 'count.desc'
        }
        if(filters.hosts && filters.hosts.length){
            args['host.in'] =`${filters.hosts.map(o=> `"${o}"` )}`;
        }
        if(filters.method){
            args['method'] = filters.method.toString();
        }
        return this.getRestRequest(args);
    }
}