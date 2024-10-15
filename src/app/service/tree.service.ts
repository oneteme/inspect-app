
import { HttpClient } from "@angular/common/http";
import {Injectable} from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class TreeService {

    server = `${localStorage.getItem('server')}/v3/trace`;
    constructor(private http:HttpClient){

    }

    getFtpRequestStage(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/ftp/stages`, {params: ids})
    }

    getMailRequestStage(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/smtp/stages`, {params: ids})
    }

    getLdapRequestStage(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/ldap/stages`, {params: ids})
    }

    getSmtpRequestCount(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/smtp/stages/count`, {params: ids})
    }

    getJdbcRequestCount(ids:any): Observable<{}> { 
        return this.http.get(`${this.server}/session/request/database/stages/count`, {params: ids})
    }

    getJdbcExceptions(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/database/exception`, {params: ids})
    }

    getFtpExceptions(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/ftp/exception`, {params: ids})
    }

    getSmtpExceptions(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/smtp/exception`, {params: ids})
    }

    getLdapExceptions(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/ldap/exception`, {params: ids})
    }

    getRestExceptions(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/rest/exception`, {params: ids})
    }

}
