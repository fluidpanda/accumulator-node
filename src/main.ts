import type { DiscoveredDevice } from "@/adapters/types";
import type { Listener } from "@/listener/listener";
import type { Logger } from "@/logging/logger";
import type { ServiceDependencies } from "@/service/deps";
import type { Runner } from "@/service/runner";
import { initEnv, envStr, envInt } from "@/helpers/envs";
import { createListener } from "@/listener/listener";
import { createLogger } from "@/logging/logger";
import { buildServiceDeps } from "@/service/deps";
import { createRunner } from "@/service/runner";

initEnv();

const UDP_BIND_HOST: string = envStr("UDP_BIND_HOST") ?? "0.0.0.0";
const UDP_PORT: number = envInt("UDP_PORT", 4_5454);
const POLLING_INTERVAL_MS: number = envInt("POLLING_INTERVAL_MS", 5_000);
const DEVICE_TTL_MS: number = envInt("DEVICE_TTL_MS", 60_000);

const logger: Logger = createLogger();

async function main(): Promise<void> {
    const deps: ServiceDependencies = buildServiceDeps(logger);
    const runner: Runner = createRunner({
        logger,
        adapterRegistry: deps.adapterRegistry,
        pollingIntervalMs: POLLING_INTERVAL_MS,
        deviceTtlMs: DEVICE_TTL_MS,
    });
    const listener: Listener = createListener({
        logger,
        bindHost: UDP_BIND_HOST,
        port: UDP_PORT,
        onDevice: (d: DiscoveredDevice): void => {
            return runner.onDevice(d);
        },
    });
    const shutdown: (reason: string) => Promise<void> = async (reason: string): Promise<void> => {
        logger.info({ reason }, "shutdown");
        try {
            await listener.stop();
        } catch (err: unknown) {
            logger.error({ err });
        }
        try {
            await runner.stop();
        } catch (err: unknown) {
            logger.error({ err });
        }
    };
    process.on("SIGINT", (): void => {
        void shutdown("SIGINT").finally((): never => {
            return process.exit();
        });
    });
    process.on("SIGTERM", (): void => {
        void shutdown("SIGTERM").finally((): never => {
            return process.exit();
        });
    });
    await listener.start();
    runner.start();
    logger.info("accumulator started");
}

void main();
