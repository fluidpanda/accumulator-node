import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/main.ts"],
    format: ["esm"],
    target: "esnext",
    outDir: "dist",
    clean: true,
    sourcemap: true,
});
