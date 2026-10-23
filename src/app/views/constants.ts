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

export class Constants {

    static readonly MAPPING_TYPE: {[key: string]: Partial<{title: string, subtitle: string, icon: string}>} = {
        request: {title: 'Flux', subtitle: 'Communications externes',icon: 'call_made'},
        treatment: {title: 'Traitements', subtitle: '', icon: 'settings_suggest'},
        rest: {title: 'Services Exposés', subtitle: 'Appels API et distribution de ressources statiques', icon: 'call_received'},
        schedule: {title: 'Tâches planifiées', subtitle: 'Historique des jobs asynchrones et tâches de fond', icon: 'manufacturing'},
        test: {title: 'Validation & Tests', subtitle: 'Lancements de tests automatisés et résultats', icon: 'rule'},
        startup: {title: 'Initialisation', subtitle: 'Chronologie et durée des démarrages d\'application', icon: 'restart_alt'},
        view: {title: 'Parcours Client', subtitle: 'Navigation utilisateurs et accès aux pages', icon: 'ads_click'},
        dashboard: {title:'Tableau de bord', icon: 'home'},
        deploiment: {title:'Instances Actives', subtitle: 'Suivi des applications en cours d\'exécution', icon:'deployed_code'},
        event: {title: 'Événements', icon: 'event'},
        log: {title: 'Événements', subtitle: 'Logs applicatifs', icon: 'browse_activity'},
        user: {title: 'Événements', subtitle: 'Actions utilisateurs', icon: 'person'},
        architecture: {title: 'Architecture', icon: 'lan'},
        tree: {title: 'Arborescence des ressources', subtitle: 'Diagramme de bout en bout des flux d\'exécution', icon: 'account_tree'},
    }
    static readonly REQUEST_MAPPING_TYPE: {[key: string]: Partial<{title: string, subtitle: string, icon: string}>} = {
        rest: {title: 'Flux HTTP', subtitle: 'Communications externes', icon: 'public'},
        jdbc: {title: 'Flux JDBC', subtitle: 'Communications externes', icon: 'database'},
        ftp: {title: 'Flux FTP', subtitle: 'Communications externes', icon: 'smb_share'},
        smtp: {title: 'Flux SMTP', subtitle: 'Communications externes', icon: 'outgoing_mail'},
        ldap: {title: 'Flux LDAP', subtitle: 'Communications externes', icon: 'user_attributes'},
    }
    
    static readonly REST_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<string, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000", noDataStyle: { symbolSize: 0 } } as any,
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    if (p.data?._noData) return `${p.axisValueLabel ?? p.axisValue}<br/><span style="color:rgba(255,255,255,0.6);font-size:11px">Aucune donnée</span>`;
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };
    
    static readonly DATABASE_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000", noDataStyle: { symbolSize: 0 } } as any
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    if (p.data?._noData) return `${p.axisValueLabel ?? p.axisValue}<br/><span style="color:rgba(255,255,255,0.6);font-size:11px">Aucune donnée</span>`;
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static readonly FTP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000", noDataStyle: { symbolSize: 0 } } as any
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    if (p.data?._noData) return `${p.axisValueLabel ?? p.axisValue}<br/><span style="color:rgba(255,255,255,0.6);font-size:11px">Aucune donnée</span>`;
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static readonly SMTP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000", noDataStyle: { symbolSize: 0 } } as any
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    if (p.data?._noData) return `${p.axisValueLabel ?? p.axisValue}<br/><span style="color:rgba(255,255,255,0.6);font-size:11px">Aucune donnée</span>`;
                    const val = Array.isArray(p.value) ? p.value[1] : p.value;
                    return `${p.axisValueLabel ?? p.axisValue}<br/>${p.marker}${p.seriesName}&nbsp;&nbsp;<b>${(val ?? 0).toFixed(2)}%</b>`;
                }
            }
        }
    };

    static readonly LDAP_REQUEST_EXCEPTION_BY_PERIOD_LINE: ChartProvider<Date, number> = {
        continue: true,
        series: [
            { data: { x: field('stringDate'), y: field('perc') }, name: 'Exceptions', color: "#ff0000", noDataStyle: { symbolSize: 0 } } as any
        ],
        options: {
            legend: { show: false },
            yAxis: { show: true, min: 0, max: 100, interval: 20, axisLabel: { formatter: (v: number) => v === 0 ? '' : v + '%', fontSize: 9, color: 'rgba(0,0,0,.38)' } },
            series: [{ smooth: true }],
            tooltip: {
                formatter: (params: any[]) => {
                    const p = params[0];
                    if (p.data?._noData) return `${p.axisValueLabel ?? p.axisValue}<br/><span style="color:rgba(255,255,255,0.6);font-size:11px">Aucune donnée</span>`;
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

export const STATUS = {
    "-1": {icon: 'hourglass_empty', label: "En cours", color: '#4f46e5', class: 'in-progress'},
    "0xx": {icon: 'priority_high', label: "Erreur de connexion", color: '#94A3B8', class: 'unavailable'},
    "2xx": {icon: 'done', label: "Succès", color: '#4CAF50', class: 'success'},
    "4xx": {icon: 'error', label: "Erreur applicative", color: '#F9AD4E', class: 'warning'},
    "5xx": {icon: 'warning', label: "Erreur d'interface", color: '#F44336', class: 'fail'}
};
