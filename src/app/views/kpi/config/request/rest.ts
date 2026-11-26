import {DURATION_UNIT, STATUS_FILTER_ITEMS} from "../common";
import {elapsedChart, statusChart} from "../charts";
import {REQUEST_REST_ICONS, withMenuIcons} from "../icons";
import {applicationDimension, coalesced, dateDimension, dimension, versionDimension} from "../items";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {VOLUMETRY_INDICATORS} from "../volumetry-indicators";
import {ChartConfig, ChartItem, ChartSection} from "../types";

const durationMeasure = (key: 'avg' | 'min' | 'max', label: string, selected: boolean): ChartItem => ({
  key,
  selected,
  group: 'Durées',
  unit: DURATION_UNIT,
  menu: {
    label
  },
  jquery: {
    value: (s: string) => key,
    buildAlias: () => key,
    buildName: (chartItem) => label,
    buildColor: () => '#0080ff'
  }
});

const REST_DIMENSIONS = (groupedBy: string, dateSelected: boolean): ChartItem[] => [
  dateDimension(groupedBy, dateSelected),
  dimension('host', 'Serveur', 'host'),
  coalesced('user', 'Utilisateur'),
  coalesced('method', 'Méthode'),
  coalesced('path', 'Point d\'accès'),
  coalesced('media', 'Content-Type', 'No Content'),
  coalesced('auth', 'Auth', 'No Auth'),
  coalesced('thread', 'Thread'),
  applicationDimension(),
  versionDimension()
];

export const REST_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  elapsedChart(PERFORMANCE_INDICATORS(), REST_GROUPS_CONFIG(groupedBy), REST_FILTERS_CONFIG(filterGroupedBy));

export const REST_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  statusChart(REST_GROUPS_CONFIG(groupedBy), REST_FILTERS_CONFIG(filterGroupedBy));

export const REST_VOLUMETRY_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ( {
  series: {
    optional: false,
    items: [{
      key: 'size_out',
      selected: true,
      menu: {
        label: '↑'
      },
      jquery: {
        value: () => 'size_out_notnull',
        buildAlias: () => 'size_out'
      }
    }, {
      key: 'size_in',
      selected: true,
      menu: {
        label: '↓'
      },
      jquery: {
        value: () => 'size_in_notnull',
        buildAlias: () => 'size_in'
      }
    }]
  },
  indicators: VOLUMETRY_INDICATORS(),
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(filterGroupedBy)
});

// Audience : nombre d'utilisateurs distincts. Empiler est proposé par l'organizer à partir du groupement choisi.
export const AUDIENCE_CHART_CONFIG = (groups: ChartSection, filters?: ChartSection): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'user',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'user.distinct',
        buildAlias: () => 'user'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'count',
      selected: true,
      menu: {
        label: 'Utilisateurs'
      },
      jquery: {
        value: (s: string) => `count(${s})`,
        buildAlias: () => 'count',
        buildName: () => 'Utilisateurs'
      }
    }]
  },
  groups,
  filters
});

export const REST_LATENCY_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  elapsedChart({
    optional: false,
    items: [
      durationMeasure('avg', 'Moyenne', true),
      durationMeasure('min', 'Minimum', false),
      durationMeasure('max', 'Maximum', false)
    ]
  }, REST_GROUPS_CONFIG(groupedBy), REST_FILTERS_CONFIG(filterGroupedBy));

export const REST_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(REQUEST_REST_ICONS, {
  optional: false,
  items: REST_DIMENSIONS(groupedBy, true)
});

export const REST_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(REQUEST_REST_ICONS, {
  optional: false,
  items: [...REST_DIMENSIONS(groupedBy, false), ...STATUS_FILTER_ITEMS()]
});
