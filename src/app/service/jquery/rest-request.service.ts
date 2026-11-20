import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {forkJoin, map, Observable} from "rxjs";
import {RestSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {RestRequestDto} from "../../model/request.model";
import {ChartFilterSelection, ChartItem} from "../../views/kpi/kpi.config";
import {applyGroupOptions, DATE_HOUR_COLUMNS, fetchGroupedRows, groupColumn, groupedRequestContext, isDateHour, packDateHour} from "./kpi-date-granularity";

/** Colonnes de base de la liste REST ; l'alias (`colonne:alias`) donne la clé de la réponse. */
const REST_REQUEST_LIST_COLUMNS = 'id,host,method,protocol,path,status,start,end,user,linked';

/** Colonnes lazy : clé de table vers expression jquery (`colonne:alias`, l'alias est la clé de la réponse). */
const LAZY_REST_REQUEST_COLUMNS: Record<string, string> = {
    query: 'query',
    threadName: 'thread:threadName',
    contentType: 'media:contentType',
    inDataSize: 'size_in:inDataSize',
    outDataSize: 'size_out:outDataSize',
    bodyContent: 'body_content:bodyContent',
    appName: 'instance.app_name:appName',
    appVersion: 'instance.version:appVersion'
};

@Injectable({ providedIn: 'root' })
export class RestRequestService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {

    }

    getRestRequest<T>(params?: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get<T>(url, { params: params });
    }

    /** Liste REST : colonnes de base + colonnes lazy demandées. jquery renvoie start/end en ms, la page les attend en secondes. */
    getRequestList(criteria: Record<string, any>, lazyColumns: readonly string[] = []): Observable<RestRequestDto[]> {
        const select = [REST_REQUEST_LIST_COLUMNS, ...lazyColumns.map(c => LAZY_REST_REQUEST_COLUMNS[c])].join(',');
        return this.getRestRequest<any[]>({ ...criteria, select }).pipe(
            map(rows => rows.map(row => ({
                ...row,
                start: row.start / 1000,
                end: row.end == null ? null : row.end / 1000
            })))
        );
    }

    getHost(type: string, filters: any): Observable<{ host: string }[]> {
        return this.http.get<{ host: string }[]>(`${this.server}/request/${type}/hosts`, { params: filters });
    }

    getSizeCustom(
      data: { series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem },
      filters: { namespace: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], selections?: ChartFilterSelection[], instanceType?: string }
    ): Observable<any[]> {
        const ctx = groupedRequestContext(data, filters);
        const groupAlias = data.group.jquery.buildAlias();
        const stackAlias = data.stack?.jquery.buildAlias();
        // Une requête par série (size_in, size_out, ...)
        const requests = data.series.map(serie => {
            const serieAlias = data.indicator.jquery.buildAlias(serie.jquery.buildAlias());
            const args: any = {
                'select': `${data.indicator.jquery.value(serie.jquery.value())}:${serieAlias},${groupColumn(data.group, ctx.groupDateHour)}`,
                'instance.namespace': filters.namespace,
                'start.ge': filters.start.toISOString(),
                'start.lt': filters.end.toISOString(),
                'join': 'instance'
            };
            applyGroupOptions(args, data, ctx, data.stack ? `${data.stack.jquery.value(serie.jquery.buildAlias())}:${stackAlias}` : undefined);
            if (filters.hosts?.length && !args['host.in']) {
                args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
            }
            if (filters.instanceType) {
                args['instance.type'] = filters.instanceType;
            }
            return fetchGroupedRows(request => this.getRestRequest<any[]>(request), args, filters.selections, ctx.dateHour, ctx.packAlias);
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

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem },
              filters: {namespace: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], selections?: ChartFilterSelection[], instanceType?: string }): Observable<any[]> {
        const ctx = groupedRequestContext(data, filters);
        let args: any = {
            'select': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${groupColumn(data.group, ctx.groupDateHour)}`,
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'join': 'instance'
        }
        applyGroupOptions(args, data, ctx, data.stack ? `${data.stack.jquery.value()}:${data.stack.jquery.buildAlias()}` : undefined);
        if(filters.hosts?.length && !args['host.in']){
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        if(filters.instanceType) {
            args['instance.type'] = filters.instanceType;
        }
        return fetchGroupedRows(request => this.getRestRequest<any[]>(request), args, filters.selections, ctx.dateHour, ctx.packAlias);
    }

    getLatency(data: {serie: ChartItem, indicator: ChartItem, group: ChartItem, stack?: ChartItem },
               filters: {namespace: string, start: Date, end: Date, hosts?: string[], method?: string[], selections?: ChartFilterSelection[], instanceType?: string, groupedBy?: string }): Observable<any[]> {
        const ctx = groupedRequestContext(data, filters);
        let args: any = {
            'select': `${data.indicator.jquery.value()}(${data.serie.jquery.value()}.minus(rest_session.${data.serie.jquery.value()})):${data.indicator.jquery.buildAlias(data.serie.jquery.buildAlias())},${groupColumn(data.group, ctx.groupDateHour)}`,
            'status.gt': 0,
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session.start.ge': filters.start.toISOString(),
            'rest_session.start.lt': filters.end.toISOString(),
            'join': 'innerJoin(instance).criteria(instance_env.eq(instance.id)),innerJoin(rest_session).criteria(id.eq(rest_session.id).and(start.le(rest_session.start)).and(end.ge(rest_session.end)))',

        }
        applyGroupOptions(args, data, ctx, data.stack ? `${data.stack.jquery.value()}:${data.stack.jquery.buildAlias()}` : undefined);
        if(filters.hosts?.length && !args['host.in']){
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        if(filters.instanceType) {
            args['instance.type'] = filters.instanceType;
        }
        return fetchGroupedRows(request => this.getRestRequest<any[]>(request), args, filters.selections, ctx.dateHour, ctx.packAlias);
    }

    getFilters(filter: ChartItem, filters: {namespace: string, start: Date, end: Date, hosts?: string[], instanceType?: string, groupedBy?: string }) {
        const dateHour = isDateHour(filters.groupedBy, filter.key);
        let args: any = {
            'select': dateHour ? DATE_HOUR_COLUMNS : `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'join': 'instance'
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        if(filters.instanceType) {
            args['instance.type'] = filters.instanceType;
        }
        return this.getRestRequest<any[]>(args).pipe(
            map(rows => dateHour ? packDateHour(rows, filter.jquery.buildAlias()) : rows)
        );
    }

    getRestExceptions(filters: { namespace: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<RestSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'select': `count:count,count.sum.over(partition(start.${filters.groupedBy}:date,start.year)):countok,error_type:errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'instance.namespace': filters.namespace,
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
