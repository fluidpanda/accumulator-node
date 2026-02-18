import type { Device, State } from "@/frontend/parts/types";
import { byId, el, qs } from "@/frontend/parts/dom";

function getCo2ppm(snapshot: Device["snapshot"]): number | null {
    if (!snapshot || !snapshot.metrics) return null;
    const v: unknown = snapshot.metrics["co2ppm"];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function renderPlaceholder(container: HTMLElement): void {
    container.innerHTML = "";
    const card: HTMLElement = el("div", "card placeholder");
    card.appendChild(el("div", "label", "No devices"));
    card.appendChild(el("div", "muted", "Waiting for UDP announce..."));
    container.appendChild(card);
}

function createDeviceCard(d: Device, onClick: (deviceId: string) => void): HTMLElement {
    const card: HTMLElement = el("div", "card");
    card.setAttribute("data-device-id", d.id);
    card.style.cursor = "pointer";
    card.addEventListener("click", () => onClick(d.id));
    card.appendChild(el("div", "label", "Device"));
    card.appendChild(el("div", "mono", d.id));
    card.appendChild(el("div", "label", "CO₂"));
    const value: HTMLElement = el("div", "value", "—");
    value.setAttribute("data-role", "co2ppm");
    card.appendChild(value);
    const status: HTMLElement = el("div", "muted", "Waiting for first snapshot...");
    status.setAttribute("data-role", "status");
    card.appendChild(status);

    return card;
}

function updateDeviceCard(card: HTMLElement, d: Device): void {
    const co2ppm: number | null = getCo2ppm(d.snapshot);
    const value: HTMLElement = qs<HTMLElement>(card, '[data-role="co2ppm"]');
    const status: HTMLElement = qs<HTMLElement>(card, '[data-role="status"]');
    value.textContent = co2ppm === null ? "—" : String(co2ppm);
    if (co2ppm !== null && co2ppm > 600) value.classList.add("warning");
    else value.classList.remove("warning");
    if (!d.snapshot) status.textContent = "Waiting for first snapshot...";
    else status.textContent = d.snapshot.ok ? "OK" : `ERROR: ${d.snapshot.lastError || "unknown"}`;
}

export function renderCards(state: State, onClick: (deviceId: string) => void): void {
    const container: HTMLElement = byId<HTMLDivElement>("cards");
    if (!state.devices || state.devices.length === 0) {
        renderPlaceholder(container);
        return;
    }
    const existing = new Map<string, HTMLElement>();
    for (const node of container.querySelectorAll<HTMLElement>(".card[data-device-id]")) {
        const id: string | null = node.getAttribute("data-device-id");
        if (id) existing.set(id, node);
    }
    for (const ph of container.querySelectorAll<HTMLElement>(".card.placeholder")) ph.remove();
    for (const d of state.devices) {
        let card: HTMLElement | undefined = existing.get(d.id);
        if (!card) {
            card = createDeviceCard(d, onClick);
            container.appendChild(card);
        }
        updateDeviceCard(card, d);
    }
    for (const [id, card] of existing) {
        if (!state.devices.some((d: Device): boolean => d.id === id)) card.remove();
    }
}
