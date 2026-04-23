import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {
    ExceptionsByPeriodAndAppname,
    RepartitionRequestByPeriod,
    RepartitionTimeAndTypeResponse,
    RepartitionTimeAndTypeResponseByPeriod
} from "../../model/jquery.model";
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
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'instance.app_name.asc',
        };

        return this.getRestSession(args);
    }

    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date , ids: string }): Observable<RepartitionTimeAndTypeResponse>;
    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date , ids: string, apiName: string}): Observable<RepartitionTimeAndTypeResponse>;
    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date , user: string, env: string}): Observable<RepartitionTimeAndTypeResponse>;
    getRepartitionTimeAndTypeResponse(filters: {start: Date, end: Date , ids: string, apiName: string, user: string, env: string}): Observable<RepartitionTimeAndTypeResponse> {
        let args: any = {
            'column': 'count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,count_succes:countSucces,count_error_server:countErrorServer,count_error_client:countErrorClient',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if (filters.apiName) {
                args['api_name'] = `"${filters.apiName}"`;
            }
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string}): Observable<RepartitionTimeAndTypeResponseByPeriod>;
    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string, apiName: string}): Observable<RepartitionTimeAndTypeResponseByPeriod>;
    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string , user: string, env: string}): Observable<RepartitionTimeAndTypeResponseByPeriod>;
    getRepartitionTimeAndTypeResponseByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string, apiName: string, user: string, env: string}): Observable<RepartitionTimeAndTypeResponseByPeriod> {
        let args: any = {
            'column': `count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,count_unavailable_server:countUnavailableServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': `year.asc,date.asc`,
            
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if (filters.apiName) {
                args['api_name'] = `"${filters.apiName}"`;
            }
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getRepartitionTimeAndTypeResponseByPeriodNew(filters: {server: string, env: string, start: Date, end: Date, groupedBy: string, apiNames: string, users: string, versions: string}): Observable<RepartitionTimeAndTypeResponseByPeriod> {
        let args: any = {
            'column': `count_succes:countSuccess,count_error_client:countErrorClient,count_error_server:countErrorServer,count_slowest:elapsedTimeSlowest,count_slow:elapsedTimeSlow,count_medium:elapsedTimeMedium,count_fast:elapsedTimeFast,count_fastest:elapsedTimeFastest,elapsedtime.avg:avg,elapsedtime.max:max,start.${filters.groupedBy}:date,start.year:year`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'instance.app_name': filters.server,
            'instance.type': 'SERVER',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': `year.asc,date.asc`
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
        return this.getRestSession(args);
    }

    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string}): Observable<RepartitionRequestByPeriod>;
    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string, apiName: string}): Observable<RepartitionRequestByPeriod>;
    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string , user: string, env: string}): Observable<RepartitionRequestByPeriod>;
    getRepartitionRequestByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string, apiName: string, user: string, env: string}): Observable<RepartitionRequestByPeriod> {
        let args: any = {
            'column': `count:count,count_error_server:countErrorServer,count_slowest:countSlowest,start.${filters.groupedBy}:date,start.year:year`,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'year.asc,date.asc',
            
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if (filters.apiName) {
                args['api_name'] = `"${filters.apiName}"`;
            }
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getRepartitionUser(filters: {start: Date, end: Date , ids: string}): Observable<{count: number, user: string}[]>;
    getRepartitionUser(filters: {start: Date, end: Date , ids: string, apiName: string}): Observable<{count: number, user: string}[]>;
    getRepartitionUser(filters: {start: Date, end: Date , ids: string, apiName: string}): Observable<{count: number, user: string}[]> {
        let args: any = {
            'column': 'count:count,user',
            'instance_env.in': filters.ids,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'user.notNull': '',
            'order': 'count.desc',
            'limit': 5,
            
        }
        if (filters.apiName) {
            args['api_name'] = `"${filters.apiName}"`;
        }
        return this.getRestSession(args);
    }

    getRepartitionUserByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string}): Observable<{count: number, date: number, year: number, user: string}[]>;
    getRepartitionUserByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string, apiName: string}): Observable<{count: number, date: number, year: number, user: string}[]>;
    getRepartitionUserByPeriod(filters: {start: Date, end: Date, groupedBy: string , ids: string, apiName: string}): Observable<{count: number, date: number, year: number, user: string}[]> {
        let args: any = {
            'column': `count:count,start.${filters.groupedBy}:date,start.year:year,user`,
            'instance_env.in': filters.ids,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'user.notNull': '',
            'order': `year.asc,date.asc,count.desc`,
            
        }
        if(filters.apiName) {
            args['api_name'] = `"${filters.apiName}"`;
        }
        return this.getRestSession(args);
    }

    getRepartitionApi(filters: {start: Date, end: Date , ids: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, apiName: string}[]>;
    getRepartitionApi(filters: {start: Date, end: Date , user: string, env: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, apiName: string}[]>;
    getRepartitionApi(filters: {start: Date, end: Date , ids: string, user: string, env: string}): Observable<{countSucces: number, countErrorClient: number, countErrorServer: number, apiName: string}[]> {
        let args: any = {
            'column': 'count_succes:countSucces,count_error_client:countErrorClient,count_error_server:countErrorServer,api_name',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'api_name.notNull': '',
            'order': 'count.desc',
            'limit': 5,
            
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getDependencies(filters: {server: string, env: string, start: Date, end: Date, apiNames: string, users: string, versions: string }): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, appName: string, type: string}[]> {
        let args: any = {
            'column': `count:count,count_succes:countSucces,count_error_client:countErrClient,count_error_server:countErrServer,instance.app_name,instance.type`,
            'instance.id': 'instance_env',
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'rest_session_join.instance_env': 'instance_join.id',
            'instance_join.app_name': filters.server,
            'instance_join.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        }
        if(filters.apiNames) {
            args['rest_session_join.api_name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance_join.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['rest_session_join.user.in'] = filters.users;
        }
        return this.getRestSession(args);
    }

    getDependenciesNew(filters: {env: string, start: Date, end: Date, servers: string[] }): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, dep: string, actual: string, type: string}[]> {
        let args: any = {
            'column': `count:count,count_succes:countSucces,count_error_client:countErrClient,count_error_server:countErrServer,instance.app_name:dep,instance.type,instance_join.app_name:actual`,
            'instance.id': 'instance_env',
            'id': 'rest_request.parent',
            'rest_request.id': 'rest_session_join.id',
            'rest_request.start.ge': filters.start.toISOString(),
            'rest_request.start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'rest_session_join.instance_env': 'instance_join.id',
            'instance_join.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        }
        if(filters.servers) {
            args['instance_join.app_name.in'] = filters.servers.map(o => `"${o}"`).join(',');
        }
        return this.getRestSession(args);
    }

    getDependents(filters: {server: string, env: string, start: Date, end: Date, apiNames: string, users: string, versions: string }): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, appName: string}[]> {
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
            'instance.environement': filters.env,
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
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
        return this.getRestSession(args);
    }

    getDependentsNew(filters: {env: string, start: Date, end: Date, servers: string[] }): Observable<{count: number, countSucces: number, countErrClient: number, countErrServer: number, dep: string, actual: string }[]> {
        let args: any = {
            'column': `rest_session_join.count:count,rest_session_join.count_succes:countSucces,rest_session_join.count_error_client:countErrClient,rest_session_join.count_error_server:countErrServer,instance_join.app_name:dep,instance.app_name:actual`,
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
            'instance.environement': filters.env,
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'order': 'count.desc'
        }
        if(filters.servers) {
            args['instance.app_name.in'] = filters.servers.map(o => `"${o}"`).join(',');
        }
        return this.getRestSession(args);
    }

    getArchitectureForHeatMap(filters: {start: Date, end: Date, env: string}): Observable<{count: number, sum: number, origin: string, target: string}[]> {
        return this.getRestSession({
            'column': 'rest_request.count:count,rest_request.size_out.sum:sum,instance.app_name:origin,instance_join.app_name:target',
            'instance.id': 'instance_env',
            'id': 'rest_request.parent',
            'rest_request.remote': 'rest_session_join.id',
            'rest_session_join.instance_env': 'instance_join.id',
            'view': 'rest_session:rest_session_join,instance:instance_join',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'rest_session_join.start.ge': filters.start.toISOString(),
            'rest_session_join.start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance_join.environement': filters.env,
            'order': 'origin.asc,target.asc'
        });
    }

    getExceptions(filters: {start: Date, end: Date , ids: string}): Observable<{count: number, errorType: string}[]>;
    getExceptions(filters: {start: Date, end: Date , ids: string, apiName: string}): Observable<{count: number, errorType: string}[]>;
    getExceptions(filters: {start: Date, end: Date , user: string, env: string}): Observable<{count: number, errorType: string}[]>;
    getExceptions(filters: {start: Date, end: Date , ids: string, apiName: string, user: string, env: string}): Observable<{count: number, errorType: string}[]> {
        let args: any = {
            'column': 'count:count,err_type',
            'status.ge': 500,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'order': 'count.desc',
            'limit': 5,
            
        }
        if(filters.ids) {
            args['instance_env.in'] = filters.ids;
            if(filters.apiName) args['api_name'] = `"${filters.apiName}"`;
        } else {
            args['instance_env'] = 'instance.id';
            args['instance.environement'] = filters.env;
            if (filters.user) {
                args['user'] = filters.user;
            }
        }
        return this.getRestSession(args);
    }

    getSessionExceptions(filters: {env: string, start: Date, end: Date, groupedBy: string, server?: string, apiNames?: string, users?: string, versions?: string, others?: {[key: string]: any}  }): Observable<ExceptionsByPeriodAndAppname[]> {
        let args = {
            "column": `start.${filters.groupedBy}:date,err_type,count:count,status,count.sum.over(partition(date)):countok,count.divide(countok).multiply(100).round(2):pct,start.year:year,instance.type:type`,
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
            const key = Object.keys(filters.others)[0];
            args[key] = filters.others[key];
        }
        return this.getRestSession(args);
    }

    getRequestNames(filters: {env: string, appName: string, start: Date, end: Date}): Observable<string[]> {
        return this.getRestSession({
            'column.distinct': 'api_name',
            'join': 'instance',
            'api_name.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'SERVER'
        }).pipe(map((data: {apiName: string}[]) => (data.map(d => d.apiName))));
    }

    getUsers(filters: {env: string, appName: string, start: Date, end: Date}): Observable<string[]> {
        return this.getRestSession({
            'column.distinct': 'user',
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': `"${filters.appName}"`,
            'instance.type': 'SERVER'
        }).pipe(map((data: {user: string}[]) => (data.map(d => d.user))));
    }

    getUsersByPeriod(filters: {server: string, env: string, start: Date, end: Date, groupedBy: string, apiNames: string, users: string, versions: string }): Observable<{user: string, date: number, year: number}[]> {
        let args = {
            'column.distinct': `user,start.${filters.groupedBy}:date,start.year:year`,
            'join': 'instance',
            'user.notNull': '',
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString(),
            'instance.environement': filters.env,
            'instance.app_name': filters.server,
            'instance.type': 'SERVER'
        };
        if(filters.apiNames) {
            args['api_name.in'] = filters.apiNames;
        }
        if(filters.versions) {
            args['instance.version.in'] = filters.versions;
        }
        if (filters.users) {
            args['user.in'] = filters.users;
        }
        return this.getRestSession(args);
    }

    getCustom(data: {series: ChartItem[], indicator: ChartItem, group: ChartItem, stack?: ChartItem, filter?: ChartItem },
              filters: {env: string, start: Date, end: Date, hosts?: string[], filters?: string[] }): Observable<any[]> {
        let args: any = {
            'column': `${data.series.map(d => d.jquery.value + '.' + data.indicator.jquery.value + ':' + data.indicator.jquery.buildAlias(d.jquery.buildAlias())).join(',')},${data.group.jquery.value}:${data.group.jquery.buildAlias()}`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(data.stack) {
            args['column'] += `,${data.stack.jquery.value}:${data.stack.jquery.buildAlias()}`;
            args[`${data.stack.jquery.buildAlias()}.notNull`] = ''
        }
        if(data.group.jquery.order){
            args['order'] = `${data.group.jquery.buildAlias()}.${data.group.jquery.order}`;
        }
        if(filters.filters?.length) {
            args[`${data.filter.jquery.value}.in`] = filters.filters.map(o => `"${o}"`).join(',');
        }
        if(filters.hosts?.length){
            args['instance.app_name.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getRestSession(args);
    }

    getFilters(filter: ChartItem, filters: {env: string, start: Date, end: Date, groupedBy?: string, hosts?: string[], method?: string[] }) {
        let args: any = {
            'column': `${filter.jquery.value}.distinct:${filter.jquery.buildAlias()}`,
            'instance_env': 'instance.id',
            'instance.environement': filters.env,
            'start.ge': filters.start.toISOString(),
            'start.lt': filters.end.toISOString()
        }
        if(filters.hosts?.length){
            args['host.in'] = filters.hosts.map(o => `"${o}"`).join(',');
        }
        return this.getRestSession(args);
    }
}