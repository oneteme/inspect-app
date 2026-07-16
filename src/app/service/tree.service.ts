import { HttpClient } from "@angular/common/http";
import {Injectable} from "@angular/core";
import { Observable } from "rxjs";
import {Architecture} from "../views/architecture/architecture.view";

@Injectable({ providedIn: 'root' })
export class TreeService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http:HttpClient){

    }

    getSmtpRequestCount(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/smtp/stages/count`, {params: ids})
    }

    getJdbcRequestCount(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/database/stages/count`, {params: ids})
    }

    getArchitecture(start: Date, end: Date, env: string): Observable<Architecture[]> {
        return this.http.get<Architecture[]>(`${this.server}/architecture`, {params: {start: start.toISOString(), end: end.toISOString(), env: env}});
    }
}
