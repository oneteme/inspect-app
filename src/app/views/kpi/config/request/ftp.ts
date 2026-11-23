import {STATUS_FILTER_ITEMS} from "../common";
import {elapsedChart, statusChart} from "../charts";
import {FTP_ICONS, withMenuIcons} from "../icons";
import {applicationDimension, coalesced, dateDimension, dimension, versionDimension} from "../items";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartItem, ChartSection} from "../types";

const FTP_DIMENSIONS = (groupedBy: string, dateSelected: boolean): ChartItem[] => [
  dateDimension(groupedBy, dateSelected),
  dimension('host', 'Serveur', 'host'),
  coalesced('user', 'Utilisateur'),
  coalesced('command', 'Commande'),
  coalesced('server_version', 'Version du serveur'),
  coalesced('client_version', 'Version du client'),
  coalesced('thread', 'Thread'),
  coalesced('protocol', 'Protocole'),
  applicationDimension(),
  versionDimension()
];

export const FTP_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  statusChart(FTP_GROUPS_CONFIG(groupedBy), FTP_FILTERS_CONFIG(filterGroupedBy));

export const FTP_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  elapsedChart(PERFORMANCE_INDICATORS(), FTP_GROUPS_CONFIG(groupedBy), FTP_FILTERS_CONFIG(filterGroupedBy), 'Temps');

export const FTP_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(FTP_ICONS, {
  optional: false,
  items: FTP_DIMENSIONS(groupedBy, true)
});

export const FTP_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(FTP_ICONS, {
  optional: true,
  items: [...FTP_DIMENSIONS(groupedBy, false), ...STATUS_FILTER_ITEMS()]
});
