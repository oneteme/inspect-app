import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
/**
 * Provides access to trace sampling metrics for application instances.
 */
export class InstanceTraceService {
  constructor(private http: HttpClient) {

  }

  /**
   * Executes an instance trace query with typed response mapping.
   *
   * @param params Backend query parameters.
   * @returns Observable of the response typed with `T`.
   */
  getInstanceTrace<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/instance/trace`;
    return this.http.get<T>(url, { params: params });
  }

  /**
   * Retrieves trace metrics over time for one instance.
   *
   * @param filters Instance identifier and date range.
   * @returns Observable list of time-series trace metrics.
   */
  getInstanceTraceByPeriod(filters: {instance: string, start: Date, end: Date}): Observable<{date: number, pending: number, attempts: number, traceCount: number}[]> {
    let args: any = {
      'column': 'start:date,pending:pending,attempts:attempts,trace_count:traceCount',
      'instance_env.varchar': filters.instance,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getInstanceTrace(args);
  }

  /**
   * Computes the cumulative pending trace count before a given date.
   *
   * @param filters Instance identifier and upper date bound.
   * @returns Observable sum of pending traces (0 when no data exists).
   */
  getPendingSum(filters: {instance: string, date: Date}): Observable<number> {
    return this.getInstanceTrace({
      'column': 'pending.sum:pending',
      'instance_env.varchar': filters.instance,
      'start.lt': filters.date.toISOString()
    }).pipe(map((res: {pending: number}[]) => res[0].pending || 0));
  }

  /**
   * Retrieves the latest trace timestamp for each instance id.
   *
   * @param filters List of instance identifiers.
   * @returns Observable list with instance id and last trace date.
   */
  getLastInstanceTrace(filters: {instance: string[]}): Observable<{id: string, date: number}[]> {
    let args: any = {
      'column': 'instance_env:id,start:date',
      'instance_env.varchar.in': filters.instance.join(','),
      'rank.over(partition(instance_env).order(start.desc))': '1'
    }
    return this.getInstanceTrace(args);
  }
}
