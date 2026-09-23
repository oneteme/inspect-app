import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {LastServerStart} from "src/app/model/jquery.model";
import {InspectCollectorConfiguration} from "../../model/trace.model";

@Injectable({providedIn: 'root'})
export class InstanceService {
  constructor(private http: HttpClient) {

  }

  getInstance<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/instance`;
    return this.http.get<T>(url, {params: params});
  }

  getNamespaces(): Observable<{ namespace: string }[]> {
    let args = {
      'column': 'namespace',
      'distinct': true,
      'namespace.notNull': '',
      'order': 'namespace.asc'
    }
    return this.getInstance(args);
  }

  getApplications(type: string, namespace: string): Observable<{ appName: string }[]> {
    let args = {
      'column': 'app_name:appName',
      'distinct': true,
      'app_name.notNull': '',
      'namespace': namespace,
      'type': type,
      'order': 'app_name.asc'
    }
    return this.getInstance(args);
  }

  getLastServerStart(filters: { namespace: string }): Observable<LastServerStart[]> {
    return this.getInstance<any>({
      'column': `view1.id,view1.namespace:namespace,view1.type,view1.appName,view1.version,view1.branch,view1.hash,view1.start,view1.end,view1.collector,view1.configuration,view1.restart,view1.minStart,view1.lastStart,view1.os,view1.re,view1.address,view1.user`,
      'cte': `select(id,namespace,type,app_name,version,branch,hash,start,end,collector,configuration,os,re,user,address,start.min.over(partition(namespace,app_name,version)):minStart,rank.over(partition(namespace,app_name).order(end.coalesce(9999-12-31T00:00:00.000Z).desc,start.desc)):rk,count.over(partition(namespace,app_name,version)):restart,start.max.over(partition(namespace,app_name)):lastStart).criteria(type.eq(SERVER).and(namespace.eq(${filters.namespace}))):view1`,
      'view1.rk': '1', 'order': 'view1.start.desc'
    }).pipe(map(res => { return res.map(r => ({...r, configuration: r.configuration?.value ? JSON.parse(r.configuration?.value) : null})) }));
  }

  getMainSessionApplication(start: Date, end: Date, namespace: string): Observable<{ appName: string, type: string }[]> {
    let args = {
      'column': 'app_name:appName,main_session.type',
      'distinct': true,
      'id': 'main_session.instance_env',
      'main_session.start.ge': start.toISOString(),
      'main_session.start.lt': end.toISOString(),
      'app_name.notNull': '',
      'namespace': namespace,
      'main_session.type': 'VIEW',
      'order': 'app_name.asc'
    }
    return this.getInstance(args);
  }

  //new
  getInstancesPeriodsByAppName(filters: { namespace: string,appName: string, address: string | undefined}): Observable<{
    id: string,
    version: string,
    hash: string,
    branch: string,
    address:string,
    start: number,
    end: number,
    collector: string,
    configuration: InspectCollectorConfiguration,
    re:string,
  }[]> {
    let args: any = {
      'column': 'id,start,end,version,address,branch,hash,os,re,collector,configuration',
      'namespace': filters.namespace,
      'app_name': filters.appName,
      'order': 'start.asc'
    }
    if(filters.address){
      args['address']= filters.address;
    }
    return this.getInstance<any>(args).pipe(map(res => { return res.map(r => ({...r, configuration: r.configuration?.value ? JSON.parse(r.configuration?.value) : null})) }));
  }

  getInstancesByPeriod(filters: { namespace: string, start: Date, end: Date }): Observable<{
    id: string,
    appName: string,
    start: number,
    end: number
  }[]> {
    let criteria = `start.le(${filters.end.toISOString()}).and(end.ge(${filters.start.toISOString()}).or(end.isNull))`;
    let args: any = {
      'column': 'id,app_name:appName,start,end',
      'namespace': filters.namespace,
      'type': 'SERVER',
      [criteria]: '',
      'order': 'app_name.asc,start.desc'
    }
    return this.getInstance(args);
  }

  getClientInstanceByPeriodAndAddress(filters: { namespace: string, start: Date, end: Date}): Observable<{
    id: string,
    appName: string,
    address: string,
    start: number,
    end: number
  }[]> {
    let criteria = `start.le(${filters.end.toISOString()}).and(end.ge(${filters.start.toISOString()}).or(end.isNull))`;
    let args: any = {
      'column': 'id,app_name:appName,address,start,end',
      'namespace': filters.namespace,
      'type': 'CLIENT',
      [criteria]: '',
      'order': 'app_name.asc,start.desc'
    }
    return this.getInstance(args);
  }
}
