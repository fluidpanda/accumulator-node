import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import type { Logger } from "@/logging/logger";
import type { Runner, RunnerState } from "@/service/runner";

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
    const filename: string = fileURLToPath(import.meta.url);
    const dirname: string = path.dirname(filename);

    app.get("/state", (): RunnerState => {
        return opts.runner.getState();
    });
    app.register(fastifyStatic, {
        root: path.join(dirname, "static"),
        prefix: "/",
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
