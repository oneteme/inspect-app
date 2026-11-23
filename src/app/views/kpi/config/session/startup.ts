import {STATUS_STACKS, STATUS_FILTER_ITEMS} from "../common";
import {SESSION_STARTUP_ICONS, withMenuIcons} from "../icons";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartSection} from "../types";

export const STARTUP_SESSION_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'type',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'type',
        buildAlias: () => 'type'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'count',
      selected: true,
      menu: {
        label: 'Nombre de lancement',
        icon: 'numbers'
      },
      jquery: {
        value: () => 'count',
        buildAlias: () => 'count',
        buildName: () => 'Nombre de lancement'
      },
      extra: {
        stacks: STATUS_STACKS()
      }
    }]
  },
  groups: STARTUP_SESSION_GROUPS_CONFIG(groupedBy),
  filters: STARTUP_SESSION_FILTERS_CONFIG(filterGroupedBy)
});

export const STARTUP_SESSION_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
        buildAlias: () => 'elapsedtime'
      }
    }]
  },
  indicators: PERFORMANCE_INDICATORS(),
  groups: STARTUP_SESSION_GROUPS_CONFIG(groupedBy),
  filters: STARTUP_SESSION_FILTERS_CONFIG(filterGroupedBy)
});

export const STARTUP_SESSION_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SESSION_STARTUP_ICONS, {
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
      order: `start.${groupedBy}.asc`
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Application'
    },
    jquery: {
      value: () => `instance.app_name`,
      buildAlias: () => 'host',
      order: 'host.asc'
    }
  }, {
    key: 'resource',
    selected: false,
    menu: {
      label: 'Ressource'
    },
    jquery: {
      value: () => `location`,
      buildAlias: () => 'resource',
      order: 'resource.asc'
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
      order: 'user.asc'
    }
  }, {
    key: 'name',
    selected: false,
    menu: {
      label: 'Nom'
    },
    jquery: {
      value: () => `name`,
      buildAlias: () => 'name',
      order: 'name.asc'
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
      order: 'thread.asc'
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
      order: 'version.asc'
    }
  }]
});

export const STARTUP_SESSION_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SESSION_STARTUP_ICONS, {
  optional: false,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: () => `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: `start.${groupedBy}.asc`
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Application'
    },
    jquery: {
      value: () => `instance.app_name`,
      buildAlias: () => 'host',
      order: 'host.asc'
    }
  }, {
    key: 'resource',
    selected: false,
    menu: {
      label: 'Ressource'
    },
    jquery: {
      value: () => `location`,
      buildAlias: () => 'resource',
      order: 'resource.asc'
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
      order: 'user.asc'
    }
  }, {
    key: 'name',
    selected: false,
    menu: {
      label: 'Nom'
    },
    jquery: {
      value: () => `name`,
      buildAlias: () => 'name',
      order: 'name.asc'
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
      order: 'thread.asc'
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
      order: 'version.asc'
    }
  }, ...STATUS_FILTER_ITEMS()]
});
