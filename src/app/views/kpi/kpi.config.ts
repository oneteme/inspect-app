import {field} from "@oneteme/jquery-core";
import {SerieProvider} from "@oneteme/jquery-core/lib/jquery-core.model";

export const REST_SESSION_PERFORMANCE_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime'
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'performance_tranche',
            selected: true,
            menu: {
              label: 'Par tranche 1',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche',
              buildAlias: () => 'performance_tranche',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
            }
          }, {
            key: 'performance_tranche2',
            selected: false,
            menu: {
              label: 'Par tranche 2',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche2',
              buildAlias: () => 'performance_tranche2',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
            }
          }]
        }
      }
    }, {
      key: 'avg',
      selected: false,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: (chartItem) => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: (chartItem) => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: (chartItem) => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(groupedBy)
});

export const REST_SESSION_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'status',
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'status_stack',
            selected: true,
            menu: {
              label: 'Par statut'
            },
            jquery: {
              value: 'status',
              buildAlias: () => 'status',
              buildName: (chartItem, value) => value,
              buildColor: (value: string) => statusColor(value)
            }
          }, {
            key: 'status_tranche',
            selected: false,
            menu: {
              label: 'Par tranche'
            },
            jquery: {
              value: 'status_tranche',
              buildAlias: () => 'status_tranche',
              buildColor: (value: string) => STATUS_TRANCHE[value].color,
              buildName: (chartItem, value) => STATUS_TRANCHE[value].label
            }
          }]
        }
      }
    }]
  },
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(groupedBy)
});

export const REST_SESSION_VOLUMETRY_CHART_CONFIG = (groupedBy: string): ChartConfig => ( {
  series: {
    optional: false,
    items: [{
      key: 'size_in',
      selected: true,
      menu: {
        label: 'Données reçues'
      },
      jquery: {
        value: 'size_in_notnull',
        buildAlias: () => 'size_in'
      }
    }, {
      key: 'size_out',
      selected: true,
      menu: {
        label: 'Données envoyées'
      },
      jquery: {
        value: 'size_out_notnull',
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
        value: 'count',
        buildAlias: (value: string) => 'count_' + value
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'size_tranche',
            selected: true,
            menu: {
              label: 'Par tranche'
            },
            jquery: {
              value: 'size_tranche',
              buildAlias: () => 'size_tranche',
              buildName: (chartItem, value) => SIZE_TRANCHE[value].label + " " + chartItem.menu.label,
              buildColor: (value) => SIZE_TRANCHE[value].color
            }
          }]
        }
      }
    }, {
      key: 'sum',
      selected: false,
      menu: {
        label: 'Total'
      },
      jquery: {
        value: 'sum',
        buildAlias: (value) => 'sum_' + value,
        buildName: (chartItem, value) => 'Total ' + chartItem.menu.label,
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: (value) => 'min_' + value,
        buildName: (chartItem, value) => 'Minimum ' + chartItem.menu.label,
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: (value) => 'max_' + value,
        buildName: (chartItem, value) => 'Maximum ' + chartItem.menu.label,
      }
    }]
  },
  groups: REST_SESSION_GROUPS_CONFIG(groupedBy),
  filters: REST_SESSION_FILTERS_CONFIG(groupedBy)
});

export const REST_SESSION_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc'
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Hôte'
    },
    jquery: {
      value: `instance.app_name`,
      buildAlias: () => 'host',
      order: 'asc'
    }
  }, {
    key: 'name',
    selected: false,
    menu: {
      label: 'Api'
    },
    jquery: {
      value: `api_name.coalesce("<empty>")`,
      buildAlias: () => 'name',
      order: 'asc'
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc'
    }
  }, {
    key: 'method',
    selected: false,
    menu: {
      label: 'Method'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'method',
      order: 'asc'
    }
  }, {
    key: 'media',
    selected: false,
    menu: {
      label: 'Media'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'media',
      order: 'asc'
    }
  }, {
    key: 'auth',
    selected: false,
    menu: {
      label: 'Auth'
    },
    jquery: {
      value: `auth.coalesce("<empty>")`,
      buildAlias: () => 'auth',
      order: 'asc'
    }
  }]
});

