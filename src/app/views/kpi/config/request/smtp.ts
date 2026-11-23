import {STATUS_STACKS, STATUS_FILTER_ITEMS} from "../common";
import {SMTP_ICONS, withMenuIcons} from "../icons";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartSection} from "../types";

export const SMTP_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: SMTP_GROUPS_CONFIG(groupedBy),
  filters: SMTP_FILTERS_CONFIG(filterGroupedBy)
});

export const SMTP_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: SMTP_GROUPS_CONFIG(groupedBy),
  filters: SMTP_FILTERS_CONFIG(filterGroupedBy)
});

export const SMTP_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SMTP_ICONS, {
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

export const SMTP_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SMTP_ICONS, {
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
