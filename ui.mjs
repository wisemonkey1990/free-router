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
  --bg: #f6f7f9;
  --card: #ffffff;
  --card-2: #fafbfc;
  --line: #e2e5ea;
  --line-soft: #eef0f4;
  --text: #1c1f24;
  --muted: #5f6773;
  --faint: #8a929e;
  --accent: #0b62d6;
  --accent-strong: #0954b5;
  --accent-soft: #eaf1fd;
  --accent-ring: rgba(11, 98, 214, .18);
  --input-bg: #ffffff;
  --input-line: #ccd2db;
  --btn-bg: #ffffff;
  --btn-hover: #f3f5f8;
  --ok: #16794a;
  --ok-soft: #e6f4ec;
  --warn: #8a5b00;
  --warn-soft: #fdf2dd;
  --bad: #c22c38;
  --bad-soft: #fdeced;
  --shadow: 0 6px 24px rgba(20, 28, 40, .13);
}
:root[data-theme="dark"], :root.dark {
  color-scheme: dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #0e1116;
    --card: #161b22;
    --card-2: #1b212b;
    --line: #2b323d;
    --line-soft: #232a34;
    --text: #e7ebf0;
    --muted: #9aa4b2;
    --faint: #6e7885;
    --accent: #4c9dff;
    --accent-strong: #74b3ff;
    --accent-soft: #16273f;
    --accent-ring: rgba(76, 157, 255, .28);
    --input-bg: #0f141b;
    --input-line: #333c48;
    --btn-bg: #1b212b;
    --btn-hover: #232a34;
    --ok: #58c896;
    --ok-soft: #16321f;
    --warn: #e0b25a;
    --warn-soft: #33290f;
    --bad: #f27884;
    --bad-soft: #3a1a1f;
    --shadow: 0 10px 30px rgba(0, 0, 0, .45);
  }
}
:root[data-theme="dark"] {
  --bg: #0e1116;
  --card: #161b22;
  --card-2: #1b212b;
  --line: #2b323d;
  --line-soft: #232a34;
  --text: #e7ebf0;
  --muted: #9aa4b2;
  --faint: #6e7885;
  --accent: #4c9dff;
  --accent-strong: #74b3ff;
  --accent-soft: #16273f;
  --accent-ring: rgba(76, 157, 255, .28);
  --input-bg: #0f141b;
  --input-line: #333c48;
  --btn-bg: #1b212b;
  --btn-hover: #232a34;
  --ok: #58c896;
  --ok-soft: #16321f;
  --warn: #e0b25a;
  --warn-soft: #33290f;
  --bad: #f27884;
  --bad-soft: #3a1a1f;
  --shadow: 0 10px 30px rgba(0, 0, 0, .45);
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
[hidden] { display: none !important; }

header {
  background: var(--card);
  border-bottom: 1px solid var(--line);
  padding: 16px 28px;
  position: sticky; top: 0; z-index: 5;
}
.head-inner {
  max-width: 1040px; margin: 0 auto;
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.brand { display: flex; align-items: center; gap: 9px; }
.brand .dot {
  width: 11px; height: 11px; border-radius: 3px;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
}
h1 { font-size: 18px; font-weight: 650; margin: 0; letter-spacing: -.2px; }
.endpoint {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 6px 5px 11px; border: 1px solid var(--line); border-radius: 8px;
  background: var(--card-2); max-width: 100%;
}
.endpoint .mono { font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head-right { margin-left: auto; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.updated { font-size: 12px; color: var(--faint); }

main { max-width: 1040px; margin: 0 auto; padding: 24px 28px 40px; display: grid; gap: 22px; }

.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.tile {
  background: var(--card); border: 1px solid var(--line); border-radius: 12px;
  padding: 15px 16px;
}
.tile .k { font-size: 12px; color: var(--muted); font-weight: 550; }
.tile .v { font-size: 25px; font-weight: 660; letter-spacing: -.4px; margin-top: 5px; font-variant-numeric: tabular-nums; }
.tile .s { font-size: 12px; color: var(--faint); margin-top: 2px; }
.tile .v.good { color: var(--ok); }
.tile .v.bad { color: var(--bad); }

section { background: var(--card); border: 1px solid var(--line); border-radius: 12px; }
.sec-head { padding: 18px 22px 0; }
.sec-head h2 { font-size: 15px; font-weight: 650; margin: 0; letter-spacing: -.1px; }
.sec-head p { margin: 5px 0 0; font-size: 13px; color: var(--muted); max-width: 78ch; }
.sec-body { padding: 14px 22px 20px; }
.sec-body.flush { padding: 6px 0 8px; }

.prov {
  display: grid; grid-template-columns: minmax(160px, 210px) 1fr auto;
  gap: 18px; align-items: start;
  padding: 18px 0; border-top: 1px solid var(--line-soft);
}
.prov:first-child { border-top: 0; padding-top: 6px; }
.prov-name { font-weight: 600; padding-top: 7px; }
.prov-name span { display: block; font-weight: 400; font-size: 12px; color: var(--faint); margin-top: 2px; }
.prov-field input {
  width: 100%; padding: 9px 12px; border-radius: 8px;
  border: 1px solid var(--input-line); background: var(--input-bg); color: var(--text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px;
}
.prov-field input::placeholder { color: var(--faint); font-family: inherit; }
.prov-field input:focus {
  outline: none; border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-ring);
}
.prov-hint { margin-top: 7px; font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.prov-actions { display: flex; gap: 8px; align-items: center; padding-top: 3px; }

button {
  padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 550;
  border: 1px solid var(--input-line); background: var(--btn-bg); color: var(--text); cursor: pointer;
}
button:hover { background: var(--btn-hover); }
button:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--accent-ring); }
button.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
button.primary:hover { background: var(--accent-strong); border-color: var(--accent-strong); }
button.quiet { border-color: transparent; background: transparent; color: var(--muted); }
button.quiet:hover { background: var(--bad-soft); color: var(--bad); }
button.icon { padding: 7px 9px; line-height: 1; }
button:disabled { opacity: .55; cursor: default; }

.pill {
  display: inline-block; padding: 2px 9px; border-radius: 999px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
}
.pill.ok { color: var(--ok); background: var(--ok-soft); }
.pill.no { color: var(--muted); background: var(--line-soft); }
.pill.warn { color: var(--warn); background: var(--warn-soft); }
.pill.bad { color: var(--bad); background: var(--bad-soft); }

.tablewrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line-soft); white-space: nowrap; }
th {
  color: var(--muted); font-weight: 600; font-size: 12px;
  border-bottom: 1px solid var(--line);
}
tbody tr:last-child td { border-bottom: 0; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
td.mono { font-size: 12.5px; white-space: normal; }
td.muted { color: var(--muted); }
tbody tr:hover { background: var(--card-2); }
.bar { display: inline-block; height: 6px; border-radius: 3px; background: var(--line); min-width: 2px; vertical-align: middle; }
.bar > i { display: block; height: 100%; border-radius: 3px; background: var(--ok); }
.bar.low > i { background: var(--warn); }
.bar.none > i { background: var(--bad); }

.note { font-size: 12.5px; color: var(--muted); margin: 14px 22px 0; }
.sec-body.flush + .note { margin-top: 12px; }
.pinstar { color: var(--accent); font-weight: 700; }

#banner {
  margin: 0 0 4px; padding: 11px 15px; border-radius: 10px;
  background: var(--bad-soft); color: var(--bad); border: 1px solid transparent;
  font-size: 13px;
}
.skeleton { color: var(--faint); font-size: 13px; padding: 8px 0; }

#toast {
  position: fixed; right: 20px; bottom: 20px; padding: 12px 16px; border-radius: 9px;
  background: var(--card); border: 1px solid var(--line); color: var(--text);
  box-shadow: var(--shadow);
  max-width: 430px; font-size: 13px;
  opacity: 0; transform: translateY(8px); transition: .18s; pointer-events: none;
}
#toast.show { opacity: 1; transform: none; }
#toast.good { border-left: 3px solid var(--ok); }
#toast.err { border-left: 3px solid var(--bad); }

