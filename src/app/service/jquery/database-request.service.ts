import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {JdbcExceptionsByPeriodAndAppname} from "../../model/jquery.model";
import {DatabaseRequestDto} from "../../model/request.model";
import {ChartItem} from "../../views/kpi/kpi.config";

@Injectable({ providedIn: 'root' })
/**
 * Provides KPI-oriented JDBC request queries and aggregations.
 */
export class DatabaseRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    /**
     * Executes a JDBC request query with typed response mapping.
     *
     * @param params Backend query parameters.
     * @returns Observable of the response typed with `T`.
     */
    getDatabaseRequest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get<T>(url, { params: params });
    }

    /**
     * Retrieves JDBC request rows from v3 query endpoints.
     *
     * @param params Backend filter parameters.
     * @returns Observable list of JDBC request DTOs.
     */
    getRequests(params: any): Observable<Array<DatabaseRequestDto>> {
        return this.http.get<Array<DatabaseRequestDto>>(`${this.server}/request/database`, { params: params });
    }

    /**
     * Retrieves distinct hosts for a request protocol and filter set.
     *
     * @param type Request protocol used in the endpoint path.
     * @param filters Query filters.
     * @returns Observable list of host values.
     */
    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    /**
     * Retrieves JDBC exception counts grouped by period and application.
     *
     * @param filters Environment, time range and grouping configuration.
     * @returns Observable list of aggregated exception rows.
     */
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

    /**
     * Builds and executes a configurable JDBC aggregation query for chart rendering.
     *
     * @param data Chart configuration (series, indicator, group and optional stack/filter).
     * @param filters Runtime filters (environment, period and optional host/filter lists).
     * @returns Observable list of aggregated rows ready for KPI charts.
     */
    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
              filters: {env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], filters?: string[] }): Observable<any[]> {
        let args: any = {
            'column': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value()}:${data.group.jquery.buildAlias()}`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(data.stack) {
            args['column'] += `,${data.stack.jquery.value()}:${data.stack.jquery.buildAlias()}`;
            args[`${data.stack.jquery.buildAlias()}.notNull`] = ''
        }
        if(data.group.jquery.order){
            args['order'] = `${data.group.jquery.order}`;
        }
        if(data.filter && filters.filters?.length) {
            args[`${data.filter.jquery.value()}.in`] = filters.filters.join(',');
        }
        if(filters.hosts?.length && !args['host.in']){
            args['host.in'] = filters.hosts.join(',');
        }
        return this.getDatabaseRequest(args);
    }

    /**
     * Retrieves distinct values for one chart filter dimension.
     *
     * @param filter Chart item describing the requested dimension.
     * @param filters Environment/time filters and optional host constraints.
     * @returns Observable list of available distinct filter values.
     */
    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], method?: string[] }) {
        let args: any = {
            'column': `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.join(',');
        }
        return this.getDatabaseRequest(args);
    }
}
