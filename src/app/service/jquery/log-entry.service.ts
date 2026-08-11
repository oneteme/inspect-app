import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
/**
 * Accesses log entry records through the jQuery API.
 */
export class LogEntryService {
  constructor(private http: HttpClient) {

  }

  /**
   * Executes a log entry query with typed response mapping.
   *
   * @param params Backend filter and projection parameters.
   * @returns Observable of the response typed with `T`.
   */
  getLogEntry<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/log/entry`;
    return this.http.get<T>(url, { params: params });
  }
}
