import fs from 'node:fs';
import os from 'node:os';

const MAX_SECRET_LENGTH = 500;

// Keeps the operator's username out of the interface and the log file, which
// both get shared or screenshotted more often than they get read locally.
export function displayPath(target) {
  const home = os.homedir();
  const text = String(target || '');
  if (!home) return text;
  if (text === home) return '~';
  if (text.startsWith(`${home}/`)) return `~/${text.slice(home.length + 1)}`;
  return text;
}

// Shows enough of a key to recognise which one is set, never enough to use it.
export function maskSecret(value) {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 12) return `${'*'.repeat(text.length)} (${text.length})`;
  return `${text.slice(0, 5)}${'*'.repeat(8)}${text.slice(-4)} (${text.length})`;
}

// A newline would let one field append unrelated assignments to .env, which
// start.sh sources with `set -a`. That would be code execution on next start.
export function validateSecret(value) {
  const text = String(value ?? '');
  if (/[\r\n\0]/.test(text)) return 'value must not contain newlines';
  if (text.length > MAX_SECRET_LENGTH) return `value must be at most ${MAX_SECRET_LENGTH} characters`;
  return '';
}

function formatEnvLine(name, value) {
  const needsQuotes = /[\s#'"]/.test(value);
  if (!needsQuotes) return `${name}=${value}`;
  return `${name}="${value.replace(/(["\\])/g, '\\$1')}"`;
}

// Rewrites only the named assignments, preserving comments, ordering, and any
// unrelated variables. An empty value removes the assignment entirely.
export function updateEnvFile(file, updates) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const lines = existing ? existing.split(/\r?\n/) : [];
  const pending = new Map(Object.entries(updates));
  const output = [];

  for (const line of lines) {
    const match = line.match(/^\s*(export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    const name = match?.[2];
    if (!name || !pending.has(name)) {
      output.push(line);
      continue;
    }
    const value = pending.get(name);
    pending.delete(name);
    if (!value) continue;
    output.push(`${match[1] || ''}${formatEnvLine(name, value)}`);
  }

  for (const [name, value] of pending) {
    if (!value) continue;
    output.push(formatEnvLine(name, value));
  }

  while (output.length && !output[output.length - 1].trim()) output.pop();
  const body = output.length ? `${output.join('\n')}\n` : '';
  const temporaryPath = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, body, { mode: 0o600 });
  fs.renameSync(temporaryPath, file);
  // A pre-existing file may have been group or world readable.
  fs.chmodSync(file, 0o600);
}

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>Free Router</title>
<style>
:root {
  color-scheme: light;
  --bg: #f4f5f8;
  --card: #ffffff;
  --card-2: #f7f8fb;
  --line: #e6e8ef;
  --line-strong: #d6dae4;
  --text: #10131a;
  --muted: #5c6674;
  --faint: #98a1af;
  --accent: #2f68e6;
  --accent-strong: #2352c9;
  --accent-quiet: #eef3fe;
  --accent-ring: rgba(47, 104, 230, .22);
  --input-bg: #ffffff;
  --input-line: #d3d9e3;
  --btn-bg: #ffffff;
  --btn-line: #d6dbe4;
  --btn-hover: #f2f4f8;
  --ok: #1a7a4c;
  --ok-soft: #e6f5ec;
  --warn: #8a5a00;
  --warn-soft: #fbf0d8;
  --bad: #cb2f3b;
  --bad-soft: #fdebed;
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, .05);
  --shadow: 0 1px 2px rgba(16, 24, 40, .06), 0 8px 22px -12px rgba(16, 24, 40, .18);
  --shadow-lg: 0 12px 40px -12px rgba(16, 24, 40, .28);
  --r-sm: 7px;
  --r-md: 9px;
  --r-lg: 14px;
  --control-h: 36px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0b0e13;
    --card: #12161d;
    --card-2: #171c25;
    --line: #242b36;
    --line-strong: #333c49;
    --text: #e8ecf2;
    --muted: #9aa4b2;
    --faint: #67707e;
    --accent: #4d8dff;
    --accent-strong: #6aa0ff;
    --accent-quiet: #142338;
    --accent-ring: rgba(77, 141, 255, .30);
    --input-bg: #0e131a;
    --input-line: #2f3946;
    --btn-bg: #1a212b;
    --btn-line: #2f3946;
    --btn-hover: #222a35;
    --ok: #4ec78e;
    --ok-soft: #12301f;
    --warn: #e2b25c;
    --warn-soft: #322710;
    --bad: #f36f7c;
    --bad-soft: #37171b;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, .4);
    --shadow: 0 2px 6px rgba(0, 0, 0, .4), 0 12px 30px -14px rgba(0, 0, 0, .6);
    --shadow-lg: 0 16px 44px -12px rgba(0, 0, 0, .7);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0b0e13;
  --card: #12161d;
  --card-2: #171c25;
  --line: #242b36;
  --line-strong: #333c49;
  --text: #e8ecf2;
  --muted: #9aa4b2;
  --faint: #67707e;
  --accent: #4d8dff;
  --accent-strong: #6aa0ff;
  --accent-quiet: #142338;
  --accent-ring: rgba(77, 141, 255, .30);
  --input-bg: #0e131a;
  --input-line: #2f3946;
  --btn-bg: #1a212b;
  --btn-line: #2f3946;
  --btn-hover: #222a35;
  --ok: #4ec78e;
  --ok-soft: #12301f;
  --warn: #e2b25c;
  --warn-soft: #322710;
  --bad: #f36f7c;
  --bad-soft: #37171b;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, .4);
  --shadow: 0 2px 6px rgba(0, 0, 0, .4), 0 12px 30px -14px rgba(0, 0, 0, .6);
  --shadow-lg: 0 16px 44px -12px rgba(0, 0, 0, .7);
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
[hidden] { display: none !important; }
::selection { background: var(--accent-ring); }
.micro {
  font-size: 11px; font-weight: 650; letter-spacing: .06em; text-transform: uppercase;
  color: var(--faint);
}

/* Header ------------------------------------------------------------------ */
header {
  background: color-mix(in srgb, var(--card) 82%, transparent);
  backdrop-filter: saturate(1.4) blur(10px);
  -webkit-backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid var(--line);
  padding: 13px 24px;
  position: sticky; top: 0; z-index: 20;
}
.head-inner {
  max-width: 1060px; margin: 0 auto;
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand .dot {
  width: 22px; height: 22px; border-radius: 7px;
  background: linear-gradient(140deg, var(--accent), var(--accent-strong));
  box-shadow: 0 2px 8px -2px var(--accent-ring);
}
h1 { font-size: 16px; font-weight: 680; margin: 0; letter-spacing: -.01em; }
.endpoint {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 4px 4px 12px; border: 1px solid var(--line); border-radius: var(--r-md);
  background: var(--card-2); max-width: 100%; height: 34px;
}
.endpoint .mono { font-size: 12.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.updated { font-size: 12px; color: var(--faint); white-space: nowrap; }

/* Layout ------------------------------------------------------------------ */
main { max-width: 1060px; margin: 0 auto; padding: 26px 24px 56px; display: grid; gap: 20px; }

.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.tile {
  background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
  padding: 16px 18px; box-shadow: var(--shadow-sm);
  display: flex; flex-direction: column; gap: 3px;
}
.tile .k { font-size: 11px; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; color: var(--faint); }
.tile .v { font-size: 27px; font-weight: 680; letter-spacing: -.02em; font-variant-numeric: tabular-nums; line-height: 1.15; margin-top: 2px; }
.tile .s { font-size: 12px; color: var(--muted); }
.tile .v.good { color: var(--ok); }
.tile .v.bad { color: var(--bad); }

section {
  background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
  box-shadow: var(--shadow-sm); overflow: hidden;
}
.sec-head { padding: 20px 22px 0; }
.sec-head h2 { font-size: 15px; font-weight: 670; margin: 0; letter-spacing: -.01em; }
.sec-head p { margin: 6px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--muted); max-width: 80ch; }
.sec-head-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.sec-body { padding: 16px 22px 22px; }
.sec-body.flush { padding: 8px 0 10px; }

/* Buttons ----------------------------------------------------------------- */
button {
  height: var(--control-h); padding: 0 14px; border-radius: var(--r-sm);
  font-size: 13px; font-weight: 560; font-family: inherit;
  border: 1px solid var(--btn-line); background: var(--btn-bg); color: var(--text);
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  transition: background .13s ease, border-color .13s ease, color .13s ease, box-shadow .13s ease, transform .05s ease;
  white-space: nowrap;
}
button:hover { background: var(--btn-hover); border-color: var(--line-strong); }
button:active { transform: translateY(.5px); }
button:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--accent-ring); }
button.primary {
  background: var(--accent); border-color: var(--accent); color: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, .12);
}
button.primary:hover { background: var(--accent-strong); border-color: var(--accent-strong); }
button.quiet { border-color: transparent; background: transparent; color: var(--muted); }
button.quiet:hover { background: var(--btn-hover); color: var(--text); border-color: transparent; }
button.quiet.danger:hover { background: var(--bad-soft); color: var(--bad); }
button.icon { height: 34px; padding: 0 12px; background: var(--btn-bg); color: var(--muted); font-weight: 560; }
button.icon:hover { color: var(--text); }
.endpoint button.icon { height: 26px; padding: 0 10px; border-color: transparent; background: transparent; font-size: 12px; }
.endpoint button.icon:hover { background: var(--card); border-color: var(--line); }
button:disabled { opacity: .5; cursor: default; }
button:disabled:hover { background: var(--btn-bg); border-color: var(--btn-line); }

