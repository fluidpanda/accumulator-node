import Fastify from "fastify";
import type { HistoryState } from "@/history/store";
import type { Logger } from "@/logging/logger";
import type { Runner, RunnerState } from "@/service/runner";
import { renderPage } from "@/api/static/page";

export interface ApiOpts {
    logger: Logger;
    runner: Runner;
    history: HistoryState;
    host: string;
    port: number;
}

export interface ApiServer {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export function createApi(opts: ApiOpts): ApiServer {
    const logger: Logger = opts.logger.child({ module: "api" });
    const app = Fastify({ loggerInstance: logger });

    app.get("/api/state", (): RunnerState => {
        return opts.runner.getState();
    });
    app.get("/api/history", (req, reply) => {
        const q = req.query as Partial<{ deviceId: string; metric: string; limit: string }>;
        const deviceId: string | undefined = q.deviceId;
        const metric: string = q.metric ?? "co2ppm";
        const limitRaw: number = q.limit ? Number(q.limit) : 600;
        if (!deviceId) {
            reply.code(400);
            return { error: "deviceId is required" };
        }
        const limit: number = Number.isFinite(limitRaw) ? Math.max(1, Math.min(10_000, limitRaw)) : 600;
        return opts.history.get(deviceId, metric, limit);
    });
    app.get("/", async (req, reply): Promise<string> => {
        reply.header("content-type", "text/html; charset=utf-8");
        return renderPage();
    });
    return {
        async start(): Promise<void> {
            await app.listen({ host: opts.host, port: opts.port });
            logger.info({ host: opts.host, port: opts.port }, "api started");
        },
        async stop(): Promise<void> {
            await app.close();
            logger.info("api stopped");
        },
    };
}
