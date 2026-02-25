import type { OverlayState, Overlay } from "@/frontend/parts/overlay";
import type { State, MetricPoint, Device } from "@/frontend/parts/types";
import { fetchHistory, fetchState } from "@/frontend/parts/api";
import { renderCards } from "@/frontend/parts/cards";
import { updateChart } from "@/frontend/parts/chart";
import { createOverlay } from "@/frontend/parts/overlay";

const POLL_MS = 5_000;

const overlayState: OverlayState = {
    deviceId: null,
    range: "1h",
    agg: "avg",
};

let timer: number | null = null;
let tickInFlight: boolean = false;

async function refreshChart(): Promise<void> {
    if (!overlayState.deviceId) return;
    const points: Array<MetricPoint> = await fetchHistory({
        deviceId: overlayState.deviceId,
        metric: "co2ppm",
        range: overlayState.range,
        agg: overlayState.agg,
        targetPoints: 100,
    });
    updateChart(points);
}

function onCardClick(deviceId: string): void {
    overlay.open(deviceId);
    void refreshChart().catch((err: unknown): void => console.error(err));
}

function getCo2ppmFromState(state: State, deviceId: string): number | null {
    const d: Device | undefined = state.devices.find((x: Device): boolean => x.id === deviceId);
    const snap = d?.snapshot;
    if (!snap || !snap.metrics) return null;
    const v: unknown = snap.metrics["co2ppm"];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

async function tick(): Promise<void> {
    if (tickInFlight) return;
    tickInFlight = true;
    try {
        const state: State = await fetchState();
        renderCards(state, onCardClick);
        if (overlayState.deviceId) {
            overlay.setReading(getCo2ppmFromState(state, overlayState.deviceId));
            await refreshChart();
        }
    } catch (err: unknown) {
        console.error(err);
    } finally {
        tickInFlight = false;
    }
}

const overlay: Overlay = createOverlay(overlayState, {
    onClose(): void {
        overlayState.deviceId = null;
        overlay.close();
        overlay.setReading(null);
    },
    onChange(): void {
        void refreshChart().catch((err: unknown): void => console.error(err));
    },
});

export function start(): void {
    if (timer !== null) return;
    void tick();
    timer = window.setInterval((): void => {
        void tick();
    }, POLL_MS);
}

export function stop(): void {
    if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
    }
    overlayState.deviceId = null;
    overlay.close();
}

start();
