import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import {RestSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {RestRequestDto} from "../../model/request.model";
import {ChartItem} from "../../views/kpi/kpi.config";

@Injectable({ providedIn: 'root' })
export class RestRequestService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {

    }

    getRestRequest<T>(params?: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get<T>(url, { params: params });
    }

    getRequests(params: any): Observable<Array<RestRequestDto>> {
        return this.http.get<Array<RestRequestDto>>(`${this.server}/request/rest`, { params: params });
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getSizeCustom(
      data: { series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
      filters: { env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], filters?: string[], instanceType?: string }
    ): Observable<any[]> {
        const groupAlias = data.group.jquery.buildAlias();
        const stackAlias = data.stack?.jquery.buildAlias();
        // Une requête par série (size_in, size_out, ...)
        const requests = data.series.map(serie => {
            const serieAlias = data.indicator.jquery.buildAlias(serie.jquery.buildAlias());
            const args: any = {
                'column': `${data.indicator.jquery.value(serie.jquery.value())}:${serieAlias},${data.group.jquery.value()}:${groupAlias}`,
                'instance.environement': filters.env,
                'start.ge': filters.start.toISOString(),
                'start.lt': filters.end.toISOString(),
                'join': 'instance'
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
            if (filters.instanceType) {
                args['instance.type'] = filters.instanceType;
            }
            return this.getRestRequest<any[]>(args);
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
              filters: {env: string, start: Date, end: Date, hosts?: string[], filters?: string[], instanceType?: string }): Observable<any[]> {
        let args: any = {
            'column': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value()}:${data.group.jquery.buildAlias()}`,
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'join': 'instance'
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
        if(filters.instanceType) {
            args['instance.type'] = filters.instanceType;
        }
        return this.getRestRequest(args);
    }

    getLatency(data: {serie: ChartItem, indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
               filters: {env: string, start: Date, end: Date, hosts?: string[], method?: string[], filters?: string[], instanceType?: string }): Observable<any[]> {
        let args: any = {
            'column': `${data.indicator.jquery.value()}(${data.serie.jquery.value()}.minus(rest_session.${data.serie.jquery.value()})):${data.indicator.jquery.buildAlias(data.serie.jquery.buildAlias())},${data.group.jquery.value()}:${data.group.jquery.buildAlias()}`,
            'status.gt': 0,
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            'join': 'innerJoin(instance).criteria(instance_env.eq(instance.id)),innerJoin(rest_session).criteria(id.eq(rest_session.id))',

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
        if(filters.instanceType) {
            args['instance.type'] = filters.instanceType;
        }
        return this.getRestRequest(args);
    }

    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, hosts?: string[], instanceType?: string }) {
        let args: any = {
            'column': `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'join': 'instance'
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.join(',');
        }
        if(filters.instanceType) {
            args['instance.type'] = filters.instanceType;
        }
        return this.getRestRequest(args);
    }

    getRestExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
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
}
