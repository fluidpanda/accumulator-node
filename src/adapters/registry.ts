import type { AdapterFactory } from "@/adapters/types";

export interface AdapterRegistry {
    readonly factories: ReadonlyArray<AdapterFactory>;
}

export function createAdapterRegistry(factories: ReadonlyArray<AdapterFactory>): AdapterRegistry {
    return { factories };
}
