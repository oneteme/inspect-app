import {OrganizerChartBinding, OrganizerChartType} from "@oneteme/jquery-organizer";

const KPI_CHART_TYPE_LABELS: Record<string, string> = {
  column: 'Colonne',
  bar: 'Bar',
  pie: 'Camembert',
  donut: 'Donut',
  line: 'Courbe',
  spline: 'Courbe lissée',
  area: 'Aire',
  areaspline: 'Aire lissée'
};

const KPI_CHART_TYPE_IDS = ['column', 'bar', 'pie', 'donut', 'line', 'spline', 'area', 'areaspline', 'treemap', 'heatmap'];

export function withKpiChartTypes(binding: OrganizerChartBinding, selected: string): OrganizerChartBinding {
  const chartTypes: OrganizerChartType[] = KPI_CHART_TYPE_IDS.map(id => ({id, label: KPI_CHART_TYPE_LABELS[id] ?? id}));
  return {
    config: {...binding.config, chartTypes},
    state: {...binding.state, selectedChartType: selected}
  };
}
