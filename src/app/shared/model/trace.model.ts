

export interface IncomingRequest {
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
    outDataSize:number;
    start:number;
    end:number;
    threadName:string;
    exception:ExceptionInfo
    name: string;
    user: string;
    application: applicationInfo;
    requests: OutcomingRequest[];
    queries: OutcomingQuery[];
    stages: RunnableStage[];
    type?:string;

}

export interface applicationInfo {
    name: string;
    version: string;
    address: string;
    env: string;
    os: string;
    re: string;
}

export interface OutcomingRequest {
    id: string;
    method: string;
    name?:string;
    protocol: string;
    host: string;
    port: number;
    path: string;
    query: string;
    contentType: string; 
    authScheme: string;
    status: number;
    inDataSize: number;
    outDataSize:number;
    start:Date;
    end:Date;
    threadName:string;
    exception:ExceptionInfo;
    requests?:OutcomingRequest[];
    queries?: OutcomingQuery[];
    stages?: RunnableStage[];
    type?:string;
    application?:applicationInfo
}

export interface OutcomingQuery{
    host:string;
    port:number;
    scheme:string;
    start:Date;
    end:Date;
    user:string;
    threadName:string;
    driverVersion:string;
    databaseName:string;
    databaseVersion:string;
    completed:boolean;
    actions:DatabaseAction[]
}

export interface DatabaseAction{
    type:string;
    start:Date;
    end:Date; 
    exception:ExceptionInfo;
}

export interface ExceptionInfo{
    classname:string;
    message:string;
}

export interface Mainrequest{
    id:string;
    name:string;
    user:string;
    start:Date;
    end:Date;
    launchMode:string;
    location:string;
    threadName:string;
    application:applicationInfo;
    exception:ExceptionInfo;
    requests:OutcomingRequest[];
    queries: OutcomingQuery[];
    stages: RunnableStage[];
    type?:string;

}

export interface RunnableStage { 
    name:string;
    location:string; 
    start:number;
    end:number;
    user:string;
    threadName:string;
    exception:ExceptionInfo;
}


