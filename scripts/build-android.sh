#!/usr/bin/env bash
# 3. Build the Android game into an installable file (release APK by default).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/build-android.sh [options]

Build the web bundle, sync it into the native project and assemble a release
APK at dist-native/${APP_SLUG}-<version>.apk.

Signing: if android/keystore.properties exists it is used. Otherwise the APK is
signed with the local Android debug key so it can still be installed on a phone.

Options:
  --aab        Build a Play Store upload bundle (.aab) instead of an APK
  --install    Install the APK on the connected phone/emulator with adb
  -h, --help   Show this help

Requires: Node 20+, JDK 17-23 (JDK 21 recommended), Android SDK with the
platform matching compileSdkVersion, and network access for Gradle downloads.
EOF
}

FORMAT="apk"
INSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --aab)     FORMAT="aab"; shift ;;
    --apk)     FORMAT="apk"; shift ;;
    --install) INSTALL=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

require_cmd node
require_cmd npm
ensure_android_project
setup_java
setup_android_env
ensure_run_dir
ensure_node_modules
mkdir -p "$DIST_NATIVE"

build_web_bundle

log_step "Syncing the web build into the Android project"
(cd "$ROOT" && npx cap sync android)

log_step "Generating Android icons and splash screens"
(cd "$ROOT" && npm run native:assets)

VERSION="$(pkg_version)"

cd "$ROOT/android"
if [[ "$FORMAT" == "aab" ]]; then
  log_step "Assembling the release App Bundle"
  ./gradlew --console=plain bundleRelease
  SOURCE="app/build/outputs/bundle/release/app-release.aab"
  OUTPUT="$DIST_NATIVE/$APP_SLUG-$VERSION.aab"
else
  log_step "Assembling the release APK"
  ./gradlew --console=plain assembleRelease
  SOURCE="app/build/outputs/apk/release/app-release.apk"
  OUTPUT="$DIST_NATIVE/$APP_SLUG-$VERSION.apk"
fi

[[ -f "$SOURCE" ]] || die "Gradle finished without producing $SOURCE"
cp -f "$SOURCE" "$OUTPUT"
log_ok "Built $OUTPUT ($(du -h "$OUTPUT" | awk '{print $1}'))"

if [[ "$FORMAT" == "apk" ]]; then
  APKSIGNER="$(find "$ANDROID_HOME/build-tools" -maxdepth 2 -type f -name apksigner 2>/dev/null | sort -V | tail -1 || true)"
  CERTS=""
  if [[ -n "$APKSIGNER" ]]; then
    CERTS="$("$APKSIGNER" verify --print-certs "$OUTPUT" 2>/dev/null || true)"
  fi
  if [[ -n "$CERTS" ]]; then
    SIGNER="$(printf '%s\n' "$CERTS" | sed -n 's/^.* certificate DN: //p' | head -1)"
    log_ok "APK signature verified${SIGNER:+ ($SIGNER)}"
    if [[ "$SIGNER" == *"CN=Android Debug"* ]]; then
      log_warn "Signed with the debug key: fine for side-loading, not for Google Play."
      log_info "Create android/keystore.properties to sign with your release key."
    fi
  else
    log_warn "Could not verify the APK signature; install it and check on the device."
  fi
fi

printf '\n'
if (( INSTALL )); then
  if [[ "$FORMAT" == "aab" ]]; then
    log_warn "--install only applies to APKs; the .aab must be uploaded to Google Play."
  else
    SERIAL="$(android_first_device_serial)"
    [[ -n "$SERIAL" ]] || die "No Android device or emulator connected. Start one with scripts/run-android-emulator.sh"
    log_step "Installing on $SERIAL"
    adb -s "$SERIAL" install -r "$OUTPUT"
    log_ok "Installed on $SERIAL"
  fi
fi

if [[ "$FORMAT" == "apk" ]]; then
  log_info "Install on a phone:  adb install -r \"$OUTPUT\""
  log_info "Or copy the APK to the phone and open it (allow install from unknown sources)."
else
  log_info "Upload the .aab in the Google Play Console."
fi
