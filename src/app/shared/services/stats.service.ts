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

    getSessionRest(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/session/rest`;
        return this.http.get(url, { params: params });
    }

    getSessionMain(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/session/main`;
        return this.http.get(url, { params: params });
    }

    getInstance(params: any) {
        let url = `${localStorage.getItem('server')}/jquery/instance`;
        return this.http.get(url, { params: params });
    }
}