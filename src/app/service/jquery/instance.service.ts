import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class InstanceService {
    constructor(private http: HttpClient) {

    }

    getInstance<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/instance`;
        return this.http.get<T>(url, { params: params });
    }

    getIds(env: string, end: Date, appName: string): Observable<{id: string}[]> {
        let args: any = {
            'column.distinct': 'id',
            'app_name.in': `"${appName}"`,
            'environement': env,
            'start.lt': end.toISOString(),
        }
        return this.getInstance(args);
    }
    
    getEnvironments(): Observable<{environement: string}[]> {
        let args = {
            'column.distinct': 'environement',
            'environement.notNull': '',
            'order': 'environement.asc'
        }
        return this.getInstance(args);
    }

    getApplications(): Observable<{appName: string}[]> {
        let args = {
            'column.distinct': 'app_name:appName',
            'order': 'app_name.asc'
        }
        return this.getInstance(args);
    }
}