import { AuthConfig } from 'angular-oauth2-oidc';
import { auth } from 'src/environments/environment';
import { isOidc, isRequestAccess } from '../model/auth.model';

export const authCodeFlowConfig: AuthConfig = {
  issuer: auth.authIssuer,
  redirectUri: auth.redirectUri ?? window.location.origin,
  clientId: auth.clientId,
  responseType: auth.authFlow,
  scope: auth.scope,
  customQueryParams: auth.customQueryParams,
  showDebugInformation: auth.debug ?? false,
  requestAccessToken: isRequestAccess(auth),
  oidc: isOidc(auth),
  clearHashAfterLogin: auth.clearHashPostLogin ?? true,
  logoutUrl: window.location.origin + "/logout.html"
};

