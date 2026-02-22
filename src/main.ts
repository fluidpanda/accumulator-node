import type { DiscoveredDevice } from "@/adapters/types";
import type { ApiServer } from "@/api/http";
import type { HistoryState } from "@/history/store";
import type { Listener } from "@/listener/listener";
import type { Logger } from "@/logging/logger";
import type { ServiceDependencies } from "@/service/deps";
import type { Runner } from "@/service/runner";
import { createApi } from "@/api/http";
import { initEnv, envStr, envInt } from "@/helpers/envs";
import { createSqliteHistoryState } from "@/history/sqlite";
import { createHistoryState } from "@/history/store";
import { createListener } from "@/listener/listener";
import { createLogger } from "@/logging/logger";
import { buildServiceDeps } from "@/service/deps";
import { createRunner } from "@/service/runner";

initEnv();

const BIND_HOST: string = envStr("BIND_HOST") ?? "0.0.0.0";
const CAPTURE_PORT: number = envInt("CAPTURE_PORT", 4_5454);
const POLLING_INTERVAL_MS: number = envInt("POLLING_INTERVAL_MS", 5_000);
const DEVICE_TTL_MS: number = envInt("DEVICE_TTL_MS", 60_000);
const WEB_PORT: number = envInt("WEB_PORT", 8080);
const HISTORY_BACKEND: string = envStr("HISTORY_BACKEND") ?? "memory";
const HISTORY_DB: string = envStr("HISTORY_DB") ?? "./history.sqlite";
const HISTORY_DAYS: number = envInt("HISTORY_DAYS", 30);

const logger: Logger = createLogger();

async function main(): Promise<void> {
    const deps: ServiceDependencies = buildServiceDeps(logger);
    const history: HistoryState =
        HISTORY_BACKEND === "sqlite"
            ? createSqliteHistoryState({ path: HISTORY_DB, retentionDays: HISTORY_DAYS })
            : createHistoryState({ maxPointsPerSeries: 10_000 });
    const runner: Runner = createRunner({
        logger,
        history,
        adapterRegistry: deps.adapterRegistry,
        pollingIntervalMs: POLLING_INTERVAL_MS,
        deviceTtlMs: DEVICE_TTL_MS,
    });
    const listener: Listener = createListener({
        logger,
        bindHost: BIND_HOST,
        port: CAPTURE_PORT,
        onDevice: (d: DiscoveredDevice): void => {
            return runner.onDevice(d);
        },
    });
    const api: ApiServer = createApi({
        logger,
        runner,
        history,
        host: BIND_HOST,
        port: WEB_PORT,
    });
    const shutdown: (reason: string) => Promise<void> = async (reason: string): Promise<void> => {
        logger.info({ reason }, "shutdown");
        try {
            await listener.stop();
            await runner.stop();
            await api.stop();
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
    await api.start();
    logger.info("accumulator started");
}

void main();
