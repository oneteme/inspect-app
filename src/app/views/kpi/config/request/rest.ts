import {SIZE_TRANCHE} from "../colors";
import {DURATION_UNIT, STATUS_STACKS, STATUS_FILTER_ITEMS} from "../common";
import {REQUEST_REST_ICONS, withMenuIcons} from "../icons";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {ChartConfig, ChartSection} from "../types";

export const REST_PERFORMANCE_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_STATUS_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_VOLUMETRY_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ( {
  series: {
    optional: false,
    items: [{
      key: 'size_out',
      selected: true,
      menu: {
        label: '↑'
      },
      jquery: {
        value: () => 'size_out_notnull',
        buildAlias: () => 'size_out'
      }
    }, {
      key: 'size_in',
      selected: true,
      menu: {
        label: '↓'
      },
      jquery: {
        value: () => 'size_in_notnull',
        buildAlias: () => 'size_in'
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
      group: 'Taille',
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
        value: (s: string) => `${s}.sum`,
        buildAlias: (value) => 'sum_' + value,
        buildName: (chartItem) => chartItem?.menu?.label ?? '',
      }
    }, {
      key: 'min',
      selected: false,
      group: 'Taille',
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
        value: (s: string) => `${s}.min`,
        buildAlias: (value) => 'min_' + value,
        buildName: (chartItem) => chartItem?.menu?.label ?? '',
      }
    }, {
      key: 'max',
      selected: false,
      group: 'Taille',
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
        value: (s: string) => `${s}.max`,
        buildAlias: (value) => 'max_' + value,
        buildName: (chartItem) => chartItem?.menu?.label ?? '',
      }
    }]
  },
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(filterGroupedBy)
});

// Audience : nombre d'utilisateurs distincts. Empiler est proposé par l'organizer à partir du groupement choisi.
export const AUDIENCE_CHART_CONFIG = (groups: ChartSection, filters?: ChartSection): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'user',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: () => 'user.distinct',
        buildAlias: () => 'user'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'count',
      selected: true,
      menu: {
        label: 'Utilisateurs'
      },
      jquery: {
        value: (s: string) => `count(${s})`,
        buildAlias: () => 'count',
        buildName: () => 'Utilisateurs'
      }
    }]
  },
  groups,
  filters
});

export const REST_LATENCY_CHART_CONFIG = (groupedBy: string, filterGroupedBy: string = groupedBy): ChartConfig => ({
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
  indicators: {
    optional: false,
    items: [{
      key: 'avg',
      selected: true,
      group: 'Durées',
      unit: DURATION_UNIT,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: (s: string) => `avg`,
        buildAlias: () => 'avg',
        buildName: (chartItem) => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      group: 'Durées',
      unit: DURATION_UNIT,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: (s: string) => `min`,
        buildAlias: () => 'min',
        buildName: (chartItem) => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      group: 'Durées',
      unit: DURATION_UNIT,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: (s: string) => `max`,
        buildAlias: () => 'max',
        buildName: (chartItem) => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(REQUEST_REST_ICONS, {
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
      order: 'user.asc'
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
    key: 'path',
    selected: false,
    menu: {
      label: 'Point d\'accès'
    },
    jquery: {
      value: () => `path.coalesce("Unknown")`,
      buildAlias: () => 'path',
      order: 'path.asc'
    }
  }, {
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
    key: 'application',
    selected: false,
    menu: {
      label: 'Application'
    },
    jquery: {
      value: () => `instance.app_name`,
      buildAlias: () => 'application',
      order: 'application.asc'
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

export const REST_FILTERS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(REQUEST_REST_ICONS, {
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
      order: 'user.asc'
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
    key: 'path',
    selected: false,
    menu: {
      label: 'Point d\'accès'
    },
    jquery: {
      value: () => `path.coalesce("Unknown")`,
      buildAlias: () => 'path',
      order: 'path.asc'
    }
  }, {
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
    key: 'application',
    selected: false,
    menu: {
      label: 'Application'
    },
    jquery: {
      value: () => `instance.app_name`,
      buildAlias: () => 'application',
      order: 'application.asc'
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
