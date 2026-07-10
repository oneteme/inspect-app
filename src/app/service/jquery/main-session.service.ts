import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {combineLatest, map, Observable} from "rxjs";
import {ExceptionsByPeriodAndAppname, RepartitionTimeAndTypeResponseByPeriod} from "src/app/model/jquery.model";
import {ChartItem} from "../../views/kpi/kpi.config";

@Injectable({ providedIn: 'root' })
export class MainSessionService {
    constructor(private http: HttpClient) {

    }

    getHosts(filters: {start: Date, end: Date, env: string, type: string}): Observable<{ host: string }[]> {
        var args: any = {
            'column': `instance.app_name.distinct:host`,
            'instance_env': 'instance.id',
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': filters.type,
            'order': 'instance.app_name.asc',
        };

        return this.getMainSession(args);
    }

    getMainSession<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get<T>(url, { params: params });
    }

    getInfos(filters: { start: Date, end: Date, user: string, env: string }): Observable<{ name: string, date: number, elapsedtime: number, location: string, appName: string }[]> {
        let args = {
            'column': "name:name,start:date,elapsedtime:elapsedtime,location:location,instance.app_name:appName",
            'instance_env': 'instance.id',
            'user': filters.user,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': `"${filters.env}"`,
            'type': 'VIEW',
            'order': 'date.desc'
        }
        return this.getMainSession(args)
    }

    getMainExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year,type:type`,
            'main_session.type': 'BATCH',
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            "order": "date.desc,count.desc"
        }
        if(filters.app_name) {
            args['instance.app_name.in'] = filters.app_name;
        }
        return this.getMainSession(args);
    }

    getStartupExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        const args: any = {
            'column': `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
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

    getDependents(filters: {env: string, start: Date, end: Date, appName: string}): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, name: string}[]> {
        return this.getMainSession({
            'column': 'rest_request.count:count,rest_request.count_succes:countSucces,rest_request.count_error_client:countErrClient,rest_request.count_error_server:countErrServer,instance_join.app_name:name',
            'instance.id': 'instance_env',
            'instance.app_name': `"${filters.appName}"`,
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'CLIENT',
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
            'rest_session_join.instance_env': 'instance_join.id',
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        });
    }

    getCountByPage(filters: { env: string, start: Date, end: Date, appName: string }): Observable<{count: number, location: string}[]> {
        return this.getMainSession({
            'column': `count:count,location`,
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc',
            'limit': '5'
        });
    }

    getCountSessionByDateAndUser(filters: { env: string, start: Date, end: Date, groupedBy: string, appName: string }): Observable<{count: number, user: string, date: number}[]> {
        return this.getMainSession({
            'column': `count:count,user,start.${filters.groupedBy}:date`,
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'CLIENT',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': 'VIEW',
            'order': 'date.asc'
        });
    }

    getCountByException(filters: { env: string, start: Date, end: Date, appName: string }): Observable<{count: number, errorMessage: string, status: number}[]> {
        return this.getMainSession({
            'column': `exception.count:count,exception.err_msg,rest_request.status`,
            'join': 'instance,rest_request,rest_request.exception',
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': `"${filters.appName}"`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_request.status.ge': 400,
            'order': 'count.desc'
        });
    }

    getMainSessionArchitectureForHeatMap(filters: {start: Date, end: Date, env: string}): Observable<{count: number, origin: string, target: string}[]> {
        return this.getMainSession({
            'column': 'rest_request.count:count,rest_request.size_out.sum:sum,instance.app_name:origin,instance_join.app_name:target',
            'instance.id': 'instance_env',
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
            'rest_session_join.instance_env': 'instance_join.id',
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'type': 'VIEW',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'instance.environement': `"${filters.env}"`,
            'instance_join.environement': `"${filters.env}"`,
            'order': 'origin.asc,target.asc'
        });
    }

    getRepartitionTimeAndTypeResponseByPeriodNew(filters: {server: string, env: string, start: Date, end: Date, groupedBy: string, apiNames: string, users: string, versions: string}): Observable<RepartitionTimeAndTypeResponseByPeriod> {
        let args: any = {
            'column': `count_no_exception:countSuccess,count_exception:countError,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'instance_env': 'instance.id',
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': filters.server,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': 'BATCH',
            'order': `year.asc,date.asc`,
        }
        if(filters.apiNames) {
            args['name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getMainSession(args);
    }

    getUsersByPeriod(filters: {server: string, env: string, start: Date, end: Date, groupedBy: string, apiNames: string, users: string, versions: string }): Observable<{user: string, date: number, year: number}[]> {
        let args = {
            'column': `user,start.${filters.groupedBy}:date,start.year:year`,
            'distinct': true,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': filters.server,
            'instance.type': 'SERVER'
        };
        if(filters.apiNames) {
            args['name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getMainSession(args);
    }

    getTopBatchJobErrors(filters: { env: string, start: Date, end: Date, app_name: string }): Observable<{ name: string; count: number }[]> {
        const args: any = {
            'column': 'name,count:count',
            'join': 'instance',
            'type': 'BATCH',
            'err_type.notNull': '',
            'instance.environement': `"${filters.env}"`,
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

    getBatchNames(filters: {env: string, appName: string, start: Date, end: Date}): Observable<string[]> {
        return this.getMainSession({
            'column': 'name',
            'distinct': true,
            'join': 'instance',
            'name.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'SERVER',
            'type': 'BATCH'
        }).pipe(map((data: {name: string}[]) => (data.map(d => d.name))));
    }

    getDependentsNew(filters: {server: string, env: string, start: Date, end: Date, apiNames: string, users: string, versions: string }): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, appName: string}[]> {
        let args: any = {
            'column': `rest_session_join.count:count,rest_session_join.count_succes:countSucces,rest_session_join.count_error_client:countErrClient,rest_session_join.count_error_server:countErrServer,instance_join.app_name`,
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.instance_env': 'instance_join.id',
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance_env': 'instance.id',
            'instance.app_name': filters.server,
            'instance.environement': `"${filters.env}"`,
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        }
        if(filters.apiNames) {
            args['name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getMainSession(args);
    }

    getDependentsNew2(filters: {env: string, start: Date, end: Date, servers: string[], type: string}): Observable<{count: number, target: string, origin: string}[]> {
        let args: any = {
            'column': `rest_session_join.count:count,instance_join.app_name:target,instance.app_name:origin`,

            'type': filters.type,
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'SERVER',
            'join': 'innerJoin(rest_request).criteria(id.eq(rest_request.parent)),innerJoin(rest_session:rest_session_join).criteria(rest_request.id.eq(rest_session_join.id)),innerJoin(instance:instance_join).criteria(instance_join.id.eq(rest_session_join.instance_env)),innerJoin(instance).criteria(instance_env.eq(instance.id))',
            'order': 'count.desc'
        }
        if(filters.servers?.length) {
            args['instance.app_name.in'] = filters.servers.map(o => `"${o}"`).join(',');
        }
        return this.getMainSession(args);
    }

    getSessionExceptions(filters : {env: string, start:Date, end: Date,groupedBy:string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            [filters.app_name]: '',
            'order': 'date.desc,count.desc'
        }
        return this.getMainSession(args);
    }

    getViewExceptions(filters: { env: string, start: Date, end: Date, groupedBy: string, app_name: string }): Observable<ExceptionsByPeriodAndAppname[]> {
        const args: any = {
            'column': `start.${filters.groupedBy}:date,err_type,count:count,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year`,
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
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

    getUsers(filters: {env: string, appName: string, start: Date, end: Date}): Observable<string[]> {
        return this.getMainSession({
            'column': 'user',
            'distinct': true,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'type': 'BATCH',
            'instance.environement': `"${filters.env}"`,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'SERVER'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }

    getUsersView(filters: {env: string, date: Date}): Observable<string[]> {
        return this.getMainSession({
            'column': 'user',
            'distinct': true,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.date.toISOString(),
            'type': 'VIEW',
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'CLIENT'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }

    getStartupErrorsByServer(filters: {env: string, start: Date, end: Date}): Observable<{appName: string; errors: number}[]> {
        return this.getMainSession<{appName: string; count: number}[]>({
            'column': 'instance.app_name:appName,count:count',
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'type': 'STARTUP',
            'err_type.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc'
        }).pipe(map(rows => rows.map(r => ({ appName: r.appName, errors: r.count }))));
    }

    getCountByUser(filters: { env: string, start: Date, end: Date }): Observable<{ count: number, user: string }[]> {
        return this.getMainSession({
            'column': 'count:count,user',
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'CLIENT',
            'type': 'VIEW',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc',
            'limit': 10
        });
    }

    getCountByType(filters: {env: string, start: Date, end: Date}): Observable<{type: string, total: number, errors: number}[]> {
        const base = {
            'column': 'type,count:count',
            'join': 'instance',
            'instance.environement': `"${filters.env}"`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        };
        const total$ = this.getMainSession<{type: string, count: number}[]>(base);
        const errors$ = this.getMainSession<{type: string, count: number}[]>({ ...base, 'err_type.notNull': '' });
        return combineLatest([total$, errors$]).pipe(
            map(([totals, errors]) =>
                totals.map(t => ({
                    type: t.type,
                    total: t.count,
                    errors: errors.find(e => e.type === t.type)?.count ?? 0
                }))
            )
        );
    }

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
              filters: {env: string, start: Date, end: Date, hosts?: string[], filters?: string[], type: string }): Observable<any[]> {
        let args: any = {
            'column': `${data.series.map(d => data.indicator.jquery.value(d.jquery.value()) + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value()}:${data.group.jquery.buildAlias()}`,
            'instance_env': 'instance.id',
            'instance.environement': `"${filters.env}"`,
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
            args[`${data.filter.jquery.value()}.in`] = filters.filters.map(o => `"${o}"`).join(',');
        }
        if(filters.hosts?.length && !args['instance.app_name.in']){
            args['instance.app_name.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getMainSession(args);
    }

    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, hosts: string[], type: string }) {
        let args: any = {
            'column': `${filter.jquery.value()}:${filter.jquery.buildAlias()}`,
            'distinct': 'true',
            'instance_env': 'instance.id',
            'instance.environement': `"${filters.env}"`,
            'instance.type': 'SERVER',
            'type': filters.type,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['instance.app_name.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getMainSession(args);
    }
}
