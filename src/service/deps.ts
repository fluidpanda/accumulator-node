import type { Logger } from "@/logging/logger";
import { senseairAdapterFactory } from "@/adapters/factory";
import { createAdapterRegistry } from "@/adapters/registry";

export interface ServiceDependencies {
    logger: Logger;
    adapterRegistry: ReturnType<typeof createAdapterRegistry>;
}

export function buildServiceDeps(logger: Logger): ServiceDependencies {
    return {
        logger,
        adapterRegistry: createAdapterRegistry([senseairAdapterFactory]),
    };
}
