interface Device {
    id: string;
    snapshot?: {
        ok: boolean;
        metrics?: Record<string, unknown>;
        lastError?: string | null;
    } | null;
}

interface State {
    devices: Array<Device>;
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const x: HTMLElement = document.createElement(tag);
    if (className) x.className = className;
    if (text !== undefined) x.textContent = text;
    return x;
}

function byId<T extends HTMLElement>(id: string): T {
    const x: HTMLElement | null = document.getElementById(id);
    if (!x) throw new Error(`Missing element id="${id}"`);
    return x as T;
}

function qs<T extends Element>(root: ParentNode, selector: string): T {
    const x: Element | null = root.querySelector(selector);
    if (!x) throw new Error(`Missing element: ${selector}`);
    return x as T;
}

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

function createDeviceCard(d: Device): HTMLElement {
    const card: HTMLElement = el("div", "card");
    card.setAttribute("data-device-id", d.id);
    card.appendChild(el("div", "label", "Device"));
    card.appendChild(el("div", "mono", d.id));
    card.appendChild(el("div", "label", "CO₂"));
    const value = el("div", "value", "—");
    value.setAttribute("data-role", "co2ppm");
    card.appendChild(value);
    const status = el("div", "muted", "Waiting for first snapshot...");
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
    if (!d.snapshot) {
        status.textContent = "Waiting for first snapshot...";
    } else {
        status.textContent = d.snapshot.ok ? "OK" : `ERROR: ${d.snapshot.lastError || "unknown"}`;
    }
}

function renderState(state: State): void {
    const container: HTMLElement = byId<HTMLDivElement>("cards");
    if (!state || !state.devices || state.devices.length === 0) {
        renderPlaceholder(container);
        return;
    }
    const existing = new Map<string, HTMLElement>();
    const nodes: NodeListOf<HTMLElement> = container.querySelectorAll<HTMLElement>(".card[data-device-id]");
    for (const node of nodes) {
        const id: string | null = node.getAttribute("data-device-id");
        if (id) existing.set(id, node);
    }
    for (const ph of container.querySelectorAll<HTMLElement>(".card.placeholder")) {
        ph.remove();
    }
    for (const d of state.devices) {
        let card: HTMLElement | undefined = existing.get(d.id);
        if (!card) {
            card = createDeviceCard(d);
            container.appendChild(card);
        }
        updateDeviceCard(card, d);
    }
    for (const [id, card] of existing) {
        if (!state.devices.some((d: Device): boolean => d.id === id)) card.remove();
    }
}

async function tick(): Promise<void> {
    const res: Response = await fetch("/api/state");
    const state = (await res.json()) as State;
    renderState(state);
}

function start(): void {
    void tick().catch((err: unknown): void => console.error(err));
    setInterval((): void => {
        void tick().catch((err: unknown): void => console.error(err));
    }, 5000);
}

start();
