import "chartjs-adapter-date-fns";
import { Chart } from "chart.js/auto";
import type { Chart as ChartType, ScatterDataPoint, Point } from "chart.js/auto";
import type { MetricPoint } from "@/frontend/parts/types";
import { byId } from "@/frontend/parts/dom";
import { createTickFormatter } from "@/helpers/format";

export interface ChartAxes {
    x: number;
    y: number;
}

const CO2_WARN_PPM: number = 600;

let chart: ChartType<"line", Array<ScatterDataPoint>, unknown> | null = null;

export function ensureChart(): ChartType<"line", Array<ScatterDataPoint>, unknown> {
    if (chart) return chart;

    const canvas: HTMLCanvasElement = byId<HTMLCanvasElement>("chart");
    chart = new Chart(canvas, {
        type: "line",
        data: {
            datasets: [
                {
                    label: "CO₂ ppm",
                    data: [],
                    pointRadius: 1,
                    borderWidth: 4,
                    cubicInterpolationMode: "monotone",
                    borderColor: "rgba(238,238,238,0.4)",
                    parsing: false,
                },
                {
                    label: "600 ppm",
                    data: [],
                    pointRadius: 0,
                    borderWidth: 4,
                    tension: 0,
                    borderColor: "rgba(255,160,122,0.9)",
                    parsing: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: "time",
                    time: { tooltipFormat: "dd.MM.yyyy HH:mm:ss" },
                    ticks: {
                        color: "#eee",
                    },
                    grid: { color: "rgba(255,255,255,0.08)" },
                },
                y: {
                    ticks: { color: "#eee" },
                    grid: { color: "rgba(255,255,255,0.08)" },
                },
            },
            plugins: { legend: { labels: { color: "#eee" } } },
        },
    });
    return chart;
}

export function updateChart(points: Array<MetricPoint>): void {
    const c: Chart<"line", Array<Point>, unknown> = ensureChart();
    const dataset: Array<ChartAxes> = points.map(
        (p: MetricPoint): ChartAxes => ({
            x: p.tsMs,
            y: p.value,
        }),
    );
    c.data.datasets[0].data = dataset;
    c.data.datasets[1].data = dataset.map((p: ChartAxes) => ({
        x: p.x,
        y: CO2_WARN_PPM,
    }));
    const tickFormatter = createTickFormatter(dataset);
    const xScale = c.options.scales?.x;
    if (xScale && typeof xScale === "object") {
        xScale.ticks = {
            ...xScale.ticks,
            callback: (value: string | number): string => tickFormatter(Number(value)),
            maxRotation: 90,
        };
    }
    c.update();
}
