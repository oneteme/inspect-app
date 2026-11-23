import {ChartType, field} from "@oneteme/jquery-core";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";
import {DURATION_UNIT} from "./common";
import {ChartItem} from "./types";

/**
 * Pivote le résultat brut :
 *   [{count, status, date, year}]  →  [{<status>: count, date, year}]
 *
 * Exemple :
 *   [{count:8, status:202, date:"10:00", year:2026}]
 *   → [{202: 8, date:"10:00", year:2026}]
 */
export function pivotByStack(series: ChartItem[], indicator: ChartItem, group: ChartItem, stack: ChartItem, data: any[]): any[] {
  const grouped: { [key: string]: any } = {};
  for (const s of series) {
    const distinctStacks = [...new Set(data.map(d => String(d[stack.jquery.buildAlias()]) + '_' + s.jquery.buildAlias()))].sort((a, b) => a.localeCompare(b));

    for (const item of data) {
      const key = `${item[group.jquery.buildAlias()]}`;
      if (!grouped[key]) {
        grouped[key] = { group: item[group.jquery.buildAlias()] };
        distinctStacks.forEach(s => grouped[key][s] = 0);
      }
      grouped[key][String(item[stack.jquery.buildAlias()]) + '_' + s.jquery.buildAlias()] = item[indicator.jquery.buildAlias(s.jquery.buildAlias())];
    }
  }
  return Object.values(grouped);
}

/** Les durées ne se cumulent pas : avec un groupement, chaque groupe est tracé côte à côte. */
export function isStackable(indicator: ChartItem): boolean {
  return indicator.unit !== DURATION_UNIT;
}

export function buildSeries(series: ChartItem[], indicator: ChartItem, group: ChartItem, stack: ChartItem, data: any[], stacked = true): SerieProvider<string, number>[] {
  return series.flatMap(s => {
    return stack ? buildStackSeries(s, stack, data, stacked && isStackable(indicator)) :  [{ data: { x: field(group.jquery.buildAlias()), y: field(indicator.jquery.buildAlias(s.jquery.buildAlias())) }, stack: s.jquery.buildAlias(), name: indicator.jquery.buildName ? indicator.jquery.buildName(s) : indicator.jquery.buildAlias(s.jquery.buildAlias()), color: s.jquery.buildColor ? s.jquery.buildColor() : '' }];
  });
}

/**
 * Génère les SerieProvider dynamiquement à partir des statuts présents dans les données.
 *
 * Exemple de sortie :
 *   [{ data: { x: field('date'), y: field('202') }, name: '202', color: '#22c55e' }]
 */
export function buildStackSeries(serie: ChartItem, stack: ChartItem, data: any[], stackable: boolean): SerieProvider<string, number>[] {
  const distinctStacks = [...new Set(data.map(d => String(d[stack.jquery.buildAlias()])))].sort((a, b) => a.localeCompare(b));
  return distinctStacks.map(s => ({
    data: { x: field('group'), y: field(s + '_' + serie.jquery.buildAlias()) },
    name: stack.jquery.buildName ? stack.jquery.buildName(serie, s) : s + '_' + serie.jquery.buildAlias(),
    stack: stackable ? serie.jquery.buildAlias() : undefined,
    color: stack.jquery.buildColor ? stack.jquery.buildColor(s) : ''
  }));
}

const LINE_CHART_TYPES: ChartType[] = ['line', 'spline'];

/**
 * Le cumul (stack) n'a de sens que pour les barres et les aires : sur les courbes, chaque série
 * est tracée à sa propre valeur. `optionsByType` annule donc `stack` série par série.
 */
export function lineTypeOptions(series: unknown[]): Partial<Record<ChartType, any>> {
  const unstacked = { series: series.map(() => ({ stack: null })) };
  return Object.fromEntries(LINE_CHART_TYPES.map(type => [type, unstacked]));
}
