import * as dgram from "node:dgram";
import type { DiscoveredDevice } from "@/adapters/types";
import type { SenseairAnnounceV1 } from "@/listener/types";
import type { Logger } from "@/logging/logger";
import { isRecord } from "@/helpers/jsons";
import { mapSenseairAnnounceToDevice } from "@/helpers/mappers";

export interface ListenerOpts {
    logger: Logger;
    bindHost: string;
    port: number;
    onDevice: (device: DiscoveredDevice) => void;
}

export interface Listener {
    start(): Promise<void>;
    stop(): Promise<void>;
}

function parseAnnounce(b: Buffer): SenseairAnnounceV1 | null {
    try {
        return JSON.parse(b.toString("utf8")) as SenseairAnnounceV1;
    } catch {
        return null;
    }
}

export function createListener(opts: ListenerOpts): Listener {
    const logger: Logger = opts.logger.child({ module: "listener" });
    const socket = dgram.createSocket("udp4");
    let started: boolean = false;
    function handleMessage(msg: Buffer, rinfo: dgram.RemoteInfo): void {
        const body: SenseairAnnounceV1 | null = parseAnnounce(msg);
        if (!body || !isRecord(body)) {
            logger.debug({ from: rinfo.address }, "non json udp");
            return;
        }
        const type: unknown = body["type"];
        const version: unknown = body["version"];
        if (type === "senseair.sensor.announce" && version === 1) {
            const device: DiscoveredDevice = mapSenseairAnnounceToDevice(body);
            logger.info({
                deviceId: device.id,
                api: device.api,
                from: rinfo.address,
            });
            opts.onDevice(device);
            return;
        }
        logger.debug({ type, version, from: rinfo.address }, "unknown udp message");
    }
    return {
        async start(): Promise<void> {
            if (started) return;
            started = true;
            socket.on("message", handleMessage);
            socket.on("error", (err: Error): void => {
                logger.error({ err });
            });
            await new Promise<void>((resolve): void => {
                socket.bind(opts.port, opts.bindHost, (): void => {
                    logger.info({ bindHost: opts.bindHost, port: opts.port }, "udp listener started");
                    resolve();
                });
            });
        },
        async stop(): Promise<void> {
            if (!started) return;
            started = false;
            await new Promise<void>((resolve): void => {
                socket.close((): void => {
                    logger.info("udp listener stopped");
                    resolve();
                });
            });
        },
    };
}
