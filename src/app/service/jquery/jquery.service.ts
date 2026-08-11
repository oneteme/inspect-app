import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable({ providedIn: 'root' })
/**
 * Generic jQuery-query client used to target arbitrary backend endpoints.
 */
export class JQueryService { 
    constructor(private http: HttpClient) {

    }

    /**
     * Executes a jQuery backend request on the provided endpoint.
     *
     * @param endpoint Endpoint suffix appended after `/jquery/`.
     * @param params Query parameters sent to the backend.
     * @returns Observable containing the raw response payload.
     */
    getJqueryData(endpoint:string, params: any) {
        let url = `${localStorage.getItem('server')}/jquery/${endpoint}`;
        return this.http.get(url, { params: params });
    }
}