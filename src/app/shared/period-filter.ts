import {IPeriod, IStep, Period} from '../model/conf.model';

export type PeriodQuickRange = '5m' | '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '24h' | '2d' | '7d';
export type KpiPeriodQuickRange = '2d' | '3d' | '4d' | '5d' | '6d';

export const PERIOD_QUICK_RANGES: ReadonlyArray<{ value: PeriodQuickRange; label: string }> = [ { value: '5m', label: 'Dernières 5 minutes' }, { value: '15m', label: 'Dernières 15 minutes' }, { value: '30m', label: 'Dernières 30 minutes' }, { value: '1h', label: 'Dernière 1 heure' }, { value: '3h', label: 'Dernières 3 heures' }, { value: '6h', label: 'Dernières 6 heures' }, { value: '12h', label: 'Dernières 12 heures' }, { value: '24h', label: 'Dernières 24 heures' }, { value: '2d', label: 'Derniers 2 jours' }, { value: '7d', label: 'Derniers 7 jours' } ];

export const KPI_PERIOD_QUICK_RANGES: ReadonlyArray<{ value: KpiPeriodQuickRange; label: string }> = [ { value: '2d', label: '2 derniers jours' }, { value: '3d', label: '3 derniers jours' }, { value: '4d', label: '4 derniers jours' }, { value: '5d', label: '5 derniers jours' }, { value: '6d', label: '6 derniers jours' } ];

const PERIOD_QUICK_RANGE_MINUTES: Record<PeriodQuickRange, number> = { '5m': 5, '15m': 15, '30m': 30, '1h': 60, '3h': 180, '6h': 360, '12h': 720, '24h': 1440, '2d': 2880, '7d': 10080 };

export function getQuickRangeDates(range: PeriodQuickRange, reference: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(reference.getTime());
  const start = new Date(end.getTime() - PERIOD_QUICK_RANGE_MINUTES[range] * 60 * 1000);
  return { start, end };
}

export function getQuickRangeStep(range: PeriodQuickRange): IStep {
  const minutes = PERIOD_QUICK_RANGE_MINUTES[range];
  return new IStep(minutes);
}

export function getKpiQuickRangeDates(range: KpiPeriodQuickRange, reference: Date = new Date()): { start: Date; end: Date; queryEnd: Date } {
  const days = Number(range.replace('d', ''));
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - (days - 1));
  const queryEnd = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1);
  return { start, end, queryEnd };
}

export function getDefaultRelativePeriod(step: number = 60): IStep {
  return new IStep(step);
}

export function isDefaultRelativePeriod(period?: Period | null): boolean {
  if (!period) {
    return true;
  }

  return period instanceof IStep && period._step === 60 && !(period as any)._from;
}

export function getDefaultTodayPeriod(reference: Date = new Date()): IPeriod {
  return new IPeriod(
    new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()),
    new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() + 1)
  );
}

export function isDefaultTodayPeriod(period?: Period | null, reference: Date = new Date()): boolean {
  if (!period) { return true }

  const defaultPeriod = getDefaultTodayPeriod(reference);
  return isSameDay(period.start, defaultPeriod.start) && isSameDay(period.end, defaultPeriod.end);
}

export function toDisplayedPeriodEnd(end: Date): Date {
  return new Date(end.getTime() - 1);
}

export function normalizeToMinimumDay(period: Period, reference: Date = new Date()): Period {
  const durationMs = period.end.getTime() - period.start.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  if (durationMs < ONE_DAY_MS) {
    return getDefaultTodayPeriod(reference);
  }
  
  return period;
}

function isSameDay(firstDate: Date, secondDate: Date): boolean {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}