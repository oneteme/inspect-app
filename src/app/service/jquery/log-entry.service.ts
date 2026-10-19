import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
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
      'column': 'start:instant,instance.app_name:appName,log_message,stacktrace',
      'join': 'instance',
      'instance.namespace': filters.namespace,
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
      action: row. action ?? '',
      thread: row.thread ?? '',
      stackRows: row.stackRows ?? []
    }))));
  }
}
