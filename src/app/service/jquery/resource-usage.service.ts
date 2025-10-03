import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class MachineUsageService {
  server = `${localStorage.getItem('server')}/jquery`;

  constructor(private http: HttpClient) {

  }

  getResourceMachine<T>(params: any): Observable<T> {
    let url = `${this.server}/resource/machine`;
    return this.http.get<T>(url, { params: params });
  }

  getResourceMachineByPeriod(filters: {instance: string, start: Date, end: Date}): Observable<{date: number, usedHeap: number, commitedHeap: number, usedDiskSpace: number}[]> {
    let args: any = {
      'column': 'start:date,used_heap:usedHeap,commited_heap:commitedHeap,used_disk_space:usedDiskSpace',
      'instance_env.varchar': `"${filters.instance}"`,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getResourceMachine(args);
  }
}