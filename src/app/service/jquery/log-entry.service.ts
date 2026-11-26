import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable, of} from "rxjs";
import {LogEntry} from '../../model/trace.model';


@Injectable({ providedIn: 'root' })
export class LogEntryService {
  constructor(private http: HttpClient) {

  }

  getLogEntry<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/log/entry`;
    return this.http.get<T>(url, { params: params });
  }

  getActivityByPeriod(filters: {namespace: string, start: Date, end: Date, app_name?: string[]}): Observable<LogEntry[]> {
    const args: any = {
      'select': 'instance_env,start:instant,instance.app_name:appName,log_message,thread,action,has_stack:hasStack',
      'join': 'left_instance',
      'instance.namespace': filters.namespace, // todo remove this once @usf fixes the namespace issue in server
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'instant.asc'
    };
    if (filters.app_name?.length) {
      args['instance.app_name.in'] = filters.app_name.join(',');
    }
    return this.getLogEntry<any[]>(args).pipe(map(rows => rows.map(row => ({
      instant: row.instant / 1000,
      appName: row.appName ?? '',
      message: row.logMessage ?? '',
      level: row.level ?? '',
      action: row.action ?? '',
      thread: row.thread ?? '',
      instanceEnv: row.instanceEnv ?? '',
      startMs: row.instant,
      hasStack: row.hasStack ?? false
    }))));
  }

  getSystemActivityLogs(filters: {
    namespace: string, start: Date, end: Date, app_name?: string[],
  }): Observable<LogEntry[]> {
    const args: any = {
      'select': 'instance_env,start:instant,log_message,thread,action,has_stack:hasStack',
      'join': 'left_instance',
      'instance.app_name.isNull': '',
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'instant.asc',
    };
    if (!filters.app_name?.length) {
      return this.getLogEntry<any[]>(args).pipe(map(rows => rows.map(row => ({
        instant: row.instant / 1000,
        appName: '',
        message: row.logMessage ?? '',
        level: row.level ?? '',
        action: row.action ?? '',
        thread: row.thread ?? '',
        instanceEnv: row.instanceEnv ?? '',
        startMs: row.instant,
        hasStack: row.hasStack ?? false
      }))));
    }
    return of([]);
  }

  getStacktrace(instanceEnv: string, startMs: number): Observable<string | null> {
    return this.getLogEntry<any[]>({
      select: 'stacktrace:stacktrace',
      instance_env: instanceEnv,
      'start.ge': new Date(startMs).toISOString(),
      'start.lt': new Date(startMs + 1).toISOString()
    }).pipe(map(rows => {
      const stack = rows[0]?.stacktrace;
      return (stack && typeof stack === 'object' ? stack.value : stack) ?? null;
    }));
  }
}
