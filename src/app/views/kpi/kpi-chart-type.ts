import {OrganizerChartBinding, OrganizerChartType, OrganizerState, OrganizerSubmenu} from "@oneteme/jquery-organizer";

const KPI_CHART_TYPE_LABELS: Record<string, string> = {
  column: 'Colonne',
  bar: 'Bar',
  pie: 'Camembert',
  donut: 'Donut',
  line: 'Courbe',
  spline: 'Courbe lissée',
  area: 'Aire',
  areaspline: 'Aire lissée',
  treemap: 'Treemap',
  heatmap: 'Heatmap',
  columnpyramid: 'Pyramide',
  rose: 'Rose',
  radialBar: 'Barres radiales',
  sunburst: 'Sunburst',
  radar: 'Radar',
  funnel: 'Entonnoir'
};

const KPI_CHART_TYPE_SECTIONS: {submenu: OrganizerSubmenu; types: string[]}[] = [
  {submenu: {id: 'bars', label: 'Barres', icon: 'bar_chart'}, types: ['column', 'bar', 'columnpyramid']},
  {submenu: {id: 'lines', label: 'Courbes et aires', icon: 'show_chart'}, types: ['line', 'spline', 'area', 'areaspline']},
  {submenu: {id: 'shares', label: 'Répartition', icon: 'pie_chart'}, types: ['pie', 'donut', 'rose', 'radialBar']},
  {submenu: {id: 'special', label: 'Spécialisés', icon: 'grid_view'}, types: ['treemap', 'sunburst', 'heatmap', 'radar', 'funnel']}
];

// Les courbes ne cumulent pas (voir lineTypeOptions) : seuls les types en barres et aires sont empilables.
const KPI_STACKABLE_CHART_TYPES = ['column', 'bar', 'area', 'areaspline'];

export function withKpiChartTypes(binding: OrganizerChartBinding, selected: string): OrganizerChartBinding {
  const chartTypes: OrganizerChartType[] = KPI_CHART_TYPE_SECTIONS.flatMap(({submenu, types}) =>
    types.map(id => ({id, label: KPI_CHART_TYPE_LABELS[id] ?? id, submenu})));
  return {
    config: {...binding.config, chartTypes, stackChartTypes: KPI_STACKABLE_CHART_TYPES},
    state: {...binding.state, selectedChartType: selected}
  };
}

export function isKpiStacked(state: OrganizerState): boolean {
  return state.stacked !== false && KPI_STACKABLE_CHART_TYPES.includes(state.selectedChartType ?? '');
}

export function kpiStackBreadcrumbLabel(state: OrganizerState): string {
  return isKpiStacked(state) ? 'Regroupé et empilé par:' : 'Regroupé par:';
}
