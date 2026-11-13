import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {DatabaseInfo} from "../model/database.model";

@Injectable({providedIn: 'root'})
export class AdminService {
  server = `${localStorage.getItem('server')}/admin`;

  constructor(private http: HttpClient) {
  }

  addNamespace(namespace: string, password: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.server}/namespace/${namespace}`, {password: password});
  }

  getDatabaseInfo(params?: any): Observable<DatabaseInfo[]> {
    return this.http.get<DatabaseInfo[]>(`${this.server}/database`, { params: params });
  }
}
