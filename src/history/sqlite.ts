import Database from "better-sqlite3";
import type { Statement } from "better-sqlite3";
import type { HistoryAgg, HistoryQuery, HistoryState } from "@/history/store";
import type { MetricPoint } from "@/history/types";

export interface SqliteHistoryOpts {
    path: string;
    retentionDays?: number;
}

interface RawPoints {
    tsMs: number;
    value: number;
}

interface BucketedPoints {
    bucketTs: number;
    value: number;
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
    const stmtInsert: Statement<Array<unknown>> = db.prepare(
        `INSERT INTO points(deviceId, metric, tsMs, value) VALUES (?, ?, ?, ?)`,
    );
    const stmtDevice: Statement<Array<unknown>> = db.prepare(`DELETE FROM points WHERE deviceId = ?`);
    const retentionMs: number | null =
        opts.retentionDays && opts.retentionDays > 0 ? opts.retentionDays * 24 * 60 * 60 * 1_000 : null;
    const stmtDeleteOld: Statement<Array<unknown>> | null = retentionMs
        ? db.prepare(`DELETE FROM points WHERE tsMs < ?`)
        : null;
    function aggSql(agg: HistoryAgg): string {
        switch (agg) {
            case "avg":
                return "AVG(value)";
            case "max":
                return "MAX(value)";
            case "min":
                return "MIN(value)";
            case "raw":
                return "value";
        }
    }
    return {
        push(deviceId: string, metric: string, point: MetricPoint): void {
            stmtInsert.run(deviceId, metric, point.tsMs, point.value);
            if (retentionMs && stmtDeleteOld) {
                const cutoff: number = Date.now() - retentionMs;
                stmtDeleteOld.run(cutoff);
            }
        },
        prune(deviceId: string): void {
            stmtDevice.run(deviceId);
        },
        query(q: HistoryQuery): Array<MetricPoint> {
            if (q.agg === "raw") {
                const targetPoints: number = q.limit || 500;
                // count all the points
                const countSql = `
                    SELECT COUNT(*) as count
                    FROM points
                    WHERE deviceId = ?
                        AND metric = ?
                        AND tsMs >= ?
                        AND tsMs <= ?
                `;
                const countResult = db.prepare(countSql).get(q.deviceId, q.metric, q.fromMs, q.toMs) as {
                    count: number;
                };
                const actualPoints: number = countResult.count;
                // show all point on small windows
                if (actualPoints <= targetPoints) {
                    const sql = `
                        SELECT tsMs, value
                        FROM points
                        WHERE deviceId = ?
                            AND metric = ?
                            AND tsMs >= ?
                            AND tsMs <= ?
                        ORDER BY tsMs
                    `;
                    const rows = db.prepare(sql).all(q.deviceId, q.metric, q.fromMs, q.toMs) as Array<RawPoints>;
                    return rows.map((r: RawPoints) => ({ tsMs: Number(r.tsMs), value: Number(r.value) }));
                }
                // downsampling points
                const step: number = Math.floor(actualPoints / targetPoints);
                const sql = `
                    SELECT tsMs, value
                    FROM points
                    WHERE deviceId = ?
                        AND metric = ?
                        AND tsMs >= ?
                        AND tsMs <= ?
                        AND (rowid % ? = 0)
                    ORDER BY tsMs
                `;
                const rows = db.prepare(sql).all(q.deviceId, q.metric, q.fromMs, q.toMs, step) as Array<RawPoints>;
                return rows.map((r: RawPoints) => ({ tsMs: Number(r.tsMs), value: Number(r.value) }));
            }
            const expr: string = aggSql(q.agg);
            const sql = `
                SELECT
                    (tsMs - (tsMs % ?)) AS bucketTs,
                    ${expr} AS value
                FROM points
                WHERE deviceId = ?
                    AND metric = ?
                    AND tsMs >= ?
                    AND tsMs <= ?
                GROUP BY bucketTs
                ORDER BY bucketTs
            `;
            const rows = db
                .prepare(sql)
                .all(q.bucketMs, q.deviceId, q.metric, q.fromMs, q.toMs) as Array<BucketedPoints>;
            return rows.map((r: BucketedPoints) => ({ tsMs: Number(r.bucketTs), value: Number(r.value) }));
        },
    };
}
