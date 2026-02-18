import type { OverlayState, Overlay } from "@/frontend/parts/overlay";
import type { State, MetricPoint } from "@/frontend/parts/types";
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

async function tick(): Promise<void> {
    if (tickInFlight) return;
    tickInFlight = true;
    try {
        const state: State = await fetchState();
        renderCards(state, onCardClick);

        if (overlayState.deviceId) {
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