/* Pills ------------------------------------------------------------------- */
.pill {
  display: inline-flex; align-items: center; padding: 2px 9px; border-radius: var(--r-pill, 999px);
  border-radius: 999px; font-size: 11.5px; font-weight: 600; white-space: nowrap; line-height: 1.5;
  border: 1px solid transparent;
}
.pill.ok { color: var(--ok); background: var(--ok-soft); }
.pill.no { color: var(--muted); background: var(--card-2); border-color: var(--line); }
.pill.warn { color: var(--warn); background: var(--warn-soft); }
.pill.bad { color: var(--bad); background: var(--bad-soft); }

/* Provider rows ----------------------------------------------------------- */
.prov {
  display: grid; grid-template-columns: 200px 1fr auto;
  gap: 20px; align-items: center;
  padding: 16px 0; border-top: 1px solid var(--line);
}
.prov:first-child { border-top: 0; }
.prov-name { font-weight: 620; font-size: 14px; align-self: start; padding-top: 8px; }
.prov-name span { display: block; font-weight: 500; font-size: 11.5px; color: var(--faint); margin-top: 3px; letter-spacing: .02em; }
.prov-field input {
  width: 100%; height: var(--control-h); padding: 0 12px; border-radius: var(--r-sm);
  border: 1px solid var(--input-line); background: var(--input-bg); color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px;
  transition: border-color .13s ease, box-shadow .13s ease;
}
.prov-field input::placeholder { color: var(--faint); font-family: inherit; }
.prov-field input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
.prov-hint { margin-top: 9px; font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.prov-actions { display: flex; gap: 8px; align-items: center; align-self: start; padding-top: 1px; }

/* Add-provider form ------------------------------------------------------- */
.addform {
  border: 1px solid var(--line); border-radius: var(--r-lg); background: var(--card-2);
  padding: 18px; margin-bottom: 18px; display: grid; gap: 16px;
}
.addgrid { display: grid; grid-template-columns: 1fr 1.5fr 1.2fr; gap: 14px; }
.addform label { display: grid; gap: 6px; font-size: 11px; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; color: var(--faint); }
.addform input:not([type="checkbox"]) {
  height: var(--control-h); padding: 0 12px; border-radius: var(--r-sm); border: 1px solid var(--input-line);
  background: var(--input-bg); color: var(--text); font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  transition: border-color .13s ease, box-shadow .13s ease;
}
.addform input:not([type="checkbox"])::placeholder { color: var(--faint); }
.addform input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
.addrow { display: flex; gap: 22px; align-items: end; flex-wrap: wrap; }
.addform label.chk {
  display: flex; flex-direction: row; align-items: center; gap: 8px; font-size: 13px; font-weight: 500;
  letter-spacing: 0; text-transform: none; color: var(--text); height: var(--control-h);
  white-space: nowrap;
}
.addform label.chk input { width: 16px; height: 16px; accent-color: var(--accent); }
.addform label.grow { flex: 1; min-width: 240px; }
.addactions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding-top: 2px; }
.addactions .hint { font-size: 12px; color: var(--muted); }