export const REST_SESSION_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc'
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Hôte'
    },
    jquery: {
      value: `instance.app_name`,
      buildAlias: () => 'host',
      order: 'asc'
    }
  }, {
    key: 'name',
    selected: false,
    menu: {
      label: 'Api'
    },
    jquery: {
      value: `api_name.coalesce("<empty>")`,
      buildAlias: () => 'name',
      order: 'asc'
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc'
    }
  }, {
    key: 'method',
    selected: false,
    menu: {
      label: 'Method'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'method',
      order: 'asc'
    }
  }, {
    key: 'media',
    selected: false,
    menu: {
      label: 'Media'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'media',
      order: 'asc'
    }
  }, {
    key: 'auth',
    selected: false,
    menu: {
      label: 'Auth'
    },
    jquery: {
      value: `auth.coalesce("<empty>")`,
      buildAlias: () => 'auth',
      order: 'asc'
    }
  }]
});

export const BATCH_SESSION_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'type',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'type',
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
        label: 'Nombre d\'Appel',
        icon: 'numbers'
      },
      jquery: {
        value: 'count',
        buildAlias: () => 'count',
        buildName: () => 'Nombre d\'Appel'
      }
    }]
  },
  groups: BATCH_SESSION_GROUPS_CONFIG(groupedBy),
  filters: BATCH_SESSION_FILTERS_CONFIG(groupedBy)
});

export const BATCH_SESSION_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc'
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Hôte'
    },
    jquery: {
      value: `instance.app_name`,
      buildAlias: () => 'host',
      order: 'asc'
    }
  }, {
    key: 'batch',
    selected: false,
    menu: {
      label: 'Tâches planifiées'
    },
    jquery: {
      value: `name`,
      buildAlias: () => 'name',
      order: 'asc'
    }
  }]
});

export const BATCH_SESSION_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc'
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Hôte'
    },
    jquery: {
      value: `instance.app_name`,
      buildAlias: () => 'host',
      order: 'asc'
    }
  }, {
    key: 'batch',
    selected: false,
    menu: {
      label: 'Tâches planifiées'
    },
    jquery: {
      value: `name`,
      buildAlias: () => 'name',
      order: 'asc'
    }
  }]
});

export const REST_PERFORMANCE_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime'
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'performance_tranche',
            selected: true,
            menu: {
              label: 'Par tranche 1',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche',
              buildAlias: () => 'performance_tranche',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
            }
          }, {
            key: 'performance_tranche2',
            selected: false,
            menu: {
              label: 'Par tranche 2',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche2',
              buildAlias: () => 'performance_tranche2',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
            }
          }]
        }
      }
    }, {
      key: 'avg',
      selected: false,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: (chartItem) => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: (chartItem) => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: (chartItem) => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(groupedBy)
});

export const REST_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'status',
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'status_stack',
            selected: true,
            menu: {
              label: 'Par statut'
            },
            jquery: {
              value: 'status',
              buildAlias: () => 'status',
              buildName: (chartItem, value) => value,
              buildColor: (value: string) => statusColor(value)
            }
          }, {
            key: 'status_tranche',
            selected: false,
            menu: {
              label: 'Par tranche'
            },
            jquery: {
              value: 'status_tranche',
              buildAlias: () => 'status_tranche',
              buildColor: (value: string) => STATUS_TRANCHE[value].color,
              buildName: (chartItem, value) => STATUS_TRANCHE[value].label
            }
          }]
        }
      }
    }]
  },
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(groupedBy)
});

