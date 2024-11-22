import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable({ providedIn: 'root' })
export class JQueryService { 
    constructor(private http: HttpClient) {

    }

    getJqueryData(endpoint:string, params: any) {
        let url = `${localStorage.getItem('server')}/jquery/${endpoint}`;
        return this.http.get(url, { params: params });
    }
}