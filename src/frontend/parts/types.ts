export interface MetricPoint {
    tsMs: number;
    value: number;
}

export interface Device {
    id: string;
    snapshot?: {
        ok: boolean;
        metrics?: Record<string, unknown>;
        lastError?: string | null;
    } | null;
}

export interface State {
    devices: Array<Device>;
}

export type RangePreset = "1m" | "5m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
export type AggPreset = "avg" | "max";
