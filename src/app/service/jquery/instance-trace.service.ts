import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class InstanceTraceService {
  constructor(private http: HttpClient) {

  }

  getInstanceTrace<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/instance/trace`;
    return this.http.get<T>(url, { params: params });
  }

  getInstanceTraceByPeriod(filters: {instance: string, start: Date, end: Date}): Observable<{date: number, pending: number, attempts: number, traceCount: number}[]> {
    let args: any = {
      'column': 'start:date,pending:pending,attempts:attempts,trace_count:traceCount',
      'instance_env.varchar': `"${filters.instance}"`,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getInstanceTrace(args);
  }

  getLastInstanceTrace(filters: {instance: string}): Observable<{date: number}[]> {
    let args: any = {
      'column': 'start:date',
      'instance_env.varchar': `"${filters.instance}"`,
      'limit': '1',
      'order': 'date.desc'
    }
    return this.getInstanceTrace(args);
  }
}