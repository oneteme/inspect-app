import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class StatsService { 
    constructor(private http: HttpClient) {

    }

    getSessionByEndpoint(endpoint:string ,params: any) {
        let url = `${localStorage.getItem('server')}${endpoint}`;
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

    getDatabaseRequest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/request/database`;
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