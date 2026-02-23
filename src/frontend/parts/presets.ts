import type { RangePreset } from "./types";

export function rangeToMs(p: RangePreset): number {
    switch (p) {
        case "1m":
            return 60_000;
        case "5m":
            return 5 * 60_000;
        case "30m":
            return 30 * 60_000;
        case "1h":
            return 60 * 60_000;
        case "3h":
            return 3 * 60 * 60_000;
        case "6h":
            return 6 * 60 * 60_000;
        case "12h":
            return 12 * 60 * 60_000;
        case "24h":
            return 24 * 60 * 60_000;
        case "1w":
            return 7 * 24 * 60 * 60_000;
        case "1mo":
            return 31 * 24 * 60 * 60_000;
    }
}

export function pickBucketMs(rangeMs: number, targetPoints = 180): number {
    const raw: number = Math.max(1000, Math.floor(rangeMs / targetPoints));
    const steps: Array<number> = [
        1000, 2000, 5000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000, 600_000, 900_000, 1_800_000, 3_600_000,
        7_200_000, 14_400_000,
    ];
    for (const s of steps) if (raw <= s) return s;
    return steps[steps.length - 1];
}
