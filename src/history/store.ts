import type { MetricPoint } from "@/history/types";

export type HistoryAgg = "avg" | "max" | "min";

export interface HistoryQuery {
    deviceId: string;
    metrics: string;
    fromMs: number;
    toMs: number;
    bucketMs: number;
    agg: HistoryAgg;
}

export interface HistoryState {
    push(deviceId: string, metric: string, point: MetricPoint): void;
    prune(deviceId: string): void;
    query(q: HistoryQuery): Array<MetricPoint>;
}

export interface HistoryStateOpts {
    maxPointsPerSeries: number;
}

export function aggregatePoints(
    points: Array<MetricPoint>,
    fromMs: number,
    toMs: number,
    bucketMs: number,
    agg: HistoryAgg,
): Array<MetricPoint> {
    if (bucketMs <= 0) return [];
    const buckets = new Map<number, { sum: number; n: number; min: number; max: number }>();
    for (const p of points) {
        if (p.tsMs < fromMs || p.tsMs > toMs) continue;
        const b: number = Math.floor(p.tsMs / bucketMs) * bucketMs;
        const cur = buckets.get(b);
        if (!cur) {
            buckets.set(b, { sum: p.value, n: 1, min: p.value, max: p.value });
        } else {
            cur.sum += p.value;
            cur.n += 1;
            if (p.value < cur.min) cur.min = p.value;
            if (p.value > cur.max) cur.max = p.value;
        }
    }
    const keys: Array<number> = Array.from(buckets.keys()).sort((a: number, b: number): number => {
        return a - b;
    });
    return keys.map((tsMs: number) => {
        const b = buckets.get(tsMs)!;
        const v: number = agg === "avg" ? b.sum / b.n : agg === "max" ? b.max : b.min;
        return { tsMs, value: v };
    });
}

export function createHistoryState(opts: HistoryStateOpts): HistoryState {
    const series = new Map<string, Array<MetricPoint>>();

    function key(deviceId: string, metric: string): string {
        return `${deviceId}:${metric}`;
    }
    return {
        push(deviceId: string, metric: string, point: MetricPoint): void {
            const k: string = key(deviceId, metric);
            const arr: Array<MetricPoint> = series.get(k) ?? [];
            arr.push(point);
            while (arr.length > opts.maxPointsPerSeries) arr.shift();
            series.set(k, arr);
        },
        prune(deviceId: string): void {
            const prefix = `${deviceId}|`;
            for (const k of series.keys()) {
                if (k.startsWith(prefix)) series.delete(k);
            }
        },
        query(q: HistoryQuery): Array<MetricPoint> {
            const k: string = key(q.deviceId, q.metrics);
            const arr: Array<MetricPoint> = series.get(k) ?? [];
            return aggregatePoints(arr, q.fromMs, q.toMs, q.bucketMs, q.agg);
        },
    };
}
