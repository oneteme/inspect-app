import {DURATION_UNIT} from "./common";
import {ChartSection} from "./types";

export const PERFORMANCE_INDICATORS = (): ChartSection => ({
  optional: false,
  items: [{
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
