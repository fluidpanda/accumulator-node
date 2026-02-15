import type { Logger } from "@/logging/logger";

export type AdapterKind = string;
export type MetricValue = number | string | boolean | null;
export type Metrics = Record<string, MetricValue>;

export interface ApiEndpoint {
    hosts: ReadonlyArray<string>;
    port: number;
    path: string;
    scheme?: "http" | "https";
}

export interface DiscoveredDevice {
    id: string;
    kind?: AdapterKind;
    api?: ApiEndpoint;
    meta?: Record<string, unknown>;
}

export interface SensorSnapshot {
    tsMs: number;
    ok: boolean;
    metrics: Metrics;
    ageMs?: number | null;
    lastError?: string | null;
    raw?: unknown;
}

export interface Adapter {
    readonly kind: AdapterKind;
    readonly device: DiscoveredDevice;
    poll(): Promise<SensorSnapshot>;
    close?(): Promise<void>;
}

export interface AdapterCreateDeps {
    logger: Logger;
}

export interface AdapterFactory {
    readonly kind: AdapterKind;
    match(device: DiscoveredDevice): boolean;
    create(device: DiscoveredDevice, deps: AdapterCreateDeps): Adapter;
}
