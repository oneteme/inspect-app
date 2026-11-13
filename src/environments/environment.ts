// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { AuthFlow, AuthParams } from "src/app/model/auth.model";
import { Application, IStep, IStepFrom, Period } from "src/app/model/conf.model";

export const environment = {
  production: false,
  inspect: {
    application: {
      name: 'inspect-app',
      namespace: 'jarvis',
      version: () => '',
      env: 'local',
      user: () => {
        let claims: any = sessionStorage.getItem("id_token_claims_obj")
        return (claims && JSON.parse(claims).sub);
      }
    },
    collector: {
      enabled: true, // default: false
      debugMode: false, // default: false
      // debug: {app: true, user: false},

      scheduling: {
        interval: 1000,
        queueCapacity: 50
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
        resources: { enabled: true },
        analytics: { enabled: true },
        logger: { enabled: true },          // Capture console.warn and console.error
        reporter: { enabled: true },  // Send internal collector reports
        storage: { enabled: false }
      },
      tracing: {
        remote: {
          host: `http://localhost:9001/`, // default: 'localhost'
          token: () => "",
          retentionMaxAge: { audit: 7, diagnostics: 10 }
        }
      }
    }
  }
};

export const app: Application = {
  host: "http://localhost:9001",
  defaultNamespace: "jarvis",
  gridViewPeriod: "LAST_60",
  kpiViewPeriod: "LAST_1440"
}

export const auth: AuthParams = {
  authFlow: AuthFlow.IMPLICIT_ID,
  authIssuer: '',
  clientId: '',
  clientSecret: '',
  scope: "openid",
  enabled: false,
  debug: false // PROD = false !
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
