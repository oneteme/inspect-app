import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {ActivityPeriodGroup} from '../../shared/util';

export interface SequenceLossEvent {
  instanceId: string;
  start: number;
  seq: number;
  atm: number;
}

@Injectable({ providedIn: 'root' })
export class InstanceTraceService {
  constructor(private readonly http: HttpClient) {

  }

  getInstanceTrace<T>(params: any): Observable<T> {
    const url = `${localStorage.getItem('server')}/jquery/instance/trace`;
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
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': `${filters.groupedBy}.asc`
    };
    if (filters.app_name?.length) {
      args['instance.app_name.in'] = filters.app_name.join(',');
    }
    return this.getInstanceTrace(args);
  }

  getRetryOccurrencesHeatmap(filters: {namespace: string, start: Date, end: Date, groupedBy: ActivityPeriodGroup, app_name?: string[]}): Observable<{
    hourMinute: string;
    appName: string;
    sum: number;
  }[]> {
    const criteria = [
      'attempts.gt(1)',
      `instance.namespace.eq(${filters.namespace})`,
      `instance.start.ge(${filters.start.toISOString()})`,
      `instance.start.lt(${filters.end.toISOString()})`
    ];
    if (filters.app_name?.length) {
      criteria.push(`instance.app_name.in(${filters.app_name.join(',')})`);
    }
    const criteriaExpression = criteria[0] + criteria.slice(1).map(item => `.and(${item})`).join('');
    const args: any = {
      'column': `v1.${filters.groupedBy},v1.appName,v1.occurrences.sum:sum`,
      'cte': `select(instance.start.${filters.groupedBy}:${filters.groupedBy},instance.app_name:appName,sequence,sequence.count:occurrences).join(left_instance).criteria(${criteriaExpression}):v1`,
      'order': `v1.${filters.groupedBy}.asc`
    };
    return this.getInstanceTrace(args);
  }


  getSequenceLossesByPeriod(filters: {start: Date, end: Date, groupedBy: ActivityPeriodGroup, app_name?: string[]}): Observable<SequenceLossEvent[]> {
    const args: any = {
      'column': `v1.instanceId,v1.start:start,v1.start.${filters.groupedBy}:${filters.groupedBy},v1.sequence.minus(v1.prev_seq).minus(1):seq,v1.attempts.minus(1):atm`,
      'cte': 'select(instance_env:instanceId,instance.app_name:appName,start,sequence,attempts,sequence.lag.over(partition(instance_env).order(start.asc)):prev_seq,attempts.lag.over(partition(instance_env).order(start.asc)):prev_atm).join(left_instance):v1',
      'seq.gt(0).or(atm.gt(0))': '',
      'v1.start.ge': filters.start.toISOString(),
      'v1.start.lt': filters.end.toISOString(),
      'order': 'v1.start.asc'
    };
    if (filters.app_name?.length) {
      args['v1.appName.in'] = filters.app_name.join(',');
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
