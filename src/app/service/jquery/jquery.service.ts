import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {BrowserConfigDto} from "../../model/trace.model";

@Injectable({ providedIn: 'root' })
export class JQueryService { 
    constructor(private http: HttpClient) {

    }

    getJqueryData(endpoint:string, params: any) {
        let url = `${localStorage.getItem('server')}/jquery/${endpoint}`;
        return this.http.get(url, { params: params });
    }

    getBrowserConfig(params?: any): Observable<BrowserConfigDto[]> {
        let url = `${localStorage.getItem('server')}/jquery/instance/browser`;
        return this.http.get<BrowserConfigDto[]>(url, { params: params });
    }
}