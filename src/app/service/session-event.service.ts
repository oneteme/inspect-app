import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {AnalyticDto, MainSessionType, SessionEventDto} from "../model/request.model";
import {SessionEvent} from "../model/trace.model";

/** Colonnes de base de la liste ; l'alias (`colonne:alias`) donne la clé de la réponse. sessionId reste en base : il sert au lien de détail. */
const SESSION_EVENT_LIST_COLUMNS = 'start:instant,type,value,sessionId,scope,instance.app_name:appName';

/** Colonnes lazy : clé de table vers expression jquery. */
const LAZY_SESSION_EVENT_COLUMNS: Record<string, string> = {
    namespace: 'instance.namespace:namespace'
};

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

    /** Liste jquery : colonnes de base + colonnes lazy demandées. jquery renvoie start en ms, la page attend instant en secondes. */
    getSessionEvents(criteria: Record<string, any>, lazyColumns: readonly string[] = []): Observable<SessionEventDto[]> {
        const column = [SESSION_EVENT_LIST_COLUMNS, ...lazyColumns.map(c => LAZY_SESSION_EVENT_COLUMNS[c])].join(',');
        const params = { ...criteria, join: 'instance', column };
        return this.http.get<any[]>(`${localStorage.getItem('server')}/jquery/session/event`, {params}).pipe(
            map(rows => rows.map(row => ({ ...row, instant: row.instant / 1000 })))
        );
    }

    getSessionEventTypeCount(params: any): Observable<{count: number, type: string}[]> {
        return this.http.get<{count: number, type: string}[]>(`${localStorage.getItem('server')}/jquery/session/event`, {params: params});
    }

    getMainSessionType(idSession: string): Observable<MainSessionType> {
        return this.http.get<MainSessionType>(`${this.server}/session/main/${idSession}`);
    }

}