export const REST_VOLUMETRY_CHART_CONFIG = (groupedBy: string): ChartConfig => ( {
  series: {
    optional: false,
    items: [{
      key: 'size_in',
      selected: true,
      menu: {
        label: 'Données reçues'
      },
      jquery: {
        value: 'size_in_notnull',
        buildAlias: () => 'size_in'
      }
    }, {
      key: 'size_out',
      selected: true,
      menu: {
        label: 'Données envoyées'
      },
      jquery: {
        value: 'size_out_notnull',
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
        value: 'count',
        buildAlias: (value: string) => 'count_' + value
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'size_tranche',
            selected: true,
            menu: {
              label: 'Par tranche'
            },
            jquery: {
              value: 'size_tranche',
              buildAlias: () => 'size_tranche',
              buildName: (chartItem, value) => SIZE_TRANCHE[value].label + " " + chartItem.menu.label,
              buildColor: (value) => SIZE_TRANCHE[value].color
            }
          }]
        }
      }
    }, {
      key: 'sum',
      selected: false,
      menu: {
        label: 'Total'
      },
      jquery: {
        value: 'sum',
        buildAlias: (value) => 'sum_' + value,
        buildName: (chartItem, value) => 'Total ' + chartItem.menu.label,
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: (value) => 'min_' + value,
        buildName: (chartItem, value) => 'Minimum ' + chartItem.menu.label,
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: (value) => 'max_' + value,
        buildName: (chartItem, value) => 'Maximum ' + chartItem.menu.label,
      }
    }]
  },
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(groupedBy)
});

export const REST_LATENCY_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime'
      }
    }]
  },
  indicators: {
    optional: false,
    items: [{
      key: 'avg',
      selected: true,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: (chartItem) => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: (chartItem) => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: (chartItem) => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: REST_GROUPS_CONFIG(groupedBy),
  filters: REST_FILTERS_CONFIG(groupedBy)
});

export const REST_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc'
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Hôte'
    },
    jquery: {
      value: `host`,
      buildAlias: () => 'host',
      order: 'asc'
    }
  }, {
    key: 'method',
    selected: false,
    menu: {
      label: 'Method'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'method',
      order: 'asc'
    }
  }, {
    key: 'media',
    selected: false,
    menu: {
      label: 'Media'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'media',
      order: 'asc'
    }
  }, {
    key: 'auth',
    selected: false,
    menu: {
      label: 'Auth'
    },
    jquery: {
      value: `auth.coalesce("<empty>")`,
      buildAlias: () => 'auth',
      order: 'asc'
    }
  }]
});

export const REST_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc'
    }
  }, {
    key: 'host',
    selected: false,
    menu: {
      label: 'Hôte'
    },
    jquery: {
      value: `host`,
      buildAlias: () => 'host',
      order: 'asc'
    }
  }, {
    key: 'method',
    selected: false,
    menu: {
      label: 'Method'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'method',
      order: 'asc'
    }
  }, {
    key: 'media',
    selected: false,
    menu: {
      label: 'Media'
    },
    jquery: {
      value: `method.coalesce("<empty>")`,
      buildAlias: () => 'media',
      order: 'asc'
    }
  }, {
    key: 'auth',
    selected: false,
    menu: {
      label: 'Auth'
    },
    jquery: {
      value: `auth.coalesce("<empty>")`,
      buildAlias: () => 'auth',
      order: 'asc'
    }
  }]
});

export const JDBC_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'failed',
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'status_stack',
            selected: true,
            menu: {
              label: 'Par statut'
            },
            jquery: {
              value: 'failed',
              buildAlias: () => 'status_stack',
              buildName: (chartItem, value) => REQUEST_STATUS_STACK[value].label,
              buildColor: (value) => REQUEST_STATUS_STACK[value].color
            }
          }]
        }
      }
    }]
  },
  groups: JDBC_GROUPS_CONFIG(groupedBy),
  filters: JDBC_FILTERS_CONFIG(groupedBy)
});

export const JDBC_PERFORMANCE_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime',
        buildName: () => 'Temps'
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'performance_tranche',
            selected: true,
            menu: {
              label: 'Par tranche 1',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche',
              buildAlias: () => 'performance_tranche',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
            }
          }, {
            key: 'performance_tranche2',
            selected: false,
            menu: {
              label: 'Par tranche 2',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche2',
              buildAlias: () => 'performance_tranche2',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
            }
          }]
        }
      }
    }, {
      key: 'avg',
      selected: false,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: () => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: () => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: () => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: JDBC_GROUPS_CONFIG(groupedBy),
  filters: JDBC_FILTERS_CONFIG(groupedBy)
});

