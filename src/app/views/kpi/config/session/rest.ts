import {SIZE_TRANCHE} from "../colors";
import {STATUS_STACKS, USER_AGENT_ITEMS, STATUS_FILTER_ITEMS} from "../common";
import {SESSION_REST_ICONS, withMenuIcons} from "../icons";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartSection} from "../types";

export const REST_SESSION_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_SESSION_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
        stacks: {
          optional: false,
          items: [...STATUS_STACKS().items, ...USER_AGENT_ITEMS()]
        }
      }
    }]
  },
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_SESSION_VOLUMETRY_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ( {
  series: {
    optional: false,
    items: [{
      key: 'size_in',
      selected: true,
      menu: {
        label: '↑'
      },
      jquery: {
        value: () => 'size_in_notnull',
        buildAlias: () => 'size_in'
      }
    }, {
      key: 'size_out',
      selected: true,
      menu: {
        label: '↓'
      },
      jquery: {
        value: () => 'size_out_notnull',
        buildAlias: () => 'size_out'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'count',
      selected: true,
      menu: {
        label: 'Nombre d\'Appel'
      },
      jquery: {
        value: () => 'count',
        buildAlias: (value: string) => 'count_' + value
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'size_tranche',
            selected: true,
            menu: {
              label: 'Tranche'
            },
            jquery: {
              value: (serieAlias: string) => serieAlias + '_tranche',
              buildAlias: () => 'size_tranche',
              buildName: (chartItem, value) => chartItem.menu.label + " " + SIZE_TRANCHE[value].label,
              buildColor: (value) => SIZE_TRANCHE[value].color
            }
          }]
        }
      }
    }, {
      key: 'sum',
      selected: false,
      unit: {
        baseUnit: 'o',
        scales: [
          { unit: 'o', scale: 1, threshold: 1024 },
          { unit: 'Ko', scale: 1/1024, threshold: 1024 * 1024 },
          { unit: 'Mo', scale: 1/(1024 * 1024), threshold: 1024 * 1024 * 1024 },
          { unit: 'Go', scale: 1/(1024 * 1024 * 1024), threshold: Infinity }
        ]
      },
      menu: {
        label: 'Total'
      },
      jquery: {
        value:  (s: string) => `${s}.sum`,
        buildAlias: (value) => 'sum_' + value,
        buildName: (chartItem, value) => chartItem.menu.label,
      }
    }, {
      key: 'min',
      selected: false,
      unit: {
        baseUnit: 'o',
        scales: [
          { unit: 'o', scale: 1, threshold: 1024 },
          { unit: 'Ko', scale: 1/1024, threshold: 1024 * 1024 },
          { unit: 'Mo', scale: 1/(1024 * 1024), threshold: 1024 * 1024 * 1024 },
          { unit: 'Go', scale: 1/(1024 * 1024 * 1024), threshold: Infinity }
        ]
      },
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value:  (s: string) => `${s}.min`,
        buildAlias: (value) => 'min_' + value,
        buildName: (chartItem, value) => chartItem.menu.label,
      }
    }, {
      key: 'max',
      selected: false,
      unit: {
        baseUnit: 'o',
        scales: [
          { unit: 'o', scale: 1, threshold: 1024 },
          { unit: 'Ko', scale: 1/1024, threshold: 1024 * 1024 },
          { unit: 'Mo', scale: 1/(1024 * 1024), threshold: 1024 * 1024 * 1024 },
          { unit: 'Go', scale: 1/(1024 * 1024 * 1024), threshold: Infinity }
        ]
      },
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value:  (s: string) => `${s}.max`,
        buildAlias: (value) => 'max_' + value,
        buildName: (chartItem) => chartItem?.menu?.label ?? '',
      }
    }]
  },
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_SESSION_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SESSION_REST_ICONS, {
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
      value: () => `path.coalesce("Unknown")`,
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
      value: () => `api_name.coalesce("Unknown")`,
      buildAlias: () => 'name',
      order: 'name.asc'
    }
  }, {
    key: 'method',
    selected: false,
    menu: {
      label: 'Méthode'
    },
    jquery: {
      value: () => `method.coalesce("Unknown")`,
      buildAlias: () => 'method',
      order: 'method.asc'
    }
  }, {
    key: 'httpHost',
    selected: false,
    menu: {
      label: 'Hôte HTTP'
    },
    jquery: {
      value: () => `host.coalesce("Unknown")`,
      buildAlias: () => 'httpHost',
      order: 'httpHost.asc'
    }
  }, ...USER_AGENT_ITEMS(), {
    key: 'media',
    selected: false,
    menu: {
      label: 'Content-Type'
    },
    jquery: {
      value: () => `media.coalesce("No Content")`,
      buildAlias: () => 'media',
      order: 'media.asc'
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
  }, {
    key: 'auth',
    selected: false,
    menu: {
      label: 'Auth'
    },
    jquery: {
      value: () => `auth.coalesce("No Auth")`,
      buildAlias: () => 'auth',
      order: 'auth.asc'
    }
  }]
});

export const REST_SESSION_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SESSION_REST_ICONS, {
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
      value: () => `path.coalesce("Unknown")`,
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
      value: () => `api_name.coalesce("Unknown")`,
      buildAlias: () => 'name',
      order: 'name.asc'
    }
  }, {
    key: 'method',
    selected: false,
    menu: {
      label: 'Méthode'
    },
    jquery: {
      value: () => `method.coalesce("Unknown")`,
      buildAlias: () => 'method',
      order: 'method.asc'
    }
  }, {
    key: 'httpHost',
    selected: false,
    menu: {
      label: 'Hôte HTTP'
    },
    jquery: {
      value: () => `host.coalesce("Unknown")`,
      buildAlias: () => 'httpHost',
      order: 'httpHost.asc'
    }
  }, ...USER_AGENT_ITEMS(), {
    key: 'media',
    selected: false,
    menu: {
      label: 'Content-Type'
    },
    jquery: {
      value: () => `media.coalesce("No Content")`,
      buildAlias: () => 'media',
      order: 'media.asc'
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
  }, {
    key: 'auth',
    selected: false,
    menu: {
      label: 'Auth'
    },
    jquery: {
      value: () => `auth.coalesce("No Auth")`,
      buildAlias: () => 'auth',
      order: 'auth.asc'
    }
  }, ...STATUS_FILTER_ITEMS()]
});
