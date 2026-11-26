import {STATUS_STACKS, USER_AGENT_ITEMS, STATUS_FILTER_ITEMS} from "../common";
import {SESSION_REST_ICONS, withMenuIcons} from "../icons";
import {dateDimension} from "../items";
import {PERFORMANCE_INDICATORS} from "../performance-indicators";
import {VOLUMETRY_INDICATORS} from "../volumetry-indicators";
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
  indicators: VOLUMETRY_INDICATORS(),
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(filterGroupedBy)
});

export const REST_SESSION_GROUPS_CONFIG = (groupedBy: string): ChartSection => withMenuIcons(SESSION_REST_ICONS, {
  optional: false,
  items: [dateDimension(groupedBy, true), {
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
  items: [dateDimension(groupedBy, false), {
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
