import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: 'root' })
export class TraceService { 
    readonly INCOMING_REQUEST_URL = `${localStorage.getItem('server')}/trace/session/api`;
    readonly MAIN_REQUEST_URL = `${localStorage.getItem('server')}/trace/session/main`;

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
        return this.http.get(`${localStorage.getItem('server')}/trace/session/api/${id}/tree`);
    }

    getDbRequestById(id: number){
        return this.http.get(`${localStorage.getItem('server')}/trace/db/${id}`);
    }

    getSessionParentByChildId(id: string){
        return this.http.get(`${localStorage.getItem('server')}/trace/session/api/${id}/parent`).pipe(catchError(this.handleError))
    }

    private handleError( error: HttpErrorResponse){
        return throwError(()=>error)
    }
}