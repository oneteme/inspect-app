import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from "./auth-code-flow.config";
import { auth } from "../../environments/environment";
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {

    public initialized = false;
    private isCodeFlow = authCodeFlowConfig.responseType == "code";

    constructor(private oauthService: OAuthService, private router: Router) { }


    init(): Promise<void> {

        if (!auth.enabled || this.initialized) {
            return Promise.resolve();
        }
        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        authCodeFlowConfig.redirectUri = cleanUrl;
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
        if (hash) {
            this.oauthService.initLoginFlow(window.location.hash.slice(1));
        }
    }

    logout() {
        this.oauthService.logOut({
            post_logout_redirect_uri: auth.logOutRedirectUri
        });
    }

    isLogged(): boolean {
        return this.isCodeFlow ? this.oauthService.hasValidAccessToken() : this.oauthService.hasValidIdToken();
    }

    getToken(): string {
        return this.isCodeFlow ? this.oauthService.getAccessToken() : this.oauthService.getIdToken();
    }

    getUserProfile() {
        return this.oauthService.getIdentityClaims();
    }

}
