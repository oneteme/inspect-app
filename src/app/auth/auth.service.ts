import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authCodeFlowConfig } from "./auth-code-flow.config";
import { auth } from "../../environments/environment";
import { Router } from '@angular/router';
import { isImplicitId } from '../model/auth.model';

@Injectable({ providedIn: 'root' })
/**
 * Centralizes OAuth authentication lifecycle and token access helpers.
 */
export class AuthService {

    private initialized = false;

    constructor(private oauthService: OAuthService, private router: Router) { }


    /**
     * Initializes OAuth configuration and attempts silent login once.
     *
     * @returns A promise resolved when initialization/login checks complete.
     */
    init(): Promise<void> {
        if (!auth.enabled || this.initialized) {
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

    /**
     * Indicates whether the authentication service has already been initialized.
     *
     * @returns `true` when init was successfully executed, otherwise `false`.
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Starts the OAuth login flow and preserves the current hash route as state.
     *
     */
    login() {
        const hash = window.location.hash;
        this.oauthService.initLoginFlow(hash ? hash.slice(1) : "/");
    }

    /**
     * Logs the current user out and redirects to the configured post-logout URL.
     *
     */
    logout() {
        this.oauthService.logOut({
            post_logout_redirect_uri: authCodeFlowConfig.logoutUrl
        });
    }

    /**
     * Checks whether the current session has a valid OAuth token.
     *
     * @returns `true` when a valid token is present for the active auth flow.
     */
    isLogged(): boolean {
        return !isImplicitId(auth) ? this.oauthService.hasValidAccessToken() : this.oauthService.hasValidIdToken();
    }

    /**
     * Returns the primary token depending on the configured OAuth flow.
     *
     * @returns Access token or ID token string.
     */
    getToken(): string {
        return !isImplicitId(auth) ? this.oauthService.getAccessToken() : this.oauthService.getIdToken();
    }

    /**
     * Returns the access token, with a fallback to the primary token when needed.
     *
     * @returns OAuth access token string.
     */
    getAccessToken(): string {
        return this.oauthService.getAccessToken() ?? this.getToken();
    }

    /**
     * Returns the ID token, with a fallback to the primary token when needed.
     *
     * @returns OAuth ID token string.
     */
    getIdToken(): string {
        return this.oauthService.getIdToken() ?? this.getToken();
    }

    /**
     * Returns decoded identity claims exposed by the OAuth library.
     *
     * @returns User profile claims object for the authenticated user.
     */
    getUserProfile() {
        return this.oauthService.getIdentityClaims();
    }

}
