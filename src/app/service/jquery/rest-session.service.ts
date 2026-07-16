import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import {ExceptionsByPeriodAndAppname} from "../../model/jquery.model";
import {ChartItem} from "../../views/kpi/kpi.config";

@Injectable({ providedIn: 'root' })
export class RestSessionService {
    constructor(private http: HttpClient) {

    }

    getRestSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/rest`;
        return this.http.get<T>(url, { params: params });
    }

    getHosts(filters: {start: Date, end: Date , env: string}): Observable<{ host: string }[]> {
        var args: any = {
            'column': `instance.app_name.distinct:host`,
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'join': 'instance',
            'order': 'instance.app_name.asc',
        };

        return this.getRestSession(args);
    }

    getDependencies(filters: {env: string, start: Date, end: Date, servers: string[]}): Observable<{count: number, target: string, origin: string}[]> {
        let args: any = {
            'column': `count:count,instance.app_name:origin,instance_join.app_name:target`,
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance_join.environement': filters.env,
            'join': 'innerJoin(instance).criteria(instance_env.eq(instance.id)),innerJoin(rest_request).criteria(id.eq(rest_request.parent)),innerJoin(rest_session:rest_session_join).criteria(rest_request.id.eq(rest_session_join.id)),innerJoin(instance:instance_join).criteria(rest_session_join.instance_env.eq(instance_join.id))',
            'order': 'count.desc'
        }
        if(filters.servers?.length) {
            args['instance_join.app_name.in'] = filters.servers.join(',');
        }
        return this.getRestSession(args);
    }

    getDependents(filters: {env: string, start: Date, end: Date, servers: string[]}): Observable<{count: number, target: string, origin: string}[]> {
        let args: any = {
            'column': `rest_session_join.count:count,instance_join.app_name:target,instance.app_name:origin`,
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'join': 'innerJoin(instance).criteria(instance_env.eq(instance.id)),innerJoin(rest_request).criteria(id.eq(rest_request.parent)),innerJoin(rest_session:rest_session_join).criteria(rest_request.id.eq(rest_session_join.id)),innerJoin(instance:instance_join).criteria(rest_session_join.instance_env.eq(instance_join.id))',
            'order': 'count.desc'
        }
        if(filters.servers?.length) {
            args['instance.app_name.in'] = filters.servers.join(',');
        }
        return this.getRestSession(args);
    }

    getSessionExceptions(filters: {env: string, start: Date, end: Date, groupedBy: string, server?: string, apiNames?: string, users?: string, versions?: string, others?: {[key: string]: any}  }): Observable<ExceptionsByPeriodAndAppname[]> {
        let args: any = {
            "column": `start.${filters.groupedBy}:date,error_type_session:errorType,count:count,status,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year,instance.type:type`,
            'join': 'instance',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            "order": "date.desc,count.desc"
        }
        if(filters.server) {
            args['instance.app_name.in'] = filters.server;
        }
        if(filters.apiNames) {
            args['api_name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        if(filters.others) {
            Object.entries(filters.others).forEach(([key, value]) => args[key] = value);
        }
        return this.getRestSession(args);
    }

    getCountByEnv(filters: {env: string, start: Date, end: Date}): Observable<{total: number, errors: number}> {
        return this.getRestSession<{count: number, countErrorServer: number, countErrorClient: number}[]>({
            'column': 'count:count,count_error_server:countErrorServer,count_error_client:countErrorClient',
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }).pipe(map(data => {
            const d = data[0];
            return d ? { total: d.count, errors: (d.countErrorServer ?? 0) + (d.countErrorClient ?? 0) } : { total: 0, errors: 0 };
        }));
    }

    getSizeCustom(
      data: { series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
      filters: { env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], filters?: string[] }
    ): Observable<any[]> {
        const groupAlias = data.group.jquery.buildAlias();
        const stackAlias = data.stack?.jquery.buildAlias();

        // Une requête par série (size_in, size_out, ...)
        const requests = data.series.map(serie => {
            const serieAlias = data.indicator.jquery.buildAlias(serie.jquery.buildAlias());
            const args: any = {
                'column': `${data.indicator.jquery.value(serie.jquery.value())}:${serieAlias},${data.group.jquery.value()}:${groupAlias}`,
                'join': 'instance',
                'instance.environement': filters.env,
                'start.ge': filters.start.toISOString(),
                'start.lt': filters.end.toISOString()
            };
            if (data.stack) {
                args['column'] += `,${data.stack.jquery.value(serie.jquery.buildAlias())}:${stackAlias}`;
                args[`${stackAlias}.notNull`] = '';
            }
            if (data.group.jquery.order) {
                args['order'] = data.group.jquery.order;
            }
            if (data.filter && filters.filters?.length) {
                args[`${data.filter.jquery.value()}.in`] = filters.filters.join(',');
            }
            if (filters.hosts?.length && !args['host.in']) {
                args['host.in'] = filters.hosts.join(',');
            }
            return this.getRestSession<any[]>(args);
        });

        // Fusion des résultats par clé group (+ stack si présent)
        return forkJoin(requests).pipe(
          map((results: any[][]) => {
              const mergeMap = new Map<string, any>();
              results.forEach((rows, i) => {
                  const serieAlias = data.indicator.jquery.buildAlias(data.series[i].jquery.buildAlias());
                  rows.forEach(row => {
                      const key = stackAlias
                        ? `${row[groupAlias]}__${row[stackAlias]}`
                        : `${row[groupAlias]}`;
                      if (!mergeMap.has(key)) {
                          const base: any = { [groupAlias]: row[groupAlias] };
                          if (stackAlias) base[stackAlias] = row[stackAlias];
                          mergeMap.set(key, base);
                      }
                      mergeMap.get(key)![serieAlias] = row[serieAlias];
                  });
              });
              return Array.from(mergeMap.values());
          })
        );
    }

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
              filters: {env: string, start: Date, end: Date, hosts?: string[], filters?: string[] }): Observable<any[]> {

        let args: any = {
            'column': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value()}:${data.group.jquery.buildAlias()}`,
            'join': 'instance',
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
        if(filters.hosts?.length && !args['instance.app_name.in']){
            args['instance.app_name.in'] = filters.hosts.join(',');
        }
        return this.getRestSession(args);
    }

    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, hosts: string[] }) {
        let args: any = {
            'column': `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'join': 'instance',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['instance.app_name.in'] = filters.hosts.join(',');
        }
        return this.getRestSession(args);
    }
}
