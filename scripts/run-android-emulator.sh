#!/usr/bin/env bash
# 5. Start an Android emulator and wait until the device is ready.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/run-android-emulator.sh [options]

Boot an Android Virtual Device in the background and wait for it to finish
booting. Reuses an already running emulator when possible.

Options:
  --avd <name>       AVD to start (default: env SCJ_ANDROID_AVD, then the
                     first available AVD)
  --cold             Ignore the saved snapshot and cold boot
  --timeout <secs>   Boot timeout (default: 300, env SCJ_EMULATOR_TIMEOUT)
  -h, --help         Show this help

Stop it again with: scripts/stop-android-emulator.sh
Create an AVD in Android Studio (Device Manager) or with avdmanager.
EOF
}

AVD="$DEFAULT_AVD"
AVD_REQUESTED=0
COLD=0
TIMEOUT="${SCJ_EMULATOR_TIMEOUT:-300}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --avd)     [[ $# -ge 2 ]] || die "--avd needs a value"; AVD="$2"; AVD_REQUESTED=1; shift 2 ;;
    --avd=*)   AVD="${1#*=}"; AVD_REQUESTED=1; shift ;;
    --cold)    COLD=1; shift ;;
    --timeout) [[ $# -ge 2 ]] || die "--timeout needs a value"; TIMEOUT="$2"; shift 2 ;;
    --timeout=*) TIMEOUT="${1#*=}"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

[[ "$TIMEOUT" =~ ^[0-9]+$ ]] || die "--timeout must be a number of seconds"

setup_android_env
ensure_run_dir

EMULATOR_BIN="$ANDROID_HOME/emulator/emulator"
[[ -x "$EMULATOR_BIN" ]] || die "Android emulator binary not found at $EMULATOR_BIN"
require_cmd adb

if [[ -z "$AVD" ]]; then
  AVD="$("$EMULATOR_BIN" -list-avds 2>/dev/null | head -1 || true)"
fi
[[ -n "$AVD" ]] || die "No AVD found. Create one in Android Studio → Device Manager, or set SCJ_ANDROID_AVD."

AVAILABLE_AVDS="$("$EMULATOR_BIN" -list-avds 2>/dev/null || true)"
if ! printf '%s\n' "$AVAILABLE_AVDS" | grep -Fxq "$AVD"; then
  log_error "AVD '$AVD' does not exist."
  log_info "Available AVDs:"
  printf '%s\n' "$AVAILABLE_AVDS" | sed 's/^/    /' >&2
  exit 1
fi

for serial in $(android_emulator_serials); do
  running_avd="$(adb -s "$serial" emu avd name 2>/dev/null | tr -d '\r' | head -1 || true)"
  if [[ "$running_avd" == "$AVD" ]]; then
    log_ok "Emulator '$AVD' is already running ($serial)"
    exit 0
  fi
done

if (( AVD_REQUESTED == 0 )); then
  for serial in $(android_emulator_serials); do
    log_ok "An Android emulator is already running ($serial), reusing it"
    exit 0
  done
fi

PID_FILE="$RUN_DIR/android-emulator.pid"
LOG_FILE="$LOG_DIR/android-emulator.log"
BEFORE_SERIALS="$(android_emulator_serials || true)"

EMULATOR_ARGS=(-avd "$AVD" -netdelay none -netspeed full -no-boot-anim)
(( COLD )) && EMULATOR_ARGS+=(-no-snapshot-load)

log_step "Starting Android emulator '$AVD'"
log_info "Command: emulator ${EMULATOR_ARGS[*]}"
: >"$LOG_FILE"
(
  nohup "$EMULATOR_BIN" "${EMULATOR_ARGS[@]}" >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
)

EMULATOR_PID="$(read_pid "$PID_FILE" || true)"

log_info "Waiting for the emulator to boot (up to ${TIMEOUT}s)…"
DEADLINE=$((SECONDS + TIMEOUT))
SERIAL=""
while (( SECONDS < DEADLINE )); do
  if [[ -n "$EMULATOR_PID" ]] && ! pid_alive "$EMULATOR_PID"; then
    log_error "The emulator process exited during startup. Last log lines:"
    tail -n 30 "$LOG_FILE" >&2 || true
    rm -f "$PID_FILE"
    exit 1
  fi
  for candidate in $(android_emulator_serials); do
    if ! printf '%s\n' "$BEFORE_SERIALS" | grep -Fxq "$candidate"; then
      SERIAL="$candidate"
      break
    fi
  done
  [[ -n "$SERIAL" ]] && break
  sleep 2
done

if [[ -z "$SERIAL" ]]; then
  log_error "No emulator device appeared within ${TIMEOUT}s. Last log lines:"
  tail -n 30 "$LOG_FILE" >&2 || true
  stop_pidfile "$PID_FILE" "Android emulator" 5 || true
  exit 1
fi

log_info "Device $SERIAL connected, waiting for Android to finish booting…"
BOOTED=0
while (( SECONDS < DEADLINE )); do
  BOOT_COMPLETED="$(adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  if [[ "$BOOT_COMPLETED" == "1" ]]; then
    BOOTED=1
    break
  fi
  sleep 2
done

if (( BOOTED == 0 )); then
  log_error "Android did not finish booting within ${TIMEOUT}s."
  tail -n 30 "$LOG_FILE" >&2 || true
  exit 1
fi

adb -s "$SERIAL" shell input keyevent 82 >/dev/null 2>&1 || true
log_ok "Android emulator '$AVD' is ready ($SERIAL)"
log_info "Install the game: scripts/build-android.sh --install"
log_info "Stop the emulator: scripts/stop-android-emulator.sh"
