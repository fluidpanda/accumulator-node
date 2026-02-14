export function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

export function getRecord(x: unknown, key: string): Record<string, unknown> | null {
    if (!isRecord(x)) return null;
    const v: unknown = x[key];
    return isRecord(v) ? v : null;
}

export function getNumber(x: unknown, key: string): number | null {
    if (!isRecord(x)) return null;
    const v: unknown = x[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function getStringOrNull(x: unknown, key: string): string | null {
    if (!isRecord(x)) return null;
    const v: unknown = x[key];
    if (typeof v === "string") return v;
    if (v === null) return null;
    return null;
}
