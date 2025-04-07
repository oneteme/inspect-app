# Inpect App

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
