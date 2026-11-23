import {STATUS_FILTER_ITEMS} from "../common";
import {elapsedChart, statusChart} from "../charts";
import {SMTP_ICONS, withMenuIcons} from "../icons";
import {applicationDimension, coalesced, dateDimension, dimension, versionDimension} from "../items";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartItem, ChartSection} from "../types";

const SMTP_DIMENSIONS = (groupedBy: string, dateSelected: boolean): ChartItem[] => [
  dateDimension(groupedBy, dateSelected),
  dimension('host', 'Serveur', 'host'),
  coalesced('user', 'Utilisateur'),
  coalesced('command', 'Commande'),
  coalesced('thread', 'Thread'),
  applicationDimension(),
  versionDimension()
];

export const SMTP_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  statusChart(SMTP_GROUPS_CONFIG(groupedBy), SMTP_FILTERS_CONFIG(filterGroupedBy));

export const SMTP_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  elapsedChart(PERFORMANCE_INDICATORS(), SMTP_GROUPS_CONFIG(groupedBy), SMTP_FILTERS_CONFIG(filterGroupedBy), 'Temps');

export const SMTP_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SMTP_ICONS, {
  optional: false,
  items: SMTP_DIMENSIONS(groupedBy, true)
});

export const SMTP_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SMTP_ICONS, {
  optional: true,
  items: [...SMTP_DIMENSIONS(groupedBy, false), ...STATUS_FILTER_ITEMS()]
});
