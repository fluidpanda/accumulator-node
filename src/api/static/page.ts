import { SCRIPT_JS } from "@/api/static/generated";

export function renderPage(): string {
    return /* html */ `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Accumulator</title>
    <style>
    body {
        font-family: system-ui, sans-serif;
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
                <button id="overlayClose" class="btn" type="button">Close</button>
            </div>
        <div class="chart-wrap">
            <canvas id="chart"></canvas>
        </div>
        </div>
    </div>
    <script>${SCRIPT_JS}</script>
</body>
</html>
`;
}
