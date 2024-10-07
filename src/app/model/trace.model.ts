export interface InstanceRestSession extends RestSession {
    instanceId: string;
    appName: string;
    mask: number;
}

export interface InstanceMainSession extends MainSession {
    instanceId: string;
    appName: string;
    mask: number;
}

export interface RestSession extends RestRequest {
    type: string;
    name: string;
    restRequests: Array<RestRequest>;
    databaseRequests: Array<DatabaseRequest>;
    stages: Array<LocalRequest>;
    ftpRequests: Array<FtpRequest>;
    mailRequests: Array<MailRequest>;
    ldapRequests: Array<NamingRequest>;
    userAgent: string;
}

export interface MainSession extends LocalRequest {
    id: string;
    type: string;
    restRequests: Array<RestRequest>;
    databaseRequests: Array<DatabaseRequest>;
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
    remoteTrace: ServerRestSession;
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
    id: number;
    completed: boolean;
}

export interface FtpRequest extends SessionStage {
    protocol: string;
    host: string;
    port: number;
    serverVersion: string;
    clientVersion: string;
    actions: Array<FtpRequestStage>;

    completed: boolean;
}

export interface MailRequest extends SessionStage {
    host: string;
    port: number;
    actions: Array<MailRequestStage>;
    mails: Array<Mail>;

    completed: boolean;
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

    completed: boolean;
}

export interface DatabaseRequestStage extends RequestStage {
    count?: Array<number>;
    order?: number;
}

export interface FtpRequestStage extends RequestStage {
    args: Array<string>;
    order?: number;
}

export interface MailRequestStage extends RequestStage {
    order?: number;
}

export interface NamingRequestStage extends RequestStage {
    args: Array<string>;
    order?: number;
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
    start: number;
    end: number;
    exception: ExceptionInfo;
}

export interface SessionStage {
    user: string;
    start: number;
    end: number;
    threadName: string;
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
    instant: number;
    collector: string;
}

export interface Period {
    start: number;
    end: number;
}

export interface ServerMainSession extends MainSession {
    instanceId: string;
    version: string;
    os: string;
    re: string;
    address: string; 
    appName: string;
    mask: number
}

export interface ServerRestSession extends RestSession{
    instanceId: string;
    version: string;
    os: string;
    re: string;
    address: string;
    appName: string;
    mask: number
    treeToString():string;
}

export interface Node<T> {
    format(field: T):string;
}

export class RestServerNode implements Node<Label> {
    
    nodeObject: ServerRestSession;
    
    constructor(nodeObject: ServerRestSession){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.appName + " " /*+ this.nodeObject.version*/ //version
            case Label.OS_RE: return this.nodeObject.os + " " + this.nodeObject.re;
            case Label.IP_PORT: return this.nodeObject.address + " " + this.nodeObject.port
            case Label.BRANCH_COMMIT: return "" // soon
            default: return '';
        }
    }
    
}

export class MainServerNode implements Node<Label> {
    
    nodeObject: ServerMainSession;
    constructor(nodeObject: ServerMainSession){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.appName + " " /*+ this.nodeObject.version*/ //version
            case Label.OS_RE: return this.nodeObject.os + " " + this.nodeObject.re;
            case Label.IP_PORT: return this.nodeObject.address;
            case Label.BRANCH_COMMIT: return "" // soon
            default: return 'N/A';
        }
    }
    
}
export class JdbcRequestNode implements Node<Label> {
    nodeObject: DatabaseRequest;
    constructor(nodeObject: DatabaseRequest){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.name + " " /*+ this.nodeObject.version*/ //version
            case Label.OS_RE: return this.nodeObject.productName;
            case Label.IP_PORT: return this.nodeObject.port.toString();
            case Label.BRANCH_COMMIT: return "" // soon
            default: return 'N/A';
        }
    }
}

export class FtpRequestNode implements Node<Label> {
    
    nodeObject: FtpRequest;
    constructor(nodeObject: FtpRequest){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.host; //version
            case Label.IP_PORT: return this.nodeObject.port.toString();
            case Label.BRANCH_COMMIT: return "" // soon
            default: return 'N/A';
        }
    }
    
}

export class SmtpRequestNode implements Node<Label> {
    
    nodeObject: MailRequest;
    constructor(nodeObject: MailRequest){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.host //version
            case Label.IP_PORT: return this.nodeObject.port.toString();
            case Label.BRANCH_COMMIT: return "" // soon
            default: return 'N/A';
        }
    }
    
}

export class LdapRequestNode implements Node<Label> {
    
    nodeObject: NamingRequest;
    constructor(nodeObject: NamingRequest){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.host + " " /*+ this.nodeObject.version*/ //version
            case Label.IP_PORT: return this.nodeObject.port.toString();
            case Label.BRANCH_COMMIT: return "" // soon
            default: return 'N/A';
        }
    }
    
}

export class RestRequestNode implements Node<Label> {
    
    nodeObject: RestRequest;
    constructor(nodeObject: RestRequest){
        this.nodeObject = nodeObject;
    }

    format(field: Label): string {
        switch(field){
            case Label.SERVER_IDENTITY : return  this.nodeObject.host //version
            case Label.IP_PORT: return this.nodeObject.port.toString();
            case Label.BRANCH_COMMIT: return "" // soon
            default: return 'N/A';
        }
    }
    
}

export enum Label {
    SERVER_IDENTITY = "SERVER_IDENTITY",
    OS_RE= "OS_RE",
    IP_PORT= "IP_PORT",
    BRANCH_COMMIT = "BRANCH_COMMIT"
}
