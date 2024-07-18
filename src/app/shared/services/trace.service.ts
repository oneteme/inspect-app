import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, throwError } from "rxjs";
import { DatabaseRequest, DatabaseRequestStage, InstanceEnvironment, InstanceMainSession, InstanceRestSession, LocalRequest, RestRequest, RestSession } from "../model/v3/trace.model";

@Injectable({ providedIn: 'root' })
export class TraceService { 
    readonly INCOMING_REQUEST_URL = `${localStorage.getItem('server')}/v3/trace/session/rest`;
    readonly MAIN_REQUEST_URL = `${localStorage.getItem('server')}/v3/trace/session/main`;

    constructor(private http: HttpClient) {
    }

    getRestSessions(params: any): Observable<Array<InstanceRestSession>> {
        return this.http.get<Array<InstanceRestSession>>(`${localStorage.getItem('server')}/v3/trace/session/rest`, { params: params });
    }

    getRestSession(id: string) {
        return this.http.get(`${localStorage.getItem('server')}/v3/trace/session/rest/${id}`);
    }

    getMainSessions(params: any): Observable<Array<InstanceMainSession>> {
        return this.http.get<Array<InstanceMainSession>>(`${localStorage.getItem('server')}/v3/trace/session/main`, { params: params });
    }

    getMainSession(id: string) {
        return this.http.get(`${localStorage.getItem('server')}/v3/trace/session/main/${id}`);
    }

    getTree(id: string, type: string) {
        return type == "api" ? this.http.get(`${localStorage.getItem('server')}/v3/trace/session/rest/${id}/tree`) :
            this.http.get(`${localStorage.getItem('server')}/v3/trace/session/main/${id}/tree`);
    }

    getSessionParentByChildId(id: string): Observable<{ id: string, type: string }> {
        return this.http.get<{ id: string, type: string }>(`${localStorage.getItem('server')}/v3/trace/session/rest/${id}/parent`)
    }

    getRestRequests(id: string): Observable<Array<RestRequest>> {
        return this.http.get<Array<RestRequest>>(`${localStorage.getItem('server')}/v3/trace/session/${id}/request/rest`);
    }

    getDatabaseRequests(idSession: string): Observable<Array<DatabaseRequest>>;
    getDatabaseRequests(idSession: string, idDatabase: number): Observable<DatabaseRequest>;
    getDatabaseRequests<T>(idSession: string, idDatabase?: number): Observable<T> {
        if(idDatabase)         
            return this.http.get<T>(`${localStorage.getItem('server')}/v3/trace/session/${idSession}/request/database/${idDatabase}`);
        return this.http.get<T>(`${localStorage.getItem('server')}/v3/trace/session/${idSession}/request/database`);
    }

    getDatabaseRequestStages(idSession: string, idDatabase: number): Observable<Array<DatabaseRequestStage>> {
        return this.http.get<Array<DatabaseRequestStage>>(`${localStorage.getItem('server')}/v3/trace/session/${idSession}/request/database/${idDatabase}/stage`);
    };

    getLocalRequests(id: string): Observable<Array<LocalRequest>> {
        return this.http.get<Array<LocalRequest>>(`${localStorage.getItem('server')}/v3/trace/session/${id}/request/local`);
    }

    getInstance(id: string): Observable<InstanceEnvironment> {
        return this.http.get<InstanceEnvironment>(`${localStorage.getItem('server')}/v3/trace/instance/${id}`);
    }
}