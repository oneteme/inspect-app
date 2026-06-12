import { AuthConfig } from 'angular-oauth2-oidc';
import { auth } from 'src/environments/environment';

export const authCodeFlowConfig: AuthConfig = {
  issuer: auth.authIssuer,
  redirectUri: auth.redirectUri ?? window.location.origin,
  clientId: auth.clientId,
  responseType: auth.authFlow,
  scope: 'openid',
  showDebugInformation: auth.debug ?? false,
  requestAccessToken: true,
  oidc: true,
  clearHashAfterLogin: auth.clearHashPostLogin ?? true,
  logoutUrl: window.location.origin + "/logout.html"
};

