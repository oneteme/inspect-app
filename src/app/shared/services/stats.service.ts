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

    getSessionApi(params: any) {
        let url = `${localStorage.getItem('server')}/stat/apisession`;
        return this.http.get(url, { params: params });
    }

    getSessionMain(params: any) {
        let url = `${localStorage.getItem('server')}/stat/mainsession`;
        return this.http.get(url, { params: params });
    }

    getInstance(params: any) {
        let url = `${localStorage.getItem('server')}/stat/instance`;
        return this.http.get(url, { params: params });
    }
}