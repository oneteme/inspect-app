// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Application } from "src/app/model/conf.model";

export const environment = {
  production: false,
  url: "http://localhost:9006"
};

export const application: Application = {
  default_env: 'dev',
  session: {
    api: {
      default_period: makePeriod(0, 1)
    },
    main: {
      default_period: makePeriod(0, 1)
    }
  },
  dashboard: {
    default_period: makePeriod(6, 1),
    home: {
      default_period : makePeriod (0, 1)
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

export function makePeriod(dayBetween: number, shiftEnd: number = 0): { start: Date, end: Date } {
  var s = new Date();
  return {start: new Date(s.getFullYear(), s.getMonth(), s.getDate() - dayBetween), end:  new Date(s.getFullYear(), s.getMonth(), s.getDate() + shiftEnd)}; 
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.