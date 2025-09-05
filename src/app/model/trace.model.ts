
export interface MainSession extends AbstractSession, LocalRequest {

}

export interface RestSession extends AbstractSession, RestRequest {
  name: string;
  userAgent: string;
  cacheControl: string;
  exception: ExceptionInfo;
}

export interface RestRequest extends AbstractRequest {
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
  inContentEncoding: string;
  outContentEncoding: string;
  bodyContent: string;
}

export interface DatabaseRequest extends AbstractRequest {
  scheme: string;
  host: string;
  port: number;
  name: string;
  schema: string;
  driverVersion: string;
  productName: string;
  productVersion: string;
  command: string;
  failed: boolean;
}

export interface FtpRequest extends AbstractRequest {
  protocol: string;
  host: string;
  port: number;
  serverVersion: string;
  clientVersion: string;
  failed: boolean;
}

export interface MailRequest extends AbstractRequest {
  protocol: string;
  host: string;
  port: number;
  mails: Array<Mail>;
  failed: boolean;
}

export interface DirectoryRequest extends AbstractRequest {
  protocol: string;
  host: string;
  port: number;
  failed: boolean;
}

export interface LocalRequest extends AbstractRequest {
  name: string;
  type: string;
  location: string;
  exception: ExceptionInfo;
}

export interface DatabaseRequestStage extends AbstractStage {
  count: number[];
  commands: string[];
}

export interface DirectoryRequestStage extends AbstractStage {
  args: string[];
}

export interface FtpRequestStage extends AbstractStage {
  args: string[];
}

export interface HttpRequestStage extends AbstractStage {

}

export interface HttpSessionStage extends AbstractStage {

}

export interface MailRequestStage extends AbstractStage {

}

export interface Mail {
  subject: string;
  contentType: string;
  from: Array<string>;
  recipients: Array<string>;
  replyTo: Array<string>;
  size: number;
}

export interface UserAction {
  name: string;
  nodeName: string;
  type: string;
  start: Date;
}

export interface AbstractSession {
  requestsMask: number;
  instanceId: string;
}

export interface AbstractRequest {
  user: string;
  start: number;
  end: number;
  threadName: string;

  sessionId: string;
  instanceId: string;
  id: string;
}

export interface AbstractStage {
  name: string;
  start: number;
  end: number;
  exception: ExceptionInfo;

  order: number;
  requestId: string;
  instanceId: string;
}

export interface ExceptionInfo {
  type: string;
  message: string;
  stackTraceRows: StackTraceRow[];
  cause: ExceptionInfo;
}

export interface StackTraceRow {
  className: string;
  methodName: string;
  lineNumber: number;
}

export interface InstanceEnvironment {
  id: string;
  name: string;
  version: string;
  address: string;
  env: string;
  os: string;
  re: string;
  user: string;
  type: string;
  instant: number;
  end: number;
  branch: string;
  hash: string;
  collector: string;
  resource: MachineResource;
  configuration: InspectCollectorConfiguration;
}

export interface InspectCollectorConfiguration {
  scheduling: SchedulingProperties;
  tracing: TracingProperties;
}

export interface MachineResource {
  minHeap: number;
  maxHeap: number;
  minMeta: number;
  maxMeta: number;
  diskTotalSpace: number;
}

export interface SchedulingProperties {
  interval: number;
}

export interface TracingProperties {
  queueCapacity: number;
}

export interface LogEntry {
  instant: number;
  level: string;
  message: string;
  stackRows: StackTraceRow[];
}