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
  --page: #f9f9f7;
  --surface: #fcfcfb;
  --surface-2: #f4f4f1;
  --surface-3: #edece7;
  --ink: #0b0b0b;
  --ink-2: #52514e;
  --muted: #898781;
  --line: #e1e0d9;
  --line-2: #c3c2b7;
  --ring: rgba(11, 11, 11, .10);
  --accent: #2a78d6;
  --accent-2: #256abf;
  --accent-wash: #e7f0fc;
  --good: #0ca30c;
  --good-wash: #e3f3e3;
  --warn: #fab219;
  --warn-wash: #fbf0d9;
  --crit: #d03b3b;
  --crit-wash: #fae6e6;
  --shadow: 0 1px 2px rgba(11, 11, 11, .04), 0 12px 28px -20px rgba(11, 11, 11, .30);
  --shadow-pop: 0 18px 48px -16px rgba(11, 11, 11, .34);
  --r: 12px;
  --r-sm: 8px;
  --r-xs: 6px;
  --h: 34px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #0d0d0d;
    --surface: #1a1a19;
    --surface-2: #222221;
    --surface-3: #2b2b28;
    --ink: #ffffff;
    --ink-2: #c3c2b7;
    --muted: #898781;
    --line: #2c2c2a;
    --line-2: #383835;
    --ring: rgba(255, 255, 255, .12);
    --accent: #3987e5;
    --accent-2: #5598e7;
    --accent-wash: #15263a;
    --good-wash: #14301a;
    --warn-wash: #332a10;
    --crit-wash: #331b1b;
    --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 12px 28px -20px rgba(0, 0, 0, .8);
    --shadow-pop: 0 18px 48px -16px rgba(0, 0, 0, .8);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --page: #0d0d0d;
  --surface: #1a1a19;
  --surface-2: #222221;
  --surface-3: #2b2b28;
  --ink: #ffffff;
  --ink-2: #c3c2b7;
  --muted: #898781;
  --line: #2c2c2a;
  --line-2: #383835;
  --ring: rgba(255, 255, 255, .12);
  --accent: #3987e5;
  --accent-2: #5598e7;
  --accent-wash: #15263a;
  --good-wash: #14301a;
  --warn-wash: #332a10;
  --crit-wash: #331b1b;
  --shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 12px 28px -20px rgba(0, 0, 0, .8);
  --shadow-pop: 0 18px 48px -16px rgba(0, 0, 0, .8);
}

* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--page);
  color: var(--ink);
  font: 13.5px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
[hidden] { display: none !important; }
::selection { background: var(--accent-wash); }
svg { display: block; flex: none; }

.wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
.micro {
  font-size: 10.5px; font-weight: 650; letter-spacing: .08em;
  text-transform: uppercase; color: var(--muted);
}

/* Top bar ----------------------------------------------------------------- */
.topbar {
  position: sticky; top: 0; z-index: 30;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}
.topbar .wrap { display: flex; align-items: center; gap: 14px; height: 58px; }
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.mark {
  width: 27px; height: 27px; border-radius: 8px; flex: none;
  background: linear-gradient(150deg, var(--accent), var(--accent-2));
  color: #fff; display: grid; place-items: center;
  box-shadow: 0 2px 8px -3px rgba(42, 120, 214, .7);
}
.mark svg { width: 16px; height: 16px; }
.brand h1 { font-size: 14.5px; font-weight: 660; margin: 0; letter-spacing: -.01em; white-space: nowrap; }

.conn {
  display: inline-flex; align-items: center; gap: 8px; min-width: 0;
  height: 30px; padding: 0 4px 0 10px;
  background: var(--surface-2); border: 1px solid var(--line); border-radius: 999px;
}
.conn code { font-size: 12px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.live { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); flex: none; }
.live.ok { background: var(--good); box-shadow: 0 0 0 3px var(--good-wash); }
.live.warn { background: var(--warn); box-shadow: 0 0 0 3px var(--warn-wash); }
.live.bad { background: var(--crit); box-shadow: 0 0 0 3px var(--crit-wash); }
.grow { margin-left: auto; }
.stamp { font-size: 11.5px; color: var(--muted); white-space: nowrap; }

/* Buttons ----------------------------------------------------------------- */
.btn {
  height: var(--h); padding: 0 13px; border-radius: var(--r-sm);
  border: 1px solid var(--line-2); background: var(--surface); color: var(--ink);
  font: inherit; font-size: 12.5px; font-weight: 560;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  cursor: pointer; white-space: nowrap;
  transition: background .12s ease, border-color .12s ease, color .12s ease, box-shadow .12s ease;
}
.btn:hover { background: var(--surface-2); }
.btn:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--accent-wash), 0 0 0 1px var(--accent); }
.btn svg { width: 15px; height: 15px; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-2); border-color: var(--accent-2); }
.btn-ghost { border-color: transparent; background: transparent; color: var(--ink-2); }
.btn-ghost:hover { background: var(--surface-2); color: var(--ink); }
.btn-icon { width: var(--h); padding: 0; }
.btn-sm { height: 28px; padding: 0 10px; font-size: 12px; border-radius: var(--r-xs); }
.btn-sm svg { width: 13px; height: 13px; }
.btn-micro { width: 26px; height: 26px; padding: 0; border-radius: var(--r-xs); }
.btn-micro svg { width: 13px; height: 13px; }
.btn-danger:hover { background: var(--crit-wash); color: var(--crit); border-color: transparent; }
.btn:disabled { opacity: .4; cursor: default; }
.btn:disabled:hover { background: var(--surface); }
.conn .btn-ghost:hover { background: var(--surface); }

