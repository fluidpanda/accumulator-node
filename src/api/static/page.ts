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
    </style>
</head>
<body>
    <h1>Accumulator</h1>
    <div id="cards" class="cards"></div>
    <script>${SCRIPT_JS}</script>
</body>
</html>
`;
}