export const JDBC_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'schema',
    selected: false,
    menu: {
      label: 'Schéma'
    },
    jquery: {
      value: `schema.coalesce("<empty>")`,
      buildAlias: () => 'schema',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }, {
    key: 'db_name',
    selected: false,
    menu: {
      label: 'Nom de la base de données'
    },
    jquery: {
      value: `db_name.coalesce("<empty>")`,
      buildAlias: () => 'db_name',
      order: 'asc',
    }
  }, {
    key: 'db_version',
    selected: false,
    menu: {
      label: 'Version de la base de données'
    },
    jquery: {
      value: `db_version.coalesce("<empty>")`,
      buildAlias: () => 'db_version',
      order: 'asc',
    }
  }, {
    key: 'driver',
    selected: false,
    menu: {
      label: 'Version du driver'
    },
    jquery: {
      value: `driver.coalesce("<empty>")`,
      buildAlias: () => 'driver',
      order: 'asc',
    }
  }]
});

export const JDBC_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: true,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'schema',
    selected: false,
    menu: {
      label: 'Schéma'
    },
    jquery: {
      value: `schema.coalesce("<empty>")`,
      buildAlias: () => 'schema',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }, {
    key: 'db_name',
    selected: false,
    menu: {
      label: 'Nom de la base de données'
    },
    jquery: {
      value: `db_name.coalesce("<empty>")`,
      buildAlias: () => 'db_name',
      order: 'asc',
    }
  }, {
    key: 'db_version',
    selected: false,
    menu: {
      label: 'Version de la base de données'
    },
    jquery: {
      value: `db_version.coalesce("<empty>")`,
      buildAlias: () => 'db_version',
      order: 'asc',
    }
  }, {
    key: 'driver',
    selected: false,
    menu: {
      label: 'Version du driver'
    },
    jquery: {
      value: `driver.coalesce("<empty>")`,
      buildAlias: () => 'driver',
      order: 'asc',
    }
  }]
});

export const FTP_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'failed',
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'status_stack',
            selected: true,
            menu: {
              label: 'Par statut'
            },
            jquery: {
              value: 'failed',
              buildAlias: () => 'status_stack',
              buildName: (chartItem, value) => REQUEST_STATUS_STACK[value].label,
              buildColor: (value) => REQUEST_STATUS_STACK[value].color
            }
          }]
        }
      }
    }]
  },
  groups: FTP_GROUPS_CONFIG(groupedBy),
  filters: FTP_FILTERS_CONFIG(groupedBy)
});

export const FTP_PERFORMANCE_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime',
        buildName: () => 'Temps'
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'performance_tranche',
            selected: true,
            menu: {
              label: 'Par tranche 1',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche',
              buildAlias: () => 'performance_tranche',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
            }
          }, {
            key: 'performance_tranche2',
            selected: false,
            menu: {
              label: 'Par tranche 2',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche2',
              buildAlias: () => 'performance_tranche2',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
            }
          }]
        }
      }
    }, {
      key: 'avg',
      selected: false,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: () => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: () => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: () => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: FTP_GROUPS_CONFIG(groupedBy),
  filters: FTP_FILTERS_CONFIG(groupedBy)
});

export const FTP_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }, {
    key: 'server_version',
    selected: false,
    menu: {
      label: 'Version du serveur'
    },
    jquery: {
      value: `server_version.coalesce("<empty>")`,
      buildAlias: () => 'server_version',
      order: 'asc',
    }
  }, {
    key: 'client_version',
    selected: false,
    menu: {
      label: 'Version du client'
    },
    jquery: {
      value: `client_version.coalesce("<empty>")`,
      buildAlias: () => 'client_version',
      order: 'asc',
    }
  }]
});