/* Layout ------------------------------------------------------------------ */
/* minmax(0,...) and min-width:0 everywhere a grid item holds a wide table:
   a grid item defaults to min-width:auto and would otherwise refuse to shrink
   below the table's min-content width, overflowing the page on narrow screens. */
main { padding: 22px 0 64px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 18px; }
.cols { display: grid; grid-template-columns: minmax(0, 1.32fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.cols > * { min-width: 0; }

.card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--r); box-shadow: var(--shadow); min-width: 0;
}
.card-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
  padding: 17px 18px 13px;
}
.card-head h2 { font-size: 13.5px; font-weight: 680; margin: 0; letter-spacing: -.005em; }
.card-head p { margin: 5px 0 0; font-size: 12px; line-height: 1.5; color: var(--muted); max-width: 62ch; }
.card-body { padding: 0 18px 16px; }
.card-body.pad { padding: 4px 18px 18px; }

/* KPI row ----------------------------------------------------------------- */
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--r);
  padding: 14px 16px 15px; box-shadow: var(--shadow);
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
}
.kpi .lbl { font-size: 10.5px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
.kpi .val { font-size: 26px; font-weight: 660; letter-spacing: -.025em; line-height: 1.25; margin-top: 4px; }
.kpi .sub { font-size: 11.5px; color: var(--muted); }
.kpi .spark { margin-top: 7px; height: 22px; }
.kpi .spark svg { width: 100%; height: 22px; overflow: visible; }

/* Status chips ------------------------------------------------------------ */
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 550; color: var(--ink-2); white-space: nowrap;
  padding: 2px 9px 2px 7px; border-radius: 999px;
  background: var(--surface-2); border: 1px solid var(--line);
}
.chip i { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); flex: none; }
.chip.good i { background: var(--good); }
.chip.warn i { background: var(--warn); }
.chip.crit i { background: var(--crit); }
.chip.flat { background: transparent; border-color: transparent; padding-left: 0; }

/* Meters ------------------------------------------------------------------ */
.meter { display: block; height: 6px; border-radius: 3px; background: var(--surface-3); overflow: hidden; }
.meter > i { display: block; height: 100%; border-radius: 0 3px 3px 0; background: var(--accent); }
.meter.good { background: var(--good-wash); } .meter.good > i { background: var(--good); }
.meter.warn { background: var(--warn-wash); } .meter.warn > i { background: var(--warn); }
.meter.crit { background: var(--crit-wash); } .meter.crit > i { background: var(--crit); }
.meter.accent { background: var(--accent-wash); } .meter.accent > i { background: var(--accent); }

/* Route cascade ----------------------------------------------------------- */
.routes { position: relative; }
.routes::before {
  content: ""; position: absolute; left: 12px; top: 22px; bottom: 22px;
  width: 1px; background: var(--line); z-index: 0;
}
.route {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 25px minmax(0, 1fr) auto;
  gap: 12px; align-items: center;
  padding: 9px 8px 9px 0; border-radius: var(--r-sm);
}
.route:hover { background: var(--surface-2); }
/* Scoped away from .pin: an unscoped hover rule outranks .rank.pin and would
   leave a pinned badge with white text on a white background. */
