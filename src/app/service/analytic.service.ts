import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {InstanceRestSession, MainSession, UserAction} from "../model/trace.model";

@Injectable({ providedIn: 'root' })
export class AnalyticService {
    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {
    }

    getUserActionsByUser(user: string, date: Date, offset: number, limit: number): Observable<MainSession[]> {
        let params: any = {
            'date': date.toISOString()
        }
        if(offset) params['offset'] = offset;
        if(limit) params['limit'] = limit;
        return this.http.get<Array<MainSession>>(`${this.server}/session/user/${user}/action`, { params: params });
    }

    getUserActionsBySession(idSession: string): Observable<UserAction[]> {
        return this.http.get<UserAction[]>(`${this.server}/session/${idSession}/user/action`);
    }
}