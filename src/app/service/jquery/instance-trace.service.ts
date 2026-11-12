import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {ActivityPeriodGroup} from '../../shared/util';

export interface SequenceLossEvent {
  instanceId: string;
  start: number;
  date: string | number;
  year: number;
  seq: number;
  atm: number;
}
const SIZE_UNIT_MULTIPLIERS: Record<string, number> = {
  B: 1,
  KB: 1000,
  MB: 1000 ** 2,
  GB: 1000 ** 3,
  TB: 1000 ** 4
};

export function parseSizeToBytes(value: string): number {
  const match = /^([\d.,]+)\s*([A-Za-z]+)$/.exec(value?.trim() ?? '');
  if (!match) return 0;
  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2].toUpperCase();
  const multiplier = SIZE_UNIT_MULTIPLIERS[unit] ?? 1;
  return Number.isFinite(amount) ? amount * multiplier : 0;
}

export interface DatabaseInfo {
  schema: string;
  size_schema: string;
  size_database: string;
}

@Injectable({ providedIn: 'root' })
export class InstanceTraceService {
  constructor(private readonly http: HttpClient) {

  }

  getInstanceTrace<T>(params: any): Observable<T> {
    const url = `${localStorage.getItem('server')}/jquery/instance/trace`;
    return this.http.get<T>(url, { params: params });
  }

  getDatabaseInfo(params?: any): Observable<DatabaseInfo[]> {
    const url = `${localStorage.getItem('server')}/v5/trace/database`;
    return this.http.get<DatabaseInfo[]>(url, { params: params });
  }


  getInstanceTraceByPeriod(filters: {instance: string, start: Date, end: Date}): Observable<{date: number, pending: number, attempts: number, traceCount: number}[]> {
    let args: any = {
      'select': 'start:date,pending:pending,attempts:attempts,trace_count:traceCount',
      'instance_env.varchar': filters.instance,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    }
    return this.getInstanceTrace(args);
  }

  getPendingSum(filters: {instance: string, date: Date}): Observable<number> {
    return this.getInstanceTrace({
      'select': 'pending.sum:pending',
      'instance_env.varchar': filters.instance,
      'start.lt': filters.date.toISOString()
    }).pipe(map((res: {pending: number}[]) => res[0].pending || 0));
  }

  getActivityByPeriod(filters: {namespace: string, start: Date, end: Date, groupedBy: ActivityPeriodGroup, app_name?: string[]}): Observable<{
    date: string | number;
    appName: string;
    pending: number;
    attempts: number;
    traceCount: number;
  }[]> {
    const args: any = {
      'select': `start.${filters.groupedBy}:date,instance.app_name:appName,pending.sum:pending,attempts.sum:attempts,trace_count.sum:traceCount`,
      'join': 'instance',
      'instance.namespace': filters.namespace,
      'start.ge': filters.start.toISOString(),
      'start.lt': filters.end.toISOString(),
      'order': 'date.asc'
    };
    if (filters.app_name?.length) {
      args['instance.app_name.in'] = filters.app_name.join(',');
    }
    return this.getInstanceTrace(args);
  }


  getSequenceLossesByPeriod(filters: {namespace: string, start: Date, end: Date, groupedBy: ActivityPeriodGroup, app_name?: string[]}): Observable<SequenceLossEvent[]> {
    const args: any = {
      'select': `v1.instanceId,v1.start:start,v1.start.${filters.groupedBy}:date,v1.sequence.minus(v1.prev_seq).minus(1):seq,v1.attempts.minus(1):atm`,
      'cte': 'select(instance_env:instanceId,instance.namespace:namespace,instance.app_name:appName,start,sequence,attempts,sequence.lag.over(partition(instance_env).order(start.asc)):prev_seq,attempts.lag.over(partition(instance_env).order(start.asc)):prev_atm).join(left_instance):v1',
      'seq.gt(0).or(atm.gt(0))': '',
      'v1.namespace': filters.namespace,
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
      'select': 'instance_env:id,start:date',
      'instance_env.varchar.in': filters.instance.join(','),
      'rank.over(partition(instance_env).order(start.desc))': '1'
    }
    return this.getInstanceTrace(args);
  }
}
