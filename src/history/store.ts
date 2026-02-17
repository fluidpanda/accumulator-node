import type { MetricPoint } from "@/history/types";

export interface HistoryState {
    push(deviceId: string, metric: string, point: MetricPoint): void;
    get(deviceId: string, metric: string, limit: number): Array<MetricPoint>;
    prune(deviceId: string): void;
}

export interface HistoryStateOpts {
    maxPointsPerSeries: number;
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
        get(deviceId: string, metric: string, limit: number): Array<MetricPoint> {
            const k: string = key(deviceId, metric);
            const arr: Array<MetricPoint> = series.get(k) ?? [];
            if (limit <= 0) return [];
            if (arr.length <= limit) return arr.slice();
            return arr.slice(arr.length - limit);
        },
        prune(deviceId: string): void {
            const prefix = `${deviceId}|`;
            for (const k of series.keys()) {
                if (k.startsWith(prefix)) series.delete(k);
            }
        },
    };
}
