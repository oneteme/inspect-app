import { AuthConfig } from "angular-oauth2-oidc";

export interface AuthParams {
    authFlow: AuthFlow,
    authIssuer: string,
    clientId: string,
    clientSecret: string,
    redirectUri?: string,
    scope?: string,
    customQueryParams?: object;
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
    clearHashPostLogin?: boolean
}

export enum AuthFlow {
    CODE = "code",
    IMPLICIT = "id_token token",
    IMPLICIT_ID = "id_token",
    IMPLICIT_ACCESS = "token"
}

// convert to function with switch case
export const AUTH_FLOWS: Record<string, AuthConfig> = {
    [AuthFlow.CODE]: { oidc: true, requestAccessToken: true },
    [AuthFlow.IMPLICIT]: { oidc: true, requestAccessToken: true },
    [AuthFlow.IMPLICIT_ID]: { oidc: true, requestAccessToken: false },
    [AuthFlow.IMPLICIT_ACCESS]: { oidc: false, requestAccessToken: true }
};

export function isOidc(params: AuthParams) {
    return params.scope?.toLowerCase()?.includes("openid") && AUTH_FLOWS[params.authFlow].oidc
}

export function isRequestAccess(params: AuthParams) {
    return params.sendAccessToken || AUTH_FLOWS[params.authFlow].requestAccessToken;
}

export function isCodeFlow(params: AuthParams) {
    return params.authFlow == AuthFlow.CODE;
}

export function isImplicitFlow(params: AuthParams) {
    return params.authFlow == AuthFlow.IMPLICIT;
}

export function isImplicitId(params: AuthParams) {
    return params.authFlow == AuthFlow.IMPLICIT_ID;
}

export function isImplicitAccess(params: AuthParams) {
    return params.authFlow == AuthFlow.IMPLICIT_ACCESS;
}