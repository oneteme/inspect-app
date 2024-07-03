export interface InstanceRestSession extends RestSession {
    instanceId: string;
    instanceUser: string;
    appName: string;
    mask: number;
}

export interface InstanceMainSession extends MainSession {
    instanceId: string;
    instanceUser: string;
    appName: string;
    mask: number;
}

export interface RestSession extends RestRequest {
    name: string;
    requests: Array<RestRequest>;
    queries: Array<DatabaseRequest>;
    stages: Array<RunnableStage>;
    ftpRequests: Array<FtpRequest>;
    mailRequests: Array<MailRequest>;
    userAgent: string;
}

export interface MainSession extends RunnableStage {
    id: string;
    type: string;
    requests: Array<DatabaseRequest>;
    queries: Array<DatabaseRequest>;
    stages: Array<RunnableStage>;
    ftpRequests: Array<FtpRequest>;
    mailRequests: Array<MailRequest>;
}

export interface RestRequest extends SessionStage {
    id: string;
    method: string;
    protocol: string;
    host: string;
    port: number;
    path: string;
    query: string;
    contentType: string;
    authScheme: string;
    status: number;
    inDataSize: number;
    outDataSize: number;
    exception: ExceptionInfo;
    inContentEncoding: string;
    outContentEncoding: string; 
}

export interface DatabaseRequest {
    host: string;
    port: number;
    database: string;
    driverVersion: string;
    databaseName: string;
    databaseVersion: string;
    actions: Array<DatabaseRequestStage>;
    commands: Array<string>;
}

export interface FtpRequest {
    protocol: string;
    host: string;
    port: number;
    serverVersion: string;
    clientVersion: string;
    actions: Array<FtpRequestStage>;
}

export interface MailRequest {
    host: string;
    port: number;
    actions: Array<MailRequestStage>;
    mails: Array<Mail>;
}

export interface RunnableStage extends SessionStage {
    name: string;
    location: string;
    exception: ExceptionInfo;
}

export interface DatabaseRequestStage extends RequestStage {
    count: Array<number>;
}

export interface FtpRequestStage extends RequestStage {
    args: Array<string>;
}

export interface MailRequestStage extends RequestStage {

}

export interface Mail {
    subject: string;
    contentType: string;
    from: Array<string>;
    recipients: Array<string>;
    replyTo: Array<string>;
    size: number;
}

export interface RequestStage {
    name: string;
    start: Date;
    end: Date;
    exception: ExceptionInfo;
}

export interface SessionStage {
    user: string;
    start: Date;
    end: Date;
    threadName: string;
}

export interface ExceptionInfo {
    type: string;
    message: string;
}