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
