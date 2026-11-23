import {STATUS_FILTER_ITEMS} from "../common";
import {elapsedChart, statusChart} from "../charts";
import {JDBC_ICONS, withMenuIcons} from "../icons";
import {applicationDimension, coalesced, dateDimension, dimension, versionDimension} from "../items";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartItem, ChartSection} from "../types";

const JDBC_DIMENSIONS = (groupedBy: string, dateSelected: boolean): ChartItem[] => [
  dateDimension(groupedBy, dateSelected),
  dimension('host', 'Serveur', 'host'),
  coalesced('user', 'Utilisateur'),
  coalesced('db_name', 'Base de données'),
  coalesced('command', 'Commande'),
  coalesced('schema', 'Schéma'),
  coalesced('db_version', 'Version de la base de données'),
  coalesced('driver', 'Version du driver'),
  coalesced('scheme', 'Éditeur'),
  coalesced('thread', 'Thread'),
  applicationDimension(),
  versionDimension()
];

export const JDBC_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  statusChart(JDBC_GROUPS_CONFIG(groupedBy), JDBC_FILTERS_CONFIG(filterGroupedBy));

export const JDBC_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  elapsedChart(PERFORMANCE_INDICATORS(), JDBC_GROUPS_CONFIG(groupedBy), JDBC_FILTERS_CONFIG(filterGroupedBy), 'Temps');

export const JDBC_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(JDBC_ICONS, {
  optional: false,
  items: JDBC_DIMENSIONS(groupedBy, true)
});

export const JDBC_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(JDBC_ICONS, {
  optional: true,
  items: [...JDBC_DIMENSIONS(groupedBy, false), ...STATUS_FILTER_ITEMS()]
});
