import Fastify from "fastify";
import type { InjectOptions, LightMyRequestResponse } from "fastify";
import type { HistoryState, HistoryAgg } from "@/history/store";
import type { Logger } from "@/logging/logger";
import type { Runner, RunnerState } from "@/service/runner";
import { renderPage } from "@/frontend/page";

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
    inject(opts: InjectOptions): Promise<LightMyRequestResponse>;
}

export function createApi(opts: ApiOpts): ApiServer {
    const logger: Logger = opts.logger.child({ module: "api" });
    const app = Fastify({ loggerInstance: logger });

    app.get("/api/state", (): RunnerState => {
        return opts.runner.getState();
    });
    app.get("/api/history", (req, reply) => {
        const q = req.query as Partial<{
            deviceId: string;
            metric: string;
            fromMs: string;
            toMs: string;
            bucketMs: string;
            agg: HistoryAgg;
            limit?: number;
        }>;
        if (!q.deviceId) {
            reply.code(400);
            return { error: "deviceId is required" };
        }
        const now: number = Date.now();
        const toMs: number = q.toMs ? Number(q.toMs) : now;
        const fromMs: number = q.fromMs ? Number(q.fromMs) : toMs - 60 * 60 * 1000;
        const bucketMs: number = q.bucketMs ? Number(q.bucketMs) : 5 * 60 * 1000;
        const limit: number | undefined = q.limit ? Number(q.limit) : undefined;

        return opts.history.query({
            deviceId: q.deviceId,
            metric: q.metric ?? "co2ppm",
            fromMs,
            toMs,
            bucketMs,
            agg: q.agg ?? "avg",
            limit,
        });
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
        inject(req: InjectOptions): Promise<LightMyRequestResponse> {
            return app.inject(req);
        },
    };
}
