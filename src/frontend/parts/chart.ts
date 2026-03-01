import { Chart } from "chart.js/auto";
import type { Chart as ChartType } from "chart.js/auto";
import type { MetricPoint } from "@/frontend/parts/types";
import { byId } from "@/frontend/parts/dom";

const CO2_WARN_PPM: number = 600;

let chart: ChartType<"line", Array<number>, string> | null = null;

export function ensureChart(): ChartType<"line", Array<number>, string> {
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
                    tension: 0,
                    cubicInterpolationMode: "monotone",
                    borderColor: "rgba(238,238,238,0.4)",
                },
                {
                    label: "600 ppm",
                    data: [],
                    pointRadius: 0,
                    borderWidth: 4,
                    tension: 0,
                    borderDash: [30, 6],
                    borderColor: "rgba(255,160,122,0.9)",
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: "#eee" }, grid: { color: "rgba(255,255,255,0.08)" } },
                y: { ticks: { color: "#eee" }, grid: { color: "rgba(255,255,255,0.08)" } },
            },
            plugins: { legend: { labels: { color: "#eee" } } },
        },
    });
    return chart;
}

export function updateChart(points: Array<MetricPoint>): void {
    const c: Chart<"line", Array<number>, string> = ensureChart();
    c.data.labels = points.map((p: MetricPoint): string => new Date(p.tsMs).toLocaleTimeString());
    c.data.datasets[0].data = points.map((p: MetricPoint): number => p.value);
    c.data.datasets[1].data = points.map((): number => CO2_WARN_PPM);
    c.update();
}
