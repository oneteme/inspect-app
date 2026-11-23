import {DURATION_UNIT} from "./common";
import {PERFORMANCE_TRANCHE1, PERFORMANCE_TRANCHE2} from "./colors";
import {ChartSection} from "./types";

export const PERFORMANCE_INDICATORS = (): ChartSection => ({
  optional: false,
  items: [{
    key: 'count',
    selected: false,
    menu: {
      label: 'Nombre d\'Appel'
    },
    jquery: {
      value: () => 'count',
      buildAlias: () => 'count'
    },
    extra: {
      stacks: {
        optional: false,
        items: [{
          key: 'performance_tranche',
          selected: false,
          menu: {
            label: 'Tranche 1',
            icon: ''
          },
          jquery: {
            value: () => 'performance_tranche',
            buildAlias: () => 'performance_tranche',
            buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
            buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
          }
        }, {
          key: 'performance_tranche2',
          selected: false,
          menu: {
            label: 'Tranche 2',
            icon: ''
          },
          jquery: {
            value: () => 'performance_tranche2',
            buildAlias: () => 'performance_tranche2',
            buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
            buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
          }
        }]
      }
    }
  }, {
    key: 'percentile',
    selected: true,
    group: 'Durées',
    unit: DURATION_UNIT,
    menu: {
      label: 'Percentile (95%)'
    },
    jquery: {
      value: (s: string) => `percentileDisc(0.95).within(group.order(elapsed_time))`,
      buildAlias: () => 'percentile',
      buildName: (chartItem) => 'Percentile (95%)',
      buildColor: () => '#0080ff'
    }
  }, {
    key: 'median',
    selected: false,
    group: 'Durées',
    unit: DURATION_UNIT,
    menu: {
      label: 'Médiane'
    },
    jquery: {
      value: (s: string) => `percentileDisc(0.5).within(group.order(elapsed_time))`,
      buildAlias: () => 'median',
      buildName: (chartItem) => 'Médiane',
      buildColor: () => '#0080ff'
    }
  }, {
    key: 'avg',
    selected: false,
    group: 'Durées',
    unit: DURATION_UNIT,
    menu: {
      label: 'Moyenne'
    },
    jquery: {
      value: (s: string) => `${s}.avg`,
      buildAlias: () => 'avg',
      buildName: (chartItem) => 'Moyenne',
      buildColor: () => '#0080ff'
    }
  }, {
    key: 'min',
    selected: false,
    group: 'Durées',
    unit: DURATION_UNIT,
    menu: {
      label: 'Minimum'
    },
    jquery: {
      value: (s: string) => `${s}.min`,
      buildAlias: () => 'min',
      buildName: (chartItem) => 'Minimum',
      buildColor: () => '#0080ff'
    }
  }, {
    key: 'max',
    selected: false,
    group: 'Durées',
    unit: DURATION_UNIT,
    menu: {
      label: 'Maximum'
    },
    jquery: {
      value:  (s: string) => `${s}.max`,
      buildAlias: () => 'max',
      buildName: (chartItem) => 'Maximum',
      buildColor: () => '#0080ff'
    }
  }]
});
