export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export interface AiChatRequest {
  message: string;
  sessionId?: string;
  page?: AssistantPage;
  id?: string;
}

export enum AssistantPage {
  DASHBOARD = 'DASHBOARD',
  REQUEST_SEARCH = 'REQUEST_SEARCH',
  REQUEST_DETAIL = 'REQUEST_DETAIL',
  REQUEST_COMPARE = 'REQUEST_COMPARE',
  SESSION_SEARCH = 'SESSION_SEARCH',
  SESSION_DETAIL_VIEW = 'SESSION_DETAIL_VIEW',
  SESSION_DETAIL_REST = 'SESSION_DETAIL_REST',
  SESSION_TREE = 'SESSION_TREE',
  SESSION_COMPARE = 'SESSION_COMPARE',
  INSTANCE = 'INSTANCE',
  ANALYTIC = 'ANALYTIC',
  ARCHITECTURE = 'ARCHITECTURE',
  SERVER_SUPERVISION = 'SERVER_SUPERVISION',
  CLIENT_SUPERVISION = 'CLIENT_SUPERVISION',
  REQUEST_KPI = 'REQUEST_KPI',
  SESSION_KPI = 'SESSION_KPI',
  UNKNOWN = 'UNKNOWN'
}

export interface AssistantChatContext {
  page: AssistantPage;
  id?: string;
}

export interface AiChatResponse {
  response: string;
  sessionId?: string;
}
