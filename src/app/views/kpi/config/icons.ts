import {DATABASE_ICON_SVG, DB_VERSION_ICON_SVG, TAG_ICON_SVG} from "../../../shared/_component/table/table.config";
import {ChartSection, MenuConfig} from "./types";

export type IconSpec = Pick<MenuConfig, 'icon' | 'iconSvg'>;

// Icônes des colonnes classiques (table.config.ts), par clé d'entrée KPI.
const COMMON_ICONS: Record<string, IconSpec> = {
  date: { icon: 'schedule' },
  user: { icon: 'badge' },
  thread: { icon: 'call_split' },
  version: { icon: 'label' }
};

export const SESSION_REST_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'widgets' },
  resource: { icon: 'extension' },
  name: { icon: 'label', iconSvg: TAG_ICON_SVG },
  method: { icon: 'api' },
  httpHost: { icon: 'language' },
  media: { icon: 'description' },
  auth: { icon: 'lock' }
};

export const SESSION_SCHEDULE_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'widgets' },
  resource: { icon: 'extension' },
  schedule: { icon: 'label', iconSvg: TAG_ICON_SVG }
};

export const SESSION_STARTUP_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'widgets' },
  resource: { icon: 'extension' },
  name: { icon: 'label', iconSvg: TAG_ICON_SVG }
};

export const REQUEST_REST_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'dns' },
  method: { icon: 'api' },
  path: { icon: 'route' },
  media: { icon: 'description' },
  auth: { icon: 'lock' },
  application: { icon: 'widgets' }
};

export const JDBC_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'dns' },
  db_name: { icon: 'table_rows', iconSvg: DATABASE_ICON_SVG },
  command: { icon: 'keyboard_command_key' },
  schema: { icon: 'schema' },
  db_version: { icon: 'new_releases', iconSvg: DB_VERSION_ICON_SVG },
  driver: { icon: 'settings_ethernet' },
  scheme: { icon: 'hub' },
  application: { icon: 'widgets' }
};

export const FTP_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'dns' },
  command: { icon: 'keyboard_command_key' },
  server_version: { icon: 'cloud' },
  client_version: { icon: 'computer' },
  protocol: { icon: 'lan' },
  application: { icon: 'widgets' }
};

export const LDAP_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'dns' },
  command: { icon: 'keyboard_command_key' },
  protocol: { icon: 'lan' },
  application: { icon: 'widgets' }
};

export const SMTP_ICONS: Record<string, IconSpec> = {
  ...COMMON_ICONS,
  host: { icon: 'dns' },
  command: { icon: 'keyboard_command_key' },
  application: { icon: 'widgets' }
};

/** Renseigne l'icône de chaque entrée du menu selon sa clé ; les entrées sans icône sont inchangées. */
export function withMenuIcons(icons: Record<string, IconSpec>, section: ChartSection): ChartSection {
  return {
    ...section,
    items: section.items.map(item => icons[item.key] ? { ...item, menu: { ...item.menu, ...icons[item.key] } } : item)
  };
}
