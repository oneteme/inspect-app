import {ChartProvider, field, values} from "@oneteme/jquery-core";
import {UserAction} from "../model/trace.model";

export const INFINITY = new Date(9999,12,31).getTime();

export const ANALYTIC_MAPPING : {[key: string]: {label: string, text: (param: UserAction) => string}} = {
    DOMContentLoaded: {
        label: 'Initialisation',
        text: (param: UserAction) => `Chargement de la page.`
    },
    click: {
        label: 'Click',
        text: (param: UserAction) => `Clique sur l'êlement "${param.name}" de type "${param.nodeName}".`
    },
    scrollend: {
        label: 'Scroll',
        text: (param: UserAction) => `Scroll sur l'êlement "${param.nodeName}".`
    },
    change: {
        label: 'Change',
        text: (param: UserAction) => `Changement sur l'êlement "${param.name}" de type "${param.nodeName}".`
    }
};

export class Constants {

    static readonly REPARTITION_TYPE_RESPONSE_PIE: ChartProvider<string, number> = {
        title: 'Appels par type de réponse',
        height: 250,
        series: [
            { data: { x: values('N/A'), y: field('countUnavailableServer') }, name: '0', color: '#495D63' },
            { data: { x: values('2xx'), y: field('countSucces') }, name: '2xx', color: '#33cc33' },
            { data: { x: values('4xx'), y: field('countErrorClient') }, name: '4xx', color: '#ffa31a' },
            { data: { x: values('5xx'), y: field('countErrorServer') }, name: '5xx', color: '#ff0000' }
        ],
        options: {
            chart: {
                toolbar: {
                    show: true
                }
            },
            legend: {
                height: 225
            }
        }
    };

    static readonly REPARTITION_SPEED_PIE: ChartProvider<string, number> = {
        height: 250,
        series: [
            { data: { x: values('> 10'), y: field('elapsedTimeSlowest') }, name: 'mapper 1', color: '#848383' },
            { data: { x: values('5 <> 10'), y: field('elapsedTimeSlow') }, name: 'mapper 2', color: '#8397A1' },
            { data: { x: values('3 <> 5'), y: field('elapsedTimeMedium') }, name: 'mapper 3', color: '#83ACBF' },
            { data: { x: values('1 <> 3'), y: field('elapsedTimeFast') }, name: 'mapper 4', color: '#82C0DC' },
            { data: { x: values('< 1'), y: field('elapsedTimeFastest') }, name: 'mapper 5', color: '#81D4FA' }
        ],
        options: {
            chart: {
                toolbar: {
                    show: false
                }
            },
            legend: {
                height: 225
            }
        }
    };

    static readonly REPARTITION_USER_POLAR: ChartProvider<string, number> = {
        title: 'Appels par utilisateur (Top 5)',
        height: 250,
        series: [
            { data: { x: field('user'), y: field('count') }, name: 'Total' }
        ],
        options: {
            chart: {
                toolbar: {
                    show: false
                }
            },
            legend: {
                height: 225
            }
        }
    };

    static readonly REPARTITION_RE_PIE: ChartProvider<string, number> = {
        title: 'Repartition par navigateur',
        height: 250,
        series: [
            { data: { x: field('re'), y: field('count') } }
        ],
        options: {
            chart: {
                toolbar: {
                    show: false
                }
            }
        }
    }

