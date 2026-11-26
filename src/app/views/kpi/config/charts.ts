import {STATUS_STACKS} from "./common";
import {ChartConfig, ChartSection, IndicatorExtra} from "./types";

// Graphique « statut » : indicateur de comptage empilé par statut.
export const statusChart = (groups: ChartSection, filters: ChartSection): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'status',
        buildAlias: () => 'status'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'count',
      selected: true,
      menu: {
        label: 'Nombre d\'Appel',
        icon: 'numbers'
      },
      jquery: {
        value: () => 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: STATUS_STACKS()
      }
    }]
  },
  groups,
  filters
});

// Graphique de durées (elapsed_time) ; buildName renomme la série dans la légende.
export const elapsedChart = (indicators: ChartSection<IndicatorExtra>, groups: ChartSection, filters: ChartSection, buildName?: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'elapsed_time',
        buildAlias: () => 'elapsedtime',
        ...(buildName ? {buildName: () => buildName} : {})
      }
    }]
  },
  indicators,
  groups,
  filters
});
