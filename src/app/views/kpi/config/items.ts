import {ChartItem} from "./types";
import {dateHourCriteria} from "./filter-selections";

export interface DimensionOptions {
  selected?: boolean;
  alias?: string;
  order?: string;
}

// L'alias et l'ordre valent la clé par défaut.
export const dimension = (key: string, label: string, value: string, options: DimensionOptions = {}): ChartItem => {
  const {selected = false, alias = key, order = `${alias}.asc`} = options;
  return {
    key,
    selected,
    menu: {
      label
    },
    jquery: {
      value: () => value,
      buildAlias: () => alias,
      order
    }
  };
};

// Valeur nulle remplacée par un libellé par défaut côté base.
export const coalesced = (key: string, label: string, fallback: string = 'Unknown'): ChartItem =>
  dimension(key, label, `${key}.coalesce("${fallback}")`);

export const dateDimension = (groupedBy: string, selected: boolean): ChartItem => {
  const item = dimension('date', 'Date', `start.${groupedBy}.varchar`, {selected, order: `start.${groupedBy}.asc`});
  if (groupedBy === 'dateHour') {
    item.jquery.buildCriteria = dateHourCriteria;
  }
  return item;
};

export const applicationDimension = (): ChartItem =>
  dimension('application', 'Application', 'instance.app_name');

export const versionDimension = (): ChartItem =>
  dimension('version', 'Version', 'instance.version.coalesce("Unknown")');