@media (max-width: 820px) {
  .tiles { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 760px) {
  .prov { grid-template-columns: 1fr; gap: 10px; }
  .prov-name { padding-top: 0; }
  main, header { padding-left: 18px; padding-right: 18px; }
  .head-right { width: 100%; }
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
    <div class="sec-head">
      <h2>Provider keys</h2>
      <p id="keys-blurb"></p>
    </div>
    <div class="sec-body"><div id="providers"><div class="skeleton">Loading providers&hellip;</div></div></div>
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
      const remove = document.createElement('button');
      remove.className = 'quiet';
      remove.textContent = 'Remove';
      remove.title = 'Delete ' + provider.keyEnv + ' from ' + state.envFile;
      remove.onclick = async () => {
        const message = 'Remove ' + provider.keyEnv + '?\\n\\n'
          + 'It is deleted from ' + state.envFile + ' and unset in the running process, '
          + 'so ' + provider.name + ' stops being used.';
        if (!confirm(message)) return;
        remove.disabled = true;
        try {
          await api('api/keys', {
            method: 'POST',
            body: JSON.stringify({ provider: provider.name, key: '' }),
          });
          toast('Removed ' + provider.keyEnv + '.', 'good');
          await load();
        } catch (error) {
          toast(String(error.message || error), 'err');
          remove.disabled = false;
        }
      };
      actions.appendChild(remove);
    }

    row.appendChild(name);
    row.appendChild(fieldCell);
    row.appendChild(actions);
    host.appendChild(row);
  }
  el('keys-blurb').textContent =
    'Saving writes the key to ' + state.envFile + ' with 0600 permissions and applies it to the '
    + 'running gateway right away, so there is no restart. Only these provider variables can be written.';
}

function renderRoutes() {
  const host = el('routes');
  host.textContent = '';
  el('routes-blurb').textContent =
    'Order the gateway tries models in. It stops at the first one that returns usable content. '
    + 'used and left are today (' + state.usage.today + ' ' + state.usage.timezone
    + '); rate limits and 404s are excluded, because the provider rejected those before running the model.';
  const rows = state.routes.map((entry) => {
    let status = 'ready';
    let kind = 'ok';
    if (!entry.providerConfigured) { status = 'no key'; kind = 'no'; }
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
    return [
      td(String(entry.priority), 'num'),
      td(pill(status, kind)),
      td(entry.provider, 'muted'),
      td(model, 'mono'),
      td(used || '\u2013', 'num'),
      td(left, 'num'),
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
    ],
    rows,
  ));

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

// A gentle "updated Ns ago" ticker so a stale page is obvious.
setInterval(() => {
  if (!lastLoadedAt) return;
  const secs = Math.round((Date.now() - lastLoadedAt) / 1000);
  const sel = el('updated').dataset;
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
