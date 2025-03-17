import {Application, IStep, IStepFrom, Period} from "src/app/model/conf.model";

export const app: Application = {
  host : "http://localhost:9000",
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