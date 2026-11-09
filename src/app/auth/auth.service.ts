import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig, resolvedAuth } from "./auth-code-flow.config";
import { Router } from '@angular/router';
import { initDebug, isImplicitId } from '../model/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {

    private initialized = false;

    constructor(private oauthService: OAuthService, private router: Router) { }


    init(): Promise<void> {
        initDebug(resolvedAuth);
        console.log("auth config : ", authCodeFlowConfig)
        console.log("resolved config : ", resolvedAuth)
        if (!resolvedAuth.enabled || this.initialized) {
            return Promise.resolve();
        }
        this.oauthService.configure(authCodeFlowConfig);
        return this.oauthService.loadDiscoveryDocumentAndTryLogin()
            .then(() => {
                this.initialized = true;
                if (this.isLogged()) {
                    const state = this.oauthService.state;
                    if (state) {
                        this.router.navigateByUrl(state);
                    }
                }
            });
    }

    isInitialized(): boolean {
        return this.initialized;
    }

    login() {
        const hash = window.location.hash;
        this.oauthService.initLoginFlow(hash ? hash.slice(1) : "/");
    }

    logout() {
        this.oauthService.logOut({
            post_logout_redirect_uri: authCodeFlowConfig.logoutUrl
        });
    }

    isLogged(): boolean {
        return !isImplicitId(resolvedAuth) ? this.oauthService.hasValidAccessToken() : this.oauthService.hasValidIdToken();
    }

    getToken(): string {
        return !isImplicitId(resolvedAuth) ? this.oauthService.getAccessToken() : this.oauthService.getIdToken();
    }

    getAccessToken(): string {
        return this.oauthService.getAccessToken() ?? this.getToken();
    }

    getIdToken(): string {
        return this.oauthService.getIdToken() ?? this.getToken();
    }

    getUserProfile() {
        return this.oauthService.getIdentityClaims();
    }

}
