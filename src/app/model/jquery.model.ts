export type RepartitionTimeAndTypeResponse = {elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, countSucces: number, countErrorServer: number, countErrorClient: number}[];
export type RepartitionTimeAndTypeResponseByPeriod = {countSucces: number, countErrorClient: number, countErrorServer: number, elapsedTimeSlowest: number, elapsedTimeSlow: number, elapsedTimeMedium: number, elapsedTimeFast: number, elapsedTimeFastest: number, avg: number, max: number, date: number, year: number}[];
export type RepartitionRequestByPeriod = {count: number, countErrorServer: number, countSlowest: number, date: number}[];