export const FTP_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: true,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }, {
    key: 'server_version',
    selected: false,
    menu: {
      label: 'Version du serveur'
    },
    jquery: {
      value: `server_version.coalesce("<empty>")`,
      buildAlias: () => 'server_version',
      order: 'asc',
    }
  }, {
    key: 'client_version',
    selected: false,
    menu: {
      label: 'Version du client'
    },
    jquery: {
      value: `client_version.coalesce("<empty>")`,
      buildAlias: () => 'client_version',
      order: 'asc',
    }
  }]
});

export const LDAP_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'failed',
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'status_stack',
            selected: true,
            menu: {
              label: 'Par statut'
            },
            jquery: {
              value: 'failed',
              buildAlias: () => 'status_stack',
              buildName: (chartItem, value) => REQUEST_STATUS_STACK[value].label,
              buildColor: (value) => REQUEST_STATUS_STACK[value].color
            }
          }]
        }
      }
    }]
  },
  groups: LDAP_GROUPS_CONFIG(groupedBy),
  filters: LDAP_FILTERS_CONFIG(groupedBy)
});

export const LDAP_PERFORMANCE_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime',
        buildName: () => 'Temps'
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'performance_tranche',
            selected: true,
            menu: {
              label: 'Par tranche 1',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche',
              buildAlias: () => 'performance_tranche',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
            }
          }, {
            key: 'performance_tranche2',
            selected: false,
            menu: {
              label: 'Par tranche 2',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche2',
              buildAlias: () => 'performance_tranche2',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
            }
          }]
        }
      }
    }, {
      key: 'avg',
      selected: false,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: () => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: () => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: () => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: LDAP_GROUPS_CONFIG(groupedBy),
  filters: LDAP_FILTERS_CONFIG(groupedBy)
});

export const LDAP_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }]
});

export const LDAP_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: true,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }]
});

export const SMTP_STATUS_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'status',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'failed',
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'status_stack',
            selected: true,
            menu: {
              label: 'Par statut'
            },
            jquery: {
              value: 'failed',
              buildAlias: () => 'status_stack',
              buildName: (chartItem, value) => REQUEST_STATUS_STACK[value].label,
              buildColor: (value) => REQUEST_STATUS_STACK[value].color
            }
          }]
        }
      }
    }]
  },
  groups: SMTP_GROUPS_CONFIG(groupedBy),
  filters: SMTP_FILTERS_CONFIG(groupedBy)
});

export const SMTP_PERFORMANCE_CHART_CONFIG = (groupedBy: string): ChartConfig => ({
  series: {
    optional: false,
    items: [{
      key: 'elapsedtime',
      selected: true,
      menu: {
        label: ''
      },
      jquery: {
        value: 'elapsedtime',
        buildAlias: () => 'elapsedtime',
        buildName: () => 'Temps'
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
        value: 'count',
        buildAlias: () => 'count'
      },
      extra: {
        stacks: {
          optional: false,
          items: [{
            key: 'performance_tranche',
            selected: true,
            menu: {
              label: 'Par tranche 1',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche',
              buildAlias: () => 'performance_tranche',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE1[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE1[value].color
            }
          }, {
            key: 'performance_tranche2',
            selected: false,
            menu: {
              label: 'Par tranche 2',
              icon: ''
            },
            jquery: {
              value: 'performance_tranche2',
              buildAlias: () => 'performance_tranche2',
              buildName: (chartItem, value) => PERFORMANCE_TRANCHE2[value].label,
              buildColor: (value: string) => PERFORMANCE_TRANCHE2[value].color
            }
          }]
        }
      }
    }, {
      key: 'avg',
      selected: false,
      menu: {
        label: 'Moyenne'
      },
      jquery: {
        value: 'avg',
        buildAlias: () => 'avg',
        buildName: () => 'Moyenne',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'min',
      selected: false,
      menu: {
        label: 'Minimum'
      },
      jquery: {
        value: 'min',
        buildAlias: () => 'min',
        buildName: () => 'Minimum',
        buildColor: () => '#0080ff'
      }
    }, {
      key: 'max',
      selected: false,
      menu: {
        label: 'Maximum'
      },
      jquery: {
        value: 'max',
        buildAlias: () => 'max',
        buildName: () => 'Maximum',
        buildColor: () => '#0080ff'
      }
    }]
  },
  groups: SMTP_GROUPS_CONFIG(groupedBy),
  filters: SMTP_FILTERS_CONFIG(groupedBy)
});

export const SMTP_GROUPS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: false,
  items: [{
    key: 'date',
    selected: true,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }]
});

