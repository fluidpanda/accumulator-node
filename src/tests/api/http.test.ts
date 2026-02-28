import assert from "node:assert/strict";
import test from "node:test";
import type { ApiServer } from "@/api/http";
import type { HistoryAgg, HistoryState } from "@/history/store";
import type { Logger } from "@/logging/logger";
import type { Runner, RunnerState } from "@/service/runner";
import { createApi } from "@/api/http";
import { createHistoryState } from "@/history/store";
import { createLogger } from "@/logging/logger";

interface StatusResponse {
    deviceId: string;
    metric: string;
    fromMs: string;
    toMs: string;
    bucketMs: string;
    agg: HistoryAgg;
    error?: string;
}

function createRunnerStub(state: RunnerState): Runner {
    return {
        start(): void {},
        stop(): Promise<void> {
            return Promise.resolve();
        },
        onDevice(): void {},
        getState(): RunnerState {
            return state;
        },
    };
}

await test("GET /api/state returns { devices: [] }", async (): Promise<void> => {
    const logger: Logger = createLogger();
    const runner: Runner = createRunnerStub({ devices: [] });
    const history: HistoryState = createHistoryState({ maxPointsPerSeries: 10_000 });
    const api: ApiServer = createApi({ logger, runner, history, host: "127.0.0.1", port: 0 });
    const res = await api.inject({ method: "GET", url: "/api/state" });
    assert.equal(res.statusCode, 200);
    const body: RunnerState = res.json();
    assert.ok(body);
    assert.ok(Array.isArray(body.devices));
    assert.equal(body.devices.length, 0);
    await api.stop();
});

await test("GET /api/history requires deviceId", async (): Promise<void> => {
    const logger: Logger = createLogger();
    const runner: Runner = createRunnerStub({ devices: [] });
    const history: HistoryState = createHistoryState({ maxPointsPerSeries: 10_000 });
    const api: ApiServer = createApi({ logger, runner, history, host: "127.0.0.1", port: 0 });
    const res = await api.inject({ method: "GET", url: "/api/history" });
    assert.equal(res.statusCode, 400);
    const body: StatusResponse = res.json();
    assert.equal(body.error, "deviceId is required");
    await api.stop();
});

await test("GET /api/history returns points", async (): Promise<void> => {
    const logger: Logger = createLogger();
    const runner: Runner = createRunnerStub({ devices: [] });
    const history: HistoryState = createHistoryState({ maxPointsPerSeries: 10_000 });
    history.push("D1", "co2ppm", { tsMs: 1000, value: 500 });
    history.push("D1", "co2ppm", { tsMs: 2000, value: 700 });
    const api: ApiServer = createApi({ logger, runner, history, host: "127.0.0.1", port: 0 });
    const res = await api.inject({
        method: "GET",
        url: "/api/history?deviceId=D1&metric=co2ppm&fromMs=0&toMs=5000&bucketMs=1000&agg=max",
    });
    assert.equal(res.statusCode, 200);
    const body: StatusResponse = res.json();
    assert.ok(Array.isArray(body));
    assert.ok(body.length >= 1);
    await api.stop();
});

await test("GET / returns html", async (): Promise<void> => {
    const logger: Logger = createLogger();
    const runner: Runner = createRunnerStub({ devices: [] });
    const history: HistoryState = createHistoryState({ maxPointsPerSeries: 10_000 });
    const api: ApiServer = createApi({ logger, runner, history, host: "127.0.0.1", port: 0 });
    const res = await api.inject({ method: "GET", url: "/" });
    assert.equal(res.statusCode, 200);
    assert.match(res.headers["content-type"] ?? "", /text\/html/);
    const html: string = res.body;
    assert.ok(html.includes("<!doctype html>") || html.includes("<html"));
    assert.ok(html.includes("Accumulator"));
    await api.stop();
});
