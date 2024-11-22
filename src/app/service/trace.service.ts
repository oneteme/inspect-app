import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {
    DatabaseRequest,
    DatabaseRequestStage,
    ExceptionInfo,
    FtpRequest,
    FtpRequestStage,
    InstanceEnvironment,
    InstanceMainSession,
    InstanceRestSession,
    LocalRequest,
    Mail,
    MailRequest,
    MailRequestStage,
    NamingRequest,
    NamingRequestStage,
    RestRequest
} from "../model/trace.model";

@Injectable({ providedIn: 'root' })
export class TraceService {

    server = `${localStorage.getItem('server')}/v3/trace`;

    constructor(private http: HttpClient) {
    }

    getRestSessions(params: any): Observable<Array<InstanceRestSession>> {
        return this.http.get<Array<InstanceRestSession>>(`${this.server}/session/rest`, { params: params });
    }

    getRestSession(id: string): Observable<InstanceRestSession> {
        return this.http.get<InstanceRestSession>(`${this.server}/session/rest/${id}`);
    }

    getMainSessions(params: any): Observable<Array<InstanceMainSession>> {
        return this.http.get<Array<InstanceMainSession>>(`${this.server}/session/main`, { params: params });
    }

    getMainSession(id: string): Observable<InstanceMainSession> {
        return this.http.get<InstanceMainSession>(`${this.server}/session/main/${id}`);
    }

    getTree(id: string, type: string) {
        return type == "rest" ? this.http.get(`${this.server}/session/rest/${id}/tree`) :
            this.http.get(`${this.server}/session/main/${id}/tree`);
    }

    getSessionParent(id: string): Observable<{ id: string, type: string }> {
        return this.http.get<{ id: string, type: string }>(`${this.server}/session/rest/${id}/parent`)
    }

    getRestRequests(id: string): Observable<Array<RestRequest>> {
        return this.http.get<Array<RestRequest>>(`${this.server}/session/${id}/request/rest`);
    }

    getDatabaseRequests(idSession: string): Observable<Array<DatabaseRequest>>;
    getDatabaseRequests(idSession: string, idDatabase: number): Observable<DatabaseRequest>;
    getDatabaseRequests<T>(idSession: string, idDatabase?: number): Observable<T> {
        if(idDatabase)         
            return this.http.get<T>(`${this.server}/session/${idSession}/request/database/${idDatabase}`);
        return this.http.get<T>(`${this.server}/session/${idSession}/request/database`);
    }

    getDatabaseRequestStages(idSession: string, idDatabase: number): Observable<Array<DatabaseRequestStage>> {
        return this.http.get<Array<DatabaseRequestStage>>(`${this.server}/session/${idSession}/request/database/${idDatabase}/stage`);
    };

    getFtpRequests(idSession: string): Observable<Array<FtpRequest>>;
    getFtpRequests(idSession: string, idFtp: number): Observable<FtpRequest>;
    getFtpRequests<T>(idSession: string, idFtp?: number): Observable<T> {
        if(idFtp)
            return this.http.get<T>(`${this.server}/session/${idSession}/request/ftp/${idFtp}`);
        return this.http.get<T>(`${this.server}/session/${idSession}/request/ftp`);
    }

    getFtpRequestStages(idSession: string, idFtp: number): Observable<Array<FtpRequestStage>> {
        return this.http.get<Array<FtpRequestStage>>(`${this.server}/session/${idSession}/request/ftp/${idFtp}/stage`);
    };

    getSmtpRequests(idSession: string): Observable<Array<MailRequest>>;
    getSmtpRequests(idSession: string, idSmtp: number): Observable<MailRequest>;
    getSmtpRequests<T>(idSession: string, idSmtp?: number): Observable<T> {
        if(idSmtp)
            return this.http.get<T>(`${this.server}/session/${idSession}/request/smtp/${idSmtp}`);
        return this.http.get<T>(`${this.server}/session/${idSession}/request/smtp`);
    }

    getSmtpRequestStages(idSession: string, idSmtp: number): Observable<Array<MailRequestStage>> {
        return this.http.get<Array<MailRequestStage>>(`${this.server}/session/${idSession}/request/smtp/${idSmtp}/stage`);
    };

    getSmtpRequestMails(idSession: string, idSmtp: number): Observable<Array<Mail>> {
        return this.http.get<Array<Mail>>(`${this.server}/session/${idSession}/request/smtp/${idSmtp}/mail`);
    };

    getLdapRequests(idSession: string): Observable<Array<NamingRequest>>;
    getLdapRequests(idSession: string, idLdap: number): Observable<NamingRequest>;
    getLdapRequests<T>(idSession: string, idLdap?: number): Observable<T> {
        if(idLdap)
            return this.http.get<T>(`${this.server}/session/${idSession}/request/ldap/${idLdap}`);
        return this.http.get<T>(`${this.server}/session/${idSession}/request/ldap`);
    }

    getLdapRequestStages(idSession: string, idLdap: number): Observable<Array<NamingRequestStage>> {
        return this.http.get<Array<NamingRequestStage>>(`${this.server}/session/${idSession}/request/ldap/${idLdap}/stage`);
    };

    getLocalRequests(id: string): Observable<Array<LocalRequest>> {
        return this.http.get<Array<LocalRequest>>(`${this.server}/session/${id}/request/local`);
    }

    getInstance(id: string): Observable<InstanceEnvironment> {
        return this.http.get<InstanceEnvironment>(`${this.server}/instance/${id}`);
    }
}