import {STATUS_STACKS, STATUS_FILTER_ITEMS} from "../common";
import {JDBC_ICONS, withMenuIcons} from "../icons";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartSection} from "../types";

export const JDBC_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: JDBC_GROUPS_CONFIG(groupedBy),
  filters: JDBC_FILTERS_CONFIG(filterGroupedBy)
});

export const JDBC_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: JDBC_GROUPS_CONFIG(groupedBy),
  filters: JDBC_FILTERS_CONFIG(filterGroupedBy)
});

export const JDBC_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(JDBC_ICONS, {
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
    key: 'db_name',
    selected: false,
    menu: {
      label: 'Base de données'
    },
    jquery: {
      value: () => `db_name.coalesce("Unknown")`,
      buildAlias: () => 'db_name',
      order: 'db_name.asc',
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
    key: 'schema',
    selected: false,
    menu: {
      label: 'Schéma'
    },
    jquery: {
      value: () => `schema.coalesce("Unknown")`,
      buildAlias: () => 'schema',
      order: 'schema.asc',
    }
  }, {
    key: 'db_version',
    selected: false,
    menu: {
      label: 'Version de la base de données'
    },
    jquery: {
      value: () => `db_version.coalesce("Unknown")`,
      buildAlias: () => 'db_version',
      order: 'db_version.asc',
    }
  }, {
    key: 'driver',
    selected: false,
    menu: {
      label: 'Version du driver'
    },
    jquery: {
      value: () => `driver.coalesce("Unknown")`,
      buildAlias: () => 'driver',
      order: 'driver.asc',
    }
  }, {
    key: 'scheme',
    selected: false,
    menu: {
      label: 'Éditeur'
    },
    jquery: {
      value: () => `scheme.coalesce("Unknown")`,
      buildAlias: () => 'scheme',
      order: 'scheme.asc',
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

export const JDBC_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(JDBC_ICONS, {
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
    key: 'db_name',
    selected: false,
    menu: {
      label: 'Base de données'
    },
    jquery: {
      value: () => `db_name.coalesce("Unknown")`,
      buildAlias: () => 'db_name',
      order: 'db_name.asc',
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
    key: 'schema',
    selected: false,
    menu: {
      label: 'Schéma'
    },
    jquery: {
      value: () => `schema.coalesce("Unknown")`,
      buildAlias: () => 'schema',
      order: 'schema.asc',
    }
  }, {
    key: 'db_version',
    selected: false,
    menu: {
      label: 'Version de la base de données'
    },
    jquery: {
      value: () => `db_version.coalesce("Unknown")`,
      buildAlias: () => 'db_version',
      order: 'db_version.asc',
    }
  }, {
    key: 'driver',
    selected: false,
    menu: {
      label: 'Version du driver'
    },
    jquery: {
      value: () => `driver.coalesce("Unknown")`,
      buildAlias: () => 'driver',
      order: 'driver.asc',
    }
  }, {
    key: 'scheme',
    selected: false,
    menu: {
      label: 'Éditeur'
    },
    jquery: {
      value: () => `scheme.coalesce("Unknown")`,
      buildAlias: () => 'scheme',
      order: 'scheme.asc',
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
