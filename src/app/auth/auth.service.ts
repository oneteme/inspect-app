
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import {
    authCodeFlowConfig,
    resolvedAuth
} from './auth-code-flow.config';
import {
    initDebug,
    isImplicitId
} from '../model/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private initialized = false;
    private initPromise?: Promise<void>;
    private loginStarted = false;

    returnUrl?: string;

    constructor(
        private oauthService: OAuthService,
        private router: Router
    ) { }

    init(): Promise<void> {

        initDebug(resolvedAuth);

        if (!resolvedAuth.enabled) {
            this.initialized = true;
            return Promise.resolve();
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.oauthService.configure(authCodeFlowConfig);

        this.initPromise = this.oauthService
            .loadDiscoveryDocumentAndTryLogin()
            .then((receivedTokens) => {
                this.initialized = true;
                this.loginStarted = false;

                if (receivedTokens && this.isLogged()) {
                    this.returnUrl = this.oauthService.state || undefined;
                }
            })
            .catch((error) => {
                this.initPromise = undefined;
                throw error;
            });

        return this.initPromise;
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    login(returnUrl = this.router.url): void {
        if (this.loginStarted) {
            return;
        }

        this.loginStarted = true;
        this.oauthService.initLoginFlow(returnUrl || '/');
    }

    logout(): void {
        this.oauthService.logOut({
            post_logout_redirect_uri: authCodeFlowConfig.logoutUrl
        });
    }

    isLogged(): boolean {
        return isImplicitId(resolvedAuth)
            ? this.oauthService.hasValidIdToken()
            : this.oauthService.hasValidAccessToken();
    }

    getToken(): string {
        return isImplicitId(resolvedAuth)
            ? this.oauthService.getIdToken()
            : this.oauthService.getAccessToken();
    }

    getAccessToken(): string {
        return this.oauthService.getAccessToken();
    }

    getIdToken(): string {
        return this.oauthService.getIdToken();
    }

    getUserProfile() {
        return this.oauthService.getIdentityClaims();
    }
}
