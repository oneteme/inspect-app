import {TableProvider} from '@oneteme/jquery-table';
import {DatabaseRequestDto, DirectoryRequestDto, FtpRequestDto, MailRequestDto, MainSessionDto, RestRequestDto, RestSessionDto} from '../../../model/request.model';
import {AbstractStage, LocalRequest, LogEntry} from "../../../model/trace.model";

export const DEFAULT_TABLE_CONFIG: TableProvider<any> = {
  enableSearchBar: true,
  enableViewButton: true,
  allowColumnRemoval: true,
  enablePagination: true,
  pageSize: 10,
  enableColumnDragDrop: false,
  pageSizeOptions: [5, 10, 15, 20, 100],
  pageSizeOptionsGroupBy: [20, 50, 100, 200],
  emptyStateLabel: 'Aucun résultat',
  loadingStateLabel: 'Chargement des requêtes...'
};

export const REST_SESSION_TABLE_CONFIG: TableProvider<RestSessionDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'appName', header: 'Hôte', sortable: true, icon: 'dns', width: '18%' },
    { key: 'resource', header: 'Ressource', sortable: true, icon: 'category' },
    { key: 'start', header: 'Début', sortable: true, icon: 'schedule', width: '17%' },
    { key: 'duration', header: 'Durée', sortable: true, icon: 'timer', width: '13%',
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE },
    { key: 'user', header: 'Utilisateur', sortable: true, icon: 'person', width: '15%' },
    { key: 'status', header: 'Status', sortable: true, optional: true, icon: 'task_alt', width: '13%',
      value: (row: RestSessionDto) => {
        if(!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'exception', header: 'Exception', sortable: true, optional: true, icon: 'error_outline', width: '13%',
      value: (row: RestSessionDto) => {
        return row.exception?.type;
      }
    }
  ],
  slices: [
    { title: 'Status', columnKey: 'status', hidden: true  },
    { title: 'Hôte', columnKey: 'appName', hidden: true },
    {
      title: 'Durée',
      columnKey: 'duration',
      hidden: true,
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '> 5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    }],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: RestSessionDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    return '';
  }
}

export const MAIN_SESSION_TABLE_CONFIG: TableProvider<MainSessionDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'appName', header: 'Hôte', icon: 'dns',  width: '13%' },
    { key: 'name', header: 'Nom', icon: 'label',  width: '13%' },
    { key: 'location', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', groupable: false, icon: 'schedule',  width: '13%' },
    { key: 'duration', header: 'Durée', groupable: false, icon: 'timer',  width: '13%',
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person',  width: '13%' },
    { key: 'status', header: 'Status', optional: true, icon: 'task_alt', width: '13%',
      value: (row: MainSessionDto) => {
        if(!row.end) return 'En cours...';
        if(row.exception) return 'KO';
        if(!row.exception) return 'OK';
      }
    },
    { key: 'exception', header: 'Exception', sortable: true, optional: true, icon: 'error_outline', width: '13%',
      value: (row: MainSessionDto) => {
        return row.exception?.type;
      }
    }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null },
      ]
    }],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: MainSessionDto) => {
    if(!row.end) return '';
    if (row.end && !row.exception) return 'row-ok';
    if (row.end && row.exception) return 'row-ko';
  }
}

export const REST_REQUEST_TABLE_CONFIG: TableProvider<RestRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person' },
    { key: 'status', header: 'Status', sortable: true, optional: true, icon: 'task_alt',
      value: (row: RestSessionDto) => {
        if (!row.end) return 'En cours...';
        return row.status;
      }
    },
    { key: 'exception', header: 'Exception', sortable: true, optional: true, icon: 'error_outline',
      value: (row: RestSessionDto) => row.exception?.type
    },
    { key: 'action', header: 'Action', icon: 'touch_app', sliceable: false, groupable: false, sortable: false }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms',     label: '< 100ms',       filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms',  label: '100ms - 500ms',  filter: (row) => row.end != null && (row.end - row.start) >= 0.1  && (row.end - row.start) < 0.5 },
        { key: '500ms-1s',   label: '500ms - 1s',     filter: (row) => row.end != null && (row.end - row.start) >= 0.5  && (row.end - row.start) < 1 },
        { key: '1s-5s',      label: '1s - 5s',        filter: (row) => row.end != null && (row.end - row.start) >= 1    && (row.end - row.start) < 5 },
        { key: '>5s',        label: '> 5s',           filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress',label: 'En cours...',    filter: (row) => row.end == null }
      ]
    },
    { title: 'Méthode',   columnKey: 'method', icon: 'label' },
    { title: 'Ressource', columnKey: 'path',   icon: 'category' }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: RestSessionDto) => {
    const code = row.status;
    if (code >= 500) return 'row-ko';
    if (code >= 400) return 'row-warning';
    if (code >= 200) return 'row-ok';
    if (code == 0 && row.end) return 'row-unavailable';
    return '';
  }
};

