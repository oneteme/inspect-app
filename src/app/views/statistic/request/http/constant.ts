import {RepartitionTypeCardConfig} from "../../_component/dynamic-chart/dynamic-chart.component";

export const createRepartitionPerformanceConfig = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Performance',
  indicators: [{label: 'Count', value: 'count'}, {label: 'Average', value: 'avg'}, {
    label: 'Max',
    value: 'max'
  }, {label: 'Min', value: 'min'}],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Method', value: 'method', group: (row) => (row['method']), properties: ['method']},
    {label: 'Media', value: 'media', group: (row) => (row['media']), properties: ['media']},
    {label: 'Auth', value: 'auth', group: (row) => (row['auth']), properties: ['auth']}
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'performance tranche par tranche', value: 'performance_tranche'},
  ],
  chartProvider: {
    height: 300,
    series: [],
    stacked: true,
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true
      },
      legend: {
        position: 'bottom'
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});
export const REST_REPARTITION_STATUS = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Disponibilité',
  indicators: [{label: 'Count', value: 'count'}],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Method', value: 'method', group: (row) => (row['method']), properties: ['method']},
    {label: 'Media', value: 'media', group: (row) => (row['media']), properties: ['media']},
    {label: 'Auth', value: 'auth', group: (row) => (row['auth']), properties: ['auth']}
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'Status', value: 'status'},
    {label: '2xx/4xx/5xx/0', value: 'status_tranche'},
    {label: 'Status OK Client Server Error', value: 'status_ok_client_server_error'}
  ],
  chartProvider: {
    height: 300,
    stacked: true,
    series: [],
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true,
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});

export const FTP_REPARTITION_STATUS_CONFIG = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Disponibilité',
  indicators: [{label: 'Count', value: 'count'}],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Commande', value: 'command', group: (row) => (row['command']), properties: ['command']},
    {
      label: 'Version Serveur',
      value: 'server_version',
      group: (row) => (row['server_version']),
      properties: ['server_version']
    },
    {
      label: 'Version Client',
      value: 'client_version',
      group: (row) => (row['client_version']),
      properties: ['client_version']
    }
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'Status', value: 'status'}
  ],
  chartProvider: {
    height: 300,
    stacked: true,
    series: [],
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true,
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      legend: {
        position: 'bottom'
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});
export const FTP_REPARTITION_STATUS_JQUERY_CONFIG = {
  groupColumns: {
    date: {
      column: `start.[grouped]:date,start.year:year`,
      order: 'year.asc,date.asc',
      group: (row) => `${row['date']}_${row['year']}`,
      properties: ['date', 'year']
    },
    command: {column: 'command.coalesce("<empty>"):command'},
    server_version: {column: 'server_version.coalesce("<empty>"):server_version'},
    client_version: {column: 'client_version.coalesce("<empty>"):client_version'},
  },
  seriesColumns: {
    status: {
      selector: 'status',
      query: (selectedIndicator: string) => `failed:status,failed.${selectedIndicator}:count`,
      name: 'status',
      color: '#2f8dd0'
    }
  }
};

export const FTP_REPARTITION_PERFORMANCE_CONFIG = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Performance',
  indicators: [{label: 'Count', value: 'count'}, {label: 'Average', value: 'avg'}, {
    label: 'Max',
    value: 'max'
  }, {label: 'Min', value: 'min'}],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Commande', value: 'command', group: (row) => (row['command']), properties: ['command']},
    {
      label: 'Version Serveur',
      value: 'server_version',
      group: (row) => (row['server_version']),
      properties: ['server_version']
    },
    {
      label: 'Version Client',
      value: 'client_version',
      group: (row) => (row['client_version']),
      properties: ['client_version']
    }
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'Performance tranche par tranche', value: 'performance_tranche'},
  ],
  chartProvider: {
    height: 300,
    series: [],
    stacked: true,
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true
      },
      legend: {
        position: 'bottom'
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});
export const FTP_REPARTITION_PERFORMANCE_JQUERY_CONFIG = {
  groupColumns: {
    date: {
      column: `start.[grouped]:date,start.year:year`,
      order: 'year.asc,date.asc',
      group: (row) => `${row['date']}_${row['year']}`,
      properties: ['date', 'year']
    },
    command: {column: 'command.coalesce("<empty>"):command'},
    server_version: {column: 'server_version.coalesce("<empty>"):server_version'},
    client_version: {column: 'client_version.coalesce("<empty>"):client_version'},
  },
  sliceColumns: {
    user: {
      selector: 'user',
      query: 'user.coalesce("<empty>").distinct:user',
      name: 'user'
    },
    app_name: {
      selector: 'instance.app_name',
      query: 'instance.app_name.coalesce("<empty>").distinct:app_name',
      name: 'app'
    }
  },
  seriesColumns: {
    elapsedtime: {
      selector: 'count',
      query: (selectedIndicator: string) => `elapsedtime.${selectedIndicator}:count`,
      name: 'count',
      color: '#2f8dd0'
    },
    performance_tranche:
      {
        selector: 'performance_tranche',
        query: (selectedIndicator: string) => `performance_tranche:performance_tranche,elapsedtime.${selectedIndicator}:count`,
        name: 'performance_tranche',
        color: 'gray'
      }
  }
};

