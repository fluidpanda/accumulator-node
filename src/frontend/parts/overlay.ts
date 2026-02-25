import type { AggPreset, RangePreset } from "@/frontend/parts/types";
import { byId } from "@/frontend/parts/dom";

export interface OverlayState {
    deviceId: string | null;
    range: RangePreset;
    agg: AggPreset;
}

export interface Overlay {
    open(deviceId: string): void;
    close(): void;
    sync(): void;
    setReading(ppm: number | null): void;
}

export interface OverlayHandlers {
    onClose(): void;
    onChange(range: RangePreset, agg: AggPreset): void;
}

export function createOverlay(state: OverlayState, handlers: OverlayHandlers): Overlay {
    const overlay: HTMLDivElement = byId<HTMLDivElement>("overlay");
    const label: HTMLSpanElement = byId<HTMLSpanElement>("overlayDevice");
    const closeBtn: HTMLButtonElement = byId<HTMLButtonElement>("overlayClose");
    const readingBox: HTMLDivElement = byId<HTMLDivElement>("overlayReading");
    const readingValue: HTMLSpanElement = byId<HTMLSpanElement>("overlayReadingValue");
    function setReading(ppm: number | null): void {
        readingValue.textContent = ppm === null ? "—" : String(ppm);
        readingBox.classList.toggle("warning", ppm !== null && ppm > 600);
    }
    function setActiveButtons(): void {
        for (const b of overlay.querySelectorAll<HTMLButtonElement>("[data-range]")) {
            b.classList.toggle("active", b.dataset.range === state.range);
        }
        for (const b of overlay.querySelectorAll<HTMLButtonElement>("[data-agg]")) {
            b.classList.toggle("active", b.dataset.agg === state.agg);
        }
    }
    closeBtn.addEventListener("click", () => handlers.onClose());
    overlay.addEventListener("click", (ev: MouseEvent) => {
        const t = ev.target as HTMLElement | null;
        if (!t) return;
        if (t === overlay) {
            handlers.onClose();
            return;
        }
        const range = (t as HTMLButtonElement).dataset?.range as RangePreset | undefined;
        if (range) {
            state.range = range;
            setActiveButtons();
            handlers.onChange(state.range, state.agg);
            return;
        }
        const agg = (t as HTMLButtonElement).dataset?.agg as AggPreset | undefined;
        if (agg) {
            state.agg = agg;
            setActiveButtons();
            handlers.onChange(state.range, state.agg);
        }
    });
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Escape") handlers.onClose();
    });
    return {
        open(deviceId: string): void {
            state.deviceId = deviceId;
            label.textContent = deviceId;
            overlay.classList.add("open");
            overlay.setAttribute("aria-hidden", "false");
            setActiveButtons();
        },
        close(): void {
            overlay.classList.remove("open");
            overlay.setAttribute("aria-hidden", "true");
        },
        sync(): void {
            setActiveButtons();
        },
        setReading,
    };
}