export const DATABASE_REQUEST_TABLE_CONFIG: TableProvider<DatabaseRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person' },
    { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
      value: (row) => !row.end ? 'En cours...' : row.failed ? 'KO' : 'OK'
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline',
      value: (row) => row.exception?.type
    }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    },
    {
      title: 'Commande',
      columnKey: 'command',
      icon: 'label'
    },
    {
      title: 'Ressource',
      columnKey: 'schema',
      icon: 'category'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: DatabaseRequestDto) => {
    const failed = row.failed;
    if(row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
};

export const FTP_REQUEST_TABLE_CONFIG: TableProvider<FtpRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person' },
    { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
      value: (row) => !row.end ? 'En cours...' : row.failed ? 'KO' : 'OK'
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline',
      value: (row) => row.exception?.type
    }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    },
    {
      title: 'Commande',
      columnKey: 'command',
      icon: 'label'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: FtpRequestDto) => {
    const failed = row.failed;
    if(row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
}

export const LDAP_REQUEST_TABLE_CONFIG: TableProvider<DirectoryRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person' },
    { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
      value: (row) => !row.end ? 'En cours...' : row.failed ? 'KO' : 'OK'
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', value: (row) => row.exception?.type }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    },
    {
      title: 'Commande',
      columnKey: 'command',
      icon: 'label'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: DirectoryRequestDto) => {
    const failed = row.failed;
    if(row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
};

export const LOCAL_REQUEST_TABLE_CONFIG: TableProvider<LocalRequest> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person' },
    { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
      value: (row) => !row.end ? 'En cours...' : row.failed ? 'KO' : 'OK'
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', value: (row) => row.exception?.type }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    },
    {
      title: 'Commande',
      columnKey: 'command',
      icon: 'label'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: LocalRequest) => {
    const failed = row.exception;
    if(row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
};

export const SMTP_REQUEST_TABLE_CONFIG: TableProvider<MailRequestDto> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'host', header: 'Hôte', icon: 'dns' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'user', header: 'Utilisateur', icon: 'person' },
    { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
      value: (row) => !row.end ? 'En cours...' : row.failed ? 'KO' : 'OK'
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', value: (row) => row.exception?.type }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    },
    {
      title: 'Commande',
      columnKey: 'command',
      icon: 'label'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: MailRequestDto) => {
    const failed = row.failed;
    if(row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
};

export const STAGE_TABLE_CONFIG: TableProvider<AbstractStage> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'name', header: 'Evènement', icon: 'event_list' },
    { key: 'resource', header: 'Ressource', icon: 'category' },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'duration', header: 'Durée', icon: 'timer', groupable: false,
      sortValue: (row) => row.end != null ? row.end - row.start : Number.MAX_VALUE
    },
    { key: 'failed', header: 'Statut', optional: true, icon: 'task_alt',
      value: (row) => !row.end ? 'En cours...' : row.exception ? 'KO' : 'OK'
    },
    { key: 'exception', header: 'Exception', optional: true, icon: 'error_outline', value: (row) => row.exception?.type }
  ],
  slices: [
    {
      title: 'Durée',
      columnKey: 'duration',
      categories: [
        { key: '<100ms', label: '< 100ms', filter: (row) => row.end != null && (row.end - row.start) < 0.1 },
        { key: '100-500ms', label: '100ms - 500ms', filter: (row) => row.end != null && (row.end - row.start) >= 0.1 && (row.end - row.start) < 0.5 },
        { key: '500ms-1s', label: '500ms - 1s', filter: (row) => row.end != null && (row.end - row.start) >= 0.5 && (row.end - row.start) < 1 },
        { key: '1s-5s', label: '1s - 5s', filter: (row) => row.end != null && (row.end - row.start) >= 1 && (row.end - row.start) < 5 },
        { key: '>5s', label: '> 5s', filter: (row) => row.end != null && (row.end - row.start) >= 5 },
        { key: 'in-progress', label: 'En cours...', filter: (row) => row.end == null }
      ]
    },
    {
      title: 'Commande',
      columnKey: 'command',
      icon: 'label'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' },
  rowClass: (row: AbstractStage) => {
    const failed = row.exception;
    if(row.end == null) return '';
    if (failed) return 'row-ko';
    if (!failed) return 'row-ok';
  }
};

export const LOG_TABLE_CONFIG: TableProvider<LogEntry> = {
  ...DEFAULT_TABLE_CONFIG,
  columns: [
    { key: 'message', header: 'Message', icon: 'chat', sliceable: false, groupable: false },
    { key: 'start', header: 'Début', icon: 'schedule', sliceable: false, groupable: false },
    { key: 'action', header: 'Action', icon: 'touch_app', sliceable: false, groupable: false, sortable: false }
  ],
  slices: [
    {
      title: 'Type de log',
      columnKey: 'level',
      icon: 'label'
    }
  ],
  defaultSort: { active: 'start', direction: 'desc' }
};