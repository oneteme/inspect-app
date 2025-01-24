


## Integration [![Docker Pulls](https://img.shields.io/docker/v/oneteme/inspect-app?style=social)](https://hub.docker.com/r/oneteme/inspect-app)
```SH
docker run --pull=always -d --name inspect-app -e INSPECT_SERVER_URL="{{URL}}" -p 80:80 oneteme/inspect-app:{{version}}
```
## API Reference

| Request | Description   | Required | 
|------|------------|----------|
| INSPECT_SERVER_URL | **string** | x        | 
| DEFAULT_ENV | **string** | dev      | 
| DEFAULT_GRID_VIEW_PERIOD | **string** | LAST_30  |
| DEFAULT_KPI_VIEW_PERIOD  | **string** | LAST_30  | 
