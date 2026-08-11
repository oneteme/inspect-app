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
  DatabaseRequest,
  DatabaseRequestStage,
  DirectoryRequest,
  DirectoryRequestStage,
  FtpRequest,
  FtpRequestStage,
  HttpRequestStage,
  HttpSessionStage,
  InstanceEnvironment,
  LocalRequest,
  LogEntry,
  Mail,
  MailRequest,
  MailRequestStage,
  MainSession,
  RestRequest,
  RestSession
} from "../model/trace.model";

@Injectable({providedIn: 'root'})
/**
 * Provides typed access to trace, session, request and stage endpoints.
 */
export class TraceService {

  server = `${localStorage.getItem('server')}/v3/query`;

  constructor(private http: HttpClient) {
  }

  /**
   * Retrieves REST sessions matching the provided query parameters.
   *
   * @param params Backend filter map.
   * @returns Observable list of REST session DTOs.
   */
  getRestSessions(params: any): Observable<Array<RestSessionDto>> {
    return this.http.get<Array<RestSessionDto>>(`${this.server}/session/rest`, {params: params});
  }

  /**
   * Retrieves REST sessions overlapping a period for one instance.
   *
   * @param id Instance identifier.
   * @param instanceStart Instance start date used as lower bound.
   * @param start Requested period start.
   * @param end Requested period end.
   * @returns Observable list of matching REST sessions.
   */
  getRestSessionsByInstance(id: string, instanceStart: Date, start: Date, end: Date): Observable<RestSession[]> {
    let params: any = {
      'start.ge': instanceStart.toISOString(),
      'start.le': end.toISOString(),
    }
    params['end.isNull.or(end.ge(' + start.toISOString() + '))'] = '';
    return this.http.get<RestSession[]>(`${this.server}/instance/${id}/session/rest`, {params: params});
  }

  /**
   * Retrieves main sessions overlapping a period for one instance.
   *
   * @param id Instance identifier.
   * @param instanceStart Instance start date used as lower bound.
   * @param start Requested period start.
   * @param end Requested period end.
   * @returns Observable list of matching main sessions.
   */
  getMainSessionsByInstance(id: string, instanceStart: Date, start: Date, end: Date): Observable<MainSession[]> {
    let params: any = {
      'start.ge': instanceStart.toISOString(),
      'start.le': end.toISOString(),
    }
    params['end.isNull.or(end.ge(' + start.toISOString() + '))'] = '';
    return this.http.get<MainSession[]>(`${this.server}/instance/${id}/session/main`, {params: params});
  }

  /**
   * Retrieves one REST session by its identifier.
   *
   * @param id REST session identifier.
   * @returns Observable containing the session details.
   */
  getRestSession(id: string): Observable<RestSession> {
    return this.http.get<RestSession>(`${this.server}/session/rest/${id}`);
  }

  /**
   * Retrieves main sessions matching the provided query parameters.
   *
   * @param params Backend filter map.
   * @returns Observable list of main session DTOs.
   */
  getMainSessions(params: any): Observable<Array<MainSessionDto>> {
    return this.http.get<Array<MainSessionDto>>(`${this.server}/session/main`, {params: params});
  }

  /**
   * Retrieves one main session by its identifier.
   *
   * @param id Main session identifier.
   * @returns Observable containing the session details.
   */
  getMainSession(id: string): Observable<MainSession> {
    return this.http.get<MainSession>(`${this.server}/session/main/${id}`);
  }

  /**
   * Loads the call tree for a REST or MAIN session.
   *
   * @param id Session identifier.
   * @param type Session type (`rest` or `main`).
   * @returns Observable tree payload returned by the backend.
   */
  getTree(id: string, type: string) {
    return type == "rest" ? this.http.get(`${this.server}/session/rest/${id}/tree`) :
      this.http.get(`${this.server}/session/main/${id}/tree`);
  }

