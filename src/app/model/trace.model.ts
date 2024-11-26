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

export interface RestRequest extends SessionStage<number> {
    idRequest?: number;
    id: string; //TODO
    method: string;
    protocol: string;
    host: string;
    port: number;
    path: string;
    query: string;
    contentType: string;
    authScheme: string;
    inDataSize: number;
    outDataSize: number;
    exception: ExceptionInfo;
    inContentEncoding: string;
    outContentEncoding: string;
    remoteTrace: ServerRestSession;
}

export interface DatabaseRequest extends SessionStage<boolean> {
    host: string;
    port: number;
    name: string;
    schema: string;
    driverVersion: string;
    productName: string;
    productVersion: string;
    actions: Array<DatabaseRequestStage>;
    commands: Array<string>;
    count?: number;
    id: number;
}

export interface FtpRequest extends SessionStage<boolean> {
    id: number;
    protocol: string;
    host: string;
    port: number;
    serverVersion: string;
    clientVersion: string;
    actions: Array<FtpRequestStage>;
    commands?: string[]; //non
    exception?: ExceptionInfo;
}

export interface MailRequest extends SessionStage<boolean> {
    id: number;
    host: string;
    port: number;
    actions: Array<MailRequestStage>;
    mails: Array<Mail>;
    commands?: string[]; //non
    count: number;
    exception?: ExceptionInfo;
}

export interface LocalRequest extends SessionStage<boolean> {
    name: string;
    location: string;
    exception: ExceptionInfo;
}

export interface NamingRequest extends SessionStage<boolean> {
    id: number;
    protocol: string;
    host: string;
    port: number;
    actions: Array<NamingRequestStage>;
    commands?: string[];
    exception?: ExceptionInfo;
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

export interface SessionStage<T> {
    user: string;
    start: number;
    end: number;
    threadName: string;
    status: T
    exception?: ExceptionInfo
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

export interface ServerRestSession extends RestSession {
    instanceId: string;
    version: string;
    os: string;
    re: string;
    address: string;
    appName: string;
    mask: number
}

export interface Node<T> {
    formatNode(field: T): string;
}

export interface Link<T> {
    formatLink(field: T): string;
    getLinkStyle(): string;
}
// link node



export class RestServerNode implements Node<Label> {

    nodeObject: ServerRestSession;

    constructor(nodeObject: ServerRestSession) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.appName + " " /*+ this.nodeObject.version*/ //version
            case Label.OS_RE: return (this.nodeObject.os || "?") + " " + (this.nodeObject.re || '?');
            case Label.IP_PORT: return (this.nodeObject.address || "?") +  (this.nodeObject?.port < 0 ? '' : ":"+ this.nodeObject?.port.toString())
            case Label.BRANCH_COMMIT: return "" // soon
            default: return '';
        }
    }
}

export class MainServerNode implements Node<Label> {

    nodeObject: ServerMainSession;
    constructor(nodeObject: ServerMainSession) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.appName || '?'/*+ this.nodeObject.version*/ //version
            case Label.OS_RE: return (this.nodeObject.os || "?") + " " + (this.nodeObject.re || '?');
            case Label.IP_PORT: return (this.nodeObject.address || "?")
            case Label.BRANCH_COMMIT: return "?"  // soon
            default: return '?';
        }
    }

}

export class LinkRequestNode implements Link<Label> {
    nodeObject: ServerRestSession

    constructor(nodeObject: ServerRestSession) {
        this.nodeObject = nodeObject;
    }
    getLinkStyle(): string {
        switch(true){
            case (this.nodeObject.status >= 200 && this.nodeObject.status < 300): return "SUCCES";
            case (this.nodeObject.status >= 400 && this.nodeObject.status < 500):  return "CLIENT_ERROR"
            case (this.nodeObject.status >=500):  return "SERVER_ERROR";
            case (this.nodeObject.status == 0):   return "UNREACHABLE"
        }   
    }

    formatLink(field: Label): string {
        switch (field) {
            case Label.ELAPSED_LATENSE: return `${(this.nodeObject.end - this.nodeObject.start).toFixed(3)}s`;
            case Label.METHOD_RESOURCE: return `${this.nodeObject.method || "?"} ${this.nodeObject.path || "?"}`
            case Label.SIZE_COMPRESSION: return `${this.nodeObject.inDataSize < 0 ? 0 : sizeFormatter(this.nodeObject.inDataSize) } ↓↑ ${this.nodeObject.outDataSize < 0 ? 0 : sizeFormatter(this.nodeObject.outDataSize) }`
            case Label.PROTOCOL_SCHEME: return `${this.nodeObject.protocol || "?"}/${this.nodeObject.authScheme || "?"}`
            case Label.STATUS_EXCEPTION: return this.nodeObject.status.toString() +(this.nodeObject.exception && ': ' + this.nodeObject.exception?.type || '');
            case Label.USER: return `${this.nodeObject.user ?? "?"}`
            default: return '?';
        }
    }
}

