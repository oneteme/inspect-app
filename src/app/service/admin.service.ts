import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({providedIn: 'root'})
export class AdminService {
  server = `${localStorage.getItem('server')}/admin`;

  constructor(private http: HttpClient) {
  }

  addNamespace(namespace: string, password: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.server}/namespace/${namespace}`, {password: password});
  }
}