/* Tables ------------------------------------------------------------------ */
.tablewrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--line); white-space: nowrap; }
thead th { border-bottom: 1px solid var(--line-strong); }
th {
  color: var(--faint); font-weight: 650; font-size: 11px; letter-spacing: .05em; text-transform: uppercase;
}
tbody tr { transition: background .1s ease; }
tbody tr:last-child td { border-bottom: 0; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
td.mono { font-size: 12.5px; white-space: normal; }
td.muted { color: var(--muted); }
tbody tr:hover { background: var(--card-2); }
.bar { display: inline-block; height: 6px; border-radius: 3px; background: var(--line-strong); min-width: 2px; vertical-align: middle; overflow: hidden; }
.bar > i { display: block; height: 100%; border-radius: 3px; background: var(--ok); }
.bar.low > i { background: var(--warn); }
.bar.none > i { background: var(--bad); }
.pinstar { color: var(--accent); font-weight: 700; }

/* Row controls (reorder / delete) ----------------------------------------- */
.rowbtns { display: inline-flex; align-items: center; gap: 8px; justify-content: flex-end; }
.rowbtns .seg { display: inline-flex; border: 1px solid var(--btn-line); border-radius: var(--r-sm); overflow: hidden; }
.rowbtns .seg button { height: 28px; width: 30px; padding: 0; border: 0; border-radius: 0; background: var(--btn-bg); color: var(--muted); font-size: 13px; }
.rowbtns .seg button + button { border-left: 1px solid var(--btn-line); }
.rowbtns .seg button:hover:not(:disabled) { background: var(--btn-hover); color: var(--text); }
.rowbtns button.del { height: 28px; width: 30px; padding: 0; border-radius: var(--r-sm); color: var(--faint); font-size: 15px; }
.rowbtns button.del:hover { background: var(--bad-soft); color: var(--bad); border-color: transparent; }
.rowbtns button:disabled { opacity: .35; }
td.auto { color: var(--faint); font-size: 12px; }

/* Notes, banner, skeleton, toast ------------------------------------------ */
.note { font-size: 12.5px; color: var(--muted); margin: 14px 22px 0; display: flex; align-items: baseline; gap: 7px; flex-wrap: wrap; line-height: 1.5; }
.note .mono { color: var(--muted); }
#banner {
  margin: 0; padding: 12px 16px; border-radius: var(--r-md);
  background: var(--bad-soft); color: var(--bad); border: 1px solid color-mix(in srgb, var(--bad) 30%, transparent);
  font-size: 13px; font-weight: 500;
}
.skeleton { color: var(--faint); font-size: 13px; padding: 10px 0; }
#toast {
  position: fixed; right: 22px; bottom: 22px; padding: 13px 16px; border-radius: var(--r-md);
  background: var(--card); border: 1px solid var(--line); color: var(--text);
  box-shadow: var(--shadow-lg); max-width: 440px; font-size: 13px; font-weight: 500;
  opacity: 0; transform: translateY(10px) scale(.98); transition: opacity .18s ease, transform .18s ease; pointer-events: none;
  border-left: 3px solid var(--line-strong);
}
#toast.show { opacity: 1; transform: none; }
#toast.good { border-left-color: var(--ok); }
#toast.err { border-left-color: var(--bad); }