export class JdbcRequestNode implements Node<Label>, Link<Label> {
    nodeObject: DatabaseRequest;
    constructor(nodeObject: DatabaseRequest) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.schema || this.nodeObject.name || '?'/*+ this.nodeObject.version*/ //version
            case Label.OS_RE: return this.nodeObject.productName || '?';
            case Label.IP_PORT: return (this.nodeObject.name || '?') + (this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '') 
            case Label.BRANCH_COMMIT: return "?" // soon
            default: return '?';
        }
    }

    formatLink(field: Label): string {
        switch (field) {
            case Label.ELAPSED_LATENSE: return `${(this.nodeObject.end - this.nodeObject.start).toFixed(3)}s`
            case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, 'SQL ')// todo: with sql add schema
            case Label.SIZE_COMPRESSION: return this.nodeObject?.count < 0 ? '0': this.nodeObject?.count!= undefined? this.nodeObject?.count.toString() : '?'; // remove undefined condition 
            case Label.PROTOCOL_SCHEME: return "JDBC/Basic"
            case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'FAIL:' + this.nodeObject.exception?.type || 'OK'
            case Label.USER: return `${this.nodeObject.user || '?'}`;
            default: return '?';
        }
    }

    getLinkStyle(): string {
        return this.nodeObject.status ? 'SUCCES' : 'FAILURE'
    }
}

export class FtpRequestNode implements Node<Label>, Link<Label> {

    nodeObject: FtpRequest;
    constructor(nodeObject: FtpRequest) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.host || '?'; //version
            case Label.IP_PORT: return (this.nodeObject.host || '?') + (this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '') 
            case Label.BRANCH_COMMIT: return "?"  // soon
            default: return '?';
        }
    }

    formatLink(field: Label): string {
        switch (field) {
            case Label.ELAPSED_LATENSE: return `${(this.nodeObject.end - this.nodeObject.start).toFixed(3)}s`
            case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, "SCRIPT")
            case Label.SIZE_COMPRESSION: return "?"
            case Label.PROTOCOL_SCHEME: return this.nodeObject.protocol + '/Basic'
            case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'FAIL:' + this.nodeObject.exception?.type || 'OK'
            case Label.USER: return `${this.nodeObject.user || '?'}`;
            default: return '?';
        }
    }

    getLinkStyle(): string {
        return this.nodeObject.status ? 'SUCCES' : 'FAILURE'
    }
}

export class MailRequestNode implements Node<Label>, Link<Label> {

    nodeObject: MailRequest;
    constructor(nodeObject: MailRequest) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.host || '?' //version
            case Label.IP_PORT: return (this.nodeObject.host || '?') + (this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '') 
            case Label.BRANCH_COMMIT: return "?" // soon
            default: return '?';
        }
    }

    formatLink(field: Label): string {
        switch (field) {
            case Label.ELAPSED_LATENSE: return `${(this.nodeObject.end - this.nodeObject.start).toFixed(3)}s`
            case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, "SCRIPT")
            case Label.SIZE_COMPRESSION: return this.nodeObject?.count < 0 ? '0': this.nodeObject?.count!= undefined? this.nodeObject?.count.toString() : '?';
            case Label.PROTOCOL_SCHEME: return "SMTP/Basic"
            case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'FAIL:' + this.nodeObject.exception?.type || 'OK'
            case Label.USER: return `${this.nodeObject.user || '?'}`;
            default: return '?';
        }
    }

    getLinkStyle(): string {
        return this.nodeObject.status ? 'SUCCES' : 'FAILURE'
    }
}

export class LdapRequestNode implements Node<Label>, Link<Label> {

