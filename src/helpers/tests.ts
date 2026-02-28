import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

export function tmpFile(name: string, ext = ".sqlite"): string {
    const id: string = crypto.randomBytes(16).toString("hex");
    return path.join(os.tmpdir(), `${name}-${process.pid}-${id}${ext}`);
}