  /**
   * Retrieves comparison data for a REST request.
   *
   * @param id REST request identifier.
   * @returns Observable comparison payload.
   */
  getCompare(id: string ){
    return this.http.get(`${this.server}/request/rest/${id}/compare`);
  }

  /**
   * Resolves the parent session/request of an entity.
   *
   * @param type Entity type segment used in the endpoint.
   * @param id Entity identifier.
   * @returns Observable containing parent id and type.
   */
  getSessionParent(type: string, id: string): Observable<{ id: string, type: string }> {
    return this.http.get<{ id: string, type: string }>(`${this.server}/${type}/${id}/parent`);
  }

  /**
   * Retrieves REST requests attached to a session.
   *
   * @param idSession Session identifier.
   * @returns Observable list of REST request DTOs.
   */
  getRestRequests(idSession: string): Observable<RestRequestDto[]> {
    return this.http.get<RestRequestDto[]>(`${this.server}/session/${idSession}/request/rest`);
  }

  /**
   * Retrieves one REST request by id.
   *
   * @param idRest REST request identifier.
   * @returns Observable request details.
   */
  getRestRequest(idRest: string): Observable<RestRequest> {
    return this.http.get<RestRequest>(`${this.server}/request/rest/${idRest}`);
  }

  /**
   * Retrieves stage timeline for one REST session.
   *
   * @param idSession Session identifier.
   * @returns Observable list of REST session stages.
   */
  getRestSessionStages(idSession: string): Observable<HttpSessionStage[]> {
    return this.http.get<HttpSessionStage[]>(`${this.server}/session/rest/${idSession}/stage`);
  }

  /**
   * Retrieves stage timeline for one REST request.
   *
   * @param idRest Request identifier.
   * @returns Observable list of REST request stages.
   */
  getRestRequestStages(idRest: string): Observable<HttpRequestStage[]> {
    return this.http.get<HttpRequestStage[]>(`${this.server}/request/rest/${idRest}/stage`);
  }

  /**
   * Retrieves JDBC requests attached to a session.
   *
   * @param idSession Session identifier.
   * @returns Observable list of database request DTOs.
   */
  getDatabaseRequests(idSession: string): Observable<DatabaseRequestDto[]> {
    return this.http.get<DatabaseRequestDto[]>(`${this.server}/session/${idSession}/request/database`);
  }

  /**
   * Retrieves one JDBC request by id.
   *
   * @param idDatabase Database request identifier.
   * @returns Observable database request details.
   */
  getDatabaseRequest(idDatabase: string): Observable<DatabaseRequest> {
    return this.http.get<DatabaseRequest>(`${this.server}/request/database/${idDatabase}`);
  }

  /**
   * Retrieves stage timeline for one JDBC request.
   *
   * @param idDatabase Database request identifier.
   * @returns Observable list of JDBC request stages.
   */
  getDatabaseRequestStages(idDatabase: string): Observable<DatabaseRequestStage[]> {
    return this.http.get<DatabaseRequestStage[]>(`${this.server}/request/database/${idDatabase}/stage`);
  };

  /**
   * Retrieves FTP requests attached to a session.
   *
   * @param idSession Session identifier.
   * @returns Observable list of FTP request DTOs.
   */
  getFtpRequests(idSession: string): Observable<FtpRequestDto[]> {
    return this.http.get<FtpRequestDto[]>(`${this.server}/session/${idSession}/request/ftp`);
  }

  /**
   * Retrieves one FTP request by id.
   *
   * @param idFtp FTP request identifier.
   * @returns Observable FTP request details.
   */
  getFtpRequest(idFtp: string): Observable<FtpRequest> {
    return this.http.get<FtpRequest>(`${this.server}/request/ftp/${idFtp}`);
  }

  /**
   * Retrieves stage timeline for one FTP request.
   *
   * @param idFtp FTP request identifier.
   * @returns Observable list of FTP request stages.
   */
  getFtpRequestStages(idFtp: string): Observable<FtpRequestStage[]> {
    return this.http.get<Array<FtpRequestStage>>(`${this.server}/request/ftp/${idFtp}/stage`);
  };