export const SMTP_FILTERS_CONFIG = (groupedBy: string): ChartSection => ({
  optional: true,
  items: [{
    key: 'date',
    selected: false,
    menu: {
      label: 'Date'
    },
    jquery: {
      value: `start.${groupedBy}.varchar`,
      buildAlias: () => 'date',
      order: 'asc',
    }
  }, {
    key: 'command',
    selected: false,
    menu: {
      label: 'Commande'
    },
    jquery: {
      value: `command.coalesce("<empty>")`,
      buildAlias: () => 'command',
      order: 'asc',
    }
  }, {
    key: 'user',
    selected: false,
    menu: {
      label: 'Utilisateur'
    },
    jquery: {
      value: `user.coalesce("<empty>")`,
      buildAlias: () => 'user',
      order: 'asc',
    }
  }]
});

const STATUS_COLORS = {
  2: ['#4ade80', '#22c55e', '#16a34a', '#15803d', ],
  3: ['#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490'],
  4: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
  5: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c']
}

const REQUEST_STATUS_STACK = {
  false: {label: 'Succès', color: '#22c55e'},
  true: {label: 'Échec', color: '#ef4444'}
}

const STATUS_TRANCHE = {
  '1': {label: 'Cat. 1 (0)', color: '#94a3b8'},
  '2': {label: 'Cat. 2 (1xx)', color: '#8b5cf6'},
  '3': {label: 'Cat. 3 (2xx)', color: '#22c55e'},
  '4': {label: 'Cat. 4 (3xx)', color: '#06b6d4'},
  '5': {label: 'Cat. 5 (4xx)', color: '#f59e0b'},
  '6': {label: 'Cat. 6 (5xx)', color: '#ef4444'}
}

const PERFORMANCE_TRANCHE1 = {
  '1': { label: 'Cat. 1 (0 - 1s)', color: '#22c55e' },  // vert    – excellent
  '2': { label: 'Cat. 2 (1 - 3s)', color: '#84cc16' },  // lime    – bon
  '3': { label: 'Cat. 3 (3 - 5s)', color: '#eab308' },  // jaune   – acceptable
  '4': { label: 'Cat. 4 (5 - 10s)', color: '#f97316' },  // orange  – lent
  '5': { label: 'Cat. 5 (> 10s)', color: '#ef4444' },  // rouge   – très lent
}

const PERFORMANCE_TRANCHE2 = {
  '1': { label: 'Cat. 1 (0 - 5s)', color: '#84cc16' },  // vert    – excellent
  '2': { label: 'Cat. 2 (5 - 10s)', color: '#f97316' },  // lime    – bon
  '3': { label: 'Cat. 3 (> 10s)', color: '#ef4444' }  // jaune   – acceptable
}

const SIZE_TRANCHE = {
  '1': { label: 'Cat. 1 (0 - 100o)', color: '#22c55e' },
  '2': { label: 'Cat. 2 (100 - 200o)', color: '#84cc16' },
  '3': { label: 'Cat. 3 (200 - 300o)', color: '#eab308' },
  '4': { label: 'Cat. 4 (> 300o)', color: '#f97316' }
}

export interface ChartItem<TExtra = {}> {
  key: string;
  selected: boolean;
  menu: MenuConfig;         // affichage
  jquery: JQueryConfig;     // requête
  extra?: TExtra;           // données spécifiques au type d'item
}

export interface ChartSection<TExtra = {}> {
  optional: boolean;
  items: ChartItem<TExtra>[];
}

export interface IndicatorExtra {
  stacks?: ChartSection;  // stacks disponibles pour cet indicateur
}

