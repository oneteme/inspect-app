import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  AiChatRequest,
  AiChatResponse,
  AssistantChatContext,
  AssistantPage
} from './assistant-chat.models';

@Injectable({ providedIn: 'root' })
export class AssistantChatService {
  private readonly endpoint = '/api/ai/chat';

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  sendMessage(request: Omit<AiChatRequest, 'context'>): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(this.endpoint, {
      ...request,
      context: this.getCurrentContext()
    });
  }

  private getCurrentContext(): AssistantChatContext {
    const segments = this.router.parseUrl(this.router.url)
      .root.children['primary']?.segments.map(segment => segment.path) ?? [];
    const id = this.getCurrentId();

    return {
      page: this.getPage(segments, !!id),
      ...(id ? { id } : {})
    };
  }

  private getPage(segments: string[], hasId: boolean): AssistantPage {
    const [root, section] = segments;

    if (root === 'request') {
      if (segments.includes('compare')) return AssistantPage.REQUEST_COMPARE;
      return this.getCurrentId() ? AssistantPage.REQUEST_DETAIL : AssistantPage.REQUEST_SEARCH;
    }
    if (root === 'session') {
      if (segments.includes('tree')) return AssistantPage.SESSION_TREE;
      if (segments.includes('compare')) return AssistantPage.SESSION_COMPARE;
      return hasId ? AssistantPage.SESSION_DETAIL : AssistantPage.SESSION_SEARCH;
    }
    if (root === 'instance') return AssistantPage.INSTANCE;
    if (root === 'analytic') return AssistantPage.ANALYTIC;
    if (root === 'home') return AssistantPage.DASHBOARD;
    if (root === 'architecture') return AssistantPage.ARCHITECTURE;
    if (root === 'supervision' && section === 'server') return AssistantPage.SERVER_SUPERVISION;
    if (root === 'supervision' && section === 'client') return AssistantPage.CLIENT_SUPERVISION;
    if (root === 'kpi' && section === 'request') return AssistantPage.REQUEST_KPI;
    if (root === 'kpi' && section === 'session') return AssistantPage.SESSION_KPI;
    return AssistantPage.UNKNOWN;
  }

  private getCurrentId(): string | undefined {
    const idParams = ['id_request', 'id_session', 'id_instance', 'instance'];
    let route = this.router.routerState.snapshot.root;

    while (route) {
      for (const param of idParams) {
        const value = route.paramMap.get(param);
        if (value) return value;
      }

      if (!route.firstChild) break;
      route = route.firstChild;
    }

    return undefined;
  }
}
