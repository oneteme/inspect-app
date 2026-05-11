# Contexte Copilot — inspect-app

> Fichier de contexte local. Non versionné (`.gitignore` recommandé).
> Application : **inspect-app** — frontend Angular 16 de visualisation/supervision applicative.
> Version : `1.3.0`
> Branche active : aucune branche de feature en cours — travail lié à la branche `kpi-global` (GitHub) pour remplacement de `DynamicChartComponent`.

---

## Vue d'ensemble

inspect-app est un **frontend Angular** qui consomme l'API REST d'un serveur **inspect-server** (`/v3/query`, `/jquery/*`).
Elle permet de visualiser, analyser et superviser les traces d'exécution collectées par le collecteur Inspect (sessions REST, appels DB, FTP, SMTP, LDAP, lancements serveurs, etc.).

### Stack technique

| Techno | Version | Usage |
|--------|---------|-------|
| Angular | 16 | Framework principal |
| Angular Material | 16 | UI Components |
| `@oneteme/jquery-echarts` | local (file:) | Renderer charts (ECharts) |
| `@oneteme/jquery-table` | ^0.0.3 | Composant table |
| echarts | ^6.0.0 | Moteur graphique |
| mxgraph | ^4.2.2 | Graphes d'architecture / arbres d'appels |
| vis-timeline | ^7.7.3 | Timeline (séquences d'événements) |
| rxjs | ~7.5.0 | Réactivité |
| moment / moment-timezone | — | Formatage dates |

> ⚠️ `@oneteme/jquery-echarts` est référencé en `file:../jquery-charts/jquery-charts/dist/oneteme/jquery-echarts` : c'est le build local du monorepo jquery-charts.
> L'app n'utilise **pas** `@oneteme/jquery-apexcharts` ni `@oneteme/jquery-highcharts` directement (seulement via `jquery-echarts`).

---

## Architecture de l'application

```
src/app/
├── app.component.ts         ← Shell : <app-navbar> + <router-outlet>
├── app.module.ts            ← Routing principal + déclarations + providers globaux
├── model/                   ← Interfaces et types de données
├── service/                 ← Services HTTP
│   └── jquery/              ← Services dédiés aux endpoints /jquery/*
├── config/
│   └── tech-stack.config.ts
├── shared/                  ← Module partagé (composants réutilisables, pipes, material)
│   ├── shared.module.ts
│   ├── util.ts
│   ├── _component/          ← Composants UI réutilisables
│   ├── interceptor/
│   ├── material/
│   └── pipe/
├── components/
│   └── navbar/
└── views/                   ← Pages de l'application
    ├── constants.ts         ← ChartProvider globaux + catalogues (UA, Tech, Filters)
    ├── analytic/
    ├── architecture/
    ├── dashboard/
    ├── detail/
    ├── search/
    ├── statistic/
    ├── supervision/
    └── tree/
```

---

## Routing (app.module.ts)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/request/:type` | `SearchRequestView` | Recherche de requêtes par type (rest/jdbc/ftp/smtp/ldap) |
| `/request/:type/:id_request` | `DetailRequestView` | Détail d'une requête (résout dynamiquement le composant selon `type`) |
| `/session/rest` | `SearchRestView` | Recherche de sessions REST |
| `/session/rest/:id_session` | `DetailSessionRestView` | Détail session REST |
| `/session/rest/:id_session/tree` | `TreeView` (data: `{type:'rest'}`) | Arbre d'appels REST |
| `/session/:type_main` | `SearchMainView` | Sessions main (batch/startup/test/view) |
| `/session/:type_main/:id_session` | `DetailSessionMainView` | Détail session main |
| `/session/:type_main/:id_session/tree` | `TreeView` (data: `{type:'main'}`) | Arbre d'appels main |
| `/dashboard/server/:server_name` | `StatisticServerView` | Dashboard par serveur |
| `/dashboard/request/:request_type` | `StatisticRequestView` | Stats requêtes par type |
| `/dashboard/user/:user_name` | `StatisticUserView` | Dashboard par utilisateur |
| `/dashboard/client/:client_name` | `StatisticClientView` | Dashboard par client |
| `/instance/detail/:id_instance` | `InstanceComponent` | Détail d'une instance |
| `/supervision` | `ServerSupervisionView` / `ClientSupervisionView` | Supervision serveur/client |
| `/architecture` | `ArchitectureView` | Vue graphe mxgraph des applications |
| `/analytic` | `AnalyticView` | Analyse des actions utilisateur |

---

## Modèles (`src/app/model/`)

### `trace.model.ts` — modèles de traces brutes

| Interface | Description |
|-----------|-------------|
| `MainSession` | Session principale (batch, startup, test, view) |
| `RestSession` | Session HTTP entrante (+ `name`, `userAgent`, `exception`) |
| `RestRequest` | Appel REST sortant (method, host, path, status, sizes...) |
| `DatabaseRequest` | Requête JDBC (scheme, host, command, failed...) |
| `FtpRequest` | Requête FTP |
| `MailRequest` | Requête SMTP (+ `mails[]`) |
| `DirectoryRequest` | Requête LDAP |
| `LocalRequest` | Appel local (name, type, location, exception) |
| `AbstractSession` | `requestsMask`, `instanceId` |
| `AbstractRequest` | `user, start, end, threadName, command, sessionId, instanceId, id` |
| `AbstractStage` | Étapes internes d'une requête (name, start, end, exception, order...) |
| `ExceptionInfo` | `type, message, stackTraceRows[], cause` |
| `InstanceEnvironment` | Environnement d'une instance (id, name, version, os, re, env, branch, hash, collector, resource, configuration) |
| `UserAction` | Action utilisateur trackée (name, nodeName, type, start) |
| `LogEntry` | Entrée de log (instant, level) |

### `request.model.ts` — DTOs et vues enrichies

| Type | Description |
|------|-------------|
| `RestSessionDto` | `RestSession + appName` |
| `MainSessionDto` | `MainSession + appName` |
| `RestRequestDto` | `RestRequest + exception` |
| `RestSessionView` | `RestSession + toutes les collections de requêtes enfants` |
| `MainSessionView` | `MainSession + toutes les collections de requêtes enfants` |
| `AnalyticDto` | `MainSession + userActions[]` |
| `RequestType` | enum : `REST, JDBC, FTP, SMTP, LDAP` |

### `jquery.model.ts` — types de réponses des endpoints `/jquery/*`

Types nommés (alias) pour les réponses agrégées côté serveur :
- `RepartitionTimeAndTypeResponse` — répartition vitesse + type HTTP (one-shot)
- `RepartitionTimeAndTypeResponseByPeriod` — idem par période (avg, max, date, year)
- `RepartitionRequestByPeriod` — count requêtes par période
- `ExceptionsByPeriodAndAppname`, `MainExceptionsByPeriodAndAppname` — exceptions REST
- Types équivalents pour LDAP, SMTP, FTP, JDBC
- `LastServerStart` — infos dernière instance serveur (id, type, appName, version, start, end, configuration, restart...)
- `ServerStartByPeriodAndAppname`

### `conf.model.ts` — configuration et paramètres de requête

| Classe/Interface | Description |
|----------------|-------------|
| `Application` | Config app (`host, defaultEnv, gridViewPeriod, kpiViewPeriod`) |
| `QueryParams` | Builder de paramètres HTTP (period, env, appname[], hosts[], rangestatus[], commands[], schemas[]) — méthodes `buildParams()`, `buildPath()` |
| `IPeriod` | Implémentation de `Period` avec start/end Date |
| `IStep` | Period relative (N dernières minutes) |
| `IStepFrom` | Period relative décalée |

### `chart.model.ts`
```typescript
enum ChartGroup { byHour='hour', byDay='date', byWeek='week', byMonth='month', byYear='year' }
```

### `tree.model.ts` — modèles pour mxgraph
Interfaces pour les nœuds de l'arbre d'appels : `RestSessionTree`, `MainSessionTree`, `RestRequestNode`, `JdbcRequestNode`, `FtpRequestNode`, `LdapRequestNode`, `MailRequestNode`, `MainServerNode`, `RestServerNode`, `LinkRequestNode`, etc.

---

## Services (`src/app/service/`)

### Services principaux

| Service | Endpoint | Description |
|---------|----------|-------------|
| `TraceService` | `/v3/query` | Récupération des traces brutes (sessions, requêtes, stages, tree, mails...) |
| `AnalyticService` | `/v3/query` | Actions utilisateur par user ou session |
| `FilterService` | — | Gestion des filtres (BehaviorSubject `FilterMap`, presets localStorage max 5 par page) |
| `EnvRouter` | — | Wrapper Angular `Router` qui injecte automatiquement `?env=` dans chaque navigation |
| `TreeService` | — | Construction du graphe mxgraph |

### Services jQuery (`src/app/service/jquery/`) — endpoints `/jquery/*`

Ces services consomment l'API agrégée `/jquery/` du serveur inspect qui expose une interface SQL-like via query params.

| Service | Endpoint jQuery | Description |
|---------|-----------------|-------------|
| `JQueryService` | `/jquery/{endpoint}` | Service générique bas niveau |
| `InstanceService` | `/jquery/instance` | Instances (environments, apps, last start, versions, count...) |
| `RestSessionService` | `/jquery/session/rest` | Agrégats sessions REST (répartition vitesse, type, par période) |
| `RestRequestService` | `/jquery/request/rest` | Agrégats requêtes REST sortantes |
| `DatabaseRequestService` | `/jquery/request/database` | Agrégats requêtes JDBC |
| `FtpRequestService` | `/jquery/request/ftp` | Agrégats requêtes FTP |
| `SmtpRequestService` | `/jquery/request/smtp` | Agrégats requêtes SMTP |
| `LdapRequestService` | `/jquery/request/ldap` | Agrégats requêtes LDAP |
| `ExceptionService` | `/jquery/exception` | Agrégats exceptions |
| `MainSessionService` | `/jquery/session/main` | Agrégats sessions main |
| `InstanceTraceService` | `/jquery/...` | Traces par instance |
| `MachineUsageService` | `/jquery/...` | Métriques ressources machine (heap, meta, disk) |
| `LogEntryService` | `/jquery/...` | Entrées de log |

> **Pattern d'appel jQuery** : tous les appels passent des `column`, `filter`, `order` comme query params — syntaxe propriétaire du serveur inspect (ex: `'count_succes:countSucces'`, `'start.ge'`, `'instance_env.in'`).

---

## `environment.ts`

```typescript
export const app: Application = {
  host: 'http://localhost:9001',
  defaultEnv: 'dev',
  gridViewPeriod: 'LAST_60',
  kpiViewPeriod: 'LAST_1440'
}
```

- `makeDatePeriod(dayBetween, shiftEnd?)` — retourne `{start, end}` en dates absolues
- `makeDateTimePeriod(step)` — retourne une `IStep` (N dernières minutes)
- L'URL serveur est stockée dans `localStorage.getItem('server')` (configurée au runtime, pas en dur)

---

## Vues (`src/app/views/`)

### `constants.ts` — Référentiel global des ChartProviders et catalogues

Contient :
- **`Constants` class** : tous les `ChartProvider` réutilisables globalement (`REPARTITION_TYPE_RESPONSE_PIE`, `REPARTITION_SPEED_PIE`, `REPARTITION_USER_POLAR`, toutes les configs exceptions par protocole, etc.)
- **`TECH_CATALOG`** : catalogue de technologies détectables (Java, Spring, Angular, PG, MySQL, Docker...) avec icônes Devicons, couleurs et catégories
- **`UA_CATEGORY_DEFS`** : catalogue des catégories de User-Agent (Apache HTTP, Spring Reactor, Chrome, Postman, cURL...)
- **`UA_BAR_BASE`, `UA_PIE_BASE`, `UA_ERR_DONUT_BASE`** : configs de base pour les charts User-Agent
- **`ANALYTIC_MAPPING`** : mapping des types d'événements utilisateur (DOMContentLoaded, click, scrollend, change)
- **`FilterConstants`, `FilterMap`, `FilterPreset`** : types pour la gestion des filtres

---

### Vue `search/` — Recherche de sessions/requêtes

| Vue | Description |
|-----|-------------|
| `SearchRestView` | Recherche de sessions REST. Filtres : appname, rangestatus, date range. Table via `@oneteme/jquery-table` (`TableProvider`). Config table dans `shared/_component/table/table.config.ts`. |
| `SearchMainView` | Recherche sessions main (batch/startup/test/view). Même pattern. |
| `SearchRequestView` | Recherche requêtes par type (rest/jdbc/ftp/smtp/ldap). Filtres host + date. Résolution dynamique du sous-composant selon `type`. |

---

### Vue `detail/` — Détail d'une trace

- `DetailRequestView` — router dynamique : résout le composant selon `type` via `DetailComponentResolverService`
- `DetailSessionRestView` — détail session REST complète (stages, requêtes enfants, timeline)
- `DetailSessionMainView` — détail session main

---

### Vue `dashboard/` — `DashboardComponent`

Vue centrale multi-onglets pour un serveur. Affiche :
- Sparklines de disponibilité par protocole (REST/JDBC/FTP/SMTP/LDAP)
- Graphiques d'exceptions par période (line)
- Répartition des User-Agents (bar + pie)
- `protocolDefs` array : définit les 5 protocoles avec leur `chartConfig` associé

---

### Vue `statistic/` — Dashboards thématiques

#### `StatisticServerView` (`/dashboard/server/:server_name`)
Dashboard d'un serveur applicatif. Onglets : **REST** + **Batch**. Filtres : date range + appname + version + user.
Sous-composants dans `server/_component/` :
- `rest-tab/` — métriques REST (volume, latence, erreurs)
- `batch-tab/` — métriques batch
- `dependency-card/`, `dependency-table/` — dépendances
- `evol-user-card/` — évolution utilisateurs

#### `StatisticRequestView` (`/dashboard/request/:request_type`)
Stats agrégées par type de requête. Résolution dynamique du composant via `StatisticComponentResolverService` :

| Type | Composant |
|------|-----------|
| `rest` | `StatisticRequestHttpComponent` |
| `jdbc` | `StatisticRequestJdbcComponent` |
| `ftp` | `StatisticRequestFtpComponent` |
| `smtp` | `StatisticRequestSmtpComponent` |
| `ldap` | `StatisticRequestLdapComponent` |

**`StatisticRequestHttpComponent`** (le plus complet) :
- 4 cartes `DynamicChartComponent` : status, performance, size, latency
- Configs créées via `createRepartitionStatusConfig`, `createRepartitionPerformanceConfig`, `createRepartitionSizeConfig`, `createRepartitionLatencyConfig` (depuis `constant.ts`)
- Chaque carte émet un `DynamicChartEvent` → handler appelle `getCustom()` sur `RestRequestService`

#### `StatisticUserView` (`/dashboard/user/:user_name`)
Dashboard par utilisateur. Filtres : date range.

#### `StatisticClientView` (`/dashboard/client/:client_name`)
Dashboard par client (frontend). Charts sessions main + REST.

---

### `DynamicChartComponent` — ⚠️ Composant clé (cible de remplacement)

Sélecteur : `<dynamic-chart>`

**Interface `RepartitionTypeCardConfig`** :
```typescript
{
  title: string;
  indicators: { label: string, value: string }[];       // KPI à mesurer (count, sum...)
  groups:     { label: string, value: string, group?: (row) => string, properties?: string[] }[];  // Axe X
  slices:     { label: string, value: string }[];       // Affiche une table latérale
  series:     { label: string, value: string, properties?: {...}[] }[];  // Décomposition séries
  chartProvider?: ChartProvider<string, number>;
}
```

**Interface `DynamicChartEvent`** :
```typescript
{
  type: 'group' | 'indicator' | 'slice' | 'series' | 'sliceClick';
  config: { selectedIndicator, selectedGroup, selectedSlice, selectedSerie };
  sliceFilter?: any;
}
```

**Inputs** : `menuConfig: RepartitionTypeCardConfig`, `data: any[]`, `sliceData: any[]`, `isLoading: boolean`
**Output** : `chartEmitter: EventEmitter<DynamicChartEvent>`

**Logique interne** :
- `generateDynamicSeries(objects)` — reconstruit les `ChartProvider.series` dynamiquement en extrayant les valeurs uniques du champ `selectedSerie` + palette de couleurs
- `processDataByValue(data, fieldName)` — pivot local côté client (regroupe par `groupKey`)
- Rendu : `<chart type="column" [config]="..." [data]="..." [isLoading]="...">` — composant ECharts

> **Ce composant est la cible du chantier "View externalisé"** (Phase 6 dans `pilotage-view-externalisation.md`). L'objectif est de le remplacer par `<chart [view]="...">` une fois la Phase 4-bis du monorepo jquery-charts terminée.

---

### Vue `supervision/` — Supervision temps réel

- `ServerSupervisionView` : supervision d'une instance serveur. Sélection d'instance via dialog. Charts ressources machine (heap : max/allouée/utilisée). Métriques via `MachineUsageService` + `InstanceTraceService`. Résolution de période par date range.
- `ClientSupervisionView` : supervision client

---

### Vue `architecture/` — `ArchitectureView`

Graphe **mxgraph** des dépendances inter-applications.
- Sources : `RestSessionService` + `MainSessionService` + `InstanceService`
- Treemap ECharts en surimpression (volume d'appels par origine)
- `TreeService` construit le graphe mxgraph
- Modèles dans `architecture/model/architecture.model.ts`

---

### Vue `tree/` — `TreeView`

Arbre d'appels d'une session (REST ou main) via **mxgraph**.
- `data.type` : `'rest'` ou `'main'` (passé via route `data`)
- Sources : `TraceService.getTree(id, type)`
- Labels configurables : METHOD_RESOURCE, STATUS_EXCEPTION, SIZE_COMPRESSION
- `TreeGraph`, `LinkConfig`, `ServerType` définis dans `tree.model.ts`

---

### Vue `analytic/` — `AnalyticView`

Analyse des actions utilisateur (tracking frontend).
- Filtres : `user` (autocomplete) + `date`
- Sources : `AnalyticService.getUserActionsByUser()` + `MainSessionService`
- Affiche les sessions annotées avec leurs `UserAction[]`
- Mapping : `ANALYTIC_MAPPING` (DOMContentLoaded, click, scrollend, change)

---

## Shared (`src/app/shared/`)

### Module `SharedModule` — composants réutilisables

| Composant | Usage |
|-----------|-------|
| `HeaderPageComponent` | En-tête de page standardisée |
| `TimelineComponent` | Timeline vis-timeline pour les stages |
| `ExceptionDisplayComponent` + `StacktraceDialogComponent` | Affichage exception + stacktrace en dialog |
| `VersionBadgeComponent` | Badge de version |
| `StatusIndicatorComponent` | Indicateur visuel de statut |
| `ServerCardComponent` | Carte serveur |
| `BranchChipComponent` | Chip branche/hash git |
| `LogTableComponent` | Table des entrées de log |
| `StageTableComponent` | Table des stages via `@oneteme/jquery-table` |
| `ExceptionsTableComponent` | Table des exceptions |
| `PulseComponent` + `PulseDialogComponent` | Indicateur de santé temps réel |
| `EmptyStateComponent` | État vide |
| `OverlayContainerFilterComponent` | Conteneur overlay pour filtres |
| `AdvancedFilterTriggerComponent` + `AdvancedFilterRecapComponent` + `AdvancedFilterComponent` | Système de filtres avancés avec modale |
| `ConfigDialogComponent` | Dialog de configuration |

### Pipes

| Pipe | Description |
|------|-------------|
| `DurationPipe` | Formatage durée (ms → lisible) |
| `SizePipe` | Formatage taille (bytes → Ko/Mo) |
| `NumberFormatterPipe` | Formatage nombre |
| `FilterRowPipe` | Filtrage de lignes |
| `TitleCasePipe` | TitleCase |
| `ExceptionTypePipe` | Formatage type d'exception |
| `TruncStringPipe` | Troncature de chaîne |
| `TypeColumnFormatPipe` | Formatage colonne selon type |

### `util.ts`

Fonctions utilitaires centrales :
- `formatters` — formatters de valeurs (dates, durées, sizes)
- `periodManagement` — gestion des périodes
- `groupByField`, `groupByColor`, `countByFields` — agrégations locales
- `recreateDate`, `extractPeriod`, `mapParams` — utilitaires
- `class Utils` — icônes (re, os, dbaction, protocol), `getStateColor(status)`, `statusBorder()`

### `EnvRouter`

Wrapper du `Router` Angular injectable en tant que `EnvRouter`.
- Injecte automatiquement `?env=<currentEnv>` dans toutes les navigations
- `navigateOnClick(event, commands, extras)` — Ctrl+clic → nouvel onglet

### `FilterService`

- `BehaviorSubject<FilterMap>` `filters` : état courant des filtres
- Reset automatique des filtres lors d'un changement de route
- `savePreset` / `removePreset` — presets sauvegardés en `localStorage` (max 5 par page)

---

## Patterns récurrents dans les vues

### Pattern standard d'une vue avec filtres

```typescript
// 1. combineLatest params + queryParams dans ngOnInit
combineLatest({ params, queryParams }).subscribe(v => {
  this.params = { ... new QueryParams(...) };
  this._location.replaceState(`...?${this.params.queryParams.buildPath()}`);
  this.init();
});

// 2. init() : déclare les observables dans un objet `requests`
this.requests = { key: { observable: this.service.getXxx(params) } };
// 3. souscrit à chaque observable + finalize isLoading
Object.keys(this.requests).forEach(k => {
  this.requests[k].isLoading = true;
  this.requests[k].observable
    .pipe(finalize(() => this.requests[k].isLoading = false))
    .subscribe(res => this.requests[k].data = res);
});
```

### Pattern résolution dynamique de composant

Utilisé dans `StatisticRequestView` et `DetailRequestView` :
```typescript
// Service resolver : { 'rest': ComponentClass, 'jdbc': ... }
const componentType = this.componentResolver.resolveComponent(type);
this.viewContainerRef.clear();
const ref = this.viewContainerRef.createComponent(componentType);
ref.setInput('queryParams', this.params.queryParams);
```

### Pattern DynamicChartComponent (à remplacer)

```html
<dynamic-chart
  [menuConfig]="REPARTITION_STATUS"
  [data]="$statusRepartition.data"
  [isLoading]="$statusRepartition.loading"
  (chartEmitter)="statusRepartitionChange($event)">
</dynamic-chart>
```
Le handler `xxxChange(event)` switche sur `event.type` et appelle le service correspondant.

---

## Lien avec le monorepo jquery-charts

| Lib utilisée | Intégration |
|-------------|-------------|
| `@oneteme/jquery-echarts` | `file:../jquery-charts/jquery-charts/dist/oneteme/jquery-echarts` — build local |
| `@oneteme/jquery-table` | npm `^0.0.3` — `TableComponent`, `JqtCellDefDirective`, `TableProvider` |

Le fichier `src/app/shared/_component/table/table.config.ts` centralise les configs `TableProvider` réutilisables (ex: `REST_SESSION_TABLE_CONFIG`).

---

## Travail en cours / roadmap

### Objectif prioritaire : remplacer `DynamicChartComponent` par `<chart [view]="...">`

**Contexte** : `DynamicChartComponent` est un composant ad-hoc implémentant un menu View (indicateur, group, slice, series) spécifique à `statistic/request/`. L'objectif est de le remplacer par le View externalisé de `@oneteme/jquery-core` + `@oneteme/jquery-echarts`.

**Prérequis bloquants** (dans le monorepo jquery-charts) :
- Phase 4-bis terminée : `indicator` dans `ViewState`, `applyViewStateToSeriesDynamic()`, `groupByChanged` event
- Phase 5 : tests

**Vues cibles dans inspect-app** :
- `statistic/request/http/` — `StatisticRequestHttpComponent` (4 cartes DynamicChart)
- `statistic/request/jdbc/`, `ftp/`, `smtp/`, `ldap/` — même pattern

**Correspondances DynamicChart → View externalisé** :
| `DynamicChartComponent` | View externalisé |
|-------------------------|-----------------|
| `selectedGroup` | `ViewState.groupBy` |
| `selectedSerie` | `ViewState.selectedFields` |
| `selectedIndicator` | `ViewState.indicator` (Phase 4-bis) |
| `selectedSlice` + dynamic-table latérale | `ViewState.sliceBy` + `SlicePanelComponent` |
| `chartEmitter` `EventEmitter` | `ViewEvent` Observable RxJS |