.route:hover .rank:not(.pin) { background: var(--surface); }
.rank {
  width: 25px; height: 25px; border-radius: 7px;
  display: grid; place-items: center;
  font-size: 11px; font-weight: 650; font-variant-numeric: tabular-nums;
  color: var(--ink-2); background: var(--surface); border: 1px solid var(--line-2);
}
.rank.pin { color: #fff; background: var(--accent); border-color: var(--accent); }
.r-main { min-width: 0; }
.r-id { font-size: 12.5px; font-weight: 550; color: var(--ink); display: flex; align-items: center; gap: 7px; min-width: 0; }
.r-id .name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.r-meta { display: flex; align-items: center; gap: 9px; margin-top: 4px; flex-wrap: wrap; }
.r-prov { font-size: 11.5px; color: var(--muted); }
.r-right { display: flex; align-items: center; gap: 14px; }
.r-quota { width: 84px; text-align: right; }
.r-quota .num { font-size: 11.5px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.r-quota .meter { margin-top: 5px; }
.r-ctl { display: flex; gap: 3px; opacity: 0; transition: opacity .12s ease; }
.route:hover .r-ctl, .route:focus-within .r-ctl { opacity: 1; }
@media (hover: none) { .r-ctl { opacity: 1; } }

.empty { padding: 16px 2px; font-size: 12.5px; color: var(--muted); }
.foot-note {
  margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line);
  font-size: 11.5px; color: var(--muted); line-height: 1.6;
}
.foot-note .mono { color: var(--ink-2); }
.foot-note + .foot-note { margin-top: 8px; padding-top: 8px; }

/* Providers --------------------------------------------------------------- */
.prov-item { padding: 13px 0; border-top: 1px solid var(--line); }
.prov-item:first-child { border-top: 0; padding-top: 4px; }
.prov-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.prov-id { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.prov-id b { font-size: 13px; font-weight: 640; }
.prov-id span { font-size: 10.5px; color: var(--muted); letter-spacing: .03em; }
.prov-row { display: flex; gap: 8px; margin-top: 9px; }
.field {
  flex: 1; min-width: 0; height: var(--h); padding: 0 11px; border-radius: var(--r-sm);
  border: 1px solid var(--line-2); background: var(--surface); color: var(--ink);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px;
  transition: border-color .12s ease, box-shadow .12s ease;
}
.field::placeholder { color: var(--muted); font-family: system-ui, sans-serif; }
.field:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-wash); }
.prov-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 9px; flex-wrap: wrap; }
.prov-hint { font-size: 11.5px; color: var(--muted); display: flex; align-items: center; gap: 7px; flex-wrap: wrap; min-width: 0; }
.prov-hint .mono { color: var(--ink-2); }
.prov-acts { display: flex; gap: 2px; }

/* Add provider form ------------------------------------------------------- */
.addform {
  border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-2);
  padding: 14px; margin-bottom: 14px; display: grid; gap: 12px;
}
.addform .fields { display: grid; gap: 10px; }
.addform label.f { display: grid; gap: 5px; }
.addform label.f .micro { color: var(--muted); }
.addform .field { background: var(--surface); }
.opts { display: flex; gap: 16px; flex-wrap: wrap; }
.opt { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--ink); white-space: nowrap; }
.opt input { width: 15px; height: 15px; accent-color: var(--accent); margin: 0; }
.addfoot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.addform .hint { font-size: 11.5px; color: var(--muted); line-height: 1.5; }

/* Traffic table ----------------------------------------------------------- */
.tablewrap { overflow-x: auto; margin: 0 -2px; }
table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid var(--line); white-space: nowrap; }
th {
  font-size: 10.5px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase;
  color: var(--muted); border-bottom: 1px solid var(--line-2); padding-top: 4px;
}
th:first-child, td:first-child { padding-left: 2px; }
th:last-child, td:last-child { padding-right: 2px; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--surface-2); }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
td.mono { font-size: 12px; }
td.dim { color: var(--muted); }
.volume { display: flex; align-items: center; gap: 9px; }
.volume .track { flex: 1; min-width: 54px; height: 6px; border-radius: 3px; background: var(--surface-3); }
.volume .track > i { display: block; height: 100%; border-radius: 0 3px 3px 0; background: var(--accent); }
.volume .n { font-variant-numeric: tabular-nums; color: var(--ink-2); min-width: 22px; text-align: right; }
.rate { display: flex; align-items: center; gap: 9px; justify-content: flex-end; }
.rate .meter { width: 46px; }
.rate .n { font-variant-numeric: tabular-nums; color: var(--ink-2); min-width: 32px; text-align: right; }

/* Banner, skeleton, toast ------------------------------------------------- */
#banner {
  display: flex; align-items: center; gap: 9px;
  padding: 11px 14px; border-radius: var(--r-sm);
  background: var(--crit-wash); color: var(--ink); border: 1px solid var(--line);
  font-size: 12.5px;
}
#banner i { width: 7px; height: 7px; border-radius: 50%; background: var(--crit); flex: none; }
.skeleton { font-size: 12.5px; color: var(--muted); padding: 10px 2px; }
#toast {
  position: fixed; right: 20px; bottom: 20px; z-index: 60;
  display: flex; align-items: center; gap: 10px;
  padding: 12px 15px; border-radius: var(--r-sm);
  background: var(--surface); border: 1px solid var(--line); color: var(--ink);
  box-shadow: var(--shadow-pop); max-width: 420px; font-size: 12.5px;
  opacity: 0; transform: translateY(8px) scale(.98); pointer-events: none;
  transition: opacity .18s ease, transform .18s ease;
}
#toast i { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); flex: none; }
#toast.show { opacity: 1; transform: none; }
#toast.good i { background: var(--good); }
#toast.err i { background: var(--crit); }

