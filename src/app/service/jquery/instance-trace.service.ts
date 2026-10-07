import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {ActivityPeriodGroup} from '../../shared/util';

export interface SequenceActivityEvent {
  date: number;
  appName: string;
  instanceId: string;
  pending: number;
  attempts: number;
  sequence: number;
  traceCount: number;
}

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
      'instance_env.varchar': filters.instance,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getInstanceTrace(args);
  }

  getPendingSum(filters: {instance: string, date: Date}): Observable<number> {
    return this.getInstanceTrace({
      'column': 'pending.sum:pending',
      'instance_env.varchar': filters.instance,
      'start.lt': filters.date.toISOString()
    }).pipe(map((res: {pending: number}[]) => res[0].pending || 0));
  }

  getActivityByPeriod(filters: {namespace: string, start: Date, end: Date, groupedBy: ActivityPeriodGroup, app_name?: string[]}): Observable<{
    [key: string]: any;
    appName: string;
    pending: number;
    attempts: number;
    traceCount: number;
  }[]> {
    const args: any = {
      'column': `start.${filters.groupedBy}:${filters.groupedBy},instance.app_name:appName,pending.sum:pending,attempts.sum:attempts,trace_count.sum:traceCount`,
      'join': 'instance',
      'instance.namespace': filters.namespace,
      //'instance.type': 'SERVER',
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': `${filters.groupedBy}.asc`
    };
    if (filters.app_name?.length) {
      args['instance.app_name.in'] = filters.app_name.join(',');
    }
    return this.getInstanceTrace(args);
  }

  getSequenceEventsByPeriod(filters: {namespace: string, start: Date, end: Date, app_name?: string[]}): Observable<SequenceActivityEvent[]> {
    const args: any = {
      'column': 'start:date,instance.app_name:appName,instance_env:instanceId,pending:pending,attempts:attempts,sequence,trace_count:traceCount',
      'join': 'instance',
      'instance.namespace': filters.namespace,
      //'instance.type': 'SERVER',
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'start.asc'
    };
    if (filters.app_name?.length) {
      args['instance.app_name.in'] = filters.app_name.join(',');
    }
    return this.getInstanceTrace(args);
  }


  getLastInstanceTrace(filters: {instance: string[]}): Observable<{id: string, date: number}[]> {
    let args: any = {
      'column': 'instance_env:id,start:date',
      'instance_env.varchar.in': filters.instance.join(','),
      'rank.over(partition(instance_env).order(start.desc))': '1'
    }
    return this.getInstanceTrace(args);
  }
}
