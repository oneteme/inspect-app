


## Integration [![Docker Pulls](https://img.shields.io/docker/v/oneteme/inspect-app?style=social)](https://hub.docker.com/r/oneteme/inspect-app)
```SH
docker run --pull=always -d --name inspect-app -e INSPECT_SERVER_URL="{{URL}}" -p 80:80 oneteme/inspect-app:{{version}}
```
## Référence API

| Request | Description   | obligatoire | 
|------|------------|-------------|
| host | **string** | x           | 
| defaultEnv | **string** | dev         | 
| gridViewPeriod | **string** | LAST_30     |
| kpiViewPeriod  | **string** | LAST_30           | 
