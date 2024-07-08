import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, throwError } from "rxjs";
import { DatabaseRequest, InstanceEnvironment, InstanceRestSession, LocalRequest, RestRequest, RestSession } from "../model/v3/trace.model";

@Injectable({ providedIn: 'root' })
export class TraceService { 
    readonly INCOMING_REQUEST_URL = `${localStorage.getItem('server')}/v3/trace/session/rest`;
    readonly MAIN_REQUEST_URL = `${localStorage.getItem('server')}/v3/trace/session/main`;

    constructor(private http: HttpClient) {
    }

    getIncomingRequestByCriteria(params: any) {
        return this.http.get(this.INCOMING_REQUEST_URL, { params: params });
    }

    getIncomingRequestById(id: string) {
        return this.http.get(`${this.INCOMING_REQUEST_URL}/${id}`);
    }

    getMainRequestByCriteria(params: any) {
        return this.http.get(this.MAIN_REQUEST_URL, { params: params });
    }

    getMainRequestById(id: string) {
        return this.http.get(`${this.MAIN_REQUEST_URL}/${id}`);
    }

    getTreeRequestById(id: string) {
        return this.http.get(`${localStorage.getItem('server')}/trace/session/${id}/tree`);
    }

    getDbRequestById(id: number){
        return this.http.get(`${localStorage.getItem('server')}/trace/session/db/${id}`);
    }

    getSessionParentByChildId(id: string){
        return this.http.get(`${localStorage.getItem('server')}/trace/session/rest/${id}/parent`).pipe(catchError(this.handleError))
    }

    getRestRequests(id: string): Observable<Array<RestRequest>> {
        return this.http.get<Array<RestRequest>>(`${localStorage.getItem('server')}/v3/trace/session/${id}/request/rest`);
    }

    getDatabaseRequests(id: string): Observable<Array<DatabaseRequest>> {
        return this.http.get<Array<DatabaseRequest>>(`${localStorage.getItem('server')}/v3/trace/session/${id}/request/database`);
    }

    getLocalRequests(id: string): Observable<Array<LocalRequest>> {
        return this.http.get<Array<LocalRequest>>(`${localStorage.getItem('server')}/v3/trace/session/${id}/request/local`);
    }

    getInstance(id: string): Observable<InstanceEnvironment> {
        return this.http.get<InstanceEnvironment>(`${localStorage.getItem('server')}/v3/trace/instance/${id}`);
    }

    private handleError( error: HttpErrorResponse){
        return throwError(()=>error)
    }
}