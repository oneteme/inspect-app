import { AuthConfig } from 'angular-oauth2-oidc';

export const authCodeFlowConfig: AuthConfig = {
    issuer: 'https://dev-qn7fyjzc1fz15687.eu.auth0.com/',
    // URL of the SPA to redirect the user to after login
    redirectUri:
        window.location.origin ,
    customQueryParams: {
        audience: 'https://my-api' 
    },
    // The SPA's id. The SPA is registerd with this id at the auth-server
    // clientId: 'server.code',
    clientId: 'NgOddajhOk6Hx9erFiK1XOc284hFHIV9',

    // Just needed if your auth server demands a secret. In general, this
    // is a sign that the auth server is not configured with SPAs in mind
    // and it might not enforce further best practices vital for security
    // such applications.
    // dummyClientSecret: 'secret',
    dummyClientSecret:'t3B3lu14kQMgz3Ee4bp8D9jphj0gWVEE63b-Y_H6dMu2tolTNnSU_JgdW4AnrnqU',

   // implicit
    //responseType: 'token id_token',
   // disablePKCE: true
   // code flow
   responseType: 'code',


    // set the scope for the permissions the client should request
    // The first four are defined by OIDC.
    // Important: Request offline_access to get a refresh token
    // The api scope is a usecase specific one
    scope:   'openid profile email offline_access api',

    // ^^ Please note that offline_access is not needed for silent refresh
    // At least when using idsvr, this even prevents silent refresh
    // as idsvr ALWAYS prompts the user for consent when this scope is
    // requested

    // This is needed for silent refresh (refreshing tokens w/o a refresh_token)
    // **AND** for logging in with a popup
    silentRefreshRedirectUri: `${window.location.origin}/silent-refresh.html`,

    useSilentRefresh: false,

    showDebugInformation: true,

    sessionChecksEnabled: false,

    timeoutFactor: 0.01,
    // disablePKCI: true,

    clearHashAfterLogin: true,
};