/* Responsive -------------------------------------------------------------- */
@media (max-width: 1000px) {
  .cols { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 720px) {
  .wrap { padding: 0 15px; }
  .kpis { grid-template-columns: repeat(2, 1fr); }
  .topbar .wrap { height: auto; flex-wrap: wrap; padding-top: 10px; padding-bottom: 10px; gap: 10px; }
  .conn { order: 3; width: 100%; }
  .grow { margin-left: auto; }
  .r-right { gap: 8px; }
  .r-quota { width: 62px; }
}
</style>
</head>
<body>
<div class="topbar">
  <div class="wrap">
    <div class="brand">
      <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h5l4.5 5H19"/><path d="M3 17h5l2.6-2.9"/></svg></span>
      <h1>Free Router</h1>
    </div>
    <span class="conn">
      <i class="live" id="live"></i>
      <code class="mono" id="endpoint">connecting…</code>
      <button class="btn btn-ghost btn-icon btn-sm" id="copy" title="Copy endpoint" aria-label="Copy endpoint"></button>
    </span>
    <span class="grow"></span>
    <span class="stamp" id="stamp"></span>
    <button class="btn btn-ghost btn-icon" id="refresh" title="Refresh now" aria-label="Refresh now"></button>
    <button class="btn btn-ghost btn-icon" id="theme" title="Switch light / dark" aria-label="Switch light or dark theme"></button>
  </div>
</div>

<main class="wrap">
  <div id="banner" role="alert" hidden></div>

  <section class="kpis" id="kpis" aria-label="Traffic today"></section>

  <div class="cols">
    <section class="card">
      <div class="card-head">
        <div>
          <h2>Route priority</h2>
          <p id="routes-blurb"></p>
        </div>
      </div>
      <div class="card-body pad" id="routes"><div class="skeleton">Loading route…</div></div>
    </section>

    <section class="card">
      <div class="card-head">
        <div>
          <h2>Provider keys</h2>
          <p id="keys-blurb"></p>
        </div>
        <button class="btn btn-sm" id="add-provider-toggle">Add</button>
      </div>
      <div class="card-body pad">
        <form id="add-provider" class="addform" hidden autocomplete="off">
          <div class="fields">
            <label class="f"><span class="micro">Name</span><input class="field" id="ap-name" placeholder="groq" spellcheck="false"></label>
            <label class="f"><span class="micro">Base URL</span><input class="field" id="ap-url" placeholder="https://api.example.com/v1" spellcheck="false"></label>
            <label class="f"><span class="micro">API key · optional</span><input class="field" id="ap-key" type="password" placeholder="Paste key" spellcheck="false"></label>
            <label class="f"><span class="micro">Free models · comma separated</span><input class="field" id="ap-free" placeholder="model-a, org/model-b" spellcheck="false"></label>
          </div>
          <div class="opts">
            <label class="opt"><input type="checkbox" id="ap-catalog"> Has a /models catalog</label>
            <label class="opt" id="ap-pricing-wrap" hidden><input type="checkbox" id="ap-pricing" checked> Catalog publishes prices</label>
          </div>
          <div class="addfoot">
            <button type="submit" class="btn btn-primary btn-sm" id="ap-submit">Add provider</button>
            <button type="button" class="btn btn-ghost btn-sm" id="ap-cancel">Cancel</button>
          </div>
          <div class="hint">Writes a block to config.json, and the key to the env file if given.</div>
        </form>
        <div id="providers"><div class="skeleton">Loading providers…</div></div>
      </div>
    </section>
  </div>

  <section class="card">
    <div class="card-head">
      <div>
        <h2>Traffic by model</h2>
        <p id="usage-blurb"></p>
      </div>
    </div>
    <div class="card-body pad" id="usage"></div>
  </section>
</main>

<div id="toast" role="status" aria-live="polite"></div>
<script>
const el = (id) => document.getElementById(id);
const SVG = "http://www.w3.org/2000/svg";
let state = null;
let loadedAt = 0;

// Inline icon set. Built as real SVG nodes so nothing is ever injected as HTML.
const ICONS = {
  copy: ["M9.5 9.5h8.5v8.5h-8.5z", "M6 14.5V6h8.5"],
  refresh: ["M19.5 12a7.5 7.5 0 1 1-2.2-5.3", "M19.5 4.5v4h-4"],
  sun: ["M12 4.2v1.6", "M12 18.2v1.6", "M5.8 5.8l1.1 1.1", "M17.1 17.1l1.1 1.1", "M4.2 12h1.6", "M18.2 12h1.6", "M5.8 18.2l1.1-1.1", "M17.1 6.9l1.1-1.1", "M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2z"],
  moon: ["M19.5 14.4A8 8 0 0 1 9.6 4.5a8 8 0 1 0 9.9 9.9z"],
  up: ["M12 18V7", "M7.5 11.5L12 7l4.5 4.5"],
  down: ["M12 6v11", "M16.5 12.5L12 17l-4.5-4.5"],
  close: ["M7 7l10 10", "M17 7L7 17"],
  plus: ["M12 6v12", "M6 12h12"],
};

function icon(name, size) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  if (size) { svg.style.width = size + "px"; svg.style.height = size + "px"; }
  for (const d of ICONS[name] || []) {
    const path = document.createElementNS(SVG, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

function setIcon(node, name) {
  node.textContent = "";
  node.appendChild(icon(name));
}

/* Theme -------------------------------------------------------------------- */
function prefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function currentTheme() {
  const set = document.documentElement.getAttribute("data-theme");
  return set ? set : (prefersDark() ? "dark" : "light");
}
function paintThemeButton() {
  setIcon(el("theme"), currentTheme() === "dark" ? "sun" : "moon");
}
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
  else root.removeAttribute("data-theme");
}
(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("fr-theme"); } catch (error) { saved = null; }
  applyTheme(saved);
})();

