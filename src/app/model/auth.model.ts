import { AuthConfig } from "angular-oauth2-oidc";

export interface AuthParams {
    authFlow: authFlow,
    authIssuer: string,
    clientId: string,
    clientSecret: string,
    redirectUri?: string,
    logOutRedirectUri?: string,
    scope?: string,
    enabled?: boolean,
    debug?: boolean,

    /**
* Defines whether to request an access token during
* implicit flow. (Mostly used for Implicit flow with access token)
*/
    sendAccessToken?: boolean,

    /**
 * Defines whether https is required.
 * The default value is remoteOnly which only allows
 * http for localhost, while every other domains need
 * to be used with https.
 */
    requireHttps?: boolean,

    /**
 * Defines whether to use OpenId Connect during
 * implicit flow. (for id_token or access_token or both)
 */
    enableOpenId?: boolean,
    clearHashPostLogin?: boolean
}

export enum authFlow {
    CODE = "code",
    IMPLICIT = "id_token token",
    IMPLICIT_ID = "id_token",
    IMPLICIT_ACCESS = "token"
}

export const AUTH_FLOWS: Record<string, AuthConfig> = {
    CODE: { responseType: 'code', oidc: true, requestAccessToken: true },
    IMPLICIT: { responseType: 'id_token token', oidc: true, requestAccessToken: true },
    IMPLICIT_ID: { responseType: 'id_token', oidc: true, requestAccessToken: false },
    IMPLICIT_ACCESS: { responseType: 'token', oidc: false, requestAccessToken: true }
};