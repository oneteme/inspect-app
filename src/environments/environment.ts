// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {Application, ApplicationNew, IStep, IStepFrom, Period} from "src/app/model/conf.model";

export const DEFAULT_ENV = "dev";



export const environment = {
  production: false,
};

/**
 * @deprecated use the new configuration ApplicationNew
 */
export const application: Application = {
  default_env: DEFAULT_ENV,
  session: {
    api: {
      default_period: makeDateTimePeriod(60)
    },
    main: {
      default_period: makeDateTimePeriod(60)
    }
  },
  dashboard: {
    default_period: makeDatePeriod(0, 1),
    home: {
      default_period : makeDatePeriod (0, 1)
    },
    api : {
      default_period: undefined
    },
    app: {
      default_period: undefined
    },
    database: {
      default_period: undefined
    },
    user: {
      default_period: undefined
    }
  }
}

export const app: ApplicationNew = {
  host : "http://localhost:9000",
  defaultEnv : "dev",
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
