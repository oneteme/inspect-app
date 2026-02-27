import { Injectable } from '@angular/core';
import { OAuthService} from 'angular-oauth2-oidc';
import {authCodeFlowConfig} from "./auth-code-flow.config";
import {auth} from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AuthService {

    private initialized = false;


    constructor(private oauthService: OAuthService) {}


    async init(): Promise<void> {

        if(auth.enabled){
            if (this.initialized) {
                return;
            }

            this.oauthService.configure(authCodeFlowConfig);
            this.oauthService.setupAutomaticSilentRefresh();

            await this.oauthService.loadDiscoveryDocument();
            await this.oauthService.tryLoginCodeFlow();

            this.initialized = true;
        }

    }

    login() {
        if (!this.oauthService.hasValidAccessToken()) {
            this.oauthService.initLoginFlow();
        }
    }

    logout() {
        this.oauthService.logOut();
    }

    isLogged(): boolean {
        return this.oauthService.hasValidAccessToken();
    }

    getAccessToken(): string {
        return this.oauthService.getAccessToken();
    }

    getUserProfile() {
        return this.oauthService.getIdentityClaims();
    }
}
