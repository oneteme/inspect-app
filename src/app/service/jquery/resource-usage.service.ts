import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
/**
 * Provides machine resource usage metrics from jQuery endpoints.
 */
export class MachineUsageService {
  server = `${localStorage.getItem('server')}/jquery`;

  constructor(private http: HttpClient) {

  }

  /**
   * Executes a machine resource query with typed response mapping.
   *
   * @param params Backend query parameters.
   * @returns Observable of the response typed with `T`.
   */
  getResourceMachine<T>(params: any): Observable<T> {
    let url = `${this.server}/resource/machine`;
    return this.http.get<T>(url, { params: params });
  }

  /**
   * Returns resource usage time series for one instance on a period.
   *
   * @param filters Instance identifier and date boundaries.
   * @returns Observable list of dated resource usage points.
   */
  getResourceMachineByPeriod(filters: {instance: string, start: Date, end: Date}): Observable<{date: number, usedHeap: number, commitedHeap: number, usedDiskSpace: number}[]> {
    let args: any = {
      'column': 'start:date,used_heap:usedHeap,commited_heap:commitedHeap,used_disk_space:usedDiskSpace',
      'instance_env.varchar': filters.instance,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getResourceMachine(args);
  }
}
