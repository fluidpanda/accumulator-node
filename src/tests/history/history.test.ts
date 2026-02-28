import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { TestContext } from "node:test";
import type { HistoryState } from "@/history/store";
import type { MetricPoint } from "@/history/types";
import { tmpFile } from "@/helpers/tests";
import { createSqliteHistoryState } from "@/history/sqlite";
import { createHistoryState } from "@/history/store";

async function runHistoryContract(t: TestContext, name: string, make: () => HistoryState): Promise<void> {
    await t.test(`${name}: avg aggregation in bucket`, (): void => {
        const h: HistoryState = make();
        const deviceId = "D1";
        const metric = "co2ppm";
        const base = 1_000_000;
        h.push(deviceId, metric, { tsMs: base + 1_000, value: 400 });
        h.push(deviceId, metric, { tsMs: base + 5_000, value: 600 }); // avg bucket0s = 500
        h.push(deviceId, metric, { tsMs: base + 12_000, value: 700 });
        h.push(deviceId, metric, { tsMs: base + 18_000, value: 900 }); // avg bucket10s = 800
        const out: Array<MetricPoint> = h.query({
            deviceId,
            metric,
            fromMs: base,
            toMs: base + 60_000,
            bucketMs: 10_000,
            agg: "avg",
        });
        assert.equal(out.length, 2);
        assert.equal(out[0].tsMs, Math.floor((base + 1_000) / 10_000) * 10_000);
        assert.equal(out[0].value, 500);
        assert.equal(out[1].tsMs, Math.floor((base + 12_000) / 10_000) * 10_000);
        assert.equal(out[1].value, 800);
    });
    await t.test(`${name}: max aggregation`, (): void => {
        const h: HistoryState = make();
        const deviceId = "D1";
        const metric = "co2ppm";
        const base = 2_000_000;
        h.push(deviceId, metric, { tsMs: base + 1_000, value: 400 });
        h.push(deviceId, metric, { tsMs: base + 2_000, value: 1_000 });
        h.push(deviceId, metric, { tsMs: base + 3_000, value: 500 });
        const out: Array<MetricPoint> = h.query({
            deviceId,
            metric,
            fromMs: base,
            toMs: base + 10_000,
            bucketMs: 10_000,
            agg: "max",
        });
        assert.equal(out.length, 1);
        assert.equal(out[0].value, 1_000);
    });
    await t.test(`${name}: prune removes only the device`, (): void => {
        const h: HistoryState = make();
        h.push("A", "co2ppm", { tsMs: 1, value: 1 });
        h.push("B", "co2ppm", { tsMs: 1, value: 2 });
        h.prune("A");
        const a: Array<MetricPoint> = h.query({
            deviceId: "A",
            metric: "co2ppm",
            fromMs: 0,
            toMs: 10,
            bucketMs: 1_000,
            agg: "avg",
        });
        const b: Array<MetricPoint> = h.query({
            deviceId: "B",
            metric: "co2ppm",
            fromMs: 0,
            toMs: 10,
            bucketMs: 1_000,
            agg: "avg",
        });
        assert.equal(a.length, 0);
        assert.equal(b.length, 1);
    });
}

await test("memory: contract", async (t: TestContext): Promise<void> => {
    await runHistoryContract(t, "memory", (): HistoryState => createHistoryState({ maxPointsPerSeries: 100_000 }));
});

await test("sqlite: contract", async (t: TestContext): Promise<void> => {
    const file: string = tmpFile("acc-history");
    const h: HistoryState = createSqliteHistoryState({ path: file, retentionDays: 0 });
    t.after((): void => {
        try {
            fs.unlinkSync(file);
        } catch (error) {
            console.error(error);
        }
    });
    await runHistoryContract(t, "sqlite", (): HistoryState => h);
});