/* Primitives --------------------------------------------------------------- */
function toast(message, kind) {
  const node = el("toast");
  node.textContent = "";
  const dot = document.createElement("i");
  const text = document.createElement("span");
  text.textContent = message;
  node.appendChild(dot);
  node.appendChild(text);
  node.className = "show " + (kind || "");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { node.className = ""; }, 4600);
}

function banner(message) {
  const node = el("banner");
  node.textContent = "";
  if (!message) { node.hidden = true; return; }
  const dot = document.createElement("i");
  const text = document.createElement("span");
  text.textContent = message;
  node.appendChild(dot);
  node.appendChild(text);
  node.hidden = false;
}

async function api(path, options) {
  const config = Object.assign({ headers: {} }, options || {});
  config.headers["X-Free-Router-UI"] = "1";
  if (config.body) config.headers["Content-Type"] = "application/json";
  const response = await fetch(path, config);
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch (error) { payload = null; }
  if (!response.ok) {
    throw new Error((payload && payload.error && payload.error.message) || ("HTTP " + response.status));
  }
  return payload;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

// A status is never colour alone: the dot carries the tone, the label carries
// the meaning, and the text itself stays in an ink token.
function chip(label, tone, flat) {
  const box = node("span", "chip " + (tone || "") + (flat ? " flat" : ""));
  box.appendChild(node("i"));
  box.appendChild(node("span", null, label));
  return box;
}

function meter(fraction, tone, width) {
  const track = node("span", "meter " + (tone || "accent"));
  if (width) track.style.width = width;
  const fill = node("i");
  fill.style.width = Math.round(Math.max(0, Math.min(1, fraction)) * 100) + "%";
  track.appendChild(fill);
  return track;
}

function rateTone(rate) {
  if (rate >= 0.8) return "good";
  if (rate >= 0.5) return "warn";
  return "crit";
}

function iconButton(name, label, className) {
  const button = node("button", "btn " + (className || "btn-ghost btn-micro"));
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.appendChild(icon(name));
  return button;
}

// A 7-day trend for the tile. Line plus a 10% wash, no axes: it reads as
// direction, and the exact numbers live in the table below.
function sparkline(values) {
  const width = 132;
  const height = 22;
  const max = Math.max.apply(null, values);
  if (!values.length || max <= 0) return null;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 3) - 1.5;
    return [x, y];
  });
  const line = points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  const area = document.createElementNS(SVG, "path");
  area.setAttribute("d", line + " L" + width + " " + height + " L0 " + height + " Z");
  area.setAttribute("fill", "currentColor");
  area.setAttribute("opacity", ".10");
  const stroke = document.createElementNS(SVG, "path");
  stroke.setAttribute("d", line);
  stroke.setAttribute("fill", "none");
  stroke.setAttribute("stroke", "currentColor");
  stroke.setAttribute("stroke-width", "2");
  stroke.setAttribute("stroke-linecap", "round");
  stroke.setAttribute("stroke-linejoin", "round");
  stroke.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(area);
  svg.appendChild(stroke);
  return svg;
}

/* Sections ----------------------------------------------------------------- */
function kpi(host, label, value, sub, extra) {
  const box = node("div", "kpi");
  box.appendChild(node("div", "lbl", label));
  box.appendChild(node("div", "val", value));
  box.appendChild(node("div", "sub", sub));
  if (extra) box.appendChild(extra);
  host.appendChild(box);
}

function renderKpis() {
  const host = el("kpis");
  host.textContent = "";
  const days = (state.usage && state.usage.days) || [];
  const today = days[0] || { ok: 0, fail: 0 };
  const providers = state.providers || [];
  const active = providers.filter((p) => p.configured).length;
  const ok = today.ok || 0;
  const fail = today.fail || 0;
  const attempts = ok + fail;

  const trend = days.slice().reverse().map((day) => day.ok || 0);
  const spark = sparkline(trend);
  let sparkBox = null;
  if (spark) {
    sparkBox = node("div", "spark");
    sparkBox.style.color = "var(--accent)";
    sparkBox.appendChild(spark);
  }
  kpi(host, "Served today", String(ok), "requests answered", sparkBox);
  kpi(host, "Fell through", String(fail), "failed and re-routed");

  const rate = attempts ? ok / attempts : 0;
  const rateBox = node("div", "spark");
  rateBox.style.marginTop = "9px";
  if (attempts) rateBox.appendChild(meter(rate, rateTone(rate)));
  kpi(
    host,
    "Success rate",
    attempts ? Math.round(rate * 100) + "%" : "–",
    attempts ? ok + " of " + attempts + " attempts" : "no attempts yet",
    attempts ? rateBox : null,
  );
  kpi(host, "Providers", active + " / " + providers.length, "with a key configured");

  const live = el("live");
  live.className = "live " + (active ? "ok" : "warn");
  live.title = active ? active + " provider(s) ready" : "no provider key configured";
}

