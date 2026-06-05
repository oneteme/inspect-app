import { F } from '@angular/cdk/keycodes';
import { AuthConfig } from 'angular-oauth2-oidc';
import { auth } from 'src/environments/environment';

export const authCodeFlowConfig: AuthConfig = {
  issuer: auth.authIssuer,
  redirectUri: auth.redirectUri,
  clientId: auth.clientId,
  responseType: 'id_token',
  scope: 'openid',
  showDebugInformation: auth.debug ?? false,
  requestAccessToken: false,
  oidc: true,
  clearHashAfterLogin: true,
};
