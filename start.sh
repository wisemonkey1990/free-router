#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -eq 0 ]; then
  owner="$(stat -c '%U' "$DIR")"
  if [ -z "$owner" ] || [ "$owner" = "root" ]; then
    echo "refusing to start free-router as root" >&2
    exit 1
  fi
  if ! command -v runuser >/dev/null 2>&1; then
    echo "runuser is required to drop root; start as $owner instead" >&2
    exit 1
  fi
  exec runuser -u "$owner" -- "$DIR/start.sh" "$@"
fi

PID_FILE="$DIR/router.pid"

if [ -s "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "free-router already running (pid $PID)"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

# The server loads .env itself, so start.sh no longer sources these files.
# Sourcing with `set -a` would execute any command in .env on every start; the
# only value start.sh still needs is the port for the health-check URL, which
# we read without evaluating the file.
read_env_value() {
  local name="$1" file="$2"
  [ -f "$file" ] || return 0
  sed -n -E "s/^[[:space:]]*(export[[:space:]]+)?${name}[[:space:]]*=[[:space:]]*[\"']?([^\"'#]*).*/\2/p" "$file" \
    | tail -n 1
}

PORT="${FREE_ROUTER_PORT:-}"
[ -n "$PORT" ] || PORT="$(read_env_value FREE_ROUTER_PORT "$DIR/.env")"
[ -n "$PORT" ] || PORT="$(read_env_value FREE_ROUTER_PORT "${HOME}/.hermes/.env")"
PORT="${PORT:-8787}"

nohup node "$DIR/server.mjs" >>"$DIR/router.log" 2>&1 &
PID=$!
echo "$PID" >"$PID_FILE"

for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null; then
    echo "free-router started (pid $PID, user $(id -un))"
    echo "endpoint: http://127.0.0.1:${PORT}/v1"
    exit 0
  fi
  sleep 0.5
done

echo "router failed to become healthy; run: node server.mjs" >&2
exit 1
