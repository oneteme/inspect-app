import {ChartConfig, ChartFilterSelection} from "./types";

/** Clé de la catégorie « Vide » du slice-panel (@oneteme/jquery-organizer). */
const EMPTY_SLICE_KEY = '__empty__';

/** Valeurs cochées par filtre (clé du filtre → valeurs), depuis les clés actives de chaque slice ; « Vide » devient une chaîne vide. */
export function toFilterValues(sliceConfigs: { columnKey?: string }[], activeKeys: string[][]): Record<string, string[]> {
  const values: Record<string, string[]> = {};
  sliceConfigs.forEach((s, i) => {
    if (s.columnKey && activeKeys[i]?.length) {
      values[s.columnKey] = activeKeys[i].map(k => k === EMPTY_SLICE_KEY ? '' : k);
    }
  });
  return values;
}

/** Sélections à envoyer au serveur : uniquement les filtres sélectionnés dans le menu et ayant au moins une valeur cochée. */
export function buildFilterSelections(config: ChartConfig, values: Record<string, string[]>): ChartFilterSelection[] | undefined {
  const selections = (config.filters?.items ?? [])
    .filter(f => f.selected && values[f.key]?.length)
    .map(f => ({ filter: f, values: values[f.key] }));
  return selections.length ? selections : undefined;
}

/** Critère Date→Heure : un couple (jour, heure) par valeur `MM-dd H`, OU entre couples. Sans couple valide, aucune ligne ne correspond. */
export function dateHourCriteria(values: string[]): Record<string, string> {
  const hoursByDay = new Map<string, string[]>();
  values.map(v => v.split(' ')).forEach(([day, hour]) => {
    if (day && hour) hoursByDay.set(day, [...(hoursByDay.get(day) ?? []), hour]);
  });
  if (!hoursByDay.size) {
    return { 'start.monthDay.varchar.isNull': '' };
  }
  const clauses = [...hoursByDay].map(([day, hours]) =>
    `start.monthDay.varchar.eq(${day}).and(start.hour.varchar.in(${[...new Set(hours)].join(',')}))`);
  return { [clauses.reduce((acc, clause) => `${acc}.or(${clause})`)]: '' };
}

/** Ajoute un critère `<colonne>.in` par filtre sélectionné (ET entre filtres, OU entre valeurs). */
export function applyFilterSelections(args: Record<string, any>, selections?: ChartFilterSelection[]): void {
  selections?.forEach(s => {
    if (s.filter.jquery.buildCriteria) {
      Object.assign(args, s.filter.jquery.buildCriteria(s.values ?? []));
      return;
    }
    const column = s.filter.jquery.value();
    const values = s.values ?? [];
    const nonEmpty = values.filter(v => v !== '');
    const hasEmpty = nonEmpty.length !== values.length;
    if (hasEmpty && nonEmpty.length) {
      args[`${column}.isNull.or(${column}.in(${nonEmpty.join(',')}))`] = '';
    } else if (hasEmpty) {
      args[`${column}.isNull`] = '';
    } else if (nonEmpty.length) {
      args[`${column}.in`] = nonEmpty.join(',');
    }
  });
}