function routeStatusOf(entry) {
  if (!entry.providerKnown) return ["provider missing", "crit"];
  if (!entry.providerConfigured) return ["no key", ""];
  if (entry.zeroCost === false) return ["not free", "crit"];
  if (entry.cooldownSeconds > 0) return ["cooling " + entry.cooldownSeconds + "s", "warn"];
  return ["ready", "good"];
}

function saveRoute(entries) {
  return api("api/routes", {
    method: "POST",
    body: JSON.stringify({ route: state.route, entries }),
  });
}

async function applyRouteOrder(entries, message) {
  try {
    await saveRoute(entries);
    toast(message, "good");
    await load();
  } catch (error) {
    toast(String(error.message || error), "err");
  }
}

function renderRoutes() {
  const host = el("routes");
  host.textContent = "";
  const list = state.configuredRoute || [];
  el("routes-blurb").textContent =
    "Tried top to bottom until one answers. Reorder to change priority; changes are saved to config.json.";

  if (!list.length) {
    host.appendChild(node("div", "empty", "No models configured for this route yet."));
  } else {
    const wrap = node("div", "routes");
    const keys = () => list.map((e) => ({ provider: e.provider, model: e.model }));
    list.forEach((entry, index) => {
      const row = node("div", "route");

      const rank = node("div", "rank" + (entry.pinned ? " pin" : ""), String(index + 1));
      if (entry.pinned) rank.title = "pinned: always tried first";
      row.appendChild(rank);

      const main = node("div", "r-main");
      const id = node("div", "r-id");
      id.appendChild(node("span", "name mono", entry.model));
      main.appendChild(id);
      const meta = node("div", "r-meta");
      const status = routeStatusOf(entry);
      meta.appendChild(chip(status[0], status[1], true));
      meta.appendChild(node("span", "r-prov", entry.provider));
      main.appendChild(meta);
      row.appendChild(main);

      const right = node("div", "r-right");
      const usage = entry.usage || null;
      const limit = usage ? usage.dailyLimit : null;
      const used = usage ? usage.today.consumed : 0;
      const quota = node("div", "r-quota");
      if (limit) {
        const left = usage.remainingToday;
        quota.appendChild(node("div", "num", left + " / " + limit + " left"));
        quota.appendChild(meter(left / limit, left / limit <= 0.15 ? "crit" : "accent"));
      } else {
        quota.appendChild(node("div", "num", used ? used + " today" : "–"));
      }
      right.appendChild(quota);

      const ctl = node("div", "r-ctl");
      const up = iconButton("up", "Move up");
      up.disabled = index === 0;
      up.onclick = () => {
        const next = keys();
        const swap = next[index - 1]; next[index - 1] = next[index]; next[index] = swap;
        applyRouteOrder(next, "Moved " + entry.model + " up.");
      };
      const down = iconButton("down", "Move down");
      down.disabled = index === list.length - 1;
      down.onclick = () => {
        const next = keys();
        const swap = next[index + 1]; next[index + 1] = next[index]; next[index] = swap;
        applyRouteOrder(next, "Moved " + entry.model + " down.");
      };
      const remove = iconButton("close", "Remove from route", "btn-ghost btn-micro btn-danger");
      remove.onclick = () => {
        if (!confirm("Remove " + entry.provider + ":" + entry.model + " from the route?")) return;
        applyRouteOrder(keys().filter((_, i) => i !== index), "Removed " + entry.model + ".");
      };
      ctl.appendChild(up); ctl.appendChild(down); ctl.appendChild(remove);
      right.appendChild(ctl);
      row.appendChild(right);
      wrap.appendChild(row);
    });
    host.appendChild(wrap);
  }

  const discovered = (state.routes || []).filter((entry) => !entry.configured);
  if (discovered.length) {
    const line = node("div", "foot-note");
    line.appendChild(document.createTextNode("Discovered and ranked automatically: "));
    line.appendChild(node("span", "mono", discovered.map((e) => e.provider + ":" + e.model).join(", ")));
    host.appendChild(line);
  }
  if (state.unavailableModels && state.unavailableModels.length) {
    const line = node("div", "foot-note");
    line.appendChild(document.createTextNode("Configured but no longer offered upstream, so skipped: "));
    line.appendChild(node("span", "mono", state.unavailableModels.join(", ")));
    host.appendChild(line);
  }
  for (const entry of state.excludedByProvider || []) {
    const line = node("div", "foot-note");
    line.appendChild(node("span", "mono", entry.key));
    line.appendChild(document.createTextNode(" left out: " + entry.reason + ", so retrying cannot succeed."));
    host.appendChild(line);
  }
}

