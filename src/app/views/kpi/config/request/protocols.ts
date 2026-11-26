import {STATUS_FILTER_ITEMS} from "../common";
import {elapsedChart, statusChart} from "../charts";
import {FTP_ICONS, JDBC_ICONS, LDAP_ICONS, SMTP_ICONS, withMenuIcons} from "../icons";
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

const LDAP_DIMENSIONS = (groupedBy: string, dateSelected: boolean): ChartItem[] => [
  dateDimension(groupedBy, dateSelected),
  dimension('host', 'Serveur', 'host'),
  coalesced('user', 'Utilisateur'),
  coalesced('command', 'Commande'),
  coalesced('thread', 'Thread'),
  coalesced('protocol', 'Protocole'),
  applicationDimension(),
  versionDimension()
];

const SMTP_DIMENSIONS = (groupedBy: string, dateSelected: boolean): ChartItem[] => [
  dateDimension(groupedBy, dateSelected),
  dimension('host', 'Serveur', 'host'),
  coalesced('user', 'Utilisateur'),
  coalesced('command', 'Commande'),
  coalesced('thread', 'Thread'),
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

export const LDAP_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  statusChart(LDAP_GROUPS_CONFIG(groupedBy), LDAP_FILTERS_CONFIG(filterGroupedBy));

export const LDAP_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig =>
  elapsedChart(PERFORMANCE_INDICATORS(), LDAP_GROUPS_CONFIG(groupedBy), LDAP_FILTERS_CONFIG(filterGroupedBy), 'Temps');

export const LDAP_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(LDAP_ICONS, {
  optional: false,
  items: LDAP_DIMENSIONS(groupedBy, true)
});

export const LDAP_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(LDAP_ICONS, {
  optional: true,
  items: [...LDAP_DIMENSIONS(groupedBy, false), ...STATUS_FILTER_ITEMS()]
});

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
