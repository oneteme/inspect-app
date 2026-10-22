import {
  DatabaseRequest,
  DirectoryRequest, ExceptionInfo,
  FtpRequest, HttpSessionStage, LocalRequest, LogEntry,
  MailRequest,
  MainSession,
  RestRequest,
  RestSession, SessionEvent
} from "./trace.model";

export interface RestSessionDto extends RestSession {
  appName: string;
}

export interface MainSessionDto extends MainSession {
  appName: string;
  address: string;
  status: number;
}

export interface RestRequestDto extends RestRequest {

}

export interface MailRequestDto extends MailRequest {

}

export interface FtpRequestDto extends FtpRequest {

}

export interface DirectoryRequestDto extends DirectoryRequest {

}

export interface DatabaseRequestDto extends DatabaseRequest {

}

export interface AnalyticDto extends MainSession {
  sessionEvents?: Array<SessionEvent>;
}

export interface MainSessionView extends MainSession {
  exceptions?: ExceptionInfo[];
  restRequests?: RestRequestDto[];
  databaseRequests?: DatabaseRequestDto[];
  ftpRequests?: FtpRequestDto[];
  mailRequests?: MailRequestDto[];
  ldapRequests?: DirectoryRequestDto[];
  localRequests?: LocalRequest[];
  sessionEvents?: SessionEvent[];
  logEntries?: LogEntry[];
  httpSessionStages?: HttpSessionStage[];
}

export interface RestSessionView extends RestSession {
  exceptions?: ExceptionInfo[];
  restRequests?: RestRequestDto[];
  databaseRequests?: DatabaseRequestDto[];
  ftpRequests?: FtpRequestDto[];
  mailRequests?: MailRequestDto[];
  ldapRequests?: DirectoryRequestDto[];
  localRequests?: LocalRequest[];
  sessionEvents?: SessionEvent[];
  httpSessionStages?: HttpSessionStage[];
  logEntries?: LogEntry[];
}

export enum RequestType {
  REST = 'rest',
  JDBC = 'jdbc',
  FTP = 'ftp',
  SMTP = 'smtp',
  LDAP = 'ldap'
}
