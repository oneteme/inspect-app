import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, map} from "rxjs";
import {FtpSessionExceptionsByPeriodAndappname} from "src/app/model/jquery.model";
import {FtpRequestDto} from "../../model/request.model";
import {ChartFilterSelection, ChartItem} from "../../views/kpi/kpi.config";
import {DATE_HOUR_COLUMNS, fetchGroupedRows, groupColumn, groupOrder, isDateHour, packDateHour} from "./kpi-date-granularity";

/** Colonnes de base de la liste FTP ; l'alias (`colonne:alias`) donne la clé de la réponse. */
const FTP_REQUEST_LIST_COLUMNS = 'id,host,command,status,start,end,user';

/** Colonnes lazy : clé de table vers expression jquery (`colonne:alias`, l'alias est la clé de la réponse). */
const LAZY_FTP_REQUEST_COLUMNS: Record<string, string> = {
    protocol: 'protocol',
    threadName: 'thread:threadName',
    appName: 'instance.app_name:appName',
    appVersion: 'instance.version:appVersion'
};


@Injectable({ providedIn: 'root' })
export class FtpRequestService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {

    }

    getFtp<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/request/ftp`;
        return this.http.get<T>(url, { params: params });
    }

    /** Liste FTP : colonnes de base + colonnes lazy demandées. jquery renvoie start/end en ms, la page les attend en secondes. */
    getRequestList(criteria: Record<string, any>, lazyColumns: readonly string[] = []): Observable<FtpRequestDto[]> {
        const select = [FTP_REQUEST_LIST_COLUMNS, ...lazyColumns.map(c => LAZY_FTP_REQUEST_COLUMNS[c])].join(',');
        return this.getFtp<any[]>({ ...criteria, select }).pipe(
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

    getFtpExceptions(filters: { namespace: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<FtpSessionExceptionsByPeriodAndappname[]> {
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
        return this.getFtp(args);
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
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        return fetchGroupedRows(request => this.getFtp<any[]>(request), args, filters.selections, dateHour, groupAlias);
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
            args['host.in'] = filters.hosts.map(value => `"${value}"`).join(',');
        }
        return this.getFtp<any[]>(args).pipe(
            map(rows => dateHour ? packDateHour(rows, filter.jquery.buildAlias()) : rows)
        );
    }
}