  /**
   * Retrieves SMTP requests attached to a session.
   *
   * @param idSession Session identifier.
   * @returns Observable list of SMTP request DTOs.
   */
  getSmtpRequests(idSession: string): Observable<MailRequestDto[]> {
    return this.http.get<MailRequestDto[]>(`${this.server}/session/${idSession}/request/smtp`);
  }

  /**
   * Retrieves one SMTP request by id.
   *
   * @param idSmtp SMTP request identifier.
   * @returns Observable SMTP request details.
   */
  getSmtpRequest(idSmtp: string): Observable<MailRequest> {
    return this.http.get<MailRequest>(`${this.server}/request/smtp/${idSmtp}`);
  }

  /**
   * Retrieves stage timeline for one SMTP request.
   *
   * @param idSmtp SMTP request identifier.
   * @returns Observable list of SMTP request stages.
   */
  getSmtpRequestStages(idSmtp: string): Observable<MailRequestStage[]> {
    return this.http.get<MailRequestStage[]>(`${this.server}/request/smtp/${idSmtp}/stage`);
  };

  /**
   * Retrieves mails attached to one SMTP request.
   *
   * @param idSmtp SMTP request identifier.
   * @returns Observable list of transmitted mails.
   */
  getSmtpRequestMails(idSmtp: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(`${this.server}/request/smtp/${idSmtp}/mail`);
  };

  /**
   * Retrieves LDAP requests attached to a session.
   *
   * @param idSession Session identifier.
   * @returns Observable list of LDAP request DTOs.
   */
  getLdapRequests(idSession: string): Observable<DirectoryRequestDto[]> {
    return this.http.get<DirectoryRequestDto[]>(`${this.server}/session/${idSession}/request/ldap`);
  }

  /**
   * Retrieves one LDAP request by id.
   *
   * @param idLdap LDAP request identifier.
   * @returns Observable LDAP request details.
   */
  getLdapRequest(idLdap: string): Observable<DirectoryRequest> {
    return this.http.get<DirectoryRequest>(`${this.server}/request/ldap/${idLdap}`);
  }

  /**
   * Retrieves stage timeline for one LDAP request.
   *
   * @param idLdap LDAP request identifier.
   * @returns Observable list of LDAP request stages.
   */
  getLdapRequestStages(idLdap: string): Observable<DirectoryRequestStage[]> {
    return this.http.get<DirectoryRequestStage[]>(`${this.server}/request/ldap/${idLdap}/stage`);
  };

  /**
   * Retrieves local requests attached to a session.
   *
   * @param id Session identifier.
   * @returns Observable list of local request entries.
   */
  getLocalRequests(id: string): Observable<Array<LocalRequest>> {
    return this.http.get<Array<LocalRequest>>(`${this.server}/session/${id}/request/local`);
  }

  /**
   * Retrieves one instance environment by id.
   *
   * @param id Instance identifier.
   * @returns Observable containing instance metadata.
   */
  getInstance(id: string): Observable<InstanceEnvironment> {
    return this.http.get<InstanceEnvironment>(`${this.server}/instance/${id}`);
  }

  /**
   * Retrieves root log entries for one instance within a period.
   *
   * @param instanceId Instance identifier.
   * @param start Inclusive start date.
   * @param end Exclusive end date.
   * @returns Observable list of top-level log entries.
   */
  getLogEntryByPeriod(instanceId: string, start: Date, end: Date): Observable<LogEntry[]> {
    let params: any = {
      'start.ge': start.toISOString(),
      'start.lt': end.toISOString(),
      'parent.isNull': ''
    };
    return this.http.get<LogEntry[]>(`${this.server}/instance/${instanceId}/log/entry`, {params: params});
  }

  /**
   * Retrieves log entries linked to a specific session.
   *
   * @param sessionId Session identifier.
   * @returns Observable list of log entries.
   */
  getLogEntryBySession(sessionId): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(`${this.server}/session/${sessionId}/log/entry`);
  }
}
