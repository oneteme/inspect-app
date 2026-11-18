import { SliceConfig, TableProvider } from '@oneteme/jquery-table';
import { DatabaseRequestDto, DirectoryRequestDto, FtpRequestDto, MailRequestDto, MainSessionDto, RestRequestDto, RestSessionDto, SessionEventDto } from '../../../model/request.model';
import { AbstractStage, LocalRequest, LogEntry } from "../../../model/trace.model";
import { LastServerStart } from "../../../model/jquery.model";
import { formatDuration } from '../../pipe/duration.pipe';

/** Equivalent de typeColumnFormatPipe utilisable hors template. */
function fmtMethod(value: string | null | undefined): string {
  return '[' + (value || '--') + ']';
}
/** Equivalent de `row.start * 1000 | date:'dd/MM/yyyy HH:mm:ss.SSS'` */
function fmtStart(startSec: number): string {
  const d = new Date(startSec * 1000);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}.${ms}`;
}
/** Equivalent de `{start, end} | duration` ou 'En cours...' si end absent. */
function fmtDuration(start: number, end: number | null | undefined): string {
  return end == null ? 'En cours...' : formatDuration(end - start);
}
const TAG_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-tag"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3" /></svg>';
const DATABASE_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-database"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" /><path d="M4 6v6a8 3 0 0 0 16 0v-6" /><path d="M4 12v6a8 3 0 0 0 16 0v-6" /></svg>';

export const DEFAULT_TABLE_CONFIG: TableProvider = {
  search: { enabled: true },
  view: { enabled: true, enableColumnRemoval: true },
  pagination: { enabled: true, pageSize: 10, pageSizeOptions: [5, 10, 15, 20, 100], pageSizeOptionsGroupBy: [20, 50, 100, 200], showFirstLastButtons: true },
  labels: { empty: 'Aucun résultat', loading: 'Chargement des données...' },
};

export const DEFAULT_SORT_CONFIG: { active: string; direction: 'asc' | 'desc'; } = { active: 'start', direction: 'desc' };

/** Plages de durée (en secondes) partagées par les filtres « Temps de Réponse » et « Traitement Asynchrone ». */
function durationRangeCategories(seconds: (row: any) => number | null | undefined) {
  const inRange = (min: number, max: number) => (row: any) => {
    const s = seconds(row);
    return s != null && s >= min && s < max;
  };
  return [
    { key: '<100ms', label: '< 100ms', filter: inRange(0, 0.1) },
    { key: '100-500ms', label: '100ms - 500ms', filter: inRange(0.1, 0.5) },
    { key: '500ms-1s', label: '500ms - 1s', filter: inRange(0.5, 1) },
    { key: '1s-5s', label: '1s - 5s', filter: inRange(1, 5) },
    { key: '>5s', label: '> 5s', filter: inRange(5, Infinity) }
  ];
}

export const DEFAULT_DURATION_SLICE_CONFIG: SliceConfig = {
  title: 'Temps de Réponse',
  columnKey: 'duration',
  hidden: true,
  categories: [
    ...durationRangeCategories((row) => row.end == null ? null : row.end - row.start),
    { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
  ]
};

/** asyncDuration est en millisecondes ; absent ou négatif = pas de traitement asynchrone. */
export const ASYNC_DURATION_SLICE_CONFIG: SliceConfig = {
  title: 'Traitement Asynchrone',
  columnKey: 'asyncDuration',
  hidden: true,
  categories: [
    ...durationRangeCategories((row) => row.asyncDuration == null || row.asyncDuration < 0 ? null : row.asyncDuration / 1000),
    { key: 'none', label: 'Sans traitement asynchrone', filter: (row) => row.asyncDuration == null || row.asyncDuration < 0 }
  ]
};

export const REST_SESSION_TABLE_CONFIG: TableProvider<RestSessionDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'appName', header: 'Application', icon: 'widgets', width: '18%', minWidth: 150 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', minWidth: 300,
      value: (row: RestSessionDto) => fmtMethod(row.method) + ' ' + (row.path || ''),
      searchValue: (row: RestSessionDto) => fmtMethod(row.method) + ' ' + (row.path || '')
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', width: '13%', minWidth: 150, groupable: false, sliceable: false,
      searchValue: (row: RestSessionDto) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', width: '17%', minWidth: 180, groupable: false, sliceable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: RestSessionDto) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '15%', minWidth: 120 },
    { key: 'name', header: 'Nom', icon: 'label', iconSvg: TAG_ICON_SVG, lazy: true, minWidth: 150 },
    { key: 'method', header: 'Méthode', icon: 'api', optional: true, minWidth: 110 },
    { key: 'query', header: 'Query', icon: 'search', lazy: true, minWidth: 160, groupable: false, sliceable: false },
    {
      key: 'asyncDuration', header: 'Traitement Asynchrone', icon: 'time_auto', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 180, groupable: false, sliceable: false,
      sortValue: (row: RestSessionDto) => row.asyncDuration != null && row.asyncDuration >= 0 ? row.asyncDuration : -1,
      value: (row: RestSessionDto) => row.asyncDuration != null && row.asyncDuration >= 0 ? formatDuration(row.asyncDuration / 1000) : '--'
    },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', width: '13%', minWidth: 110,
      value: (row: RestSessionDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'host', header: 'Hôte HTTP', lazy: true, icon: 'language', minWidth: 160 },
    { key: 'inDataSize', header: 'Données Reçues', icon: 'arrow_upward', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 170, groupable: false, sliceable: false },
    { key: 'outDataSize', header: 'Données Envoyées', icon: 'arrow_downward', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 170, groupable: false, sliceable: false },
    { key: 'userAgent', header: 'User-Agent', lazy: true, icon: 'devices', width: '15%', minWidth: 260 },
    { key: 'contentType', header: 'Content-Type', lazy: true, icon: 'description', minWidth: 150 },
    { key: 'threadName', header: 'Thread', lazy: true, icon: 'call_split', minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    ASYNC_DURATION_SLICE_CONFIG,
    { title: 'Méthode', columnKey: 'method', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  rowClass: (row: RestSessionDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
}

export const MAIN_SESSION_TABLE_CONFIG: TableProvider<MainSessionDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'appName', header: 'Application', icon: 'widgets', width: '18%', minWidth: 150 },
    { key: 'location', header: 'Ressource', icon: 'extension', minWidth: 220 },
    { key: 'start', header: 'Début', icon: 'schedule', width: '13%', minWidth: 150, groupable: false, sliceable: false },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', width: '17%', minWidth: 180, groupable: false, sliceable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '15%', minWidth: 120 },
    {
      key: 'name', header: 'Nom', icon: 'label', iconSvg: TAG_ICON_SVG, lazy: true, minWidth: 150, groupable: false, sliceable: false
    },
    {
      key: 'asyncDuration', header: 'Traitement Asynchrone', icon: 'time_auto', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 180, groupable: false, sliceable: false,
      sortValue: (row: MainSessionDto) => row.asyncDuration != null && row.asyncDuration >= 0 ? row.asyncDuration : -1,
      value: (row: MainSessionDto) => row.asyncDuration != null && row.asyncDuration >= 0 ? formatDuration(row.asyncDuration / 1000) : '--'
    },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', width: '13%', minWidth: 110,
      value: (row: RestSessionDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'threadName', header: 'Thread', icon: 'call_split', lazy: true, minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    ASYNC_DURATION_SLICE_CONFIG,
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: MainSessionDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
}

export const REST_REQUEST_TABLE_CONFIG: TableProvider<RestRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Serveur', icon: 'dns', width: '15%', minWidth: 140 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', width: '30%', minWidth: 220,
      value: (row: RestRequestDto) => fmtMethod(row.method) + ' ' + (row.path || ''),
      searchValue: (row: RestRequestDto) => fmtMethod(row.method) + ' ' + (row.path || '')
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false, width: '13%', minWidth: 150,
      searchValue: (row: RestRequestDto) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false, width: '17%', minWidth: 180,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: RestRequestDto) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '10%', minWidth: 120 },
    { key: 'action', width: '10%', minWidth: 60, sliceable: false, groupable: false, sortable: false, inFieldsMenu: false },
    { key: 'method', header: 'Méthode', icon: 'api', optional: true, minWidth: 110 },
    { key: 'path', header: 'Point d\'accès', icon: 'route', optional: true, minWidth: 160 },
    {
      key: 'status', header: 'Status', sortable: true, optional: true, icon: 'task_alt', minWidth: 110,
      value: (row: RestSessionDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'query', header: 'Query', icon: 'search', lazy: true, minWidth: 160, groupable: false, sliceable: false },
    { key: 'bodyContent', header: 'Réponse', icon: 'reply', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 150, groupable: false, sliceable: false },
    { key: 'outDataSize', header: 'Données envoyées', icon: 'arrow_upward', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 170, groupable: false, sliceable: false },
    { key: 'inDataSize', header: 'Données lues', icon: 'arrow_downward', iconFontSet: 'material-symbols-outlined', lazy: true, minWidth: 170, groupable: false, sliceable: false },
    { key: 'contentType', header: 'Content-Type', icon: 'description', lazy: true, minWidth: 130 },
    { key: 'threadName', header: 'Thread', icon: 'call_split', lazy: true, minWidth: 150 },
    { key: 'appName', header: 'Application', icon: 'widgets', lazy: true, minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Méthode', columnKey: 'method', hidden: true },
    { title: 'Point d\'accès', columnKey: 'path', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: DEFAULT_SORT_CONFIG,
  rowClass: (row: RestSessionDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
};

export const DATABASE_REQUEST_TABLE_CONFIG: TableProvider<DatabaseRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Serveur', icon: 'dns', width: '15%', minWidth: 140 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', sliceable: false, groupable: false, width: '30%', minWidth: 220,
      searchValue: (row: DatabaseRequestDto) => fmtMethod(row.command) + ' ' + (row.schema || row.name || 'N/A')
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false, width: '13%', minWidth: 150,
      searchValue: (row: DatabaseRequestDto) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false, width: '17%', minWidth: 180,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: DatabaseRequestDto) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '10%', minWidth: 120 },
    { key: 'productName', header: 'Base de données', icon: 'table_rows', iconSvg: DATABASE_ICON_SVG, lazy: true, minWidth: 180 },
    { key: 'command', header: 'Commande', icon: 'keyboard_command_key', optional: true, minWidth: 130 },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', minWidth: 110,
      value: (row: DatabaseRequestDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'scheme', header: 'Éditeur', icon: 'hub', lazy: true, minWidth: 130 },
    { key: 'threadName', header: 'Thread', icon: 'call_split', lazy: true, minWidth: 150 },
    { key: 'appName', header: 'Application', icon: 'widgets', lazy: true, minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Commande', columnKey: 'command', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: DEFAULT_SORT_CONFIG,
  rowClass: (row: DatabaseRequestDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
};

export const FTP_REQUEST_TABLE_CONFIG: TableProvider<FtpRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Serveur', icon: 'dns', width: '15%', minWidth: 140 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', sliceable: false, groupable: false, width: '30%', minWidth: 220,
      searchValue: (row: FtpRequestDto) => fmtMethod(row.command)
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false, width: '13%', minWidth: 150,
      searchValue: (row: FtpRequestDto) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false, width: '17%', minWidth: 180,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: FtpRequestDto) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '10%', minWidth: 120 },
    { key: 'command', header: 'Commande', icon: 'keyboard_command_key', optional: true, minWidth: 130 },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', minWidth: 110,
      value: (row: FtpRequestDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'threadName', header: 'Thread', icon: 'call_split', lazy: true, minWidth: 150 },
    { key: 'protocol', header: 'Protocole', icon: 'lan', lazy: true, minWidth: 110 },
    { key: 'appName', header: 'Application', icon: 'widgets', lazy: true, minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Commande', columnKey: 'command', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: DEFAULT_SORT_CONFIG,
  rowClass: (row: FtpRequestDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
}

export const LDAP_REQUEST_TABLE_CONFIG: TableProvider<DirectoryRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Serveur', icon: 'dns', width: '15%', minWidth: 140 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', sliceable: false, groupable: false, width: '30%', minWidth: 220,
      searchValue: (row: DirectoryRequestDto) => fmtMethod(row.command)
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false, width: '13%', minWidth: 150,
      searchValue: (row: DirectoryRequestDto) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false, width: '17%', minWidth: 180,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: DirectoryRequestDto) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '10%', minWidth: 120 },
    { key: 'command', header: 'Commande', icon: 'keyboard_command_key', optional: true, minWidth: 130 },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', minWidth: 110,
      value: (row: DirectoryRequestDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'threadName', header: 'Thread', icon: 'call_split', lazy: true, minWidth: 150 },
    { key: 'protocol', header: 'Protocole', icon: 'lan', lazy: true, minWidth: 110 },
    { key: 'appName', header: 'Application', icon: 'widgets', lazy: true, minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Commande', columnKey: 'command', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: DEFAULT_SORT_CONFIG,
  rowClass: (row: DirectoryRequestDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
};

export const LOCAL_REQUEST_TABLE_CONFIG: TableProvider<LocalRequest> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns', width: '15%', minWidth: 140 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', width: '30%', minWidth: 220,
      searchValue: (row: LocalRequest) => fmtMethod((row as any).type) + ' ' + ((row as any).name || 'N/A')
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false, width: '13%', minWidth: 150,
      searchValue: (row: LocalRequest) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false, width: '17%', minWidth: 180,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: LocalRequest) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '10%', minWidth: 120 },
    { key: 'command', header: 'Commande', icon: 'keyboard_command_key', optional: true, minWidth: 130 },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', minWidth: 110,
      value: (row: LocalRequest) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', minWidth: 150, value: (row) => row.exception?.type }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Commande', columnKey: 'command', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: DEFAULT_SORT_CONFIG,
  rowClass: (row: LocalRequest) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
};

export const SMTP_REQUEST_TABLE_CONFIG: TableProvider<MailRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Serveur', icon: 'dns', width: '15%', minWidth: 140 },
    {
      key: 'resource', header: 'Ressource', icon: 'extension', sliceable: false, groupable: false, width: '30%', minWidth: 220,
      searchValue: (row: MailRequestDto) => fmtMethod((row as any).command)
    },
    {
      key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false, width: '13%', minWidth: 150,
      searchValue: (row: MailRequestDto) => fmtStart(row.start)
    },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false, width: '17%', minWidth: 180,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE,
      searchValue: (row: MailRequestDto) => fmtDuration(row.start, row.end)
    },
    { key: 'user', header: 'Utilisateur', icon: 'badge', width: '10%', minWidth: 120 },
    { key: 'command', header: 'Commande', icon: 'keyboard_command_key', optional: true, minWidth: 130 },
    {
      key: 'status', header: 'Status', optional: true, icon: 'task_alt', minWidth: 110,
      value: (row: MailRequestDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'threadName', header: 'Thread', icon: 'call_split', lazy: true, minWidth: 150 },
    { key: 'appName', header: 'Application', icon: 'widgets', lazy: true, minWidth: 150 },
    { key: 'appVersion', header: 'Version', icon: 'label', lazy: true, minWidth: 100 }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Commande', columnKey: 'command', hidden: true },
    { title: 'Status', columnKey: 'status', hidden: true }
  ],
  defaultSort: DEFAULT_SORT_CONFIG,
  rowClass: (row: MailRequestDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code < 100 && row.end) return 'row-unavailable';
    return '';
  }
};

export const STAGE_TABLE_CONFIG: TableProvider<AbstractStage> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'name', header: 'Etape', icon: 'steppers', iconFontSet: 'material-symbols-outlined' },
    {
      key: 'resource', header: 'Ressource', icon: 'category',
      searchValue: (row: AbstractStage) => fmtMethod(row.command) + ' ' + ((row as any).args ?? row.arg ?? '')
    },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    {
      key: 'duration', header: 'Temps de Réponse', icon: 'timer', groupable: false, sliceable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'command', header: 'Commande', icon: 'keyboard_command_key', optional: true, minWidth: 130 },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', value: (row) => row.exception?.type }
  ],
  slices: [
    DEFAULT_DURATION_SLICE_CONFIG,
    { title: 'Commande', columnKey: 'command', hidden: true }
  ],
  defaultSort: { active: 'start', direction: 'asc' },
  rowClass: (row: AbstractStage) => {
    const failed = row.exception;
    if (row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
};

export const LOG_TABLE_CONFIG: TableProvider<LogEntry> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'instant', header: 'Horodate', icon: 'schedule', sliceable: false, groupable: false, width: '11%' },
    { key: 'appName', header: 'Application', icon: 'widgets', sliceable: false, groupable: false, width: '12%' },
    { key: 'message', header: 'Message', icon: 'chat', sliceable: false, groupable: false, width: '35%' },
    { key: 'thread', header: 'Thread', sliceable: false, groupable: false, width: '16%' },
    { key: 'action', header: 'Détails', sliceable: false, groupable: false, width: '17%' },
    { key: 'stack', header: 'Stack', icon: 'touch_app', sliceable: false, groupable: false, sortable: false, width: '9%' }
  ],
  slices: [
    {
      title: 'Détails',
      columnKey: 'action',
      icon: 'label',
      hidden: true
    }
  ],
  defaultSort: { active: 'instant', direction: 'desc' }
};

export const DEPLOIEMENT_TABLE_CONFIG: TableProvider<LastServerStart & { lastTrace?: number }> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'appName', header: 'Application', icon: 'widgets', width: '25%', minWidth: 180 },
    { key: 'duration', header: 'Depuis', icon: 'schedule', groupable: false, sliceable: false, width: '12%', minWidth: 120, sortValue: (row) => row.start },
    { key: 'version', header: 'Version', icon: 'label', width: '20%', minWidth: 130 },
    { key: 'branch', header: 'Branche', icon: 'fork_right', width: '25%', minWidth: 180 },
    { key: 'restart', header: 'Démarrage', icon: 'restart_alt', groupable: false, sliceable: false, minWidth: 170 },
    { key: 'user', header: 'Utilisateur', icon: 'badge', optional: true, width: '10%', minWidth: 220 },
    { key: 'os', header: 'OS', icon: 'computer', optional: true, width: '13%', minWidth: 340 },
    { key: 're', header: 'RE', icon: 'sdk', optional: true, width: '8%', minWidth: 170 },
    { key: 'address', header: 'Adresse', icon: 'fingerprint', sliceable: false, groupable: false, optional: true, minWidth: 170 },
    { key: 'collector', header: 'Collector', icon: 'sensors', optional: true, width: '17%', minWidth: 370 }
  ],
  defaultSort: { active: 'duration', direction: 'desc' },
  slices: [
    {
      title: 'Depuis',
      columnKey: 'duration',
      hidden: true,
      categories: [
        { key: '< 1h', label: '< 1h', filter: (row) => (new Date().getTime() - row.start) / 1000 < 3600 },
        { key: '1h - 6h', label: '1h - 6h', filter: (row) => { const s = (new Date().getTime() - row.start) / 1000; return s >= 3600 && s < 6 * 3600; } },
        { key: '6h - 12h', label: '6h - 12h', filter: (row) => { const s = (new Date().getTime() - row.start) / 1000; return s >= 6 * 3600 && s < 12 * 3600; } },
        { key: '12h - 1j', label: '12h - 1j', filter: (row) => { const s = (new Date().getTime() - row.start) / 1000; return s >= 12 * 3600 && s < 86400; } },
        { key: '1j - 7j', label: '1j - 7j', filter: (row) => { const s = (new Date().getTime() - row.start) / 1000; return s >= 86400 && s < 7 * 86400; } },
        { key: '> 7 jours', label: '> 7 jours', filter: (row) => (new Date().getTime() - row.start) / 1000 >= 7 * 86400 }
      ]
    }
  ]
}

export const SESSION_EVENT_TABLE_CONFIG: TableProvider<SessionEventDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'appName', header: 'Application', width: '13%', minWidth: 120, icon:'widgets' },
    { key: 'type', header: 'Type', icon: 'label', minWidth: 100, optional: true, groupable: true, sliceable: true },
    {
      key: 'instant', header: 'Date', icon: 'schedule', width: '10%', minWidth: 280, groupable: false, sliceable: false,
      searchValue: (row: SessionEventDto) => fmtStart(row.instant)
    },
    { key: 'resource', header: 'Actions', groupable: false, sliceable: false, icon: 'info' , width: '50%', minWidth: 400,
      sortValue: (row: SessionEventDto) => row.value,
      searchValue: (row: SessionEventDto) => fmtMethod(row.type) + ' ' + (row.value || '')
    },
    { key: 'scope', header: 'Thread', icon: 'call_split', width: '15%', minWidth: 150 },
    { key: 'action', width: '10%', minWidth: 60, sliceable: false, groupable: false, sortable: false, inFieldsMenu: false },
  ],
  defaultSort: { active: 'instant', direction: 'desc' },
  rowClass: (row: SessionEventDto) => {
    if (row.type === 'INFO') return 'row-ok';
    if (row.type === 'ERROR') return 'row-ko';
    if (row.type === 'WARN') return 'row-warning';
    return 'row-standard';
  }
}