function renderProviders() {
  const host = el("providers");
  host.textContent = "";
  el("keys-blurb").textContent =
    "Saved to " + state.envFile + " with 0600 permissions and applied without a restart.";

  for (const provider of state.providers) {
    const item = node("div", "prov-item");

    const top = node("div", "prov-top");
    const id = node("div", "prov-id");
    id.appendChild(node("b", null, provider.name));
    id.appendChild(node("span", "mono", provider.keyEnv));
    top.appendChild(id);
    top.appendChild(provider.configured ? chip("active", "good") : chip("no key", ""));
    item.appendChild(top);

    const row = node("div", "prov-row");
    const field = node("input", "field");
    field.type = "password";
    field.autocomplete = "off";
    field.spellcheck = false;
    field.setAttribute("aria-label", provider.keyEnv);
    field.placeholder = provider.configured ? "Paste a new key to replace" : "Paste " + provider.keyEnv;
    const save = node("button", "btn btn-primary btn-sm", "Save");
    save.type = "button";
    const submit = async () => {
      const value = field.value.trim();
      if (!value) { toast("Paste a key first, the field is empty.", "err"); return; }
      save.disabled = true;
      try {
        await api("api/keys", {
          method: "POST",
          body: JSON.stringify({ provider: provider.name, key: value }),
        });
        field.value = "";
        toast("Saved " + provider.keyEnv + ", applied immediately.", "good");
        await load();
      } catch (error) {
        toast(String(error.message || error), "err");
        save.disabled = false;
      }
    };
    save.onclick = submit;
    field.addEventListener("keydown", (event) => { if (event.key === "Enter") submit(); });
    row.appendChild(field);
    row.appendChild(save);
    item.appendChild(row);

    const foot = node("div", "prov-foot");
    const hint = node("div", "prov-hint");
    if (provider.configured) {
      hint.appendChild(document.createTextNode("current"));
      hint.appendChild(node("span", "mono", provider.maskedKey));
    } else {
      hint.appendChild(document.createTextNode("skipped until a key is set"));
    }
    if (provider.catalogError && !provider.catalogModels) {
      hint.appendChild(chip("catalog unreachable", "crit"));
    }
    if (provider.unavailableModels && provider.unavailableModels.length) {
      hint.appendChild(chip(provider.unavailableModels.length + " withdrawn", "warn"));
    }
    foot.appendChild(hint);

    const acts = node("div", "prov-acts");
    if (provider.configured) {
      const clear = node("button", "btn btn-ghost btn-sm", "Clear");
      clear.type = "button";
      clear.title = "Delete " + provider.keyEnv + " from " + state.envFile;
      clear.onclick = async () => {
        if (!confirm("Clear " + provider.keyEnv + "?\\n\\nThe key is removed from " + state.envFile
          + " and unset in the running process. The provider stays configured.")) return;
        clear.disabled = true;
        try {
          await api("api/keys", {
            method: "POST",
            body: JSON.stringify({ provider: provider.name, key: "" }),
          });
          toast("Cleared " + provider.keyEnv + ".", "good");
          await load();
        } catch (error) {
          toast(String(error.message || error), "err");
          clear.disabled = false;
        }
      };
      acts.appendChild(clear);
    }
    if (provider.removable) {
      const del = node("button", "btn btn-ghost btn-sm btn-danger", "Delete");
      del.type = "button";
      del.title = "Remove " + provider.name + " from config.json";
      del.onclick = async () => {
        if (!confirm("Delete provider " + provider.name + "?\\n\\nIt is removed from config.json, its key is "
          + "cleared, and its models are dropped from every route.")) return;
        del.disabled = true;
        try {
          await api("api/providers", {
            method: "POST",
            body: JSON.stringify({ action: "delete", name: provider.name }),
          });
          toast("Deleted provider " + provider.name + ".", "good");
          await load();
        } catch (error) {
          toast(String(error.message || error), "err");
          del.disabled = false;
        }
      };
      acts.appendChild(del);
    }
    foot.appendChild(acts);
    item.appendChild(foot);
    host.appendChild(item);
  }
}

