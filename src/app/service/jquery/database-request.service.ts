import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {JdbcExceptionsByPeriodAndAppname, RepartitionRequestByPeriod} from "../../model/jquery.model";
import {DatabaseRequestDto} from "../../model/request.model";
import {ChartItem} from "../../views/kpi/kpi.config";

@Injectable({ providedIn: 'root' })
export class DatabaseRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getDatabaseRequest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<DatabaseRequestDto>> {
        return this.http.get<Array<DatabaseRequestDto>>(`${this.server}/request/database`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getRepartitionTimeAndTypeResponseByPeriod(data: { column: string; order?: string }, filters: {env: string, start: Date, end: Date, groupedBy: string, hosts: string[],command?: string[], schema?: string[]}): Observable<{countSuccess: number, countError: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[]> {
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
        return this.getDatabaseRequest(args);
    }

    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string, database: string, env: string}): Observable<RepartitionRequestByPeriod> {
        let args: any = {
            'column': `count:count,count_request_error:countErrorServer,count_slowest:countSlowest,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database,
            'order': 'year.asc,date.asc'
        }
        return this.getDatabaseRequest(args);
    }

    getRepartitionTime(filters: {start: Date, end: Date, database: string, env: string}): Observable<{elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number}[]> {
        let args: any = {
            'column': 'count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest',
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database
        }
        return this.getDatabaseRequest(args);
    }

    getRepartitionTimeByPeriod(filters: {start: Date, end: Date, groupedBy: string, database: string, env: string}): Observable<{elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[]> {
        let args: any = {
            'column': `count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'db': filters.database,
            'order': `year.asc,date.asc`
        }
        return this.getDatabaseRequest(args);
    }

    getJdbcExceptions(data: { column: string; order?: string }, filters: { env: string, start: Date, end: Date, groupedBy: string, hosts: string[],command?: string[], schema?: string[] }): Observable<JdbcExceptionsByPeriodAndAppname[]> {
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
        return this.getDatabaseRequest(args);
    }




    getJdbcRestSessionExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<JdbcExceptionsByPeriodAndAppname[]> {
      let args = {
        'column': `count:count,count.sum.over(partition(start.${filters.groupedBy}:date,start.year)):countok,exception.err_type.coalesce():errorType,start.${filters.groupedBy}:date,start.year:year`,
        'join': 'exception,instance',
        'instance.environement': filters.env,
        'start.ge': filters.start.toISOString(),
        'start.lt': filters.end.toISOString(),
        'order': 'date.asc'
      }
      if(filters.app_name) {
        args['instance.app_name.in'] = filters.app_name;
      }
      return this.getDatabaseRequest(args);
    }

    getSchemaList(filters: { start: Date, end: Date,env: string, host: string[] }): Observable<{schema: string}[]> {
        let args: any = {
            'column.distinct': `schema`,
            'host':`"${filters.host}"`,
            'join': 'instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
        }
        return this.getDatabaseRequest(args);
    }

    getCustom(data: {base: string; column?: string; order?: string; sliceFilter?: string },
              filters: {start: Date; end: Date; env: string; hosts: string[]; method?: string[] }): Observable<any[]> {
        let args: any = {
            'column': `${data.base}`,
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

        if(data?.sliceFilter){
            args[Object.keys(data.sliceFilter)[0]] = `"${Object.values(data.sliceFilter)[0]}"`;
        }

        return this.getDatabaseRequest(args);
    }

    getCustom2(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
               filters: {env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], filters?: string[] }): Observable<any[]> {
        let args: any = {
            'column': `${data.series.map(d => d.jquery.value + '.' + data.indicator.jquery.value + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value}:${data.group.jquery.buildAlias()}`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(data.stack) {
            args['column'] += `,${data.stack.jquery.value}:${data.stack.jquery.buildAlias()}`;
            args[`${data.stack.jquery.buildAlias()}.notNull`] = ''
        }
        if(data.group.jquery.order){
            args['order'] = `${data.group.jquery.buildAlias()}.${data.group.jquery.order}`;
        }
        if(filters.filters?.length) {
            args[`${data.filter.jquery.value}.in`] = filters.filters.map(o => `"${o}"`).join(',');
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getDatabaseRequest(args);
    }

    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], method?: string[] }) {
        let args: any = {
            'column': `${filter.jquery.value}.distinct:${filter.jquery.buildAlias()}`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getDatabaseRequest(args);
    }
}