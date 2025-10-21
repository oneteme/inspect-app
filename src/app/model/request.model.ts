import {
  DatabaseRequest,
  DirectoryRequest, ExceptionInfo,
  FtpRequest, LocalRequest, LogEntry,
  MailRequest,
  MainSession,
  RestRequest,
  RestSession, UserAction
} from "./trace.model";

export interface RestSessionDto extends RestSession {
  appName: string;
}

export interface MainSessionDto extends MainSession {
  appName: string;
}

export interface RestRequestDto extends RestRequest {
  exception: ExceptionInfo;
}

export interface MailRequestDto extends MailRequest {
  exception: ExceptionInfo;
}

export interface FtpRequestDto extends FtpRequest {
  exception: ExceptionInfo;
}

export interface DirectoryRequestDto extends DirectoryRequest {
  exception: ExceptionInfo;
}

export interface DatabaseRequestDto extends DatabaseRequest {
  exception: ExceptionInfo;
}

export interface AnalyticDto extends MainSession {
  userActions: Array<UserAction>;
}

export interface MainSessionView extends MainSession {
  restRequests?: RestRequestDto[];
  databaseRequests?: DatabaseRequestDto[];
  ftpRequests?: FtpRequestDto[];
  mailRequests?: MailRequestDto[];
  ldapRequests?: DirectoryRequestDto[];
  localRequests?: LocalRequest[];
  userActions?: UserAction[];
  logEntries?: LogEntry[];
}

export interface RestSessionView extends RestSession {
  restRequests?: RestRequestDto[];
  databaseRequests?: DatabaseRequestDto[];
  ftpRequests?: FtpRequestDto[];
  mailRequests?: MailRequestDto[];
  ldapRequests?: DirectoryRequestDto[];
  localRequests?: LocalRequest[];
  logEntries?: LogEntry[];
}

export enum RequestType {
  REST = 'rest',
  JDBC = 'jdbc',
  FTP = 'ftp',
  SMTP = 'smtp',
  LDAP = 'ldap'
}