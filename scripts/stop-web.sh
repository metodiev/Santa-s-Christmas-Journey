#!/usr/bin/env bash
# 2. Stop the web version started by scripts/run-web.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/stop-web.sh [options]

Stop the background Vite dev server, including anything else still listening
on the port (for example a server started with a plain "npm run dev").

Options:
  --port <n>    Port to free (default: ${DEFAULT_WEB_PORT}, env SCJ_WEB_PORT)
  -h, --help    Show this help
EOF
}

PORT="$DEFAULT_WEB_PORT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)   [[ $# -ge 2 ]] || die "--port needs a value"; PORT="$2"; shift 2 ;;
    --port=*) PORT="${1#*=}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

[[ "$PORT" =~ ^[0-9]+$ ]] || die "Port must be a number, got: $PORT"

require_cmd lsof
ensure_run_dir

PID_FILE="$RUN_DIR/web.pid"
STOPPED=0

if stop_pidfile "$PID_FILE" "web dev server"; then
  STOPPED=1
fi

LEFTOVER_PIDS="$(port_pids "$PORT")"
if [[ -n "$LEFTOVER_PIDS" ]]; then
  log_step "Freeing port $PORT"
  for pid in $LEFTOVER_PIDS; do
    log_info "Stopping pid $pid"
    kill_tree "$pid" TERM
  done
  STOPPED=1
fi

if ! wait_for_port_free "$PORT" "${SCJ_STOP_TIMEOUT:-15}"; then
  log_warn "Port $PORT is still busy, forcing shutdown"
  for pid in $(port_pids "$PORT"); do
    kill_tree "$pid" KILL
  done
  wait_for_port_free "$PORT" 5 || die "Port $PORT is still in use; stop the process manually with: lsof -i tcp:$PORT"
fi

if (( STOPPED )); then
  log_ok "Web game stopped (port $PORT is free)"
else
  log_info "No web game was running on port $PORT"
fi
