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

export type UaGroup = 'service' | 'user' | 'tool' | 'unknown';

// Tech Stack Catalog

export type TechCategory = 'backend' | 'data' | 'integration' | 'client' | 'frontend' | 'infra';

export interface TechDef {
    name: string;
    /** Classe Devicons (ex: 'devicon-java-plain colored') */
    devicon: string;
    /** URL SVG de secours si l'icône n'existe pas dans la webfont Devicons */
    svgUrl?: string;
    color: string;
    category: TechCategory;
    categoryLabel: string;
    /** true = détecté via métriques Inspect ; false = déclaré manuellement */
    confident: boolean;
    order: number;
}

/**
 * Catalogue complet des technologies supportées.
 * Clé = ID à utiliser dans APP_TECH_STACK (tech-stack.config.ts).
 */
export const TECH_CATALOG: Record<string, TechDef> = {
    // Backend
    'java': { name: 'Java', devicon: 'devicon-java-plain colored', color: '#f89820', category: 'backend', categoryLabel: 'Backend', confident: false, order: 10 },
    'spring': { name: 'Spring Boot', devicon: 'devicon-spring-plain colored', color: '#6db33f', category: 'backend', categoryLabel: 'Backend', confident: false, order: 11 },
    'quarkus': { name: 'Quarkus', devicon: 'devicon-quarkus-plain colored', color: '#4695eb', category: 'backend', categoryLabel: 'Backend', confident: false, order: 12 },
    'micronaut': { name: 'Micronaut', devicon: 'devicon-micronaut-plain colored', color: '#3f4449', category: 'backend', categoryLabel: 'Backend', confident: false, order: 13 },
    'dotnet': { name: '.NET', devicon: 'devicon-dotnetcore-plain colored', color: '#512bd4', category: 'backend', categoryLabel: 'Backend', confident: false, order: 14 },
    'python': { name: 'Python', devicon: 'devicon-python-plain colored', color: '#3776ab', category: 'backend', categoryLabel: 'Backend', confident: true, order: 15 },
    'go': { name: 'Go', devicon: 'devicon-go-plain colored', color: '#00add8', category: 'backend', categoryLabel: 'Backend', confident: true, order: 16 },
    'nodejs': { name: 'Node.js', devicon: 'devicon-nodejs-plain colored', color: '#339933', category: 'backend', categoryLabel: 'Backend', confident: true, order: 17 },
    'rust': { name: 'Rust', devicon: 'devicon-rust-plain colored', color: '#000000', category: 'backend', categoryLabel: 'Backend', confident: false, order: 18 },
    // Frontend
    'angular': { name: 'Angular', devicon: 'devicon-angular-plain colored', color: '#dd0031', category: 'frontend', categoryLabel: 'Frontend', confident: false, order: 20 },
    'react': { name: 'React', devicon: 'devicon-react-plain colored', color: '#61dafb', category: 'frontend', categoryLabel: 'Frontend', confident: false, order: 21 },
    'vuejs': { name: 'Vue.js', devicon: 'devicon-vuejs-plain colored', color: '#42b883', category: 'frontend', categoryLabel: 'Frontend', confident: false, order: 22 },
    'nextjs': { name: 'Next.js', devicon: 'devicon-nextjs-plain', color: '#000000', category: 'frontend', categoryLabel: 'Frontend', confident: false, order: 23 },
    'nuxtjs': { name: 'Nuxt.js', devicon: 'devicon-nuxtjs-plain colored', color: '#00dc82', category: 'frontend', categoryLabel: 'Frontend', confident: false, order: 24 },
    // Bases de données
    'postgresql': { name: 'PostgreSQL', devicon: 'devicon-postgresql-plain colored', color: '#336791', category: 'data', categoryLabel: 'Données', confident: false, order: 30 },
    'mysql': { name: 'MySQL', devicon: 'devicon-mysql-plain colored', color: '#4479a1', category: 'data', categoryLabel: 'Données', confident: false, order: 31 },
    'oracle': { name: 'Oracle DB', devicon: 'devicon-oracle-plain colored', color: '#f80000', category: 'data', categoryLabel: 'Données', confident: false, order: 32 },
    'sqlserver': { name: 'SQL Server', devicon: 'devicon-microsoftsqlserver-plain colored', color: '#cc2927', category: 'data', categoryLabel: 'Données', confident: false, order: 33 },
    'mongodb': { name: 'MongoDB', devicon: 'devicon-mongodb-plain colored', color: '#47a248', category: 'data', categoryLabel: 'Données', confident: false, order: 34 },
    'redis': { name: 'Redis', devicon: 'devicon-redis-plain colored', color: '#dc382d', category: 'data', categoryLabel: 'Données', confident: false, order: 35 },
    'elasticsearch': { name: 'Elasticsearch', devicon: 'devicon-elasticsearch-plain colored', color: '#005571', category: 'data', categoryLabel: 'Données', confident: false, order: 36 },
    'cassandra': { name: 'Cassandra', devicon: 'devicon-cassandra-plain colored', color: '#1287b1', category: 'data', categoryLabel: 'Données', confident: false, order: 37 },
    'teradata': { name: 'Teradata', devicon: 'devicon-sqldeveloper-plain', color: '#f37440', category: 'data', categoryLabel: 'Données', confident: false, order: 38 },
    // Messages & Intégrations
    'kafka': { name: 'Kafka', devicon: 'devicon-apachekafka-plain colored', color: '#231f20', category: 'integration', categoryLabel: 'Intégration', confident: false, order: 40 },
    'rabbitmq': { name: 'RabbitMQ', devicon: 'devicon-rabbitmq-plain colored', color: '#ff6600', category: 'integration', categoryLabel: 'Intégration', confident: false, order: 41 },
    'smtp': { name: 'SMTP (e-mail)', devicon: 'devicon-google-plain colored', color: '#ea4335', category: 'integration', categoryLabel: 'Intégration', confident: true, order: 42 },
    'ftp': { name: 'FTP', devicon: 'devicon-filezilla-plain colored', color: '#bf0000', category: 'integration', categoryLabel: 'Intégration', confident: true, order: 43 },
    'ldap': { name: 'LDAP / Active Directory', devicon: 'devicon-windows11-plain colored', color: '#0078d4', category: 'integration', categoryLabel: 'Intégration', confident: true, order: 44 },
    // Infra & Outils
    'docker': { name: 'Docker', devicon: 'devicon-docker-plain colored', color: '#2496ed', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 50 },
    'kubernetes': { name: 'Kubernetes', devicon: 'devicon-kubernetes-plain colored', color: '#326ce5', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 51 },
    'nginx': { name: 'Nginx', devicon: 'devicon-nginx-plain colored', color: '#009639', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 52 },
    'apachetomcat': { name: 'Tomcat', devicon: 'devicon-tomcat-original colored', svgUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tomcat/tomcat-original.svg', color: '#f8dc75', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 53 },
    'linux': { name: 'Linux', devicon: 'devicon-linux-plain colored', color: '#fcc624', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 54 },
    'git': { name: 'Git', devicon: 'devicon-git-plain colored', color: '#f05032', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 55 },
    'github': { name: 'GitHub', devicon: 'devicon-github-plain', color: '#181717', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 56 },
    'gitlab': { name: 'GitLab', devicon: 'devicon-gitlab-plain colored', color: '#fc6d26', category: 'infra', categoryLabel: 'Infrastructure', confident: false, order: 57 },
};

export interface UaCategoryDef {
    color: string;
    group: UaGroup;
    keywords: string[];
}

/** Catalogue des catégories de User-Agent : couleur, groupe et mots-clés de détection (ordre = priorité). */
export const UA_CATEGORY_DEFS: Record<string, UaCategoryDef> = {
    'Apache HTTP': { color: '#f97316', group: 'service', keywords: ['apache-httpclient', 'apache httpclient', 'apache httpcomponents'] },
    'Spring (Reactor)': { color: '#68d391', group: 'service', keywords: ['reactornetty'] },
    'OkHttp': { color: '#10b981', group: 'service', keywords: ['okhttp'] },
    'Java': { color: '#f59e0b', group: 'service', keywords: ['java'] },
    'Go': { color: '#06b6d4', group: 'service', keywords: ['go-http-client', 'go http'] },
    'Node.js': { color: '#84cc16', group: 'service', keywords: ['node-fetch', 'node.js', 'undici'] },
    'Python': { color: '#3b82f6', group: 'service', keywords: ['python'] },
    'Axios': { color: '#8b5cf6', group: 'service', keywords: ['axios'] },
    'Chrome': { color: '#22c55e', group: 'user', keywords: ['chrome'] },
    'Edge': { color: '#0ea5e9', group: 'user', keywords: ['edge'] },
    'Firefox': { color: '#e8441a', group: 'user', keywords: ['firefox'] },
    'Safari': { color: '#60a5fa', group: 'user', keywords: ['safari'] },
    'Postman': { color: '#ef4444', group: 'tool', keywords: ['postman'] },
    'cURL': { color: '#6b7280', group: 'tool', keywords: ['curl'] },
    'Wget': { color: '#e879f9', group: 'tool', keywords: ['wget'] },
    'Autre': { color: '#94a3b8', group: 'unknown', keywords: [] },
    'Inconnu': { color: '#d1d5db', group: 'unknown', keywords: [] },
};

/** Config de base du treemap User-Agent (sans les couleurs dynamiques). */
export const UA_BAR_BASE: ChartProvider<string, number> = {
    height: 180,
    series: [{ data: { x: field('label'), y: field('count') } }],
    options: {
        chart: { toolbar: { show: false }, animations: { enabled: false } },
        legend: { show: false },
        dataLabels: { enabled: false },
        tooltip: {
            enabled: true,
            y: { formatter: (val: number) => val.toLocaleString('fr-FR') + ' req.' }
        },
        plotOptions: { bar: { horizontal: true, barHeight: '65%', borderRadius: 3 } },
        xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        grid: { show: false }
    }
};

/** Config de base pie pour les erreurs par type (flux). Couleurs et tooltip fournis dynamiquement. */
export const UA_ERR_DONUT_BASE: ChartProvider<string, number> = {
    series: [{ data: { x: field('label'), y: field('count') } }],
    options: {
        legend: { show: false }
    }
};

/** Config de base pie User-Agent (sans les couleurs dynamiques). */
export const UA_PIE_BASE: ChartProvider<string, number> = {
    series: [{ data: { x: field('label'), y: field('count') } }],
    options: {
        legend: { show: false }
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
            chart: { toolbar: { show: true } },
            legend: { height: 225 }
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
            chart: { toolbar: { show: false } },
            legend: { height: 225 }
        }
    };

    static readonly REPARTITION_USER_POLAR: ChartProvider<string, number> = {
        title: 'Appels par utilisateur (Top 5)',
        height: 250,
        series: [
            { data: { x: field('user'), y: field('count') }, name: 'Total' }
        ],
        options: {
            chart: { toolbar: { show: false } },
            legend: { height: 225 }
        }
    };

    static readonly REPARTITION_RE_PIE: ChartProvider<string, number> = {
        title: 'Repartition par navigateur',
        height: 250,
        series: [
            { data: { x: field('re'), y: field('count') } }
        ],
        options: { chart: { toolbar: { show: false } } }
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
        request: {title: 'Flux', subtitle: 'Communications externes',icon: 'call_made'},
        rest: {title: 'Services Exposés', subtitle: 'Appels API et distribution de ressources statiques', icon: 'call_received'},
        batch: {title: 'Tâches planifiées', subtitle: 'Historique des jobs asynchrones et tâches de fond', icon: 'manufacturing'},
        test: {title: 'Validation & Tests', subtitle: 'Lancements de tests automatisés et résultats', icon: 'rule'},
        startup: {title: 'Initialisation', subtitle: 'Chronologie et durée des démarrages d\'application', icon: 'restart_alt'},
        view: {title: 'Parcours Client', subtitle: 'Navigation utilisateurs et accès aux pages', icon: 'ads_click'},
        dashboard: {title:'Page d\'Accueil', icon: 'home'},
        deploiment: {title:'Instances Actives', subtitle: 'Suivi des applications en cours d\'exécution', icon:'deployed_code'},
        tree: {title: 'Arborescence des ressources', subtitle: 'Diagramme de bout en bout des flux d\'exécution', icon: 'account_tree'},
    }
    static readonly REQUEST_MAPPING_TYPE: {[key: string]: Partial<{title: string, subtitle: string, icon: string}>} = {
        rest: {title: 'HTTP', subtitle: 'Communications externes', icon: 'public'},
        jdbc: {title: 'JDBC', subtitle: 'Communications externes', icon: 'database'},
        ftp: {title: 'FTP', subtitle: 'Communications externes', icon: 'smb_share'},
        smtp: {title: 'SMTP', subtitle: 'Communications externes', icon: 'outgoing_mail'},
        ldap: {title: 'LDAP', subtitle: 'Communications externes', icon: 'user_attributes'},
    }

    static REQUEST_EXCEPTION_OPTIONS = {
        grid: { top: 2, bottom: 2, left: 2, right: 2, containLabel: false },
        xAxis: { show: false },
        yAxis: { show: false, max: 100 },
        legend: { show: false },
        tooltip: { formatter: (p: any) => { const v = Array.isArray(p[0]?.value) ? p[0].value[1] : p[0]?.value; return `<b>${p[0].name}</b><br>${p[0].marker} ${p[0].seriesName}: <b>${(+v).toFixed(2)}%</b>`; } },
        series: [{ showSymbol: false }]
    }
    
    static REST_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<string, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000" },
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };
    
    static  DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000" }
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static  FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000"}
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static  SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000" }
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static  LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000" }
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static readonly SESSION_EXCEPTION_LINE: ChartProvider<string, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: '#ff0000' }
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static readonly SESSION_ERRORS_BAR: ChartProvider<string, number> = {
        height: 185,
        series: [
            { data: { x: field('type'), y: field('count') }, name: '', color: '#ef4444' }
        ],
        options: {
            chart: { toolbar: { show: false }, animations: { enabled: false } },
            plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 2 } },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: { followCursor: true },
            xaxis: { labels: { show: false } },
            yaxis: {
                labels: {
                    maxWidth: 168,
                    style: { fontSize: '10px' },
                    formatter: (val: any) => {
                        if (!val) return '';
                        const s = String(val);
                        const short = s.includes('$') ? s.slice(s.lastIndexOf('$') + 1)
                            : s.includes('.') ? s.slice(s.lastIndexOf('.') + 1)
                            : s;
                        return short.length > 26 ? short.slice(0, 24) + '…' : short;
                    }
                }
            },
            grid: { yaxis: { lines: { show: false } }, xaxis: { lines: { show: false } } }
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
