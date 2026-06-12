// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { authFlow, AuthParams } from "src/app/model/auth.model";
import { Application, IStep, IStepFrom, Period } from "src/app/model/conf.model";

export const environment = {
  production: false,
  application:
  {
    enabled: false, // default: false
    debugMode: false, // default: false
    // debug: {app: true, user: false},
    scheduling: {
      interval: 60000 // default: '60s'
    },
    name: "inspect-app",
    version: "1.3.2",
    env: 'local',
    user: () => {
      let claims: any = sessionStorage.getItem("id_token_claims_obj")
      return (claims && JSON.parse(claims).sub);
    },
    monitoring: {
      httpRoute: {
        excludes: {
          path: [/scope/],
        },
      },
      httpRequest: {
        excludes: {
          host: [],
        },
      },
      resources: {
        enabled: true // default: false
      },
      analytics: {
        enabled: false // default: false
      },
      storage: {
        enabled: false // default: false
      }
    },
    tracing: {
      queueCapacity: 1000, // default: 10000
      delayIfPending: 1, // default: 30
      remote: {
        mode: 'REST', // default: null
        host: `http://localhost:9001/`, // default: 'localhost'
        retentionMaxAge: 10 // default: '30'
      }
    }
  }
};

export const app: Application = {
  host: "http://localhost:9001",
  defaultEnv: "dev",
  gridViewPeriod: "LAST_60",
  kpiViewPeriod: "LAST_1440"
}

export const auth: AuthParams = {
  redirectUri: 'http://localhost:4200',
  authIssuer: 'https://dev-454nmj6iu2c1yjbs.au.auth0.com/',
  clientId: 'lE1vnI7ybUrJDih4KdXIFFVaTBGNDBev',
  clientSecret: '41jQ1HSziTeygD8ngijnIpJHOuvw8gt6e6AgHW-sOo8xpMMMV1efoPKtuPgMvhLA',
  authFlow: authFlow.IMPLICIT_ID,
  enabled: true,
  sendAccessToken: true,
  debug: true,
  logOutRedirectUri: 'http://localhost:4200/logout.html'
}

export function makeDateTimePeriod(step: number): Period {
  return new IStep(step);
}

export function makeDateTimePeriodFrom(step: number, from: number): Period {
  return new IStepFrom(step, from);
}

export function makeDatePeriod(dayBetween: number, shiftEnd: number = 0): { start: Date, end: Date } {
  let s = new Date();
  return { start: new Date(s.getFullYear(), s.getMonth(), s.getDate() - dayBetween), end: new Date(s.getFullYear(), s.getMonth(), s.getDate() + shiftEnd) };
}
