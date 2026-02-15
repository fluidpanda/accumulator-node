import type { DiscoveredDevice, Adapter, SensorSnapshot, ApiEndpoint } from "@/adapters/types";
import type { Logger } from "@/logging/logger";
import { getRecord, getNumber, getStringOrNull } from "@/helpers/jsons";

export interface SenseairAdapterOpts {
    logger: Logger;
    device: DiscoveredDevice;
}

function buildUrl(api: NonNullable<DiscoveredDevice["api"]>, host: string): string {
    const scheme = api.scheme ?? "http";
    const url = new URL(`${scheme}://${host}:${api.port}${api.path}`);
    return url.toString();
}

export class SenseairAdapter implements Adapter {
    private readonly logger: Logger;

    public readonly kind = "senseair" as const;
    public readonly device: DiscoveredDevice;

    public constructor(opts: SenseairAdapterOpts) {
        this.device = opts.device;
        this.logger = opts.logger;
    }
    public async poll(): Promise<SensorSnapshot> {
        const api: ApiEndpoint | undefined = this.device.api;
        if (!api || api.hosts.length === 0) {
            this.logger.warn({ deviceId: this.device.id }, `no api endpoint ${this.device.id}`);
            return {
                tsMs: Date.now(),
                ok: false,
                metrics: {},
                lastError: "no api endpoint found",
            };
        }
        let lastErr: string | null = null;
        for (const host of api.hosts) {
            const url: string = buildUrl(api, host);
            try {
                const res = await fetch(url, {
                    method: "GET",
                    headers: { accept: "application/json" },
                });
                if (!res.ok) {
                    lastErr = `HTTP ${res.status} ${res.statusText}`;
                    this.logger.warn({ url, status: res.status }, "host failed, trying next");
                    continue;
                }
                const body: unknown = await res.json();
                const sensor: Record<string, unknown> | null = getRecord(body, "sensor");
                const co2ppm: number | null = sensor ? getNumber(sensor, "co2ppm") : null;
                const ageMs: number | null = sensor ? getNumber(sensor, "ageMs") : null;
                const lastError: string | null = sensor ? getStringOrNull(sensor, "lastError") : null;

                const metrics: Record<string, number | string | boolean | null> = {};
                if (co2ppm !== null) {
                    metrics["co2ppm"] = co2ppm;
                }
                this.logger.debug({ url });
                return {
                    tsMs: Date.now(),
                    ok: true,
                    metrics,
                    ageMs,
                    lastError,
                    raw: body,
                };
            } catch (err: unknown) {
                lastErr = err instanceof Error ? err.message : "unknown error";
                this.logger.warn({ err, url });
            }
        }
        return {
            tsMs: Date.now(),
            ok: false,
            metrics: {},
            lastError: lastErr ?? "all hosts failed",
        };
    }
}
