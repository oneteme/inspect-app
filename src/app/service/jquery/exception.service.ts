import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class ExceptionService {
    constructor(private http: HttpClient) {

    }

    getException<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/exception`;
        return this.http.get<T>(url, { params: params });
    }
}