function renderUsage() {
  const host = el("usage");
  host.textContent = "";
  const models = (state.usage && state.usage.models) || [];
  el("usage-blurb").textContent =
    "Every upstream attempt over the last " + (state.usage.retentionDays || 7)
    + " days. Served answered the request; fell through failed and moved down the list.";
  if (!models.length) {
    host.appendChild(node("div", "empty", "No requests recorded yet. Point a client at the endpoint above."));
    return;
  }
  const peak = Math.max.apply(null, models.map((m) => m.ok || 0).concat([1]));
  const wrap = node("div", "tablewrap");
  const table = node("table");
  const head = node("thead");
  const headRow = node("tr");
  const columns = [
    ["Model", ""], ["Provider", ""], ["Served", ""],
    ["Fell through", "num"], ["Success", "num"], ["Left today", "num"],
  ];
  for (const column of columns) {
    const cell = node("th", column[1], column[0]);
    cell.scope = "col";
    headRow.appendChild(cell);
  }
  head.appendChild(headRow);
  table.appendChild(head);

  const body = node("tbody");
  for (const model of models.slice(0, 24)) {
    const row = node("tr");
    row.appendChild(node("td", "mono", model.model));
    row.appendChild(node("td", "dim", model.provider));

    const served = node("td");
    const volume = node("div", "volume");
    const track = node("span", "track");
    const fill = node("i");
    fill.style.width = Math.round(((model.ok || 0) / peak) * 100) + "%";
    track.appendChild(fill);
    volume.appendChild(track);
    volume.appendChild(node("span", "n", String(model.ok || 0)));
    served.appendChild(volume);
    row.appendChild(served);

    row.appendChild(node("td", "num dim", String(model.fail || 0)));

    const attempts = (model.ok || 0) + (model.fail || 0);
    const rate = attempts ? model.ok / attempts : 0;
    const rateCell = node("td", "num");
    const rateBox = node("div", "rate");
    if (attempts) {
      rateBox.appendChild(meter(rate, rateTone(rate)));
      rateBox.appendChild(node("span", "n", Math.round(rate * 100) + "%"));
    } else {
      rateBox.appendChild(node("span", "n", "–"));
    }
    rateCell.appendChild(rateBox);
    row.appendChild(rateCell);

    row.appendChild(node(
      "td",
      "num dim",
      model.dailyLimit != null ? model.remainingToday + " / " + model.dailyLimit : "–",
    ));
    body.appendChild(row);
  }
  table.appendChild(body);
  wrap.appendChild(table);
  host.appendChild(wrap);
}

/* Loading ------------------------------------------------------------------ */
function renderAll() {
  el("endpoint").textContent = state.endpoint;
  renderKpis();
  renderRoutes();
  renderProviders();
  renderUsage();
}

async function load() {
  state = await api("api/state");
  banner("");
  loadedAt = Date.now();
  renderAll();
}

function editingKey() {
  const active = document.activeElement;
  if (active && active.tagName === "INPUT" && active.value) return true;
  return Array.prototype.some.call(document.querySelectorAll(".prov-row input"), (i) => i.value);
}

async function refresh(silent) {
  if (editingKey()) return;
  try {
    await load();
  } catch (error) {
    if (!silent) toast(String(error.message || error), "err");
    banner("Cannot reach the gateway: " + String(error.message || error));
    el("live").className = "live bad";
  }
}

/* Wiring ------------------------------------------------------------------- */
setIcon(el("copy"), "copy");
setIcon(el("refresh"), "refresh");
paintThemeButton();

el("copy").onclick = async () => {
  const text = state ? state.endpoint : el("endpoint").textContent;
  try {
    await navigator.clipboard.writeText(text);
    toast("Endpoint copied.", "good");
  } catch (error) {
    toast("Copy failed; select the endpoint and copy manually.", "err");
  }
};
el("refresh").onclick = () => refresh(false);
el("theme").onclick = () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  paintThemeButton();
  try { localStorage.setItem("fr-theme", next); } catch (error) { /* private mode */ }
};

const addForm = el("add-provider");
const addToggle = el("add-provider-toggle");
setIcon(addToggle, "plus");
addToggle.appendChild(document.createTextNode("Add"));
addToggle.onclick = () => {
  addForm.hidden = !addForm.hidden;
  if (!addForm.hidden) el("ap-name").focus();
};
el("ap-cancel").onclick = () => { addForm.hidden = true; addForm.reset(); el("ap-pricing-wrap").hidden = true; };
el("ap-catalog").onchange = () => { el("ap-pricing-wrap").hidden = !el("ap-catalog").checked; };
addForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = el("ap-name").value.trim();
  const baseUrl = el("ap-url").value.trim();
  if (!name) { toast("Give the provider a name.", "err"); return; }
  if (!baseUrl) { toast("Base URL is required.", "err"); return; }
  const submit = el("ap-submit");
  submit.disabled = true;
  try {
    await api("api/providers", {
      method: "POST",
      body: JSON.stringify({
        action: "add",
        name,
        baseUrl,
        key: el("ap-key").value.trim(),
        catalog: el("ap-catalog").checked,
        pricing: el("ap-pricing").checked,
        freeModels: el("ap-free").value.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    toast("Added provider " + name + ".", "good");
    addForm.reset();
    addForm.hidden = true;
    el("ap-pricing-wrap").hidden = true;
    await load();
  } catch (error) {
    toast(String(error.message || error), "err");
  } finally {
    submit.disabled = false;
  }
});

setInterval(() => {
  if (!loadedAt) return;
  const seconds = Math.round((Date.now() - loadedAt) / 1000);
  const ago = seconds < 5 ? "just now" : seconds + "s ago";
  const selection = state && state.lastSelection;
  const served = selection && selection.provider
    ? selection.provider + ":" + selection.model + "  ·  "
    : "";
  el("stamp").textContent = served + "updated " + ago;
}, 1000);

setInterval(() => refresh(true), 15000);

load().catch((error) => {
  banner("Cannot reach the gateway: " + String(error.message || error));
  el("live").className = "live bad";
  toast(String(error.message || error), "err");
});
</script>
</body>
</html>
`;

export function renderPage() {
  return PAGE;
}
