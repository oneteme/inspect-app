import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {ExceptionsByPeriodAndAppname} from "src/app/model/jquery.model";
import {ChartItem} from "../../views/kpi/kpi.config";

@Injectable({ providedIn: 'root' })
/**
 * Provides KPI-oriented MAIN session queries (batch, startup, view and dependencies).
 */
export class MainSessionService {
    constructor(private http: HttpClient) {

    }

    /**
     * Executes a main session query with typed response mapping.
     *
     * @param params Backend query parameters.
     * @returns Observable of the response typed with `T`.
     */
    getMainSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get<T>(url, { params: params });
    }

    /**
     * Retrieves distinct server host names for a main session type and period.
     *
     * @param filters Environment, period and session type filters.
     * @returns Observable list of host names.
     */
    getHosts(filters: {start: Date, end: Date, env: string, type: string}): Observable<{ host: string }[]> {
        var args: any = {
            'column': `instance.app_name.distinct:host`,
            'join': 'instance',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': filters.type,
            'order': 'instance.app_name.asc',
        };

        return this.getMainSession(args);
    }

    /**
     * Retrieves batch exception metrics grouped by period.
     *
     * @param filters Environment, period and optional application filter.
     * @returns Observable list of aggregated exception rows.
     */
    getMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year,type:type`,
            'main_session.type': 'BATCH',
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            "order": "date.desc,count.desc"
        }
        if(filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getMainSession(args);
    }

    /**
     * Retrieves startup exception metrics grouped by period.
     *
     * @param filters Environment, period and optional application filter.
     * @returns Observable list of aggregated startup exception rows.
     */
    getStartupExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        const args: any = {
            'column': `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'join': 'instance',
            'instance.environement': filters.env,
            'type': 'STARTUP',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'date.desc,count.desc'
        };
        if (filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getMainSession(args);
    }

    /**
     * Retrieves top batch jobs producing the most errors.
     *
     * @param filters Environment, period and optional application filter.
     * @returns Observable list of job names with associated error counts.
     */
    getTopBatchJobErrors(filters: { env: string, start: Date, end: Date, app_name: string }): Observable<{ name: string; count: number }[]> {
        const args: any = {
            'column': 'name,count:count',
            'join': 'instance',
            'type': 'BATCH',
            'err_type.notNull': '',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc',
            'limit': '6'
        };
        if (filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getMainSession(args);
    }

    /**
     * Retrieves dependency direction data from origins to targets for chart graphs.
     *
     * @param filters Environment, period, source servers and session type.
     * @returns Observable list of dependency links with call counts.
     */
    getDependents(filters: {env: string, start: Date, end: Date, servers: string[], type: string}): Observable<{count: number, target: string, origin: string}[]> {
        let args: any = {
            'column': `rest_session_join.count:count,instance_join.app_name:target,instance.app_name:origin`,
            'type': filters.type,
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'join': 'innerJoin(rest_request).criteria(id.eq(rest_request.parent)),innerJoin(rest_session:rest_session_join).criteria(rest_request.id.eq(rest_session_join.id)),innerJoin(instance:instance_join).criteria(instance_join.id.eq(rest_session_join.instance_env)),innerJoin(instance).criteria(instance_env.eq(instance.id))',
            'order': 'count.desc'
        }
        if(filters.servers?.length) {
            args['instance.app_name.in'] = filters.servers.join(',');
        }
        return this.getMainSession(args);
    }

    /**
     * Retrieves view exception metrics grouped by period.
     *
     * @param filters Environment, period and optional application filter.
     * @returns Observable list of aggregated view exception rows.
     */
    getViewExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        const args: any = {
            'column': `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'join': 'instance',
            'instance.environement': filters.env,
            'type': 'VIEW',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'date.desc,count.desc'
        };
        if (filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getMainSession(args);
    }

    /**
     * Retrieves distinct users active in VIEW sessions on a given day.
     *
     * @param filters Environment and date anchor.
     * @returns Observable list of distinct user identifiers.
     */
    getUsersView(filters: {env: string, date: Date}): Observable<string[]> {
        return this.getMainSession({
            'column': 'user',
            'distinct': true,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.date.toISOString(),
            'type': 'VIEW',
            'instance.environement': filters.env,
            'instance.type': 'CLIENT'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }

    /**
     * Builds and executes a configurable MAIN session aggregation query.
     *
     * @param data Chart configuration (series, indicator, group and optional stack/filter).
     * @param filters Runtime filters (environment, period, optional hosts/filters and type).
     * @returns Observable list of aggregated rows ready for KPI charts.
     */
    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
              filters: {env: string, start: Date, end: Date, hosts?: string[], filters?: string[], type: string }): Observable<any[]> {
        let args: any = {
            'column': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value()}:${data.group.jquery.buildAlias()}`,
            'join': 'instance',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'type': filters.type,
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
        if(filters.hosts?.length && !args['instance.app_name.in']){
            args['instance.app_name.in'] = filters.hosts.join(',');
        }
        return this.getMainSession(args);
    }

    /**
     * Retrieves distinct values for one chart filter dimension.
     *
     * @param filter Chart item describing the requested dimension.
     * @param filters Environment/time/type filters and optional host constraints.
     * @returns Observable list of available distinct filter values.
     */
    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, hosts: string[], type: string }) {
        let args: any = {
            'column': `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'join': 'instance',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'type': filters.type,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['instance.app_name.in'] = filters.hosts.join(',');
        }
        return this.getMainSession(args);
    }
}
