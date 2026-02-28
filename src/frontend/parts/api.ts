import type { AggPreset, MetricPoint, RangePreset, State } from "@/frontend/parts/types";
import { pickBucketMs, rangeToMs } from "@/frontend/parts/presets";

export async function fetchState(): Promise<State> {
    const res: Response = await fetch("/api/state");
    return (await res.json()) as State;
}

export interface HistoryParams {
    deviceId: string;
    metric: string;
    range: RangePreset;
    agg: AggPreset;
    targetPoints?: number;
}

export async function fetchHistory(p: HistoryParams): Promise<Array<MetricPoint>> {
    const toMs: number = Date.now();
    const rangeMs: number = rangeToMs(p.range);
    const fromMs: number = toMs - rangeMs;
    const bucketMs: number = pickBucketMs(rangeMs, p.targetPoints ?? 180);
    const limit: number | undefined = p.agg === "raw" ? 10_000 : undefined;

    const url: string =
        `/api/history?deviceId=${encodeURIComponent(p.deviceId)}` +
        `&metric=${encodeURIComponent(p.metric)}` +
        `&fromMs=${fromMs}&toMs=${toMs}` +
        (p.agg === "raw" ? "" : `&bucketMs=${bucketMs}`) +
        `&agg=${p.agg}` +
        (limit ? `&limit=${limit}` : "");

    const res: Response = await fetch(url);
    return (await res.json()) as Array<MetricPoint>;
}
