# Inspect App

<p align="center">
  <a href="https://spring.io/">
    <img src="https://img.shields.io/badge/Angular-16-$.svg?logo=Angular&color=red" alt="Angular 16" style="border-radius: 4px;">
  </a>
  <a href="https://www.npmjs.com/package/@oneteme/jquery-apexcharts">
    <img src="https://img.shields.io/badge/npm-v1.0.0-cb3837.svg?logo=npm&logoColor=white" alt="NPM Version" style="border-radius: 4px;">
  </a>
  <a href="https://github.com/oneteme/jquery-charts/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/jquerycharts-0.0.15-blue.svg" alt="License" style="border-radius: 4px;">
  </a>
</p>

## 📋 Table of Contents

- ## [Integration](#%EF%B8%8F-integration)
    - ### [Setup](#setup-1)
    - ### [Authentication](#authentication)
    - ### [How inspect-app works](#how-inspect-app-works)
    - ### [Core services and methods](#core-services-and-methods)
    - ### [Core objects and data model](#core-objects-and-data-model)
    - ### [Important dependencies](#important-dependencies)

---

# 🛠️ Integration

## Setup

```ts
// environement.ts
export const app: Application = {
    host : "http://localhost:9000",
    defaultEnv : "dev",
    gridViewPeriod:  "LAST_60",
    kpiViewPeriod: "LAST_1440"
}
```


## API Reference

| VARIABLE | TYPE   | REQUIRED  | 
|------|------------|----------|
| INSPECT_SERVER_URL | **string** | x        | 
| DEFAULT_ENV | **string** | dev      | 
| DEFAULT_GRID_VIEW_PERIOD | **string** | LAST_30  |
| DEFAULT_KPI_VIEW_PERIOD  | **string** | LAST_1440  | 

## Authentication

Authentication is optional and controlled by `auth.enabled` in `src/environments/environment.ts`.

When enabled, `AuthService.init()` runs at startup (via `APP_INITIALIZER`) and configures OAuth with `angular-oauth2-oidc`. Protected routes use `authGuard`, and API calls include a bearer token through `AuthInterceptor`.

## How inspect-app works

`inspect-app` is an Angular 16 frontend for Inspect telemetry. It loads runtime configuration from `assets/environment.remote.json` in `main.ts`, merges it into `app`, and uses that configuration to query backend APIs.

At runtime, the app flow is:

1. **Bootstrap**: `main.ts` loads/validates runtime config, then starts `AppModule`.
2. **Routing**: `app.module.ts` defines routes for search, session detail, request detail, trees, architecture, supervision, and KPI views.
3. **Data fetching**: views call service classes (`TraceService`, `TreeService`, `InstanceService`, etc.) to query Inspect endpoints.
4. **Rendering**: shared UI components (tables, charts, timelines, dialogs) present telemetry, errors, stages, and trends.

## Core services and methods

| Service | Main responsibility | Key methods |
|------|------|------|
| `TraceService` | Query v3 trace/session/request APIs | `getRestSessions`, `getMainSessions`, `getRestSession`, `getMainSession`, `getTree`, request/stage getters (`getDatabaseRequestStages`, `getSmtpRequestMails`, etc.) |
| `TreeService` | Query architecture and aggregated tree metrics | `getArchitecture`, `getJdbcExceptions`, `getSmtpRequestCount`, other protocol stage/exception getters |
| `InstanceService` | Query instance metadata and lifecycle from jQuery endpoints | `getApplications`, `getLastServerStart`, `getMainSessionApplication`, `getInstancesByPeriod` |
| `FilterService` | Manage advanced filters and presets in local storage | `savePreset`, `removePreset`, `setFilterMap`, `registerGetallFilters` |
| `EnvRouter` | Keep `env` query parameter consistent across navigation | `navigate`, `createUrlTree`, `navigateOnClick` |
| `AuthService` | OAuth login state and tokens | `init`, `login`, `logout`, `isLogged`, `getAccessToken` |
| `PageTitleService` / `PagePanelService` | Cross-view UI state (title and side panel) | `set`/`clear`, `register`/`toggle`/`close` |

## Core objects and data model

The app relies on typed DTOs/interfaces in `src/app/model`:

- `conf.model.ts`: query and period helpers (`QueryParams`, `IPeriod`, `IStep`, `IStepFrom`) used to build consistent backend query parameters.
- `trace.model.ts`: telemetry domain objects (`RestSession`, `MainSession`, `RestRequest`, `DatabaseRequest`, `InstanceEnvironment`, `LogEntry`, `ExceptionInfo`).
- `request.model.ts`: view-oriented DTOs extending telemetry objects (`RestSessionDto`, `MainSessionDto`, `MainSessionView`, `RestSessionView`).
- `tree.model.ts`: graph nodes/links and formatting logic used by the call-tree UI (`Node`, `Link`, `RestServerNode`, `JdbcRequestNode`, etc.).

Two key object patterns are used across the app:

1. **`QueryParams` + `Period` objects** to generate URL/API parameters from form state.
2. **DTO-to-view objects** to enrich raw backend data with UI-specific fields (counts, exceptions, nested request lists).

## Important dependencies

Beyond Angular, these dependencies are central to inspect-app:

- `angular-oauth2-oidc`: OAuth/OIDC login flow and token handling.
- `@oneteme/inspect-ng-collector`: frontend telemetry/monitoring integration.
- `@oneteme/jquery-table`, `@oneteme/jquery-echarts`, `@oneteme/jquery-organizer`, `@oneteme/jquery-core`: reusable table, chart, and organizer components used throughout views.
- `mxgraph`: architecture and topology graph rendering.
- `vis-timeline` / `vis-data`: timeline visualizations in detail screens (⚠️Deprecated since 2019, but still used in inspect-app).
- `rxjs`: reactive state, async orchestration, and cancellation patterns in views/services.
