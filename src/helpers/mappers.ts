import type { DiscoveredDevice } from "@/adapters/types";
import type { SenseairAnnounceV1 } from "@/listener/types";

export function mapSenseairAnnounceToDevice(msg: SenseairAnnounceV1): DiscoveredDevice {
    return {
        id: msg.id,
        kind: "senseair",
        api: {
            hosts: msg.ips,
            port: msg.api.port,
            path: msg.api.path,
            scheme: "http",
        },
        meta: {
            ts: msg.ts,
            version: msg.version,
        },
    };
}
