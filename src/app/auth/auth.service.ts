import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from "./auth-code-flow.config";
import { auth } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AuthService {

    public initialized = false;
    private isCodeFlow = authCodeFlowConfig.responseType == "code";
    private isImplicitFlow = authCodeFlowConfig.responseType != "code";

    constructor(private oauthService: OAuthService) { }


    async init(): Promise<void> {

        if (auth.enabled) {
            console.log("auth init")
            if (this.initialized) {
                return;
            }
            this.oauthService.configure(authCodeFlowConfig);
            await this.oauthService.loadDiscoveryDocumentAndTryLogin();
            console.log("token id : ", this.oauthService.getIdToken())
            console.log("token access : ", this.oauthService.getAccessToken())
            this.initialized = true;
        }
    }

    login() {
        this.oauthService.initLoginFlow();
    }

    logout() {
        this.oauthService.logOut();
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
