export type RepartitionTimeAndTypeResponse = {elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, countSucces: number, countErrorServer: number, countErrorClient: number}[];
export type RepartitionTimeAndTypeResponseByPeriod = {countSucces: number, countErrorClient: number, countErrorServer: number, countUnavailableServer: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[];
export type RepartitionRequestByPeriod = {count: number, countErrorServer: number, countSlowest: number, date: number, year: number}[];
export type ServerStartByPeriodAndAppname = { appName: string, version: string, start:number}[];
export type LastServerStart= { appName: string, version: string, start:number, collector: string}[];
export type SessionExceptionsByPeriodAndAppname = {date: string, errorType: string, count: number, countok: number, groupedBy: string,};
export type MainExceptionsByPeriodAndAppname = {date: string, errorType: string, count: number, countok: number, groupedBy: string,};
export type LdapSessionExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type LdapMainExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type SmtpSessionExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type SmtpMainExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type RestMainExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type RestSessionExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type FtpMainExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type FtpSessionExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type JdbcMainExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };
export type JdbcSessionExceptionsByPeriodAndappname = {countok: number,count: number, date: string, year: string };