    static readonly REPARTITION_USER_BAR: ChartProvider<string, number> = {
        height: 250,
        series: [
            { data: { x: field('date'), y: field('count') }, name: field('user') }
        ],
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
                position: 'right',
                offsetY: 40
            }
        }
    }

    static readonly REPARTITION_PAGE_BAR: ChartProvider<string, number> = {
        title: 'Consultation par page (Top 5)',
        height: 250,
        series: [
            { data: { x: field('location'), y: field('count') }, name: 'Consultation par page', color: '#33cc33' }
        ],
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
            plotOptions: {
                bar: {
                    dataLabels: {
                        total: {
                            enabled: true,
                            offsetX: 0,
                            style: {
                                fontSize: '13px',
                                fontWeight: 900
                            }
                        }
                    }
                },
            },
            fill: {
                opacity: 1
            },
            stroke: {
                width: 1,
                colors: ['#fff']
            }
        }
    };

    static readonly REPARTITION_API_BAR: ChartProvider<string, number> = {
        title: 'Appels par Api (Top 5)',
        height: 300,
        series: [
            { data: { x: field('apiName'), y: field('countSucces') }, name: '2xx', color: '#33cc33' },
            { data: { x: field('apiName'), y: field('countErrorClient') }, name: '4xx', color: '#ffa31a' },
            { data: { x: field('apiName'), y: field('countErrorServer') }, name: '5xx', color: '#ff0000' }
        ],
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
            plotOptions: {
                bar: {
                    dataLabels: {
                        total: {
                            enabled: true,
                            offsetX: 0,
                            style: {
                                fontSize: '13px',
                                fontWeight: 900
                            }
                        }
                    }
                },
            },
            fill: {
                opacity: 1
            },
            stroke: {
                width: 1,
                colors: ['#fff']
            },
            legend: {
                position: 'top',
                horizontalAlign: 'left',
                offsetX: 40
            }
        }
    };

    static readonly REPARTITION_SPEED_BAR: ChartProvider<string, number> = {
        title: 'Appels par tranche de temps (seconde)',
        height: 250,
        series: [
            { data: { x: field('date'), y: field('elapsedTimeSlowest') }, name: '> 10', color: '#848383' },
            { data: { x: field('date'), y: field('elapsedTimeSlow') }, name: '5 <> 10', color: '#8397A1' },
            { data: { x: field('date'), y: field('elapsedTimeMedium') }, name: '3 <> 5', color: '#83ACBF' },
            { data: { x: field('date'), y: field('elapsedTimeFast') }, name: '1 <> 3', color: '#82C0DC' },
            { data: { x: field('date'), y: field('elapsedTimeFastest') }, name: '< 1', color: '#81D4FA' }
        ],
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
                position: 'right',
                offsetY: 40
            }
        }
    };

    static readonly REPARTITION_TYPE_RESPONSE_BAR: ChartProvider<string, number> = {
        height: 250,
        series: [
            { data: { x: field('date'), y: field('countUnavailableServer') }, name: 'N/A', color: '#495D63' },
            { data: { x: field('date'), y: field('countSucces') }, name: '2xx', color: '#33cc33' },
            { data: { x: field('date'), y: field('countErrorClient') }, name: '4xx', color: '#ffa31a' },
            { data: { x: field('date'), y: field('countErrorServer') }, name: '5xx', color: '#ff0000' }
        ],
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
                followCursor: true,
            },
            legend: {
                position: 'right',
                offsetY: 40
            }
        }
    }

    static readonly REPARTITION_VIEW_AREA: ChartProvider<string, number> = {
        title: 'Nombre de pages visités',
        height: 250,
        series: [
            { data: { x: field('date'), y: field('count') }, name: 'Nombre de pages visités' }
        ],
        options: {
            chart: {
                toolbar: {
                    show: false
                }
            }
        }
    };

    static readonly REPARTITION_MAX_BY_PERIOD_LINE: ChartProvider<string, number> = {
        title: 'Temps de reponse moyen et maximum',
        ytitle: 'Temps (s)',
        height: 200,
        series: [
            { data: { x: field('date'), y: field('max') }, name: 'Temps max', color: '#FF0000' }
        ],
        options: {
            chart: {
                id: 'c',
                group: 'A',
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: [4]
            },
            yaxis: {
                decimalsInFloat: 3
            },
            legend: {
                showForSingleSeries: true
            }
        }
    };

    static readonly REPARTITION_AVG_BY_PERIOD_LINE: ChartProvider<string, number> = {
        ytitle: 'Temps (s)',
        height: 200,
        series: [
            { data: { x: field('date'), y: field('avg') }, name: 'Temps moyen', color: '#FF9B00' }
        ],
        options: {
            chart: {
                id: 'b',
                group: 'A',
                toolbar: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: [4]
            },
            yaxis: {
                decimalsInFloat: 3
            },
            legend: {
                showForSingleSeries: true
            }
        }
    };

    static readonly REPARTITION_USER_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        title: 'Utilisateurs',
        height: 150,
        series: [
            { data: { x: field('date'), y: field('count') }, name: 'Utilisateurs', color: "#FFD400" }
        ],
        options: {
            chart: {
                id: 'sparkline-3',
                group: 'sparkline',
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly REPARTITION_VIEW_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        title: 'Pages visitées',
        height: 150,
        series: [
            { data: { x: field('date'), y: field('count') }, name: 'Pages visités', color: "#DECDF5" }
        ],
        options: {
            chart: {
                id: 'sparkline-2',
                group: 'sparkline',
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly REPARTITION_REQUEST_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        title: 'Appels',
        height: 150,
        series: [
            { data: { x: field('date'), y: field('count') }, name: 'Appels', color: "#1423dc" }
        ],
        options: {
            chart: {
                id: 'sparkline-1',
                group: 'sparkline',
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly REPARTITION_REQUEST_ERROR_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        title: 'Appels en erreur',
        height: 150,
        series: [
            { data: { x: field('date'), y: field('countErrorServer') }, name: 'Appels en erreur', color: "#ff0000" }
        ],
        options: {
            chart: {
                id: 'sparkline-2',
                group: 'sparkline',
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {
                        return val.toFixed(0);
                    },
                }
            },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly REPARTITION_REQUEST_SLOWEST_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        title: 'Appels superieur à 10 secondes',
        height: 150,
        series: [
            { data: { x: field('date'), y: field('countSlowest') }, name: 'Appels superieur à 10 secondes', color: "#848383" }
        ],
        options: {
            chart: {
                id: 'sparkline-3',
                group: 'sparkline',
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                }
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {
                        return val.toFixed(0);
                    },
                }
            },
            subtitle: {
                offsetY: 20
            }
        }
    };

    static readonly MAPPING_TYPE: {[key: string]: Partial<{title: string, subtitle: string, icon: string}>} = {
        request: {title: 'Requêtes', icon: 'call_made'},
        rest: {title: 'Appels reçus', subtitle: 'Gestion et supervision des sessions', icon: 'call_received'},
        batch: {title: 'Exécution de Batch', subtitle: 'Gestion et supervision des sessions', icon: 'manufacturing'},
        test: {title: 'Exécution de Test', subtitle: 'Gestion et supervision des sessions', icon: 'rule'},
        startup: {title: 'Lancement de Serveur', subtitle: 'Gestion et supervision des sessions', icon: 'restart_alt'},
        view: {title: 'Navigation', subtitle: 'Gestion et supervision des sessions', icon: 'ads_click'},
        dashboard: {title:'Page d\'Accueil', icon: 'home'},
        deploiment: {title:'Versions déployées', subtitle: 'Gestion et supervision des deploiements', icon:'deployed_code'},
    }
    static readonly REQUEST_MAPPING_TYPE: {[key: string]: Partial<{title: string, subtitle: string, icon: string}>} = {
        rest: {title: 'HTTP', subtitle: 'Gestion et supervision des requêtes', icon: 'public'},
        jdbc: {title: 'BDD', subtitle: 'Gestion et supervision des requêtes', icon: 'database'},
        ftp: {title: 'FTP', subtitle: 'Gestion et supervision des requêtes', icon: 'smb_share'},
        smtp: {title: 'SMTP', subtitle: 'Gestion et supervision des requêtes', icon: 'outgoing_mail'},
        ldap: {title: 'LDAP', subtitle: 'Gestion et supervision des requêtes', icon: 'user_attributes'},
    }


    
    static REST_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<string, number> = {
   
    
        height: 100,
        continue: true,
        series: [
            { data: { x: field('date'), y: field('perc') }, name: 'Nombre d\'exceptions REST', color: "#ff0000" },
        ],
        options: {
            chart: {
                sparkline: {
                   enabled: true
                },
                toolbar: {
                    show: false
                }
                
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {
                        return val.toFixed(2)+"%";
                    },
                },
                showForNullSeries: false,
                max: 100
            }
        }
    };
    
    static  DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
      
        height: 100,
        continue: true,
        series: [
            { data: { x: field('date'), y: field('perc') }, name: 'Nombre d\'exceptions JDBC', color: "#ff0000" }
        ],
        options: {
            chart: {
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {
                        return val.toFixed(2)+"%";
                    },
                },
                showForNullSeries: false,
                max: 100
            }
        }
    };

    static  FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {


        height: 100,
        continue: true,
        series: [
            { data: { x: field('date'), y: field('perc') }, name: 'Nombre d\'exceptions FTP', color: "#ff0000"}
        ],
        options: {
            chart: {
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {
                        return val.toFixed(2)+"%";
                    },
                },
                showForNullSeries: false,
                max: 100
            }
        }
    };

    static  SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        height: 100,
        continue: true,
        series: [
            { data: { x: field('date'), y: field('perc') }, name: 'Nombre d\'exceptions SMTP', color: "#ff0000" }
        ],
        options: {
            chart: {
                sparkline: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {
                        return val.toFixed(2)+"%";
                    },
                },
                showForNullSeries: false,
                max: 100
            }
        }
    };

    static  LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        height: 100,
        continue: true,
        series: [
            { data: { x: field('date'), y: field('perc') }, name: 'Nombre d\'exceptions LDAP', color: "#ff0000" }
        ],
        options: {
            chart: {
                sparkline: {
                    enabled: true
                }
            },
            stroke: {
                curve: 'straight'
            },
            xaxis: {
                labels: {
                    datetimeUTC: false
                },
            },
            yaxis: {
                labels: {
                    formatter: function (val: any) {

                        return val.toFixed(2)+"%";
                    },
                },
                showForNullSeries: false,
                max: 100
            }
        }
    };
}

