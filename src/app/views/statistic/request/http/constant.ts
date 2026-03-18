import {RepartitionTypeCardConfig} from "../../_component/dynamic-chart/dynamic-chart.component";

export const createRepartitionPerformanceConfig = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
    title: 'Performance',
    indicators: [{label: 'Count', value: 'count'},{label: 'Average', value: 'avg'},{label: 'Max', value: 'max'},{label: 'Min', value: 'min'}],
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


export const createRepartitionStatusConfig = (formatterFn: (value: any) => string): RepartitionTypeCardConfig => ({
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
        series: [

        ],
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
