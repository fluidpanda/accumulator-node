import Fastify from "fastify";
import type { Logger } from "@/logging/logger";
import type { Runner, RunnerState } from "@/service/runner";
import { renderPage } from "@/api/static/page";

export interface ApiOpts {
    logger: Logger;
    runner: Runner;
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
    app.get("/", async (_req, reply) => {
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
