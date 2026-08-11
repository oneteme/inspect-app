import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {LastServerStart} from "src/app/model/jquery.model";
import {InspectCollectorConfiguration} from "../../model/trace.model";

@Injectable({providedIn: 'root'})
/**
 * Exposes instance-oriented queries (environments, applications, periods and metadata).
 */
export class InstanceService {
  constructor(private http: HttpClient) {

  }

  /**
   * Executes an instance query with typed response mapping.
   *
   * @param params Backend query parameters.
   * @returns Observable of the response typed with `T`.
   */
  getInstance<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/instance`;
    return this.http.get<T>(url, {params: params});
  }

  /**
   * Retrieves all available environment identifiers.
   *
   * @returns Observable list of distinct environment names.
   */
  getEnvironments(): Observable<{ environement: string }[]> {
    let args = {
      'column': 'environement',
      'distinct': true,
      'environement.notNull': '',
      'order': 'environement.asc'
    }
    return this.getInstance(args);
  }

  /**
   * Retrieves applications for one instance type and environment.
   *
   * @param type Instance type (for example SERVER or CLIENT).
   * @param env Environment identifier.
   * @returns Observable list of distinct application names.
   */
  getApplications(type: string, env: string): Observable<{ appName: string }[]> {
    let args = {
      'column': 'app_name:appName',
      'distinct': true,
      'app_name.notNull': '',
      'environement': env,
      'type': type,
      'order': 'app_name.asc'
    }
    return this.getInstance(args);
  }

  /**
   * Retrieves latest server start snapshots with computed restart metadata.
   *
   * @param filters Environment scope for the query.
   * @returns Observable list of last-start entries, including parsed collector configuration.
   */
  getLastServerStart(filters: { env: string }): Observable<LastServerStart[]> {
    return this.getInstance<any>({
      'column': `view1.id,view1.environement:env,view1.type,view1.appName,view1.version,view1.branch,view1.hash,view1.start,view1.end,view1.collector,view1.configuration,view1.restart,view1.minStart,view1.lastStart,view1.os,view1.re,view1.address,view1.user`,
      'cte': `select(id,environement,type,app_name,version,branch,hash,start,end,collector,configuration,os,re,user,address,start.min.over(partition(environement,app_name,version)):minStart,rank.over(partition(environement,app_name).order(end.coalesce(9999-12-31T00:00:00.000Z).desc,start.desc)):rk,count.over(partition(environement,app_name,version)):restart,start.max.over(partition(environement,app_name)):lastStart).criteria(type.eq(SERVER).and(environement.eq(${filters.env}))):view1`,
      'view1.rk': '1', 'order': 'view1.start.desc'
    }).pipe(map(res => { return res.map(r => ({...r, configuration: r.configuration?.value ? JSON.parse(r.configuration?.value) : null})) }));
  }

  /**
   * Retrieves applications that produced main VIEW sessions in a period.
   *
   * @param start Inclusive start date.
   * @param end Exclusive end date.
   * @param env Environment identifier.
   * @returns Observable list of application/type pairs.
   */
  getMainSessionApplication(start: Date, end: Date, env: string): Observable<{ appName: string, type: string }[]> {
    let args = {
      'column': 'app_name:appName,main_session.type',
      'distinct': true,
      'id': 'main_session.instance_env',
      'main_session.start.ge': start.toISOString(),
      'main_session.start.lt': end.toISOString(),
      'app_name.notNull': '',
      'environement': env,
      'main_session.type': 'VIEW',
      'order': 'app_name.asc'
    }
    return this.getInstance(args);
  }

  /**
   * Retrieves all instance runtime periods for one application (optionally one address).
   *
   * @param filters Environment, application name and optional address filter.
   * @returns Observable list of instance periods with parsed collector configuration.
   */
  getInstancesPeriodsByAppName(filters: { env: string,appName: string, address: string | undefined}): Observable<{
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
      'environement': filters.env,
      'app_name': filters.appName,
      'order': 'start.asc'
    }
    if(filters.address){
      args['address']= filters.address;
    }
    return this.getInstance<any>(args).pipe(map(res => { return res.map(r => ({...r, configuration: r.configuration?.value ? JSON.parse(r.configuration?.value) : null})) }));
  }

  /**
   * Retrieves server instances active during a given time window.
   *
   * @param filters Environment and period bounds.
   * @returns Observable list of matching server instances with start/end timestamps.
   */
  getInstancesByPeriod(filters: { env: string, start: Date, end: Date }): Observable<{
    id: string,
    appName: string,
    start: number,
    end: number
  }[]> {
    let criteria = `start.le(${filters.end.toISOString()}).and(end.ge(${filters.start.toISOString()}).or(end.isNull))`;
    let args: any = {
      'column': 'id,app_name:appName,start,end',
      'environement': filters.env,
      'type': 'SERVER',
      [criteria]: '',
      'order': 'app_name.asc,start.desc'
    }
    return this.getInstance(args);
  }

  /**
   * Retrieves client instances active during a given time window.
   *
   * @param filters Environment and period bounds.
   * @returns Observable list of matching client instances including address.
   */
  getClientInstanceByPeriodAndAddress(filters: { env: string, start: Date, end: Date}): Observable<{
    id: string,
    appName: string,
    address: string,
    start: number,
    end: number
  }[]> {
    let criteria = `start.le(${filters.end.toISOString()}).and(end.ge(${filters.start.toISOString()}).or(end.isNull))`;
    let args: any = {
      'column': 'id,app_name:appName,address,start,end',
      'environement': filters.env,
      'type': 'CLIENT',
      [criteria]: '',
      'order': 'app_name.asc,start.desc'
    }
    return this.getInstance(args);
  }
}
