import { ChartProvider, field, values } from "@oneteme/jquery-core";

export class Constants {

    static readonly REPARTITION_TYPE_RESPONSE_PIE: ChartProvider<string, number> = {
        title: 'Nombre d\'appels par type de réponse',
        height: 250,
        series: [
            { data: { x: values('2xx'), y: field('countSucces') }, name: '2xx', color: '#33cc33' },
            { data: { x: values('4xx'), y: field('countErrorClient') }, name: '4xx', color: '#ffa31a' },
            { data: { x: values('5xx'), y: field('countErrorServer') }, name: '5xx', color: '#ff0000' }
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
        title: 'Nombre d\'appels par utilisateur (Top 5)',
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

    static readonly REPARTITION_API_BAR: ChartProvider<string, number> = {
        title: 'Nombre d\'appels par Api (Top 5)',
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
        title: 'Nombre d\'appels par tranche de temps (seconde)',
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
                decimalsInFloat: 0
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

    static readonly REPARTITION_REQUEST_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        title: 'Nombre d\'appels',
        subtitle: 'sur les 7 derniers jours',
        height: 150,
        continue: true,
        series: [
            { data: { x: o => new Date(o['date']), y: field('count') }, name: 'Nombre d\'appels', color: "#1423dc" }
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
            stroke: {
                curve: 'straight'
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
        title: 'Nombre d\'appels en erreur',
        subtitle: 'sur les 7 derniers jours',
        height: 150,
        continue: true,
        series: [
            { data: { x: o => new Date(o['date']), y: field('countErrorServer') }, name: 'Nombre d\'appels en erreur', color: "#ff0000" }
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
        title: 'Nombre d\'appels superieur à 10 secondes',
        subtitle: 'sur les 7 derniers jours',
        height: 150,
        continue: true,
        series: [
            { data: { x: o => new Date(o['date']), y: field('countSlowest') }, name: 'Nombre d\'appels superieur à 10 secondes', color: "#848383" }
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
            stroke: {
                curve: 'straight'
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

    static readonly MAPPING_TYPE: {[key: string]: {title: string, icon: string}} = {
        rest: {title: 'Liste des Appels REST', icon: 'swap_vert'},
        batch: {title: 'Lancement de Batch', icon: 'manufacturing'},
        startup: {title: 'Liste des Serveurs', icon: 'restart_alt'},
        view: {title: 'Navigation', icon: 'ads_click'}
    }
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

/*export enum Operation { //  remove.
    eq = "",
    gt = "gt",
    ge = "ge",
    lt = "lt",
    le = "le",
    like = 'like'
}*/

export const Operation = {
    eq: { value: "", display: "Egal" },
    gt: { value: "gt", display: "Supérieur" },
    ge: { value: "ge", display: "Supérieur ou égale" },
    lt: { value: "lt", display: "Inférieur" },
    le: { value: "le", display: "Inférieur ou égale" },
    like: { value: "like", display: "Contient" },
}
export class FilterConstants {

    static readonly SESSION_API: Filter[] = [
        { key: 'query', label: 'Query params', type: 'input', row: 2, col: 1, op: Operation.like },
        { key: 'status', label: 'Status', type: 'select', row: 3, col: 1, endpoint: "session/rest", query: { 'column.distinct': 'status:status', 'order': 'status.asc' }, op: Operation.eq },
        { key: 'method', label: 'Method', type: 'select', width: 20, row: 1, col: 1, endpoint: "session/rest",  query: { 'column.distinct': 'method:method', 'order': 'method.asc' }, op: Operation.eq },
        { key: 'path', label: 'Path', type: 'input', row: 1, col: 2, op: Operation.like },
        { key: 'api_name', label: 'Nom API', type: 'select', row: 3, col: 2, endpoint: "session/rest", query: { 'column.distinct': 'api_name.coalesce(null):api_name', 'api_name.not': 'null', 'order': 'api_name.coalesce(null).asc' }, op: Operation.eq  },
        { key: 'user', label: 'Utilisateur', type: 'select', row: 3, col: 3, endpoint: "session/rest", query: { 'column.distinct': 'user.coalesce(null)', 'user.not': 'null', 'order': 'user.coalesce(null).asc' }, op: Operation.eq  }
        // new Filter("err_type", "Exception", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),
        // new Filter("address", "adresse", 'input', 50),
        // new Filter("os", "OS", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
        // new Filter("re", "RE", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        // new Filter("auth", "Authentification scheme", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'auth', 'order': 'auth.asc' }),
        // new Filter("host", "Hôte", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'host', 'order': 'host.asc' }),
        // new Filter("protocol", "Protocole", 'select', 50, null,null, [{ protocol: 'HTTPS' }, { protocol: 'HTTP' }]),
    ]

    static readonly SESSION_MAIN: Filter[] = [
        { key: 'name', label: 'Serveur', type: 'select', row: 2, col: 1, endpoint: 'session/main', query: { 'column.distinct': 'name.coalesce(null)', 'name.not': 'null', 'order': 'name.coalesce(null).asc' }, op: Operation.eq  },
        { key: 'location', label: 'Chemin', type: 'input', row: 1, col: 1, op: Operation.like },
        { key: 'user', label: 'Utilisateur', type: 'select', row: 2, col: 2, endpoint: 'session/main', query: { 'column.distinct': 'user.coalesce(null)', 'user.not': 'null', 'order': 'user.coalesce(null).asc' }, op: Operation.eq  }

        // new Filter("err_type", "Exception", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),
        // new Filter("os", "OS", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
        //new Filter("re", "RE", 'select', 50, "/stat/mainsession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
    ]

    static readonly STATS_API: Filter[] = [
        { key: 'query', label: 'Query params', type: 'input', row: 1, col: 1, op: Operation.like },
        { key: 'status', label: 'Status', type: 'select', row: 2, col: 1, options: [{ status: '200' }, { status: '201' }, { status: '202' }, { status: '400' }, { status: '401' }, { status: '403' }, { status: '404' }, { status: '405' }, { status: '409' }, { status: '415' }, { status: '500' }, { status: '503' }], op: Operation.eq  },
        { key: 'user', label: 'Utilisateur', type: 'select', row: 2, col: 2, endpoint: 'session/rest', query: { 'column.distinct': 'user.coalesce(null)', 'user.not': 'null', 'order': 'user.coalesce(null).asc' }, op: Operation.eq  },
        //new Filter("os", "OS", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
        //new Filter("re", "RE", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        //new Filter("err_type", "Exception", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),

    ]

    static readonly STATS_APP: Filter[] = [
        { key: 'query', label: 'Query params', type: 'input', row: 1, col: 2, op: Operation.like },
        { key: 'method', label: 'Method', type: 'select', width: 20, row: 1, col: 1, options: [{ method: 'GET' }, { method: 'PUT' }, { method: 'POST' }, { method: 'DELETE' }, { method: 'OPTIONS' }], op: Operation.eq  },
        { key: 'status', label: 'Status', type: 'select', row: 3, col: 1, options: [{ status: '200' }, { status: '201' }, { status: '202' }, { status: '400' }, { status: '401' }, { status: '403' }, { status: '404' }, { status: '405' }, { status: '409' }, { status: '415' }, { status: '500' }, { status: '503' }], op: Operation.eq  },
        { key: 'user', label: 'Utilisateur', type: 'select', row: 3, col: 2, endpoint: 'session/rest', query: { 'column.distinct': 'user.coalesce(null)', 'user.not': 'null', 'order': 'user.coalesce(null).asc' }, op: Operation.eq  },
        { key: 'path', label: 'Path', type: 'input', row: 2, col: 1, op: Operation.like }

        //new Filter("os", "OS", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
        //new Filter("re", "RE", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        //new Filter("err_type", "Exception", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),

    ]

    static readonly STATS_USER: Filter[] = [
        { key: 'query', label: 'Query params', type: 'input', row: 1, col: 2, op: Operation.like },
        { key: 'method', label: 'Method', type: 'select', width: 20, row: 1, col: 1, options: [{ method: 'GET' }, { method: 'PUT' }, { method: 'POST' }, { method: 'DELETE' }, { method: 'OPTIONS' }], op: Operation.eq  },
        { key: 'status', label: 'Status', type: 'select', row: 3, col: 1, options: [{ status: '200' }, { status: '201' }, { status: '202' }, { status: '400' }, { status: '401' }, { status: '403' }, { status: '404' }, { status: '405' }, { status: '409' }, { status: '415' }, { status: '500' }, { status: '503' }], op: Operation.eq  },
        { key: 'path', label: 'Path', type: 'input', row: 2, col: 1, op: Operation.like }

        // new Filter("query", "Query params", 'input', 100, null, null, null, null, null, Operation.like),
        // new Filter("method", "method", 'select', 50, null, null, [{ method: 'GET' }, { method: 'PUT' }, { method: 'POST' }, { method: 'DELETE' }, { method: 'OPTIONS' }]),
        // new Filter("status", "Status", 'select', 50, null, null, [{ status: '200' }, { status: '201' }, { status: '202' }, { status: '400' }, { status: '401' }, { status: '403' }, { status: '404' }, { status: '405' }, { status: '409' }, { status: '415' }, { status: '500' }, { status: '503' }]),
        // new Filter("path", "Path", 'input', 100, null, null, null, null, null, Operation.like),


        //new Filter("os", "OS", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'os', 'order': 'os.asc' }),
        //new Filter("re", "RE", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 're', 'order': 're.asc' }),
        //new Filter("err_type", "Exception", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'err_type:err_type', 'order': 'err_type.asc' }),

    ]

    static readonly STATS_DB: Filter[] = [
        // new Filter("schema", "Base de donnée", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'dbquery.schema', 'dbquery.parent': 'apisession.id',  'order': 'dbquery.schema.asc' }),
        // new Filter("user", "Utilisateur", 'select', 50, "/stat/apisession",'dbquery.', null,  { 'column.distinct': 'dbquery.user', 'dbquery.parent': 'apisession.id', 'order': 'dbquery.user.asc' }),
        // new Filter("err_type", "Exception", 'select', 50, "/stat/apisession", null, null, { 'column.distinct': 'dbaction.err_type:err_type','dbaction.parent': 'dbquery.id', 'dbquery.parent': 'apisession.id', 'order': 'dbaction.err_type.asc' }),
        // new Filter("db_name", "SGBD", 'select', 50, "/stat/apisession", "dbquery.", null, { 'column.distinct': 'dbquery.db_name:db_name', 'dbquery.parent': 'apisession.id', 'order': 'dbquery.db_name.asc' }),
    ]
}
