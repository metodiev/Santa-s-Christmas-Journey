#!/usr/bin/env bash
# Shared helpers for the Santa's Christmas Journey developer scripts.
# Sourced by every scripts/*.sh entrypoint; never executed on its own.
# shellcheck disable=SC2034  # constants are consumed by the sourcing scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUN_DIR="$ROOT/.run"
LOG_DIR="$RUN_DIR/logs"
DIST_NATIVE="$ROOT/dist-native"
APP_SLUG="Santa-Christmas-Journey"
APP_BUNDLE_ID="com.christmasjourney.santa"
DEFAULT_WEB_PORT="${SCJ_WEB_PORT:-5173}"
DEFAULT_AVD="${SCJ_ANDROID_AVD:-}"
DEFAULT_IOS_DEVICE="${SCJ_IOS_DEVICE:-iPhone 17 Pro}"

if [[ -t 1 ]] && [[ "${NO_COLOR:-}" == "" ]]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_RED=$'\033[31m'
  C_GREEN=$'\033[32m'
  C_YELLOW=$'\033[33m'
  C_BLUE=$'\033[34m'
  C_CYAN=$'\033[36m'
else
  C_RESET="" C_BOLD="" C_DIM="" C_RED="" C_GREEN="" C_YELLOW="" C_BLUE="" C_CYAN=""
fi

