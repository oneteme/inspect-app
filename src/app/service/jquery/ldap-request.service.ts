import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, map} from "rxjs";
import {LdapSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {DirectoryRequestDto} from "../../model/request.model";
import {ChartFilterSelection, ChartItem} from "../../views/kpi/kpi.config";
import {DATE_HOUR_COLUMNS, fetchGroupedRows, groupColumn, groupOrder, isDateHour, packDateHour} from "./kpi-date-granularity";

/** Colonnes de base de la liste LDAP ; l'alias (`colonne:alias`) donne la clé de la réponse. */
const LDAP_REQUEST_LIST_COLUMNS = 'id,host,command,status,start,end,user';

/** Colonnes lazy : clé de table vers expression jquery (`colonne:alias`, l'alias est la clé de la réponse). */
const LAZY_LDAP_REQUEST_COLUMNS: Record<string, string> = {
    protocol: 'protocol',
    threadName: 'thread:threadName',
    appName: 'instance.app_name:appName',
    appVersion: 'instance.version:appVersion'
};


@Injectable({ providedIn: 'root' })
export class LdapRequestService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private readonly http: HttpClient) {

    }

    getLdap<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ldap`;
        return this.http.get<T>(url, { params: params });
    }

    /** Liste LDAP : colonnes de base + colonnes lazy demandées. jquery renvoie start/end en ms, la page les attend en secondes. */
    getRequestList(criteria: Record<string, any>, lazyColumns: readonly string[] = []): Observable<DirectoryRequestDto[]> {
        const column = [LDAP_REQUEST_LIST_COLUMNS, ...lazyColumns.map(c => LAZY_LDAP_REQUEST_COLUMNS[c])].join(',');
        return this.getLdap<any[]>({ ...criteria, column }).pipe(
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

    getLdapExceptions(filters: { namespace: string, start: Date, end: Date, groupedBy: string, app_name: string, host?: string[],command?: string[]  }): Observable<LdapSessionExceptionsByPeriodAndappname[]> {
        let args = {
            'select': `count:count,count.sum.over(partition(start.${filters.groupedBy}:date,start.year)):countok,error_type:errorType,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
        }
        if(filters.command){
            args['command'] = filters.command.toString();
        }
        return this.getLdap(args);
    }

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem },
              filters: {namespace: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], selections?: ChartFilterSelection[] }): Observable<any[]> {
        const groupAlias = data.group.jquery.buildAlias();
        const dateHour = isDateHour(filters.groupedBy, data.group.key);
        let args: any = {
            'select': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${groupColumn(data.group, dateHour)}`,
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(data.stack) {
            args['select'] += `,${data.stack.jquery.value()}:${data.stack.jquery.buildAlias()}`;
            args[`${data.stack.jquery.buildAlias()}.notNull`] = ''
        }
        if(data.group.jquery.order){
            args['order'] = groupOrder(data.group, dateHour);
        }
        if(filters.hosts?.length && !args['host.in']){
            args['host.in'] = filters.hosts.join(',');
        }
        return fetchGroupedRows(request => this.getLdap<any[]>(request), args, filters.selections, dateHour, groupAlias);
    }

    getFilters(filter: ChartItem, filters: {namespace: string, start: Date, end: Date, hosts: string[], groupedBy?: string }) {
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
            args['host.in'] = filters.hosts.join(',');
        }
        return this.getLdap<any[]>(args).pipe(
            map(rows => dateHour ? packDateHour(rows, filter.jquery.buildAlias()) : rows)
        );
    }
}
