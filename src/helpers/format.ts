import type { ChartAxes } from "@/frontend/parts/chart";

export function createTickFormatter(points: Array<ChartAxes>) {
    if (points.length === 0) return (_A: number): string => "";
    const minTs: number = points[0].x;
    const maxTs: number = points[points.length - 1].x;
    const rangeMs: number = maxTs - minTs;
    const oneDay: number = 24 * 60 * 60 * 1000;
    const showDate: boolean = rangeMs >= oneDay;
    return (ts: number): string => {
        const d = new Date(ts);
        const day: string = String(d.getDate()).padStart(2, "0");
        const month: string = String(d.getMonth() + 1).padStart(2, "0");
        const hour: string = String(d.getHours()).padStart(2, "0");
        const minute: string = String(d.getMinutes()).padStart(2, "0");
        const second: string = String(d.getSeconds()).padStart(2, "0");
        if (!showDate) {
            return `${hour}:${minute}:${second}`;
        }
        return `${day}.${month} ${hour}:${minute}`;
    };
}
