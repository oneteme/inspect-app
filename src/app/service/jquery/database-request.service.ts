import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, map} from "rxjs";
import {JdbcExceptionsByPeriodAndAppname} from "../../model/jquery.model";
import {DatabaseInfo, DatabaseRequestDto, DatabaseTableInfo} from "../../model/request.model";
import {ChartFilterSelection, ChartItem} from "../../views/kpi/kpi.config";
import {applyGroupOptions, DATE_HOUR_COLUMNS, fetchGroupedRows, groupColumn, groupedRequestContext, isDateHour, packDateHour} from "./kpi-date-granularity";

/** Colonnes de base de la liste JDBC ; l'alias (`colonne:alias`) donne la clé de la réponse. */
const DATABASE_REQUEST_LIST_COLUMNS = 'id,host,db:name,command,schema,status,start,end,user';

/** Colonnes lazy : clé de table vers expression jquery (`colonne:alias`, l'alias est la clé de la réponse). */
const LAZY_DATABASE_REQUEST_COLUMNS: Record<string, string> = {
    scheme: 'scheme',
    productName: 'db_name:productName',
    threadName: 'thread:threadName',
    appName: 'instance.app_name:appName',
    appVersion: 'instance.version:appVersion'
};

@Injectable({ providedIn: 'root' })
export class DatabaseRequestService {
    constructor(private http: HttpClient) {

    }

    server = `${localStorage.getItem('server')}/v3/query`;

    getDatabaseRequest<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get<T>(url, { params: params });
    }

    /** Liste JDBC : colonnes de base + colonnes lazy demandées. jquery renvoie start/end en ms, la page les attend en secondes. */
    getRequestList(criteria: Record<string, any>, lazyColumns: readonly string[] = []): Observable<DatabaseRequestDto[]> {
        const select = [DATABASE_REQUEST_LIST_COLUMNS, ...lazyColumns.map(c => LAZY_DATABASE_REQUEST_COLUMNS[c])].join(',');
        return this.getDatabaseRequest<any[]>({ ...criteria, select }).pipe(
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

    getExceptionByDate(filters: { namespace: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<JdbcExceptionsByPeriodAndAppname[]> {
      let args = {
        'select': `count:count,count.sum.over(partition(start.${filters.groupedBy}:date,start.year)):countok,error_type:errorType,start.${filters.groupedBy}:date,start.year:year`,
        'join': 'instance',
        'instance.namespace': filters.namespace,
        'start.ge': filters.start.toISOString(),
        'start.lt': filters.end.toISOString(),
        'order': 'date.asc'
      }
      return this.getDatabaseRequest(args);
    }

    getExceptionByDateNew(namespace: string, start: Date, end: Date, groupedBy: string): Observable<{date: string, year: number, label: string, count: number, countTotal: number}[]> {
        let args = {
            'select': `start.${groupedBy}:date,start.year:year,count:count,count.sum.over(partition(date)):countTotal,error_type:label`,
            'join': 'instance',
            'instance.namespace': namespace,
            'start.ge': start.toISOString(),
            'start.lt': end.toISOString(),
            'label.notNull': '',
            'order': 'date.asc'
        }
        return this.getDatabaseRequest(args);
    }

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem },
              filters: {namespace: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], selections?: ChartFilterSelection[] }): Observable<any[]> {
        const ctx = groupedRequestContext(data, filters);
        let args: any = {
            'select': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${groupColumn(data.group, ctx.groupDateHour)}`,
            'instance_env': 'instance.id',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        applyGroupOptions(args, data, ctx, data.stack ? `${data.stack.jquery.value()}:${data.stack.jquery.buildAlias()}` : undefined);
        if(filters.hosts?.length && !args['host.in']){
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        return fetchGroupedRows(request => this.getDatabaseRequest<any[]>(request), args, filters.selections, ctx.dateHour, ctx.packAlias);
    }

    getFilters(filter: ChartItem, filters: {namespace: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], method?: string[] }) {
        const dateHour = isDateHour(filters.groupedBy, filter.key);
        let args: any = {
            'select': dateHour ? DATE_HOUR_COLUMNS : `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        return this.getDatabaseRequest<any[]>(args).pipe(
            map(rows => dateHour ? packDateHour(rows, filter.jquery.buildAlias()) : rows)
        );
    }

    getDatabaseInfo(params?: any): Observable<DatabaseInfo[]> {
        return this.http.get<DatabaseInfo[]>(`${this.server}/database`, { params: params });
    }

    getDatabaseTablesInfo(params?: any): Observable<DatabaseTableInfo[]> {
        return this.http.get<DatabaseTableInfo[]>(`${this.server}/database/table`, { params: params });
    }

    getCountException(filters: { namespace: string, start: Date, end: Date }): Observable<{countError: number, countTotal: number, type: string}> {
        let args = {
            'select': `count_error:countError,count:countTotal`,
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'count.gt': 0
        }
        return this.getDatabaseRequest(args).pipe(map(data => {
            return {...data[0], type: 'jdbc'};
        }));
    }
}
