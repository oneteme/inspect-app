export interface Request {
    id: string;
    user: string;
    start: number;
    end: number;
    threadName: string;
    application: ApplicationInfo;
    exception: ExceptionInfo;
    requests: OutcomingRequest[];
    queries: OutcomingQuery[];
    stages: RunnableStage[];
}

export interface RestRequest extends Request {
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
}

export interface MainRequest extends Request {
    name: string;
    launchMode: string;
    location: string;
}

export interface IncomingRequest extends RestRequest {
    name: string;
}

export interface OutcomingRequest extends RestRequest {

}

export interface ApplicationInfo {
    name: string;
    version: string;
    address: string;
    env: string;
    os: string;
    re: string;
}

export interface OutcomingQuery {
    host: string;
    port: number;
    scheme: string;
    start: Date;
    end: Date;
    user: string;
    threadName: string;
    driverVersion: string;
    databaseName: string;
    databaseVersion: string;
    completed: boolean;
    actions: DatabaseAction[]
}

export interface DatabaseAction {
    type: string;
    start: Date;
    end: Date;
    exception: ExceptionInfo;
    count: number;
}

export interface ExceptionInfo {
    classname: string;
    message: string;
}

export interface RunnableStage {
    name: string;
    location: string;
    start: number;
    end: number;
    user: string;
    threadName: string;
    exception: ExceptionInfo;
}


