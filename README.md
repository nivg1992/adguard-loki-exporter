# AdguardHome Loki Exporter

## Using Docker

```
docker run -e ADGUARD_URL=http://127.0.0.1:8080 -e ADGUARD_USER=admin -e ADGUARD_PASSWORD=passwrod -e LOKI_URL=http://127.0.0.1:3100 nivg1992/adguard-loki-exporter
```

## docker compose

```
version: '2'
services:
 adguardLokiExporter:
    image: nivg1992/adguard-loki-exporter
    restart: unless-stopped
    volumes:
     - ./pointer-adguard:/usr/src/app/pointer-adguard
    environment:
     - ADGUARD_URL=${ADGUARD_URL}
     - ADGUARD_USER=${ADGUARD_USER}
     - ADGUARD_PASSWORD=${ADGUARD_PASSWORD}
     - LOKI_URL=http://loki:3100
```

## local

### Installation

`yarn run build`

### run

`yarn run -- -aurl http://127.0.0.1:8080 -auser admin -apass passwrod -lurl http://127.0.0.1:3100`