/* Responsive -------------------------------------------------------------- */
@media (max-width: 900px) {
  .tiles { grid-template-columns: repeat(2, 1fr); }
  .addgrid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 680px) {
  header { padding: 12px 16px; }
  main { padding: 20px 16px 44px; }
  .prov { grid-template-columns: 1fr; gap: 10px; padding: 16px 0; }
  .prov-name { padding-top: 0; }
  .prov-actions { padding-top: 2px; }
  .head-right { width: 100%; }
  .addgrid { grid-template-columns: 1fr; }
  .tiles { gap: 12px; }
}
</style>
</head>
<body>
<header>
  <div class="head-inner">
    <div class="brand"><span class="dot"></span><h1>Free Router</h1></div>
    <span class="endpoint">
      <span class="mono" id="endpoint">loading&hellip;</span>
      <button class="icon" id="copy" title="Copy endpoint" aria-label="Copy endpoint">Copy</button>
    </span>
    <div class="head-right">
      <span class="updated" id="updated"></span>
      <button class="icon" id="refresh" title="Refresh now">Refresh</button>
      <button class="icon" id="theme" title="Toggle light / dark" aria-label="Toggle light or dark theme">Theme</button>
    </div>
  </div>
</header>
<main>
  <div id="banner" role="alert" hidden></div>

  <div class="tiles" id="tiles" aria-label="Today's traffic"></div>

  <section>
    <div class="sec-head sec-head-row">
      <div>
        <h2>Provider keys</h2>
        <p id="keys-blurb"></p>
      </div>
      <button class="icon" id="add-provider-toggle">+ Add provider</button>
    </div>
    <div class="sec-body">
      <form id="add-provider" class="addform" hidden autocomplete="off">
        <div class="addgrid">
          <label>Name<input id="ap-name" placeholder="e.g. groq" spellcheck="false"></label>
          <label>Base URL<input id="ap-url" placeholder="https://api.example.com/v1" spellcheck="false"></label>
          <label>API key (optional)<input id="ap-key" type="password" placeholder="Paste key" spellcheck="false"></label>
        </div>
        <div class="addrow">
          <label class="chk"><input type="checkbox" id="ap-catalog"> Has a /models catalog</label>
          <label class="chk" id="ap-pricing-wrap" hidden><input type="checkbox" id="ap-pricing" checked> Catalog publishes prices</label>
          <label class="grow" id="ap-free-wrap">Free models (comma-separated)<input id="ap-free" placeholder="model-a, org/model-b" spellcheck="false"></label>
        </div>
        <div class="addactions">
          <button type="submit" class="primary" id="ap-submit">Add provider</button>
          <button type="button" class="quiet" id="ap-cancel">Cancel</button>
          <span class="hint" id="ap-hint">Writes a new block to config.json and, if given, the key to the env file.</span>
        </div>
      </form>
      <div id="providers"><div class="skeleton">Loading providers&hellip;</div></div>
    </div>
  </section>

  <section>
    <div class="sec-head">
      <h2>Route priority</h2>
      <p id="routes-blurb"></p>
    </div>
    <div class="sec-body flush"><div id="routes"><div class="skeleton" style="padding-left:22px">Loading routes&hellip;</div></div></div>
  </section>

  <section>
    <div class="sec-head">
      <h2>Traffic by model</h2>
      <p id="usage-blurb"></p>
    </div>
    <div class="sec-body flush"><div id="usage"></div></div>
  </section>
</main>
<div id="toast" role="status" aria-live="polite"></div>
<script>
const el = (id) => document.getElementById(id);
let state = null;
let lastLoadedAt = 0;

// Theme: follow the OS by default, but let an explicit choice win and persist.
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
  else root.removeAttribute('data-theme');
}
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('fr-theme'); } catch (error) { saved = null; }
  applyTheme(saved);
}
function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const now = current ? current : (prefersDark ? 'dark' : 'light');
  const next = now === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('fr-theme', next); } catch (error) { /* private mode */ }
}
initTheme();

