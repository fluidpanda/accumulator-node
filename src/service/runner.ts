import type { AdapterRegistry } from "@/adapters/registry";
import type { DiscoveredDevice, Adapter, SensorSnapshot } from "@/adapters/types";
import type { Logger } from "@/logging/logger";
import { createAdapter } from "@/adapters/factory";

export interface RunnerOptions {
    logger: Logger;
    adapterRegistry: AdapterRegistry;
    pollingIntervalMs: number;
    deviceTtlMs: number;
}

export interface RunnerState {
    devices: Array<{
        id: string;
        kind?: string;
        lastSeenMs: number;
        api?: unknown;
        snapshot?: SensorSnapshot | null;
    }>;
}

export interface Runner {
    start(): void;
    stop(): Promise<void>;
    onDevice(device: DiscoveredDevice): void;
    getState(): RunnerState;
}

interface RuntimeDevice {
    device: DiscoveredDevice;
    lastSeenMs: number;
    lastSnapshot: SensorSnapshot | null;
}

export function createRunner(opts: RunnerOptions): Runner {
    const logger: Logger = opts.logger.child({ module: "runner" });
    const devices = new Map<string, RuntimeDevice>();
    let timer: NodeJS.Timeout | null = null;
    let running: boolean = false;
    let tickInFlight: boolean = false;

    function upsert(device: DiscoveredDevice): void {
        const now: number = Date.now();
        const prev: RuntimeDevice | undefined = devices.get(device.id);
        devices.set(device.id, {
            device,
            lastSeenMs: now,
            lastSnapshot: prev?.lastSnapshot ?? null,
        });
        if (!prev) {
            logger.info({ deviceId: device.id, api: device.api }, "registered");
        } else {
            logger.debug({ deviceId: device.id }, "updated");
        }
    }
    function purgeExpired(now: number): void {
        for (const [id, rt] of devices) {
            if (now - rt.lastSeenMs > opts.deviceTtlMs) {
                devices.delete(id);
                logger.warn({ deviceId: id }, "device ttl expired");
            }
        }
    }
    async function pollOne(rt: RuntimeDevice): Promise<void> {
        const device: DiscoveredDevice = rt.device;
        if (!device.api || device.api.hosts.length === 0) {
            logger.warn({ deviceId: device.id }, "skipped, without api endpoint");
            return;
        }
        const adapter: Adapter = createAdapter(opts.adapterRegistry, device, { logger });
        try {
            const snapshot: SensorSnapshot = await adapter.poll();
            const current: RuntimeDevice | undefined = devices.get(device.id);
            if (current) {
                devices.set(device.id, { ...current, lastSnapshot: snapshot });
            }
            logger.info(
                {
                    deviceId: device.id,
                    ok: snapshot.ok,
                    ageMs: snapshot.ageMs ?? null,
                    metrics: snapshot.metrics,
                },
                "snapshot received",
            );
        } finally {
            if (adapter.close) await adapter.close();
        }
    }
    async function tick(): Promise<void> {
        if (!running) return;
        if (tickInFlight) return;
        tickInFlight = true;
        try {
            const now: number = Date.now();
            purgeExpired(now);
            for (const rt of devices.values()) {
                await pollOne(rt);
            }
        } catch (err: unknown) {
            logger.error({ err }, "runner tick failed");
        } finally {
            tickInFlight = false;
        }
    }
    return {
        start(): void {
            if (running) return;
            running = true;
            timer = setInterval((): void => {
                void tick();
            }, opts.pollingIntervalMs);
            logger.info({ pollIntervalMs: opts.pollingIntervalMs, deviceTtlMs: opts.deviceTtlMs });
        },
        getState(): RunnerState {
            return {
                devices: Array.from(devices.values()).map((rt: RuntimeDevice) => ({
                    id: rt.device.id,
                    kind: rt.device.kind,
                    lastSeenMs: rt.lastSeenMs,
                    api: rt.device.api,
                    snapshot: rt.lastSnapshot,
                })),
            };
        },
        async stop(): Promise<void> {
            running = false;
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            while (tickInFlight) {
                await new Promise((r): NodeJS.Timeout => {
                    return setTimeout(r, 50);
                });
            }
            logger.info("runner stopped");
        },
        onDevice(device: DiscoveredDevice): void {
            upsert(device);
        },
    };
}