    nodeObject: NamingRequest;
    constructor(nodeObject: NamingRequest) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.host || '?'/*+ this.nodeObject.version*/ //version
            case Label.IP_PORT: return (this.nodeObject.host || '?') +(this.nodeObject?.port != -1 ?   ":"+ this.nodeObject?.port.toString() : '') 
            case Label.BRANCH_COMMIT: return "?"  // soon
            default: return '?';
        }
    }

    formatLink(field: Label): string {
        switch (field) {
            case Label.ELAPSED_LATENSE: return `${(this.nodeObject.end - this.nodeObject.start).toFixed(3)}s`
            case Label.METHOD_RESOURCE: return getCommand(this.nodeObject?.commands, "SCRIPT") || '?'
            case Label.SIZE_COMPRESSION: return "?"
            case Label.PROTOCOL_SCHEME: return this.nodeObject.protocol ?? "LDAP/Basic" // wait for fix backend
            case Label.STATUS_EXCEPTION: return this.nodeObject.exception && 'FAIL:' + this.nodeObject.exception?.type || 'OK'
            case Label.USER: return `${this.nodeObject.user || '?'}`;
            default: return '?';
        }
    }

    getLinkStyle(): string {
        return this.nodeObject.status ? 'SUCCES' : 'FAILURE'
    }
}

export class RestRequestNode implements Node<Label> {

    nodeObject: RestRequest;
    constructor(nodeObject: RestRequest) {
        this.nodeObject = nodeObject;
    }

    formatNode(field: Label): string {
        switch (field) {
            case Label.SERVER_IDENTITY: return this.nodeObject.host || '?' //version
            case Label.IP_PORT: return this.nodeObject?.port < 0 ? '' : this.nodeObject?.port.toString()
            case Label.BRANCH_COMMIT: return "?" // soon
            default: return '?';
        }
    }

    formatLink(field: Label): string {
        switch (field) {
            case Label.ELAPSED_LATENSE: {
                var e1 = this.nodeObject.end - this.nodeObject.start;
                let e2 = 0;
                if (this.nodeObject.remoteTrace) {
                    e2 = e1 - (this.nodeObject.remoteTrace.end - this.nodeObject.remoteTrace.start)
                }
                return `${e1.toFixed(3)}s` + (e2 >= 1 ? `~${e2.toFixed(3)}s` : '');
            }
            case Label.METHOD_RESOURCE: return `${this.nodeObject.method || "?"} ${this.nodeObject.path || "?"}`
            case Label.SIZE_COMPRESSION: return `${this.nodeObject.inDataSize < 0 ? 0 : sizeFormatter(this.nodeObject.inDataSize) } ↓↑ ${this.nodeObject.outDataSize < 0 ? 0 :sizeFormatter(this.nodeObject.outDataSize) }`
            case Label.PROTOCOL_SCHEME: return `${this.nodeObject.protocol || "?"}/${this.nodeObject.authScheme || "?"}`
            case Label.STATUS_EXCEPTION: return this.nodeObject.status.toString()+ (this.nodeObject?.remoteTrace?.exception && ': ' + this.nodeObject?.remoteTrace?.exception?.type || '');
            case Label.USER: return `${this.nodeObject.remoteTrace?.user ?? "?"}`
            default: return '?';
        }
    }

    getLinkStyle(): string {
        switch(true){
            case (this.nodeObject.status >= 200 && this.nodeObject.status < 300): return "SUCCES";
            case (this.nodeObject.status > 400 && this.nodeObject.status < 500):  return "CLIENT_ERROR"
            case (this.nodeObject.status >=500):  return "SERVER_ERROR";
            case (this.nodeObject.status == 0):   return "UNREACHABLE"
        }   
    }
}



export enum Label {
    SERVER_IDENTITY = "SERVER_IDENTITY",
    OS_RE = "OS_RE",
    IP_PORT = "IP_PORT",
    BRANCH_COMMIT = "BRANCH_COMMIT",
    ELAPSED_LATENSE = "ELAPSED_LATENSE",
    METHOD_RESOURCE = "METHOD_RESOURCE",
    SIZE_COMPRESSION = "SIZE_COMPRESSION",
    PROTOCOL_SCHEME = "PROTOCOL_SCHEME",
    STATUS_EXCEPTION = "STATUS_EXCEPTION",
    USER = "USER"
}




function getCommand<T>(arr: T[], multiple: string) {
    if (arr) {
        let r = arr.reduce((acc: any, item: any) => {
            if (!acc[item]) {
                acc[item] = 0
            }
            return acc;
        }, {});
        return Object.keys(r).length == 1
            ? Object.keys(r)[0]
            : multiple;
    }
    return '?';
}

function sizeFormatter(value:any){
    if(!value && value!= 0) return '';
    if(value < 1024){
        return `${value}o`;
    }
    const units= ['ko','Mo' ];
    let size = value / 1024;
    let ui = 0;

    while( size>= 1024 && ui < units.length -1){
        size /= 1024;
        ui++;
    }

    return `${size.toFixed(2)} ${units[ui]}`;
}