function toast(message, kind) {
  const node = el('toast');
  node.textContent = message;
  node.className = 'show ' + (kind || '');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.className = ''; }, 4600);
}

function banner(message) {
  const node = el('banner');
  if (!message) { node.hidden = true; node.textContent = ''; return; }
  node.textContent = message;
  node.hidden = false;
}

async function api(path, options) {
  const config = Object.assign({ headers: {} }, options || {});
  config.headers['X-Free-Router-UI'] = '1';
  if (config.body) config.headers['Content-Type'] = 'application/json';
  const response = await fetch(path, config);
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (error) { payload = null; }
  if (!response.ok) {
    throw new Error((payload && payload.error && payload.error.message) || ('HTTP ' + response.status));
  }
  return payload;
}

function td(value, className) {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  if (value instanceof Node) cell.appendChild(value);
  else cell.textContent = value;
  return cell;
}

function table(headers, rows) {
  const wrap = document.createElement('div');
  wrap.className = 'tablewrap';
  const node = document.createElement('table');
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  for (const header of headers) {
    const cell = document.createElement('th');
    cell.textContent = header.label;
    cell.scope = 'col';
    if (header.num) cell.className = 'num';
    headRow.appendChild(cell);
  }
  head.appendChild(headRow);
  node.appendChild(head);
  const body = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const cell of row) tr.appendChild(cell);
    body.appendChild(tr);
  }
  node.appendChild(body);
  wrap.appendChild(node);
  return wrap;
}

function pill(text, kind) {
  const node = document.createElement('span');
  node.className = 'pill ' + kind;
  node.textContent = text;
  return node;
}

function meter(fraction, kind) {
  const bar = document.createElement('span');
  bar.className = 'bar' + (kind ? ' ' + kind : '');
  bar.style.width = '54px';
  const fill = document.createElement('i');
  const pct = Math.max(0, Math.min(1, fraction));
  fill.style.width = Math.round(pct * 100) + '%';
  bar.appendChild(fill);
  return bar;
}

function tile(host, key, value, kind, sub) {
  const box = document.createElement('div');
  box.className = 'tile';
  const k = document.createElement('div'); k.className = 'k'; k.textContent = key;
  const v = document.createElement('div'); v.className = 'v' + (kind ? ' ' + kind : ''); v.textContent = value;
  box.appendChild(k); box.appendChild(v);
  if (sub) { const s = document.createElement('div'); s.className = 's'; s.textContent = sub; box.appendChild(s); }
  host.appendChild(box);
}

function renderTiles() {
  const host = el('tiles');
  host.textContent = '';
  const today = (state.usage && state.usage.days && state.usage.days[0]) || { ok: 0, fail: 0, total: 0 };
  const providers = state.providers || [];
  const active = providers.filter((p) => p.configured).length;
  tile(host, 'Served today', String(today.ok || 0), 'good', 'requests answered');
  tile(host, 'Fell through', String(today.fail || 0), (today.fail ? 'bad' : ''), 'failed and re-routed');
  const ok = today.ok || 0; const total = (today.ok || 0) + (today.fail || 0);
  const rate = total ? Math.round((ok / total) * 100) + '%' : '\u2013';
  tile(host, 'Success rate', rate, '', total ? ok + ' of ' + total + ' attempts' : 'no attempts yet');
  tile(host, 'Providers', active + ' / ' + providers.length, '', 'with a key configured');
}

function renderLastSelection() {
  const sel = state.lastSelection;
  const node = el('updated');
  const parts = [];
  if (sel && sel.provider && sel.model) {
    let when = '';
    try { when = new Date(sel.selectedAt).toLocaleTimeString(); } catch (error) { when = ''; }
    parts.push('last served ' + sel.provider + ':' + sel.model + (when ? ' at ' + when : ''));
  }
  node.textContent = parts.join('  \u00b7  ');
}