export class Filter {
    key: string;
    label: string;
    type: string;
    width?: number;
    row: number;
    col: number;
    endpoint?: string;
    table?: string;
    options?: { [value: string]: string }[] | any;
    query?: any;
    isLoading?: boolean;
    op: any;
}

export interface FilterMap { //filterMap
    [key: string]: any
}

export interface FilterPreset {
    name: string;
    pageName: string;
    values: { [key: string]: any };
}


export const Operation = {
    eq: { value: "", display: "Egal" },
    gt: { value: "gt", display: "Supérieur" },
    ge: { value: "ge", display: "Supérieur ou égale" },
    lt: { value: "lt", display: "Inférieur" },
    le: { value: "le", display: "Inférieur ou égale" },
    like: { value: "like", display: "Contient" },
}
export class FilterConstants {

    static readonly SEARCH: {[key: string]: Filter[]} = {
        rest: [
            { key: 'query', label: 'Query params', type: 'input', row: 2, col: 1, op: Operation.like },
            //{ key: 'status', label: 'Status', type: 'select', row: 3, col: 1, endpoint: "session/rest", query: { 'column.distinct': 'status:status', 'order': 'status.asc' }, op: Operation.eq },
            { key: 'method', label: 'Method', type: 'select', width: 20, row: 1, col: 1, endpoint: "session/rest",  query: { 'column.distinct': 'method:method', 'order': 'method.asc' }, op: Operation.eq },
            { key: 'path', label: 'Path', type: 'input', row: 1, col: 2, op: Operation.like },
            { key: 'apiname', label: 'Nom API', type: 'select', row: 3, col: 2, endpoint: "session/rest", query: { 'column.distinct': 'api_name:apiname', 'api_name.notNull': '', 'order': 'api_name.asc' }, op: Operation.eq  },
            { key: 'user', label: 'Utilisateur', type: 'select', row: 3, col: 3, endpoint: "session/rest", query: { 'column.distinct': 'user', 'user.notNull': '', 'order': 'user.asc' }, op: Operation.eq  }
            // new Filter("err_type", "Exception", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),
            // new Filter("address", "adresse", 'input', 50),
            // new Filter("os", "OS", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
            // new Filter("re", "RE", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
            // new Filter("auth", "Authentification scheme", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'auth', 'order': 'auth.asc' }),
            // new Filter("host", "Hôte", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'host', 'order': 'host.asc' }),
            // new Filter("protocol", "Protocole", 'select', 50, null,null, [{ protocol: 'HTTPS' }, { protocol: 'HTTP' }]),
        ],
        batch: [
            { key: 'name', label: 'Nom', type: 'select', row: 1, col: 1, width: 20, endpoint: 'session/main', query: { 'column.distinct': 'name', 'name.notNull': '', 'type': 'BATCH', 'order': 'name.asc' }, op: Operation.eq  },
            { key: 'location', label: 'Chemin', type: 'input', row: 1, col: 2, op: Operation.like },
            // new Filter("err_type", "Exception", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),
            // new Filter("os", "OS", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
            //new Filter("re", "RE", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        ],
        startup: [
            { key: 'location', label: 'Chemin', type: 'input', row: 1, col: 1, op: Operation.like }
            // new Filter("err_type", "Exception", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),
            // new Filter("os", "OS", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
            //new Filter("re", "RE", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        ],
        view: [
            { key: 'name', label: 'Nom', type: 'select', row: 2, col: 1, endpoint: 'session/main', query: { 'column.distinct': 'name', 'name.notNull': '', 'type': 'VIEW', 'order': 'name.asc' }, op: Operation.eq  },
            { key: 'location', label: 'Chemin', type: 'input', row: 1, col: 1, op: Operation.like },
            { key: 'user', label: 'Utilisateur', type: 'select', row: 2, col: 2, endpoint: 'session/main', query: { 'column.distinct': 'user', 'user.notNull': '', 'type': 'VIEW', 'order': 'user.asc' }, op: Operation.eq  }
            // new Filter("err_type", "Exception", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),
            // new Filter("os", "OS", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
            //new Filter("re", "RE", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        ]
    }
}
