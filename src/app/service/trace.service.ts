import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {
    DatabaseRequestDto,
    DirectoryRequestDto,
    FtpRequestDto,
    MailRequestDto,
    MainSessionDto,
    RestRequestDto,
    RestSessionDto
} from "../model/request.model";
import {
    DatabaseRequest, DatabaseRequestStage,
    DirectoryRequest,
    DirectoryRequestStage,
    FtpRequest,
    FtpRequestStage,
    InstanceEnvironment,
    LocalRequest, Mail,
    MailRequest, MailRequestStage,
    MainSession,
    RestSession
} from "../model/trace.model";

@Injectable({ providedIn: 'root' })
export class TraceService {

    server = `${localStorage.getItem('server')}/v3/query`;

    constructor(private http: HttpClient) {
    }

    getRestSessions(params: any): Observable<Array<RestSessionDto>> {
        return this.http.get<Array<RestSessionDto>>(`${this.server}/session/rest`, { params: params });
    }

    getRestSessionsForDump(env: string, appName: string, start: Date, end: Date): Observable<Array<RestSession>> {
        let params: any = {
            'env': env,
            'start': start.toISOString(),
            'end': end.toISOString()
        }
        return this.http.get<Array<RestSession>>(`${this.server}/session/rest/${appName}/dump`, { params: params });
    }

    getRestSession(id: string): Observable<RestSession> {
        return this.http.get<RestSession>(`${this.server}/session/rest/${id}`);
    }

    getMainSessions(params: any): Observable<Array<MainSessionDto>> {
        return this.http.get<Array<MainSessionDto>>(`${this.server}/session/main`, { params: params });
    }

    getMainSessionsForDump(env: string, appName: string, start: Date, end: Date): Observable<Array<MainSession>> {
        let params: any = {
            'env': env,
            'start': start.toISOString(),
            'end': end.toISOString()
        }
        return this.http.get<Array<MainSession>>(`${this.server}/session/main/${appName}/dump`, { params: params });
    }

    getMainSession(id: string): Observable<MainSession> {
        return this.http.get<MainSession>(`${this.server}/session/main/${id}`);
    }

    getTree(id: string, type: string) {
        return type == "rest" ? this.http.get(`${this.server}/session/rest/${id}/tree`) :
            this.http.get(`${this.server}/session/main/${id}/tree`);
    }

    getSessionParent(type: string, id: string): Observable<{ id: string, type: string }> {
        return this.http.get<{ id: string, type: string }>(`${this.server}/${type}/${id}/parent`);
    }

    getRestRequests(idSession: string): Observable<RestRequestDto[]> {
        return this.http.get<RestRequestDto[]>(`${this.server}/session/${idSession}/request/rest`);
    }

    getRestRequest(idRest: string): Observable<RestRequestDto> {
        return this.http.get<RestRequestDto>(`${this.server}/request/rest/${idRest}`);
    }

    getDatabaseRequests(idSession: string): Observable<DatabaseRequestDto[]> {
        return this.http.get<DatabaseRequestDto[]>(`${this.server}/session/${idSession}/request/database`);
    }

    getDatabaseRequest(idDatabase: string): Observable<DatabaseRequest> {
        return this.http.get<DatabaseRequest>(`${this.server}/request/database/${idDatabase}`);
    }

    getDatabaseRequestStages(idDatabase: string): Observable<DatabaseRequestStage[]> {
        return this.http.get<DatabaseRequestStage[]>(`${this.server}/request/database/${idDatabase}/stage`);
    };

    getFtpRequests(idSession: string): Observable<FtpRequestDto[]> {
        return this.http.get<FtpRequestDto[]>(`${this.server}/session/${idSession}/request/ftp`);
    }

    getFtpRequest(idFtp: string): Observable<FtpRequest> {
        return this.http.get<FtpRequest>(`${this.server}/request/ftp/${idFtp}`);
    }

    getFtpRequestStages(idFtp: string): Observable<FtpRequestStage[]> {
        return this.http.get<Array<FtpRequestStage>>(`${this.server}/request/ftp/${idFtp}/stage`);
    };

    getSmtpRequests(idSession: string): Observable<MailRequestDto[]> {
        return this.http.get<MailRequestDto[]>(`${this.server}/session/${idSession}/request/smtp`);
    }

    getSmtpRequest(idSmtp: string): Observable<MailRequest> {
        return this.http.get<MailRequest>(`${this.server}/request/smtp/${idSmtp}`);
    }

    getSmtpRequestStages(idSmtp: string): Observable<MailRequestStage[]> {
        return this.http.get<MailRequestStage[]>(`${this.server}/request/smtp/${idSmtp}/stage`);
    };

    getSmtpRequestMails(idSmtp: string): Observable<Mail[]> {
        return this.http.get<Mail[]>(`${this.server}/request/smtp/${idSmtp}/mail`);
    };

    getLdapRequests(idSession: string): Observable<DirectoryRequestDto[]> {
        return this.http.get<DirectoryRequestDto[]>(`${this.server}/session/${idSession}/request/ldap`);
    }

    getLdapRequest(idLdap: string): Observable<DirectoryRequest> {
        return this.http.get<DirectoryRequest>(`${this.server}/request/ldap/${idLdap}`);
    }

    getLdapRequestStages(idLdap: string): Observable<DirectoryRequestStage[]> {
        return this.http.get<DirectoryRequestStage[]>(`${this.server}/request/ldap/${idLdap}/stage`);
    };

    getLocalRequests(id: string): Observable<Array<LocalRequest>> {
        return this.http.get<Array<LocalRequest>>(`${this.server}/session/${id}/request/local`);
    }

    getInstance(id: string): Observable<InstanceEnvironment> {
        return this.http.get<InstanceEnvironment>(`${this.server}/instance/${id}`);
    }
}