function renderProviders() {
  const host = el('providers');
  host.textContent = '';
  for (const provider of state.providers) {
    const row = document.createElement('div');
    row.className = 'prov';

    const name = document.createElement('div');
    name.className = 'prov-name';
    name.textContent = provider.name;
    const env = document.createElement('span');
    env.className = 'mono';
    env.textContent = provider.keyEnv;
    name.appendChild(env);

    const fieldCell = document.createElement('div');
    fieldCell.className = 'prov-field';
    const field = document.createElement('input');
    field.type = 'password';
    field.autocomplete = 'off';
    field.spellcheck = false;
    field.setAttribute('aria-label', provider.keyEnv);
    field.placeholder = provider.configured
      ? 'Paste a new key to replace the current one'
      : 'Paste ' + provider.keyEnv;
    fieldCell.appendChild(field);

    const hint = document.createElement('div');
    hint.className = 'prov-hint';
    if (provider.configured) {
      hint.appendChild(pill('active', 'ok'));
      hint.appendChild(document.createTextNode('current '));
      const masked = document.createElement('span');
      masked.className = 'mono';
      masked.textContent = provider.maskedKey;
      hint.appendChild(masked);
    } else {
      hint.appendChild(pill('no key', 'no'));
      hint.appendChild(document.createTextNode('this provider and its models are skipped'));
    }
    if (provider.catalogError && !provider.catalogModels) {
      hint.appendChild(pill('catalog unreachable', 'bad'));
    }
    fieldCell.appendChild(hint);

    if (provider.unavailableModels && provider.unavailableModels.length) {
      const gone = document.createElement('div');
      gone.className = 'prov-hint';
      gone.appendChild(pill('withdrawn', 'warn'));
      gone.appendChild(document.createTextNode('no longer offered upstream, skipped: '));
      const ids = document.createElement('span');
      ids.className = 'mono';
      ids.textContent = provider.unavailableModels.join(', ');
      gone.appendChild(ids);
      fieldCell.appendChild(gone);
    }

    const actions = document.createElement('div');
    actions.className = 'prov-actions';
    const save = document.createElement('button');
    save.className = 'primary';
    save.textContent = 'Save';
    actions.appendChild(save);

    const submit = async () => {
      const value = field.value.trim();
      if (!value) { toast('Paste a key first, the field is empty.', 'err'); return; }
      save.disabled = true;
      try {
        await api('api/keys', {
          method: 'POST',
          body: JSON.stringify({ provider: provider.name, key: value }),
        });
        field.value = '';
        toast('Saved ' + provider.keyEnv + '. Applied immediately, no restart needed.', 'good');
        await load();
      } catch (error) {
        toast(String(error.message || error), 'err');
        save.disabled = false;
      }
    };
    save.onclick = submit;
    field.addEventListener('keydown', (event) => { if (event.key === 'Enter') submit(); });

    if (provider.configured) {
      const clear = document.createElement('button');
      clear.className = 'quiet';
      clear.textContent = 'Clear key';
      clear.title = 'Delete ' + provider.keyEnv + ' from ' + state.envFile;
      clear.onclick = async () => {
        const message = 'Clear ' + provider.keyEnv + '?\\n\\n'
          + 'It is deleted from ' + state.envFile + ' and unset in the running process, '
          + 'so ' + provider.name + ' stops being used. The provider stays configured.';
        if (!confirm(message)) return;
        clear.disabled = true;
        try {
          await api('api/keys', {
            method: 'POST',
            body: JSON.stringify({ provider: provider.name, key: '' }),
          });
          toast('Cleared ' + provider.keyEnv + '.', 'good');
          await load();
        } catch (error) {
          toast(String(error.message || error), 'err');
          clear.disabled = false;
        }
      };
      actions.appendChild(clear);
    }

    if (provider.removable) {
      const del = document.createElement('button');
      del.className = 'quiet danger';
      del.textContent = 'Delete';
      del.title = 'Remove the ' + provider.name + ' provider from config.json entirely';
      del.onclick = async () => {
        const message = 'Delete provider ' + provider.name + '?\\n\\n'
          + 'It is removed from config.json, its key is cleared, and its models are '
          + 'dropped from every route. This cannot be undone from here.';
        if (!confirm(message)) return;
        del.disabled = true;
        try {
          await api('api/providers', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', name: provider.name }),
          });
          toast('Deleted provider ' + provider.name + '.', 'good');
          await load();
        } catch (error) {
          toast(String(error.message || error), 'err');
          del.disabled = false;
        }
      };
      actions.appendChild(del);
    }

    row.appendChild(name);
    row.appendChild(fieldCell);
    row.appendChild(actions);
    host.appendChild(row);
  }
  el('keys-blurb').textContent =
    'Saving writes the key to ' + state.envFile + ' with 0600 permissions and applies it right away, '
    + 'no restart. Add a provider to register a new OpenAI-compatible endpoint in config.json, or '
    + 'Delete one to remove it entirely. The default and discovery providers cannot be deleted here.';
}

function saveRoute(entries) {
  return api('api/routes', {
    method: 'POST',
    body: JSON.stringify({ route: state.route, entries }),
  });
}

async function applyRouteOrder(entries, okMessage) {
  try {
    await saveRoute(entries);
    toast(okMessage, 'good');
    await load();
  } catch (error) {
    toast(String(error.message || error), 'err');
  }
}

