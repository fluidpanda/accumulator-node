import assert from "node:assert/strict";
import test from "node:test";
import { pickBucketMs, rangeToMs } from "@/frontend/parts/presets";

await test("rangeToMs: presets are correct", (): void => {
    assert.equal(rangeToMs("1m"), 60_000);
    assert.equal(rangeToMs("5m"), 5 * 60_000);
    assert.equal(rangeToMs("30m"), 30 * 60_000);
    assert.equal(rangeToMs("1h"), 60 * 60_000);
    assert.equal(rangeToMs("3h"), 3 * 60 * 60_000);
    assert.equal(rangeToMs("6h"), 6 * 60 * 60_000);
    assert.equal(rangeToMs("12h"), 12 * 60 * 60_000);
    assert.equal(rangeToMs("24h"), 24 * 60 * 60_000);
    assert.equal(rangeToMs("1w"), 7 * 24 * 60 * 60_000);
    assert.equal(rangeToMs("1mo"), 31 * 24 * 60 * 60_000);
});

await test("pickBucketMs: returns >= 1_000 and monotonic for larger ranges", (): void => {
    const ranges: Array<number> = [
        rangeToMs("1m"),
        rangeToMs("5m"),
        rangeToMs("30m"),
        rangeToMs("1h"),
        rangeToMs("3h"),
        rangeToMs("6h"),
        rangeToMs("12h"),
        rangeToMs("24h"),
        rangeToMs("1w"),
        rangeToMs("1mo"),
    ];
    let prev: number = 0;
    for (const r of ranges) {
        const b: number = pickBucketMs(r, 180);
        assert.ok(b >= 1_000);
        assert.ok(b >= prev);
        prev = b;
    }
});
