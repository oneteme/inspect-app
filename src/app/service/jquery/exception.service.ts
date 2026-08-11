import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
/**
 * Accesses exception records through the jQuery API.
 */
export class ExceptionService {
    constructor(private http: HttpClient) {

    }

    /**
     * Executes an exception query with typed response mapping.
     *
     * @param params Backend filter and projection parameters.
     * @returns Observable of the response typed with `T`.
     */
    getException<T>(params: any): Observable<T> {
        let url = `${localStorage.getItem('server')}/jquery/exception`;
        return this.http.get<T>(url, { params: params });
    }
}
