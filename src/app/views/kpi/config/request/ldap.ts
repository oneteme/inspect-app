import {STATUS_FILTER_ITEMS} from "../common";
import {elapsedChart, statusChart} from "../charts";
import {LDAP_ICONS, withMenuIcons} from "../icons";
import {applicationDimension, coalesced, dateDimension, dimension, versionDimension} from "../items";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartItem, ChartSection} from "../types";

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
