import Database from "better-sqlite3";
import type { HistoryAgg, HistoryQuery, HistoryState } from "@/history/store";
import type { MetricPoint } from "@/history/types";

export interface SqliteHistoryOpts {
    path: string;
}

export function createSqliteHistoryState(opts: SqliteHistoryOpts): HistoryState {
    const db = new Database(opts.path);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.exec(`
    CREATE TABLE IF NOT EXISTS points (
        deviceId TEXT NOT NULL,
        metric   TEXT NOT NULL,
        tsMs     INTEGER NOT NULL,
        value    REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_points_device_metric_ts
        ON points(deviceId, metric, tsMs)
    `);
    const stmtInsert = db.prepare(`INSERT INTO points(deviceId, metric, tsMs, value) VALUES (?, ?, ?, ?)`);
    const stmtDevice = db.prepare(`DELETE FROM points WHERE deviceId = ?`);
    function aggSql(agg: HistoryAgg): string {
        switch (agg) {
            case "avg":
                return "AVG(value)";
            case "max":
                return "MAX(value)";
            case "min":
                return "MIN(value)";
        }
    }
    return {
        push(deviceId: string, metric: string, point: MetricPoint): void {
            stmtInsert.run(deviceId, metric, point.tsMs, point.value);
        },
        prune(deviceId: string): void {
            stmtDevice.run(deviceId);
        },
        query(q: HistoryQuery): Array<MetricPoint> {
            const expr: string = aggSql(q.agg);
            const sql = `
            SELECT
                (CAST(tsMs / ? AS INTEGER) * ?) AS tsMs,
                ${expr} AS value
            FROM points
            WHERE deviceId = ?
                AND metric = ?
                AND tsMs >= ?
                AND tsMs <= ?
            GROUP BY tsMs
            ORDER BY tsMs`;
            const rows = db.prepare(sql).all(q.bucketMs, q.bucketMs, q.deviceId, q.metric, q.fromMs, q.toMs) as Array<{
                tsMs: number;
                value: number;
            }>;
            return rows.map((r) => ({ tsMs: r.tsMs, value: r.value }));
        },
    };
}