export interface ChartConfig {
  series:     ChartSection;                   // séries fixes (sizeIn, sizeOut…)
  indicators: ChartSection<IndicatorExtra>;   // indicateurs avec stacks éventuels
  groups:     ChartSection;                   // regroupements
  filters?:   ChartSection;                   // filtres (optionnel)
}

export interface MenuConfig {
  label: string;
  icon?: string;
}

export interface JQueryConfig {
  value: string;
  buildAlias: (value?: string) => string;
  buildName?: (chartItem: ChartItem, value?: string) => string;
  buildColor?: (value?: string) => string;
  order?: 'asc' | 'desc';
}

/**
 * Pivote le résultat brut :
 *   [{count, status, date, year}]  →  [{<status>: count, date, year}]
 *
 * Exemple :
 *   [{count:8, status:202, date:"10:00", year:2026}]
 *   → [{202: 8, date:"10:00", year:2026}]
 */
export function pivotByStack(series: ChartItem[], indicator: ChartItem, group: ChartItem, stack: ChartItem, data: any[]): any[] {
  const grouped: { [key: string]: any } = {};
  for (const s of series) {
    const distinctStacks = [...new Set(data.map(d => String(d[stack.jquery.buildAlias()]) + '_' + s.jquery.buildAlias()))].sort((a, b) => a.localeCompare(b));

    for (const item of data) {
      const key = `${item[group.jquery.buildAlias()]}`;
      if (!grouped[key]) {
        grouped[key] = { group: item[group.jquery.buildAlias()] };
        distinctStacks.forEach(s => grouped[key][s] = 0);
      }
      grouped[key][String(item[stack.jquery.buildAlias()]) + '_' + s.jquery.buildAlias()] = item[indicator.jquery.buildAlias(s.jquery.buildAlias())];
    }
  }
  return Object.values(grouped);
}

export function buildSeries(series: ChartItem[], indicator: ChartItem, group: ChartItem, stack: ChartItem, data: any[]): SerieProvider<string, number>[] {
  return series.flatMap(s => {
    return stack ? buildStackSeries(s, stack, data) : [{ data: { x: field(group.jquery.buildAlias()), y: field(indicator.jquery.buildAlias(s.jquery.buildAlias())) }, stack: s.jquery.buildAlias(), name: indicator.jquery.buildName ? indicator.jquery.buildName(s) : indicator.jquery.buildAlias(s.jquery.buildAlias()), color: s.jquery.buildColor ? s.jquery.buildColor() : '' }];
  });
}

/**
 * Génère les SerieProvider dynamiquement à partir des statuts présents dans les données.
 *
 * Exemple de sortie :
 *   [{ data: { x: field('date'), y: field('202') }, name: '202', color: '#22c55e' }]
 */
export function buildStackSeries(serie: ChartItem, stack: ChartItem, data: any[]): SerieProvider<string, number>[] {
  const distinctStacks = [...new Set(data.map(d => String(d[stack.jquery.buildAlias()])))].sort((a, b) => a.localeCompare(b));
  return distinctStacks.map(s => ({
    data: { x: field('group'), y: field(s + '_' + serie.jquery.buildAlias()) },
    name: stack.jquery.buildName ? stack.jquery.buildName(serie, s) : s + '_' + serie.jquery.buildAlias(),
    stack: serie.jquery.buildAlias(),
    color: stack.jquery.buildColor ? stack.jquery.buildColor(s) : ''
  }));
}

/** Retourne une couleur hex selon la famille du code HTTP. */
export function statusColor(status: number | string): string {
  const family = parseInt(String(status)[0], 10); // 200 → 2, "2xx" → 2
  const palette = STATUS_COLORS[family];
  if (!palette) return '#94a3b8';

  // Cas code exact 200, 201… → nuance dans la palette
  const code = typeof status === 'number' ? status : parseInt(status, 10);
  return pickStatusColor(code, family * 100, palette);
}

/** Sélectionne une teinte dans la palette selon la position du code dans sa famille. */
export function pickStatusColor(status: number, base: number, palette: string[]): string {
  return palette[Math.floor((status - base) / 20) % palette.length];
}