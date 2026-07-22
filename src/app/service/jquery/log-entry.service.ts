import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class LogEntryService {
  constructor(private http: HttpClient) {

  }

  getLogEntry<T>(params: any): Observable<T> {
    let url = `${localStorage.getItem('server')}/jquery/log/entry`;
    return this.http.get<T>(url, { params: params });
  }
}
