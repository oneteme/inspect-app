import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AnalyticDto, MainSessionType, SessionEventDto} from "../model/request.model";
import {SessionEvent} from "../model/trace.model";

@Injectable({ providedIn: 'root' })
export class SessionEventService {
    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {
    }

    getUserActionsByUser(user: string, date: Date, offset?: number, limit?: number): Observable<AnalyticDto[]> {
        let params: any = {
            'date': date.toISOString()
        }
        if(offset) params['offset'] = offset;
        if(limit) params['limit'] = limit;
        return this.http.get<AnalyticDto[]>(`${this.server}/session/user/${user}/action`, { params: params });
    }

    getSessionEventsBySession(idSession: string): Observable<SessionEvent[]> {
        return this.http.get<SessionEvent[]>(`${this.server}/session/${idSession}/event`);
    }

    getSessionEvents(params: any): Observable<SessionEventDto[]> {
        return this.http.get<SessionEventDto[]>(`${this.server}/session/event`, {params: params});
    }

    getSessionEventTypeCount(params: any): Observable<{count: number, type: string}[]> {
        return this.http.get<{count: number, type: string}[]>(`${localStorage.getItem('server')}/jquery/session/event/count`, {params: params});
    }

    getMainSessionType(idSession: string): Observable<MainSessionType> {
        return this.http.get<MainSessionType>(`${this.server}/session/main/${idSession}`);
    }

}
