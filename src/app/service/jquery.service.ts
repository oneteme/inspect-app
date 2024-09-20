import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class JQueryService { 
    constructor(private http: HttpClient) {

    }

    getJqueryData(endpoint:string, params: any) {
        let url = `${localStorage.getItem('server')}/jquery/${endpoint}`;
        return this.http.get(url, { params: params });
    }

    getRestSession(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/session/rest`;
        return this.http.get(url, { params: params });
    }

    getMainSession(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get(url, { params: params });
    }

    getRestRequest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/request/rest`;
        return this.http.get(url, { params: params });
    }

    getDatabaseRequest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
        return this.http.get(url, { params: params });
    }

    getFtpRequest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/request/ftp`;
        return this.http.get(url, { params: params });
    }

    getSmtpRequest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/request/smtp`;
        return this.http.get(url, { params: params });
    }

    getLdapRequest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/request/ldap`;
        return this.http.get(url, { params: params });
    }

    getException(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/exception`;
        return this.http.get(url, { params: params });
    }

    getInstance(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/instance`;
        return this.http.get(url, { params: params });
    }
}