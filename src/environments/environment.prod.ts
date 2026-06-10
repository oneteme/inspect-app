import {Application, IStep, IStepFrom, Period} from "src/app/model/conf.model";

export const environment = {
  production: true,
  application:
    {
      enabled: false, // default: false
      debugMode: false, // default: false
      // debug: {app: true, user: false},
      scheduling: {
        interval: 60000 // default: '60s'
      },
      name: "inspect-prod",
      version: "1.3.2",
      env: 'prod',
      user: () => {
        let claims:any = sessionStorage.getItem("id_token_claims_obj")
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
  host : "http://localhost:9001",
  defaultEnv : "prd",
  gridViewPeriod:  "LAST_60",
  kpiViewPeriod: "LAST_60"
}


export function makeDateTimePeriod(step: number): Period {
  return new IStep(step);
}

export function makeDateTimePeriodFrom(step: number, from: number): Period{
  return new IStepFrom(step, from);
}

export function makeDatePeriod(dayBetween: number, shiftEnd: number = 0): { start: Date, end: Date } {
  let s = new Date();
  return {start: new Date(s.getFullYear(), s.getMonth(), s.getDate() - dayBetween), end:  new Date(s.getFullYear(), s.getMonth(), s.getDate() + shiftEnd)};
}
