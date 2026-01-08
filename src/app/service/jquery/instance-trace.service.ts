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

  getPendingSum(filters: {instance: string, date: Date}): Observable<number> {
    return this.getInstanceTrace({
      'column': 'pending.sum:pending',
      'instance_env.varchar': `"${filters.instance}"`,
      'start.lt': filters.date.toISOString()
    }).pipe(map((res: {pending: number}[]) => res[0].pending || 0));
  }

  getLastInstanceTrace(filters: {instance: string[]}): Observable<{id: string, date: number}[]> {
    let args: any = {
      'column': 'instance_env:id,start:date',
      'instance_env.varchar.in': filters.instance.map(i => `"${i}"`).join(','),
      'rank.over(partition(instance_env).order(start.desc))': '1'
    }
    return this.getInstanceTrace(args);
  }
}