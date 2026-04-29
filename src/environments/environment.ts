// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {Application, IStep, IStepFrom, Period} from "src/app/model/conf.model";

export const environment = {
  production: false,
};

export const app: Application = {
  host : "http://localhost:9001",
  defaultEnv : "dev",
  gridViewPeriod:  "LAST_60",
  kpiViewPeriod: "LAST_1440"
}


 export  const auth = {
  enabled : true
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
