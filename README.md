# Accumulator

Lightweight CO2 sensor aggregator with web UI and SQLite storage.

## Features

- UDP discovery of sensors services ([senseair-node](https://github.com/fluidpanda/senseair-node))
- Adapter-based polling architecture
- In-memory or SQLite history backend
- Time-range aggregation (1m -> 24h)
- Overlay chart view (Charts.js)
- Automatic retention

## Requirements

- Node.js 20+
- SQLite (bundled via better-sqlite3)

## Installation

```
npm install
npm run build
```

## Development

```
tsx watch src/main.ts
```

## Production

```
npm run build
node dist/main.js
```

## Environment Variables

| Variable            | Default          | Description                   |
| ------------------- | ---------------- | ----------------------------- |
| WEB_PORT            | 8080             | HTTP port                     |
| CAPTURE_PORT        | 45454            | UDP announce port             |
| POLLING_INTERVAL_MS | 5000             | Sensor polling interval       |
| DEVICE_TTL_MS       | 60000            | Device timeout                |
| HISTORY_BACKEND     | memory           | `memory` or `sqlite`          |
| HISTORY_DB          | ./history.sqlite | SQLite file path              |
| HISTORY_DAYS        | 30               | Delete data older than N days |

## SQLite Schema

```sql
CREATE TABLE points (
    deviceId TEXT NOT NULL,
    metric   TEXT NOT NULL,
    tsMs     INTEGER NOT NULL,
    value    REAL NOT NULL
);

CREATE INDEX idx_points_device_metric_ts
    ON points(deviceId, metric, tsMs);
```
