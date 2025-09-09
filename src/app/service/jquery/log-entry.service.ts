import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class LogEntryService {
  constructor(private http: HttpClient) {

  }

  getLogEntry<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/log/entry`;
    return this.http.get<T>(url, { params: params });
  }

  getLogEntryByPeriod(filters: {instance: string, start: Date, end: Date}): Observable<{ date: number, level: string, message: string }[]> {
    let args: any = {
      'column': 'start:date,log_level:level,log_message:message,stacktrace:stacktrace',
      'instance_env.varchar': `"${filters.instance}"`,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getLogEntry(args);
  }
}