function renderRoutes() {
  const host = el('routes');
  host.textContent = '';
  const configured = state.configuredRoute || [];
  el('routes-blurb').textContent =
    'The models this route tries, in your configured order. Use the arrows to set priority and '
    + '\u00d7 to remove one; changes are written to config.json. used and left are today ('
    + state.usage.today + ' ' + state.usage.timezone + '). Pinned models and observed reliability '
    + 'can still re-rank the effective order, and discovered models are added automatically.';

  if (!configured.length) {
    const empty = document.createElement('p');
    empty.className = 'note';
    empty.textContent = 'No models configured for this route. Any discovered free models are listed below.';
    host.appendChild(empty);
  } else {
    const keys = () => configured.map((e) => ({ provider: e.provider, model: e.model }));
    const rows = configured.map((entry, index) => {
      let status = 'ready';
      let kind = 'ok';
      if (!entry.providerKnown) { status = 'no provider'; kind = 'bad'; }
      else if (!entry.providerConfigured) { status = 'no key'; kind = 'no'; }
      else if (entry.zeroCost === false) { status = 'paid'; kind = 'bad'; }
      else if (entry.cooldownSeconds > 0) { status = 'cooldown ' + entry.cooldownSeconds + 's'; kind = 'warn'; }
      const usage = entry.usage || null;
      const used = usage ? usage.today.consumed : 0;
      const limit = usage ? usage.dailyLimit : null;
      const remaining = usage ? usage.remainingToday : null;
      const model = document.createElement('span');
      if (entry.pinned) {
        const star = document.createElement('span');
        star.className = 'pinstar';
        star.textContent = '\u2605 ';
        star.title = 'pinned: always tried first';
        model.appendChild(star);
      }
      model.appendChild(document.createTextNode(entry.model));
      let left = '\u2013';
      if (limit != null) left = remaining + ' / ' + limit;

      const ctrls = document.createElement('span');
      ctrls.className = 'rowbtns';
      const up = document.createElement('button');
      up.textContent = '\u2191'; up.title = 'Move up'; up.setAttribute('aria-label', 'Move up'); up.disabled = index === 0;
      const down = document.createElement('button');
      down.textContent = '\u2193'; down.title = 'Move down'; down.setAttribute('aria-label', 'Move down'); down.disabled = index === configured.length - 1;
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '\u00d7'; del.title = 'Remove from route'; del.setAttribute('aria-label', 'Remove from route');
      up.onclick = () => {
        const e = keys();
        const t = e[index - 1]; e[index - 1] = e[index]; e[index] = t;
        applyRouteOrder(e, 'Moved ' + entry.model + ' up.');
      };
      down.onclick = () => {
        const e = keys();
        const t = e[index + 1]; e[index + 1] = e[index]; e[index] = t;
        applyRouteOrder(e, 'Moved ' + entry.model + ' down.');
      };
      del.onclick = () => {
        if (!confirm('Remove ' + entry.provider + ':' + entry.model + ' from the route?')) return;
        applyRouteOrder(keys().filter((_, i) => i !== index), 'Removed ' + entry.model + ' from the route.');
      };
      const seg = document.createElement('span');
      seg.className = 'seg';
      seg.appendChild(up); seg.appendChild(down);
      ctrls.appendChild(seg); ctrls.appendChild(del);

      return [
        td(String(entry.order), 'num'),
        td(pill(status, kind)),
        td(entry.provider, 'muted'),
        td(model, 'mono'),
        td(used || '\u2013', 'num'),
        td(left, 'num'),
        td(ctrls, 'num'),
      ];
    });
    host.appendChild(table(
      [
        { label: '#', num: true },
        { label: 'status' },
        { label: 'provider' },
        { label: 'model' },
        { label: 'used', num: true },
        { label: 'left today', num: true },
        { label: '' },
      ],
      rows,
    ));
  }

  const discovered = (state.routes || []).filter((entry) => !entry.configured);
  if (discovered.length) {
    const line = document.createElement('p');
    line.className = 'note';
    line.appendChild(pill('auto', 'no'));
    line.appendChild(document.createTextNode(' Discovered and ranked automatically (not editable here): '));
    const ids = document.createElement('span');
    ids.className = 'mono';
    ids.textContent = discovered.map((entry) => entry.provider + ':' + entry.model).join(', ');
    line.appendChild(ids);
    host.appendChild(line);
  }

  if (state.unavailableModels && state.unavailableModels.length) {
    const gone = document.createElement('p');
    gone.className = 'note';
    gone.appendChild(pill('withdrawn', 'warn'));
    gone.appendChild(document.createTextNode(
      ' Configured but missing from the provider catalog, so left out of the route above: ',
    ));
    const ids = document.createElement('span');
    ids.className = 'mono';
    ids.textContent = state.unavailableModels.join(', ');
    gone.appendChild(ids);
    host.appendChild(gone);
  }

  for (const entry of state.excludedByProvider || []) {
    const line = document.createElement('p');
    line.className = 'note';
    line.appendChild(pill('not free', 'bad'));
    line.appendChild(document.createTextNode(' '));
    const id = document.createElement('span');
    id.className = 'mono';
    id.textContent = entry.key;
    line.appendChild(id);
    line.appendChild(document.createTextNode(' \u2014 configured in config.json, but '
      + entry.reason + '. Left out of the route above, since retrying cannot succeed.'));
    host.appendChild(line);
  }
}

