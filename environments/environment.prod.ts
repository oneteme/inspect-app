
import { Application } from "src/app/shared/model/conf.model";

export const environment = {
  production: false,
  url: "http://localhost:9006"
};

export const application: Application = {
  default_env: 'prd',
  session: {
    api: {
      default_period: makePeriod(0)
    },
    main: {
      default_period: makePeriod(0)
    }
  },
  dashboard: {
    default_period: makePeriod(6),
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

export function makePeriod(dayBetween: number, shiftEnd: number = 0): { start: Date, end: Date } {
  var s = new Date();
  return {start: new Date(s.getFullYear(), s.getMonth(), s.getDate() - dayBetween), end:  new Date(s.getFullYear(), s.getMonth(), s.getDate() + shiftEnd)}; 
}

