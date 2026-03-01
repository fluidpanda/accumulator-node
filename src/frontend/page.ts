import { SCRIPT_JS } from "@/frontend/res/generated";

export function renderPage(): string {
    return /* html */ `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Accumulator</title>
    <link rel="preconnect" href="https://rsms.me" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <style>
    :root {
        font-family: Inter, sans-serif;
        font-feature-settings: 'liga' 1, 'calt' 1;
    }
    @supports (font-variation-settings: normal) {
        :root { font-family: InterVariable, sans-serif; }
    }
    body {
        margin: 40px;
        background: #111;
        color: #eee;
    }
    h1 {
        padding-left: 20px;
        font-weight: 600;
    }
    .cards {
        margin-top: 20px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
    }
    .card {
        padding: 20px;
        border: 1px solid #333;
        border-radius: 0.8em;
        background: #1a1a1a;
    }
    .card.placeholder {
        cursor: default;
        opacity: 0.7;
    }
    .label {
        font-size: 14px;
        opacity: 0.6;
        margin-top: 12px;
    }
    .value {
        font-size: 48px;
        font-weight: 700;
        margin-top: 4px;
    }
    .mono {
        font-family: ui-monospace, monospace;
    }
    .muted {
        opacity: 0.7;
        margin-top: 10px;
    }
    .warning {
        color: lightsalmon;
    }
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 999;
    }
    .overlay.open { display: flex; }
    .overlay-card {
        width: min(1100px, 96vw);
        height: min(640px, 86vh);
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 0.8em;
        padding: 16px 16px 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .overlay-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
    }
    .overlay-title {
        font-size: 16px;
        font-weight: 600;
    }
    .overlay-sub {
        opacity: 0.7;
        font-family: ui-monospace, monospace;
        font-size: 12px;
        margin-left: 12px;
    }
    .btn {
        background: transparent;
        border: 1px solid #333;
        color: #eee;
        padding: 6px 10px;
        border-radius: 8px;
        cursor: pointer;
    }
    .btn:hover { border-color: #555; }
    .chart-wrap {
        position: relative;
        flex: 1;
    }
    .chart-wrap canvas {
        width: 100% !important;
        height: 100% !important;
    }
    .overlay-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
    .seg {
        display: inline-flex;
        border: 1px solid #333;
        border-radius: 10px;
        overflow: hidden;
    }
    .seg-btn {
        background: transparent;
        border: 0;
        border-right: 1px solid #333;
        color: #eee;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        opacity: 0.85;
    }
    .seg-btn:last-child {
        border-right: 0;
    }
    .seg-btn:hover {
        opacity: 1;
    }
    .seg-btn.active {
        background: #222;
        opacity: 1;
    }
    .overlay-reading {
        position: absolute;
        left: 50px;
        top: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid #333;
        background: rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(6px);
        display: grid;
        gap: 2px;
        min-width: 110px;
    }
    .overlay-reading-label {
        font-size: 12px;
        opacity: 0.7;
        letter-spacing: 0.02em;
    }
    .overlay-reading-value {
        font-size: 32px;
        font-weight: 700;
        line-height: 1;
    }
    .overlay-reading.warning {
        border-color: rgba(255,160,122,0.65);
        box-shadow: 0 0 0 1px rgba(255,160,122,0.15) inset;
    }
    .overlay-reading.warning .overlay-reading-value {
        color: lightsalmon;
    }
    </style>
</head>
<body>
    <h1>Accumulator</h1>
    <div id="cards" class="cards"></div>
    <div id="overlay" class="overlay" aria-hidden="true">
        <div class="overlay-card" role="dialog" aria-modal="true">
            <div class="overlay-header">
                <div>
                    <span class="overlay-title">History</span>
                    <span id="overlayDevice" class="overlay-sub"></span>
                </div>
                <div class="overlay-controls">
                    <div class="seg" role="group" aria-label="Range">
                        <button class="seg-btn" data-range="1m" type="button">1m</button>
                        <button class="seg-btn" data-range="5m" type="button">5m</button>
                        <button class="seg-btn" data-range="30m" type="button">30m</button>
                        <button class="seg-btn" data-range="1h" type="button">1h</button>
                        <button class="seg-btn" data-range="3h" type="button">3h</button>
                        <button class="seg-btn" data-range="6h" type="button">6h</button>
                        <button class="seg-btn" data-range="12h" type="button">12h</button>
                        <button class="seg-btn" data-range="24h" type="button">24h</button>
                        <button class="seg-btn" data-range="1w" type="button">1w</button>
                        <button class="seg-btn" data-range="1mo" type="button">1mo</button>
                    </div>
                    <div class="seg" role="group" aria-label="Aggregation">
                        <button class="seg-btn" data-agg="min" type="button">min</button>
                        <button class="seg-btn" data-agg="avg" type="button">avg</button>
                        <button class="seg-btn" data-agg="max" type="button">max</button>
                        <button class="seg-btn" data-agg="raw" type="button">raw</button>
                    </div>
                        <button id="overlayClose" class="btn" type="button">Close</button>
                </div>
            </div>
        <div class="chart-wrap">
            <div id="overlayReading" class="overlay-reading" aria-live="polite">
                <div class="overlay-reading-label">CO₂</div>
                <div id="overlayReadingValue" class="overlay-reading-value">—</div>
            </div>
            <canvas id="chart"></canvas>
        </div>
        </div>
    </div>
    <script>${SCRIPT_JS}</script>
</body>
</html>
`;
}
