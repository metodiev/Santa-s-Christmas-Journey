#!/usr/bin/env bash
# 7. Run the game in the iOS Simulator.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/run-ios.sh [options]

Build the web bundle, sync it into the iOS project, build the Simulator app,
install it and launch it in the iOS Simulator.

Options:
  --device <name>   Simulator device to use (default: env SCJ_IOS_DEVICE,
                    then the first booted simulator, then ${DEFAULT_IOS_DEVICE})
  --no-open         Do not bring the Simulator window to the front
  -h, --help        Show this help

Stop it again with: scripts/stop-ios.sh
List devices with: xcrun simctl list devices available
EOF
}

DEVICE="${SCJ_IOS_DEVICE:-}"
OPEN_SIMULATOR=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --device)   [[ $# -ge 2 ]] || die "--device needs a value"; DEVICE="$2"; shift 2 ;;
    --device=*) DEVICE="${1#*=}"; shift ;;
    --no-open)  OPEN_SIMULATOR=0; shift ;;
    -h|--help)  usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

setup_xcode
ensure_ios_project
ensure_run_dir
ensure_node_modules

UDID=""
BOOTED_UDIDS="$(ios_booted_udids || true)"

if [[ -n "$DEVICE" ]]; then
  UDID="$(ios_udid_for_name "$DEVICE" || true)"
  [[ -n "$UDID" ]] || {
    log_error "Simulator '$DEVICE' was not found. Available devices:"
    xcrun simctl list devices available | sed -n 's/^ *\(iPhone[^(]*[^ (]\) (.*/\1/p' | sed 's/^/    /' >&2
    exit 1
  }
elif [[ -n "$BOOTED_UDIDS" ]]; then
  UDID="$(printf '%s\n' "$BOOTED_UDIDS" | head -1)"
  log_info "Using already booted simulator $(ios_device_name "$UDID")"
else
  UDID="$(ios_udid_for_name "$DEFAULT_IOS_DEVICE" || true)"
  [[ -n "$UDID" ]] || UDID="$(ios_first_iphone_udid || true)"
  [[ -n "$UDID" ]] || die "No iOS Simulator device available. Install a runtime in Xcode → Settings → Components."
fi

DEVICE_NAME="$(ios_device_name "$UDID")"
BUNDLE_ID="$(ios_bundle_id)"

if ! printf '%s\n' "$BOOTED_UDIDS" | grep -Fxq "$UDID"; then
  log_step "Booting simulator ${DEVICE_NAME:-$UDID}"
  xcrun simctl boot "$UDID"
fi

if (( OPEN_SIMULATOR )); then
  open -a Simulator --args -CurrentDeviceUDID "$UDID" >/dev/null 2>&1 || open -a Simulator || true
fi

log_info "Waiting for the simulator to finish booting…"
xcrun simctl bootstatus "$UDID" -b >/dev/null

build_web_bundle

log_step "Syncing the web build into the iOS project"
(cd "$ROOT" && npx cap sync ios)

log_step "Building the Simulator app"
DERIVED="$RUN_DIR/ios/simulator"
xcodebuild \
  -workspace "$ROOT/ios/App/App.xcworkspace" \
  -scheme App \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination "id=$UDID" \
  -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO \
  build

APP_PATH="$DERIVED/Build/Products/Debug-iphonesimulator/App.app"
[[ -d "$APP_PATH" ]] || die "Build succeeded but $APP_PATH is missing"

log_step "Installing and launching the game"
xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"

echo "$UDID" >"$RUN_DIR/ios-simulator.udid"

printf '\n'
log_ok "Santa's Christmas Journey is running in ${DEVICE_NAME:-the simulator}"
log_info "Device: $UDID"
log_info "Stop:   scripts/stop-ios.sh"
