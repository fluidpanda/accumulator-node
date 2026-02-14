import dotenv from "dotenv";
import type { DotenvConfigOutput } from "dotenv";

export function initEnv(): void {
    const res: DotenvConfigOutput = dotenv.config({ quiet: true });
    if (res.error) {
        const code: string | undefined = (res.error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
            const cwd: string = process.cwd();
            throw new Error(`Failed to load .env file (cwd=${cwd})\nOriginal error: ${String(res.error)}`);
        }
    }
}

export function envInt(name: string, fallback: number): number {
    const raw: string | undefined = process.env[name];
    if (!raw) return fallback;
    const n: number = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Math.floor(n);
}

export function envStr(name: string): string | null {
    const raw: string | undefined = process.env[name];
    return raw && raw.length > 0 ? raw : null;
}
