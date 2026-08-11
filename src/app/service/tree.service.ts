import { HttpClient } from "@angular/common/http";
import {Injectable} from "@angular/core";
import { Observable } from "rxjs";
import {Architecture} from "../views/architecture/architecture.view";

@Injectable({ providedIn: 'root' })
/**
 * Provides API calls used to build architecture and request-volume trees.
 */
export class TreeService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http:HttpClient){

    }

    /**
     * Retrieves SMTP request stage counts for the provided filter criteria.
     *
     * @param ids Query parameters sent to the backend.
     * @returns An observable containing aggregated SMTP stage counts.
     */
    getSmtpRequestCount(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/smtp/stages/count`, {params: ids})
    }

    /**
     * Retrieves JDBC request stage counts for the provided filter criteria.
     *
     * @param ids Query parameters sent to the backend.
     * @returns An observable containing aggregated JDBC stage counts.
     */
    getJdbcRequestCount(ids:any): Observable<{}> {
        return this.http.get(`${this.server}/session/request/database/stages/count`, {params: ids})
    }

    /**
     * Loads architecture relationships for one environment within a time range.
     *
     * @param start Inclusive start date of the analysis window.
     * @param end Exclusive end date of the analysis window.
     * @param env Environment identifier used to scope the data.
     * @returns An observable of architecture nodes and links.
     */
    getArchitecture(start: Date, end: Date, env: string): Observable<Architecture[]> {
        return this.http.get<Architecture[]>(`${this.server}/architecture`, {params: {start: start.toISOString(), end: end.toISOString(), env: env}});
    }
}
