import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
} from "chart.js";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

interface MetricPoint {
    tsMs: number;
    value: number;
}

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

let selectedDeviceId: string | null = null;

async function refreshChart(): Promise<void> {
    if (!selectedDeviceId) return;
    const points: Array<MetricPoint> = await fetchHistory(selectedDeviceId);
    updateChart(points);
}

function openOverlay(deviceId: string): void {
    selectedDeviceId = deviceId;
    const overlay: HTMLDivElement = byId<HTMLDivElement>("overlay");
    const label: HTMLSpanElement = byId<HTMLSpanElement>("overlayDevice");
    label.textContent = deviceId;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    void refreshChart().catch((err: unknown) => console.error(err));
}

function closeOverlay(): void {
    selectedDeviceId = null;
    const overlay = byId<HTMLDivElement>("overlay");
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
}

function wireOverlay(): void {
    const overlay: HTMLDivElement = byId<HTMLDivElement>("overlay");
    const btn: HTMLButtonElement = byId<HTMLButtonElement>("overlayClose");
    btn.addEventListener("click", () => closeOverlay());
    overlay.addEventListener("click", (ev: MouseEvent) => {
        if (ev.target === overlay) closeOverlay();
    });
    window.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Escape") closeOverlay();
    });
}

let chart: Chart | null = null;

async function fetchState(): Promise<State> {
    const res: Response = await fetch("/api/state");
    return (await res.json()) as State;
}

async function fetchHistory(deviceId: string): Promise<Array<MetricPoint>> {
    const url = `/api/history?deviceId=${encodeURIComponent(deviceId)}&metric=co2ppm&limit=600`;
    const res: Response = await fetch(url);
    return (await res.json()) as Array<MetricPoint>;
}

function ensureChart(): Chart {
    if (chart) return chart;
    const canvas: HTMLCanvasElement = byId<HTMLCanvasElement>("chart");
    chart = new Chart(canvas, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "CO₂ ppm",
                    data: [],
                    pointRadius: 0,
                    borderWidth: 4,
                    tension: 0.5,
                    borderColor: "rgba(238,238,238,0.4)",
                },
            ],
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: "#eee" }, grid: { color: "rgba(255,255,255,0.08)" } },
                y: { ticks: { color: "#eee" }, grid: { color: "rgba(255,255,255,0.08)" } },
            },
            plugins: {
                legend: { labels: { color: "#eee" } },
            },
        },
    });
    return chart;
}

function updateChart(points: Array<MetricPoint>): void {
    const c = ensureChart();
    c.data.labels = points.map((p: MetricPoint): string => new Date(p.tsMs).toLocaleTimeString());
    c.data.datasets[0].data = points.map((p: MetricPoint): number => p.value);
    c.update();
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
    card.style.cursor = "pointer";
    card.addEventListener("click", () => openOverlay(d.id));
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
    const state: State = await fetchState();
    renderState(state);
    if (selectedDeviceId) {
        await refreshChart();
    }
}

function start(): void {
    wireOverlay();
    void tick().catch((err: unknown): void => console.error(err));
    setInterval((): void => {
        void tick().catch((err: unknown): void => console.error(err));
    }, 5000);
}

start();
