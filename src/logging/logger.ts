import pino from "pino";
import type { Logger as PinoLogger } from "pino";

export type Logger = PinoLogger;

export function createLogger(): Logger {
    return pino({
        level: process.env.LOG_LEVEL ?? "info",
        serializers: { err: pino.stdSerializers.err },
    });
}
