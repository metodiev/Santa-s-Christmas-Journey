#!/usr/bin/env bash
# 6. Stop the Android emulator.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/stop-android-emulator.sh [options]

Shut down the Android emulator started by scripts/run-android-emulator.sh.
If no emulator is connected, falls back to the stored process id.

Options:
  -h, --help   Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

setup_android_env
ensure_run_dir

PID_FILE="$RUN_DIR/android-emulator.pid"
SERIALS="$(android_emulator_serials || true)"
STOPPED=0

for serial in $SERIALS; do
  log_step "Shutting down $serial"
  adb -s "$serial" emu kill >/dev/null 2>&1 || true
  STOPPED=1
done

if (( STOPPED )); then
  log_info "Waiting for the emulator to exit…"
  DEADLINE=$((SECONDS + 30))
  while (( SECONDS < DEADLINE )); do
    REMAINING="$(android_emulator_serials || true)"
    [[ -z "$REMAINING" ]] && break
    sleep 1
  done
  if [[ -n "$(android_emulator_serials || true)" ]]; then
    log_warn "The emulator is still shutting down; forcing the process to stop"
    if stop_pidfile "$PID_FILE" "Android emulator" 5; then
      STOPPED=1
    fi
  fi
fi

if stop_pidfile "$PID_FILE" "Android emulator" 10; then
  STOPPED=1
fi

if (( STOPPED )); then
  log_ok "Android emulator stopped"
else
  log_info "No Android emulator was running"
fi
