#!/usr/bin/env bash
# 8. Stop the iOS Simulator.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/stop-ios.sh [options]

Shut down the iOS Simulator device started by scripts/run-ios.sh.

Options:
  --all        Shut down every booted simulator, not just the saved one
  --quit       Also quit the Simulator.app window
  -h, --help   Show this help
EOF
}

ALL=0
QUIT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)     ALL=1; shift ;;
    --quit)    QUIT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

setup_xcode
ensure_run_dir

SAVED_FILE="$RUN_DIR/ios-simulator.udid"
SAVED_UDID=""
[[ -f "$SAVED_FILE" ]] && SAVED_UDID="$(tr -dc '0-9A-Fa-f-' <"$SAVED_FILE")"

BOOTED="$(ios_booted_udids || true)"
TARGETS=""

if (( ALL )); then
  TARGETS="$BOOTED"
elif [[ -n "$SAVED_UDID" ]] && printf '%s\n' "$BOOTED" | grep -Fxq "$SAVED_UDID"; then
  TARGETS="$SAVED_UDID"
else
  TARGETS="$BOOTED"
fi

STOPPED=0
for udid in $TARGETS; do
  NAME="$(ios_device_name "$udid")"
  log_step "Shutting down ${NAME:-$udid}"
  if xcrun simctl shutdown "$udid" >/dev/null 2>&1; then
    STOPPED=1
  else
    log_warn "Could not shut down $udid (it may already be off)"
  fi
done

rm -f "$SAVED_FILE"

if (( QUIT )); then
  if osascript -e 'tell application "Simulator" to quit' >/dev/null 2>&1; then
    log_ok "Simulator app closed"
  fi
fi

if (( STOPPED )); then
  log_ok "iOS Simulator stopped"
else
  log_info "No booted iOS Simulator was found"
fi
