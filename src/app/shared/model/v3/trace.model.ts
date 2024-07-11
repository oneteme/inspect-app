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
    stages: Array<LocalRequest>;
    ftpRequests: Array<FtpRequest>;
    mailRequests: Array<MailRequest>;
    ldapRequests: Array<NamingRequest>;
    userAgent: string;
}

export interface MainSession extends LocalRequest {
    id: string;
    type: string;
    requests: Array<DatabaseRequest>;
    queries: Array<DatabaseRequest>;
    stages: Array<LocalRequest>;
    ftpRequests: Array<FtpRequest>;
    mailRequests: Array<MailRequest>;
    ldapRequests: Array<NamingRequest>;
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

export interface DatabaseRequest extends SessionStage {
    host: string;
    port: number;
    name: string;
    schema: string;
    driverVersion: string;
    productName: string;
    productVersion: string;
    actions: Array<DatabaseRequestStage>;
    commands: Array<string>;
    
    idRequest: number;
    completed: boolean;
}

export interface FtpRequest extends SessionStage {
    protocol: string;
    host: string;
    port: number;
    serverVersion: string;
    clientVersion: string;
    actions: Array<FtpRequestStage>;
}

export interface MailRequest extends SessionStage {
    host: string;
    port: number;
    actions: Array<MailRequestStage>;
    mails: Array<Mail>;
}

export interface LocalRequest extends SessionStage {
    name: string;
    location: string;
    exception: ExceptionInfo;
}

export interface NamingRequest extends SessionStage {
    protocol: string;
    host: string;
    port: number;
    actions: Array<NamingRequestStage>;
}

export interface DatabaseRequestStage extends RequestStage {
    count?: Array<number>;
}

export interface FtpRequestStage extends RequestStage {
    args: Array<string>;
}

export interface MailRequestStage extends RequestStage {

}

export interface NamingRequestStage extends RequestStage {
    args: Array<string>;
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

export interface Session {
    id: string;
    
}

export interface ExceptionInfo {
    type: string;
    message: string;
}

export interface InstanceEnvironment {
    name: string;
    version: string;
    address: string;
    env: string;
    os: string;
    re: string;
    user: string;
    type: string;
    instant: Date;
    collector: string;
}