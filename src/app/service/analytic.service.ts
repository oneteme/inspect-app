import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AnalyticDto} from "../model/request.model";
import {UserAction} from "../model/trace.model";

@Injectable({ providedIn: 'root' })
/**
 * Exposes analytics endpoints related to user activity.
 */
export class AnalyticService {
    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {
    }

    /**
     * Fetches user actions for one user on a given date with optional paging.
     *
     * @param user User identifier to query.
     * @param date Day used as the analytic reference.
     * @param offset Optional pagination offset.
     * @param limit Optional pagination size.
     * @returns An observable list of user-action analytics rows.
     */
    getUserActionsByUser(user: string, date: Date, offset: number, limit: number): Observable<AnalyticDto[]> {
        let params: any = {
            'date': date.toISOString()
        }
        if(offset) params['offset'] = offset;
        if(limit) params['limit'] = limit;
        return this.http.get<AnalyticDto[]>(`${this.server}/session/user/${user}/action`, { params: params });
    }

    /**
     * Fetches user actions linked to a specific session.
     *
     * @param idSession Session identifier.
     * @returns An observable list of actions recorded for the session.
     */
    getUserActionsBySession(idSession: string): Observable<UserAction[]> {
        return this.http.get<UserAction[]>(`${this.server}/session/${idSession}/user/action`);
    }
}