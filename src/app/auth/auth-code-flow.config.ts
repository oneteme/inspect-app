import { AuthConfig } from 'angular-oauth2-oidc';
import { auth } from 'src/environments/environment';
import { isOidc, isRequestAccess, resolveAuthParams } from '../model/auth.model';

export const resolvedAuth = resolveAuthParams(auth);
export const authCodeFlowConfig: AuthConfig = {
  issuer: resolvedAuth.authIssuer,
  redirectUri: resolvedAuth.redirectUri ?? window.location.origin,
  clientId: resolvedAuth.clientId,
  responseType: resolvedAuth.authFlow,
  scope: resolvedAuth.scope,
  customQueryParams: resolvedAuth.customQueryParams,
  showDebugInformation: resolvedAuth.debug ?? false,
  requestAccessToken: isRequestAccess(resolvedAuth),
  oidc: isOidc(resolvedAuth),
  clearHashAfterLogin: resolvedAuth.clearHashPostLogin ?? true,
  logoutUrl: window.location.origin + "/logout.html",
  ...resolvedAuth.overrideAuthConfig
};

