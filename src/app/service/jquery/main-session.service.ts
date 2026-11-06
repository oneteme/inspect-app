import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {ExceptionsByPeriodAndAppname} from "src/app/model/jquery.model";
import {ChartFilterSelection, ChartItem} from "../../views/kpi/kpi.config";
import {DATE_HOUR_COLUMNS, fetchGroupedRows, groupColumn, groupOrder, isDateHour, packDateHour} from "./kpi-date-granularity";
import {MainSessionDto} from "../../model/request.model";

/** Colonnes de base de la liste des sessions principales ; l'alias (`colonne:alias`) donne la clé de la réponse. */
const MAIN_SESSION_LIST_COLUMNS = 'id,name,location,start,end,user,status,instance.app_name:appName,instance.address:address';

/** Colonnes lazy : clé de table vers expression jquery (`colonne:alias`, l'alias est la clé de la réponse). */
const LAZY_MAIN_SESSION_COLUMNS: Record<string, string> = {
    threadName: 'thread:threadName'
};

@Injectable({ providedIn: 'root' })
export class MainSessionService {
    constructor(private http: HttpClient) {

    }

    getMainSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get<T>(url, { params: params });
    }

    /** Liste des sessions principales : colonnes de base + colonnes lazy demandées. jquery renvoie start/end en ms, la page les attend en secondes. */
    getMainSessionList(criteria: Record<string, any>, lazyColumns: readonly string[] = []): Observable<MainSessionDto[]> {
        const column = [MAIN_SESSION_LIST_COLUMNS, ...lazyColumns.map(c => LAZY_MAIN_SESSION_COLUMNS[c])].join(',');
        return this.getMainSession<any[]>({ ...criteria, column }).pipe(
            map(rows => rows.map(row => ({
                ...row,
                start: row.start / 1000,
                end: row.end == null ? null : row.end / 1000
            })))
        );
    }

    getHosts(filters: {start: Date, end: Date, namespace: string, type: string}): Observable<{ host: string }[]> {
        var args: any = {
            'select': `instance.app_name.distinct:host`,
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': filters.type,
            'order': 'instance.app_name.asc',
        };

        return this.getMainSession(args);
    }

    getMainExceptions(filters: { namespace: string, start: Date, end: Date, groupedBy: string, mainType: string}): Observable<ExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,error_type,count:count,count.sum.over(partition(date)):countok,start.year:year,type:type`,
            'main_session.type': filters.mainType,
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            "order": "date.desc,count.desc"
        }
        return this.getMainSession(args);
    }

    getDependents(filters: {namespace: string, start: Date, end: Date, servers: string[], type: string}): Observable<{count: number, target: string, origin: string}[]> {
        let args: any = {
            'select': `rest_session_join.count:count,instance_join.app_name:target,instance.app_name:origin`,
            'type': filters.type,
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.namespace': filters.namespace,
            'instance.type': 'SERVER',
            'join': 'innerJoin(rest_request).criteria(id.eq(rest_request.parent)),innerJoin(rest_session:rest_session_join).criteria(rest_request.id.eq(rest_session_join.id)),innerJoin(instance:instance_join).criteria(instance_join.id.eq(rest_session_join.instance_env)),innerJoin(instance).criteria(instance_env.eq(instance.id))',
            'order': 'count.desc'
        }
        if(filters.servers?.length) {
            args['instance.app_name.in'] = filters.servers.join(',');
        }
        return this.getMainSession(args);
    }

    getUsersView(filters: {namespace: string, date: Date}): Observable<string[]> {
        return this.getMainSession({
            'select': 'user',
            'distinct': true,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.date.toISOString(),
            'type': 'VIEW',
            'instance.namespace': filters.namespace,
            'instance.type': 'CLIENT'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem },
              filters: {namespace: string, start: Date, end: Date, hosts?: string[], selections?: ChartFilterSelection[], type: string, groupedBy?: string }): Observable<any[]> {
        const groupAlias = data.group.jquery.buildAlias();
        const dateHour = isDateHour(filters.groupedBy, data.group.key);
        let args: any = {
            'select': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${groupColumn(data.group, dateHour)}`,
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'instance.type': 'SERVER',
            'type': filters.type,
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
        if(filters.hosts?.length && !args['instance.app_name.in']){
            args['instance.app_name.in'] = filters.hosts.join(',');
        }
        return fetchGroupedRows(request => this.getMainSession<any[]>(request), args, filters.selections, dateHour, groupAlias);
    }

    getFilters(filter: ChartItem, filters: {namespace: string, start: Date, end: Date, hosts: string[], type: string, groupedBy?: string }) {
        const dateHour = isDateHour(filters.groupedBy, filter.key);
        let args: any = {
            'select': dateHour ? DATE_HOUR_COLUMNS : `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'join': 'instance',
            'instance.namespace': filters.namespace,
            'instance.type': 'SERVER',
            'type': filters.type,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['instance.app_name.in'] = filters.hosts.join(',');
        }
        return this.getMainSession<any[]>(args).pipe(
            map(rows => dateHour ? packDateHour(rows, filter.jquery.buildAlias()) : rows)
        );
    }
}
