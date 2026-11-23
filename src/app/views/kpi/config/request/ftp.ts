import {STATUS_STACKS, STATUS_FILTER_ITEMS} from "../common";
import {FTP_ICONS, withMenuIcons} from "../icons";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartSection} from "../types";

export const FTP_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'status',
        buildAlias: () => 'status'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'count',
      selected: true,
      menu: {
        label: 'Nombre d\'Appel',
        icon: 'numbers'
      },
      jquery: {
        value: () => 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: STATUS_STACKS()
      }
    }]
  },
  groups: FTP_GROUPS_CONFIG(groupedBy),
  filters: FTP_FILTERS_CONFIG(filterGroupedBy)
});

export const FTP_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'elapsed_time',
        buildAlias: () => 'elapsedtime',
        buildName: () => 'Temps'
      }
    }]
  },
  indicators: PERFORMANCE_INDICATORS(),
  groups: FTP_GROUPS_CONFIG(groupedBy),
  filters: FTP_FILTERS_CONFIG(filterGroupedBy)
});

export const FTP_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(FTP_ICONS, {
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: () => `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: `start.${groupedBy}.asc`,
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Serveur'
    },
    jquery: {
      value: () => `host`,
      buildAlias: () => 'host',
      order: 'host.asc'
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: () => `user.coalesce("Unknown")`,
      buildAlias: () => 'user',
      order: 'user.asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: () => `command.coalesce("Unknown")`,
      buildAlias: () => 'command',
      order: 'command.asc',
    }
  }, {
    key: 'server_version',
    selected: false,
    menu: {
      label: 'Version du serveur'
    },
    jquery: {
      value: () => `server_version.coalesce("Unknown")`,
      buildAlias: () => 'server_version',
      order: 'server_version.asc',
    }
  }, {
    key: 'client_version',
    selected: false,
    menu: {
      label: 'Version du client'
    },
    jquery: {
      value: () => `client_version.coalesce("Unknown")`,
      buildAlias: () => 'client_version',
      order: 'client_version.asc',
    }
  }, {
    key: 'thread',
    selected: false,
    menu: {
      label: 'Thread'
    },
    jquery: {
      value: () => `thread.coalesce("Unknown")`,
      buildAlias: () => 'thread',
      order: 'thread.asc',
    }
  }, {
    key: 'protocol',
    selected: false,
    menu: {
      label: 'Protocole'
    },
    jquery: {
      value: () => `protocol.coalesce("Unknown")`,
      buildAlias: () => 'protocol',
      order: 'protocol.asc',
    }
  }, {
    key: 'application',
    selected: false,
    menu: {
      label: 'Application'
    },
    jquery: {
      value: () => `instance.app_name`,
      buildAlias: () => 'application',
      order: 'application.asc',
    }
  }, {
    key: 'version',
    selected: false,
    menu: {
      label: 'Version'
    },
    jquery: {
      value: () => `instance.version.coalesce("Unknown")`,
      buildAlias: () => 'version',
      order: 'version.asc',
    }
  }]
});

export const FTP_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(FTP_ICONS, {
  optional: true,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: () => `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: `start.${groupedBy}.asc`,
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Serveur'
    },
    jquery: {
      value: () => `host`,
      buildAlias: () => 'host',
      order: 'host.asc'
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: () => `user.coalesce("Unknown")`,
      buildAlias: () => 'user',
      order: 'user.asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: () => `command.coalesce("Unknown")`,
      buildAlias: () => 'command',
      order: 'command.asc',
    }
  }, {
    key: 'server_version',
    selected: false,
    menu: {
      label: 'Version du serveur'
    },
    jquery: {
      value: () => `server_version.coalesce("Unknown")`,
      buildAlias: () => 'server_version',
      order: 'server_version.asc',
    }
  }, {
    key: 'client_version',
    selected: false,
    menu: {
      label: 'Version du client'
    },
    jquery: {
      value: () => `client_version.coalesce("Unknown")`,
      buildAlias: () => 'client_version',
      order: 'client_version.asc',
    }
  }, {
    key: 'thread',
    selected: false,
    menu: {
      label: 'Thread'
    },
    jquery: {
      value: () => `thread.coalesce("Unknown")`,
      buildAlias: () => 'thread',
      order: 'thread.asc',
    }
  }, {
    key: 'protocol',
    selected: false,
    menu: {
      label: 'Protocole'
    },
    jquery: {
      value: () => `protocol.coalesce("Unknown")`,
      buildAlias: () => 'protocol',
      order: 'protocol.asc',
    }
  }, {
    key: 'application',
    selected: false,
    menu: {
      label: 'Application'
    },
    jquery: {
      value: () => `instance.app_name`,
      buildAlias: () => 'application',
      order: 'application.asc',
    }
  }, {
    key: 'version',
    selected: false,
    menu: {
      label: 'Version'
    },
    jquery: {
      value: () => `instance.version.coalesce("Unknown")`,
      buildAlias: () => 'version',
      order: 'version.asc',
    }
  }, ...STATUS_FILTER_ITEMS()]
});
