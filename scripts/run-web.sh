#!/usr/bin/env bash
# 1. Run the web version of Santa's Christmas Journey.
#    Starts the Vite dev server in the background and opens the browser.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/run-web.sh [options]

Start the web game (Vite dev server) in the background.

Options:
  --port <n>    Port to listen on (default: ${DEFAULT_WEB_PORT}, env SCJ_WEB_PORT)
  --no-open     Do not open the browser
  -h, --help    Show this help

Stop it again with: scripts/stop-web.sh
EOF
}

PORT="$DEFAULT_WEB_PORT"
OPEN_BROWSER=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)    [[ $# -ge 2 ]] || die "--port needs a value"; PORT="$2"; shift 2 ;;
    --port=*)  PORT="${1#*=}"; shift ;;
    --no-open) OPEN_BROWSER=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

[[ "$PORT" =~ ^[0-9]+$ ]] || die "Port must be a number, got: $PORT"

require_cmd node
require_cmd npm
require_cmd curl
ensure_run_dir
ensure_node_modules
ensure_web_assets

PID_FILE="$RUN_DIR/web.pid"
LOG_FILE="$LOG_DIR/web.log"
URL="http://localhost:$PORT/"

if port_in_use "$PORT"; then
  if existing_pid="$(read_pid "$PID_FILE")" && pid_alive "$existing_pid"; then
    log_ok "Web game is already running at $URL (pid $existing_pid)"
    (( OPEN_BROWSER )) && open_url "$URL"
    exit 0
  fi
  die "Port $PORT is already in use by another process ($(port_pids "$PORT" | tr '\n' ' ')). Stop it or pass --port."
fi

log_step "Starting the web game on port $PORT"
: >"$LOG_FILE"
(
  cd "$ROOT"
  nohup npx vite --port "$PORT" --strictPort >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
)

if ! wait_for_http "$URL" "${SCJ_WEB_TIMEOUT:-180}"; then
  log_error "The dev server did not respond. Last log lines:"
  tail -n 30 "$LOG_FILE" >&2 || true
  stop_pidfile "$PID_FILE" "web dev server" 5 || true
  exit 1
fi

(( OPEN_BROWSER )) && open_url "$URL"

SERVER_PID="$(read_pid "$PID_FILE" || true)"
printf '\n'
log_ok "Santa's Christmas Journey is running at ${C_CYAN}$URL${C_RESET}"
log_info "PID:   ${SERVER_PID:-unknown}"
log_info "Log:   $LOG_FILE"
log_info "Stop:  scripts/stop-web.sh"