function renderUsage() {
  const host = el('usage');
  host.textContent = '';
  const models = (state.usage && state.usage.models) || [];
  el('usage-blurb').textContent =
    'Every upstream attempt over the last ' + (state.usage.retentionDays || 7)
    + ' days, per model. Served is answered requests, fell through is failures that re-routed.';
  if (!models.length) {
    const empty = document.createElement('p');
    empty.className = 'note';
    empty.textContent = 'No requests recorded yet. Point a client at the endpoint above and traffic shows up here.';
    host.appendChild(empty);
    return;
  }
  const rows = models.slice(0, 30).map((m) => {
    const attempts = (m.ok || 0) + (m.fail || 0);
    const rate = attempts ? m.ok / attempts : 0;
    const rateCell = document.createElement('span');
    rateCell.appendChild(meter(rate, attempts ? (rate >= 0.8 ? '' : rate >= 0.5 ? 'low' : 'none') : 'none'));
    rateCell.appendChild(document.createTextNode(' ' + (attempts ? Math.round(rate * 100) + '%' : '\u2013')));
    return [
      td(m.model, 'mono'),
      td(m.provider, 'muted'),
      td(String(m.ok || 0), 'num'),
      td(String(m.fail || 0), 'num'),
      td(rateCell, 'num'),
      td(m.dailyLimit != null ? m.remainingToday + ' / ' + m.dailyLimit : '\u2013', 'num'),
    ];
  });
  host.appendChild(table(
    [
      { label: 'model' },
      { label: 'provider' },
      { label: 'served', num: true },
      { label: 'fell through', num: true },
      { label: 'success', num: true },
      { label: 'left today', num: true },
    ],
    rows,
  ));
}

function markUpdated() {
  lastLoadedAt = Date.now();
}

// Auto-refresh should not wipe out a key the operator is midway through typing.
function editingKey() {
  const active = document.activeElement;
  if (active && active.tagName === 'INPUT' && active.value) return true;
  return Array.prototype.some.call(document.querySelectorAll('.prov-field input'), (i) => i.value);
}

function renderAll() {
  el('endpoint').textContent = state.endpoint;
  renderTiles();
  renderLastSelection();
  renderProviders();
  renderRoutes();
  renderUsage();
}

async function load() {
  state = await api('api/state');
  banner('');
  markUpdated();
  renderAll();
}

async function refresh(silent) {
  if (editingKey()) return;
  try {
    state = await api('api/state');
    banner('');
    markUpdated();
    renderAll();
  } catch (error) {
    if (!silent) toast(String(error.message || error), 'err');
    banner('Cannot reach the gateway: ' + String(error.message || error));
  }
}

el('copy').onclick = async () => {
  const text = state ? state.endpoint : el('endpoint').textContent;
  try {
    await navigator.clipboard.writeText(text);
    toast('Endpoint copied to the clipboard.', 'good');
  } catch (error) {
    toast('Copy failed; select the endpoint and copy manually.', 'err');
  }
};
el('refresh').onclick = () => refresh(false);
el('theme').onclick = toggleTheme;

// Add-provider form.
const apForm = el('add-provider');
el('add-provider-toggle').onclick = () => {
  apForm.hidden = !apForm.hidden;
  if (!apForm.hidden) el('ap-name').focus();
};
el('ap-cancel').onclick = () => { apForm.hidden = true; apForm.reset(); el('ap-pricing-wrap').hidden = true; };
el('ap-catalog').onchange = () => { el('ap-pricing-wrap').hidden = !el('ap-catalog').checked; };
apForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = el('ap-name').value.trim();
  const baseUrl = el('ap-url').value.trim();
  const key = el('ap-key').value.trim();
  const catalog = el('ap-catalog').checked;
  const pricing = el('ap-pricing').checked;
  const freeModels = el('ap-free').value.split(',').map((s) => s.trim()).filter(Boolean);
  if (!name) { toast('Give the provider a name.', 'err'); return; }
  if (!baseUrl) { toast('Base URL is required.', 'err'); return; }
  const submitBtn = el('ap-submit');
  submitBtn.disabled = true;
  try {
    await api('api/providers', {
      method: 'POST',
      body: JSON.stringify({ action: 'add', name, baseUrl, catalog, pricing, freeModels, key }),
    });
    toast('Added provider ' + name + '.', 'good');
    apForm.reset();
    apForm.hidden = true;
    el('ap-pricing-wrap').hidden = true;
    await load();
  } catch (error) {
    toast(String(error.message || error), 'err');
  } finally {
    submitBtn.disabled = false;
  }
});

// A gentle "updated Ns ago" ticker so a stale page is obvious.
setInterval(() => {
  if (!lastLoadedAt) return;
  const secs = Math.round((Date.now() - lastLoadedAt) / 1000);
  const ago = secs < 5 ? 'updated just now' : 'updated ' + secs + 's ago';
  const base = state && state.lastSelection && state.lastSelection.provider
    ? 'last served ' + state.lastSelection.provider + ':' + state.lastSelection.model + '  \u00b7  '
    : '';
  el('updated').textContent = base + ago;
}, 1000);

setInterval(() => refresh(true), 15000);

load().catch((error) => {
  banner('Cannot reach the gateway: ' + String(error.message || error));
  toast(String(error.message || error), 'err');
});
</script>
</body>
</html>
`;

export function renderPage() {
  return PAGE;
}
