import type { AdapterRegistry } from "@/adapters/registry";
import type { Adapter, AdapterCreateDeps, AdapterFactory, DiscoveredDevice } from "@/adapters/types";
import type { Logger } from "@/logging/logger";
import { SenseairAdapter } from "@/adapters/senseair/adapter";

export function createAdapter(registry: AdapterRegistry, device: DiscoveredDevice, deps: AdapterCreateDeps): Adapter {
    const factory: AdapterFactory | undefined = registry.factories.find((f: AdapterFactory): boolean => {
        return f.match(device);
    });
    if (!factory) {
        deps.logger.warn(
            { component: "adapter", deviceId: device.id, kind: device.kind, api: device.api },
            "adapter factory not found",
        );
        throw new Error(`No adapter factory matched device ${device.id}`);
    }
    const logger: Logger = deps.logger.child({
        component: "adapter",
        adapterKind: factory.kind,
        deviceId: device.id,
    });
    logger.info({ api: device.api });
    return factory.create(device, { ...deps, logger });
}

export const senseairAdapterFactory: AdapterFactory = {
    kind: "senseair",
    match(device: DiscoveredDevice): boolean {
        return device.kind === "senseair";
    },
    create(device: DiscoveredDevice, deps: AdapterCreateDeps): Adapter {
        return new SenseairAdapter({ device, logger: deps.logger });
    },
};
