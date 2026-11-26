import {SIZE_TRANCHE} from "./colors";
import {SIZE_UNIT} from "./common";
import {ChartItem, ChartSection, IndicatorExtra} from "./types";

const sizeMeasure = (key: 'sum' | 'min' | 'max', label: string): ChartItem => ({
  key,
  selected: false,
  group: 'Taille',
  unit: SIZE_UNIT,
  menu: {
    label
  },
  jquery: {
    value: (s: string) => `${s}.${key}`,
    buildAlias: (value) => `${key}_${value}`,
    buildName: (chartItem) => chartItem?.menu?.label ?? '',
  }
});

// Indicateurs des graphiques de volumétrie : nombre d'appels empilé par tranche de taille, ou tailles (groupe « Taille »).
export const VOLUMETRY_INDICATORS = (): ChartSection<IndicatorExtra> => ({
  optional: false,
  items: [{
    key: 'count',
    selected: true,
    group: 'Nombre d\'Appel',
    menu: {
      label: 'Par tranche'
    },
    jquery: {
      value: () => 'count',
      buildAlias: (value: string) => 'count_' + value,
      buildName: () => 'Nombre d\'Appel'
    },
    extra: {
      stacks: {
        optional: false,
        items: [{
          key: 'size_tranche',
          selected: true,
          menu: {
            label: 'Tranche'
          },
          jquery: {
            value: (serieAlias: string) => serieAlias + '_tranche',
            buildAlias: () => 'size_tranche',
            buildName: (chartItem, value) => 'Nombre d\'Appel ' + (SIZE_TRANCHE[value]?.label ?? value),
            buildColor: (value) => SIZE_TRANCHE[value]?.color ?? '#94a3b8'
          }
        }]
      }
    }
  }, {
    key: 'total',
    selected: false,
    group: 'Nombre d\'Appel',
    menu: {
      label: 'Total'
    },
    jquery: {
      value: () => 'count',
      buildAlias: () => 'count',
      buildName: () => 'Nombre d\'Appel'
    }
  }, sizeMeasure('sum', 'Volume total'),
    sizeMeasure('min', 'Minimum par appel'),
    sizeMeasure('max', 'Maximum par appel')
  ]
});