export const JDBC_REPARTITION_PERFORMANCE_CONFIG = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Performance',
  indicators: [
    {label: 'Count', value: 'count'},
    {label: 'Average', value: 'avg'},
    {label: 'Max', value: 'max'},
    {label: 'Min', value: 'min'}
  ],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Commande', value: 'command', group: (row) => (row['command']), properties: ['command']},
    {
      label: 'Nom de la base de données',
      value: 'db_name',
      group: (row) => (row['db_name']),
      properties: ['db_name']
    }
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'Schéma', value: 'schema'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'Performance tranche par tranche', value: 'performance_tranche'},
  ],
  chartProvider: {
    height: 300,
    series: [],
    stacked: true,
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true
      },
      legend: {
        position: 'bottom'
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});
export const JDBC_REPARTITION_PERFORMANCE_JQUERY_CONFIG = {
  groupColumns: {
    date: {
      column: `start.[grouped]:date,start.year:year`,
      order: 'year.asc,date.asc',
      group: (row) => `${row['date']}_${row['year']}`,
      properties: ['date', 'year']
    },
    command: {column: 'command.coalesce("<empty>"):command'},
    db_name: {column: 'db_name.coalesce("<empty>"):db_name'},
  },
  sliceColumns: {
    user: {
      selector: 'user',
      query: 'user.coalesce("<empty>").distinct:user',
      name: 'user'
    },
    schema: {
      selector: 'schema',
      query: 'schema.coalesce("<empty>").distinct:schema',
      name: 'schema'
    },
    app_name: {
      selector: 'instance.app_name',
      query: 'instance.app_name.coalesce("<empty>").distinct:app_name',
      name: 'app'
    }
  },
  seriesColumns: {
    performance_tranche:
      {
        selector: 'performance_tranche',
        query: (selectedIndicator: string) => `performance_tranche:performance_tranche,elapsedtime.${selectedIndicator}:count`,
        name: 'performance_tranche',
        color: 'gray'
      }
  }
};

export const LDAP_REPARTITION_PERFORMANCE_CONFIG = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Performance',
  indicators: [
    {label: 'Count', value: 'count'},
    {label: 'Average', value: 'avg'},
    {label: 'Max', value: 'max'},
    {label: 'Min', value: 'min'}
  ],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Commande', value: 'command', group: (row) => (row['command']), properties: ['command']}
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'Performance tranche par tranche', value: 'performance_tranche'},
  ],
  chartProvider: {
    height: 300,
    series: [],
    stacked: true,
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true
      },
      legend: {
        position: 'bottom'
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});
export const LDAP_REPARTITION_PERFORMANCE_JQUERY_CONFIG = {
  groupColumns: {
    date: {
      column: `start.[grouped]:date,start.year:year`,
      order: 'year.asc,date.asc',
      group: (row) => `${row['date']}_${row['year']}`,
      properties: ['date', 'year']
    },
    command: {column: 'command.coalesce("<empty>"):command'}
  },
  sliceColumns: {
    user: {
      selector: 'user',
      query: 'user.coalesce("<empty>").distinct:user',
      name: 'user'
    },
    app_name: {
      selector: 'instance.app_name',
      query: 'instance.app_name.coalesce("<empty>").distinct:app_name',
      name: 'app'
    }
  },
  seriesColumns: {
    performance_tranche:
      {
        selector: 'performance_tranche',
        query: (selectedIndicator: string) => `performance_tranche:performance_tranche,elapsedtime.${selectedIndicator}:count`,
        name: 'performance_tranche',
        color: 'gray'
      }
  }
};

export const SMTP_REPARTITION_PERFORMANCE_CONFIG = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
  title: 'Performance',
  indicators: [
    {label: 'Count', value: 'count'},
    {label: 'Average', value: 'avg'},
    {label: 'Max', value: 'max'},
    {label: 'Min', value: 'min'}
  ],
  groups: [
    {label: 'Date', value: 'date', group: (row) => `${row['date']}_${row['year']}`, properties: ['date', 'year']},
    {label: 'Commande', value: 'command', group: (row) => (row['command']), properties: ['command']}
  ],
  slices: [
    {label: 'User', value: 'user'},
    {label: 'App Name', value: 'app_name'}
  ],
  series: [
    {label: 'Performance tranche par tranche', value: 'performance_tranche'},
  ],
  chartProvider: {
    height: 300,
    series: [],
    stacked: true,
    options: {
      chart: {
        toolbar: {
          show: false
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true
      },
      legend: {
        position: 'bottom'
      },
      xaxis: {
        labels: {
          rotateAlways: true
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            return formatterFn(value);
          }
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: '10px'
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value) => {
          return formatterFn(value);
        },
        textAnchor: 'start',
        style: {
          fontSize: '10px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 'bold',
          colors: undefined
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          padding: 4,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: '#fff',
          opacity: 0.9
        }
      }
    }
  }
});
export const SMTP_REPARTITION_PERFORMANCE_JQUERY_CONFIG = {
  groupColumns: {
    date: {
      column: `start.[grouped]:date,start.year:year`,
      order: 'year.asc,date.asc',
      group: (row) => `${row['date']}_${row['year']}`,
      properties: ['date', 'year']
    },
    command: {column: 'command.coalesce("<empty>"):command'}
  },
  sliceColumns: {
    user: {
      selector: 'user',
      query: 'user.coalesce("<empty>").distinct:user',
      name: 'user'
    },
    app_name: {
      selector: 'instance.app_name',
      query: 'instance.app_name.coalesce("<empty>").distinct:app_name',
      name: 'app'
    }
  },
  seriesColumns: {
    performance_tranche:
      {
        selector: 'performance_tranche',
        query: (selectedIndicator: string) => `performance_tranche:performance_tranche,elapsedtime.${selectedIndicator}:count`,
        name: 'performance_tranche',
        color: 'gray'
      }
  }
};