log_step() { printf '%s==>%s %s\n' "$C_BLUE$C_BOLD" "$C_RESET" "$*"; }
log_info() { printf '    %s\n' "$*"; }
log_ok() { printf '%s  ✓%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
log_warn() { printf '%s  !%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
log_error() { printf '%s  ✗%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
die() { log_error "$*"; exit 1; }
log_dim() { printf '%s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }

require_cmd() {
  local cmd="$1" hint="${2:-}"
  command -v "$cmd" >/dev/null 2>&1 || die "Missing required command: $cmd${hint:+ ($hint)}"
}

require_macos() {
  [[ "$(uname -s)" == "Darwin" ]] || die "This script requires macOS."
}

ensure_run_dir() {
  mkdir -p "$LOG_DIR"
}

pkg_version() {
  (cd "$ROOT" && node -p "require('./package.json').version")
}

ensure_node_modules() {
  if [[ ! -d "$ROOT/node_modules" ]]; then
    log_step "Installing npm dependencies"
    (cd "$ROOT" && npm install)
  fi
}

ensure_web_assets() {
  if [[ ! -f "$ROOT/public/assets/generated/manifest.json" ]]; then
    log_step "Generating art and audio assets (first run)"
    (cd "$ROOT" && npm run assets)
  fi
}

build_web_bundle() {
  log_step "Building the web bundle"
  (cd "$ROOT" && npm run build)
}

# ---------------------------------------------------------------------------
# Process helpers
# ---------------------------------------------------------------------------

pid_alive() {
  local pid="${1:-}"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

read_pid() {
  local file="$1" pid
  [[ -f "$file" ]] || return 1
  pid="$(tr -dc '0-9' <"$file")"
  [[ -n "$pid" ]] || return 1
  printf '%s' "$pid"
}

kill_tree() {
  local pid="$1" signal="${2:-TERM}" child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child" "$signal"
  done
  kill -"$signal" "$pid" 2>/dev/null || true
}

# stop_pidfile <pidfile> <label> [timeout-seconds]
stop_pidfile() {
  local pidfile="$1" label="$2" timeout="${3:-15}"
  local pid waited=0
  if ! pid="$(read_pid "$pidfile")" || ! pid_alive "$pid"; then
    rm -f "$pidfile"
    return 1
  fi
  log_step "Stopping $label (pid $pid)"
  kill_tree "$pid" TERM
  while pid_alive "$pid" && (( waited < timeout * 4 )); do
    sleep 0.25
    waited=$((waited + 1))
  done
  if pid_alive "$pid"; then
    log_warn "$label did not exit after ${timeout}s, forcing shutdown"
    kill_tree "$pid" KILL
    sleep 0.5
  fi
  rm -f "$pidfile"
  return 0
}

port_pids() {
  local port="$1"
  lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true
}

port_in_use() {
  local port="$1"
  [[ -n "$(port_pids "$port")" ]]
}

wait_for_http() {
  local url="$1" timeout="${2:-180}" waited=0
  while (( waited < timeout )); do
    if curl -fsS -o /dev/null --max-time 2 "$url" 2>/dev/null; then
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  return 1
}

wait_for_port_free() {
  local port="$1" timeout="${2:-20}" waited=0
  while port_in_use "$port" && (( waited < timeout * 2 )); do
    sleep 0.5
    waited=$((waited + 1))
  done
  ! port_in_use "$port"
}

open_url() {
  local url="$1"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    open "$url"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 &
  elif command -v wslview >/dev/null 2>&1; then
    wslview "$url"
  else
    log_warn "Could not detect a browser launcher; open $url manually"
  fi
}

# ---------------------------------------------------------------------------
# Java / Android helpers
# ---------------------------------------------------------------------------

java_major() {
  local home="$1" version
  [[ -x "$home/bin/java" ]] || return 1
  if [[ -f "$home/release" ]]; then
    version="$(sed -n 's/^JAVA_VERSION="\(.*\)"/\1/p' "$home/release" | head -1)"
    if [[ -n "$version" ]]; then
      version="${version%%[!0-9.]*}"
      printf '%s' "${version%%.*}"
      return 0
    fi
  fi
  "$home/bin/java" -version 2>&1 | sed -n 's/.*version "\([0-9]*\).*/\1/p' | head -1
}

# Gradle 8.11 / AGP 8.10 need JDK 17-23; a plain `java` is often newer and fails.
pick_java_home() {
  local candidate major candidates=()
  [[ -n "${SCJ_JAVA_HOME:-}" ]] && candidates+=("$SCJ_JAVA_HOME")
  [[ -n "${JAVA_HOME:-}" ]] && candidates+=("$JAVA_HOME")
  if [[ "$(uname -s)" == "Darwin" ]]; then
    for version in 21 17 23 22 20; do
      candidate="$(/usr/libexec/java_home -v "$version" 2>/dev/null || true)"
      [[ -n "$candidate" ]] && candidates+=("$candidate")
    done
  fi
  for candidate in /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
                   /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
                   /Library/Java/JavaVirtualMachines/*/Contents/Home; do
    [[ -d "$candidate" ]] && candidates+=("$candidate")
  done
  for candidate in "${candidates[@]}"; do
    [[ -n "$candidate" ]] || continue
    major="$(java_major "$candidate" || true)"
    if [[ -n "$major" ]] && (( major >= 17 && major <= 23 )); then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

setup_java() {
  local home
  if ! home="$(pick_java_home)"; then
    die "No compatible JDK found. Install JDK 21 (Gradle 8.11 / AGP 8.10 reject newer JDKs) and retry."
  fi
  export JAVA_HOME="$home"
  export PATH="$JAVA_HOME/bin:$PATH"
  log_info "JDK $(java_major "$JAVA_HOME") at $JAVA_HOME"
}

android_sdk() {
  local candidate
  for candidate in "${SCJ_ANDROID_SDK:-}" "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" \
                   "$HOME/Library/Android/sdk" "/opt/android-sdk" "$HOME/Android/Sdk"; do
    [[ -n "$candidate" ]] || continue
    if [[ -x "$candidate/platform-tools/adb" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done
  return 1
}

setup_android_env() {
  local sdk
  if ! sdk="$(android_sdk)"; then
    die "Android SDK not found. Install Android Studio or set ANDROID_HOME to your SDK path."
  fi
  export ANDROID_HOME="$sdk"
  export ANDROID_SDK_ROOT="$sdk"
  export PATH="$sdk/platform-tools:$sdk/emulator:$sdk/cmdline-tools/latest/bin:$PATH"
  printf 'sdk.dir=%s\n' "$sdk" >"$ROOT/android/local.properties"
  log_info "Android SDK at $sdk"
}

ensure_android_project() {
  [[ -d "$ROOT/android" ]] || die "android/ is missing. Run: npx cap add android && npm run native:assets"
}

ensure_ios_project() {
  [[ -d "$ROOT/ios/App" ]] || die "ios/ is missing. Run: npx cap add ios && npm run native:assets"
}

# ---------------------------------------------------------------------------
# iOS simulator helpers
# ---------------------------------------------------------------------------

setup_xcode() {
  require_macos
  require_cmd xcrun "install Xcode and run: sudo xcode-select -s /Applications/Xcode.app"
  require_cmd xcodebuild
  xcodebuild -version >/dev/null 2>&1 || die "xcodebuild is not usable. Check xcode-select and the Xcode licence."
}

ios_bundle_id() {
  local id
  id="$(sed -n 's/^[[:space:]]*PRODUCT_BUNDLE_IDENTIFIER = \(.*\);/\1/p' "$ROOT/ios/App/App.xcodeproj/project.pbxproj" | head -1)"
  printf '%s' "${SCJ_IOS_BUNDLE_ID:-${id:-$APP_BUNDLE_ID}}"
}

ios_udid_for_name() {
  local name="$1"
  xcrun simctl list devices available | awk -v want="$name" '
    index($0, want " (") {
      if (match($0, /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/)) {
        print substr($0, RSTART, RLENGTH)
        exit
      }
    }'
}

ios_first_iphone_udid() {
  xcrun simctl list devices available | awk '
    /iPhone/ && /Shutdown|Booted/ {
      if (match($0, /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/)) {
        print substr($0, RSTART, RLENGTH)
        exit
      }
    }'
}

ios_booted_udids() {
  xcrun simctl list devices booted | awk '
    /\(Booted\)/ {
      if (match($0, /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/)) {
        print substr($0, RSTART, RLENGTH)
      }
    }'
}

ios_device_name() {
  local udid="$1"
  xcrun simctl list devices | awk -v id="$udid" '
    index($0, id) {
      sub(/^[[:space:]]+/, "")
      sub(/ \([0-9A-F-]{36}\)/, "")
      sub(/ \((Booted|Shutdown)\)[[:space:]]*$/, "")
      print
      exit
    }'
}

android_emulator_serials() {
  adb devices 2>/dev/null | awk '/^emulator-[0-9]+[[:space:]]+device/ { print $1 }'
}

android_first_device_serial() {
  adb devices 2>/dev/null | awk '/^[^[:space:]]+[[:space:]]+device$/ && $1 != "" { print $1; exit }'
}
