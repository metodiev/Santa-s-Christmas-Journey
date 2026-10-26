#!/usr/bin/env bash
# 4. Build the iOS game into a file that can be installed on an iPhone (.ipa).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

usage() {
  cat <<EOF
Usage: scripts/build-ios.sh [options]

Build the web bundle, sync it into the iOS project and produce a signed
.ipa at dist-native/${APP_SLUG}-<version>.ipa for installing on an iPhone.

A device build requires an Apple Developer team with an iOS development
certificate and provisioning profile. Provide the team ID with --team or
SCJ_IOS_TEAM_ID, or set DEVELOPMENT_TEAM in the Xcode project.

Options:
  --team <id>     Apple Developer team ID (or env SCJ_IOS_TEAM_ID)
  --method <m>    Export method: development (default), ad-hoc,
                  app-store-connect or enterprise
  --simulator     Only build the Simulator app (no signing required)
  -h, --help      Show this help

Without signing credentials the script still builds the Simulator app to
validate the project, then exits with code 2 and explains what is missing.
EOF
}

TEAM="${SCJ_IOS_TEAM_ID:-}"
METHOD="${SCJ_IOS_METHOD:-development}"
SIMULATOR_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --team)      [[ $# -ge 2 ]] || die "--team needs a value"; TEAM="$2"; shift 2 ;;
    --team=*)    TEAM="${1#*=}"; shift ;;
    --method)    [[ $# -ge 2 ]] || die "--method needs a value"; METHOD="$2"; shift 2 ;;
    --method=*)  METHOD="${1#*=}"; shift ;;
    --simulator) SIMULATOR_ONLY=1; shift ;;
    -h|--help)   usage; exit 0 ;;
    *) die "Unknown option: $1 (try --help)" ;;
  esac
done

case "$METHOD" in
  development|ad-hoc|app-store-connect|enterprise) ;;
  *) die "Unsupported --method: $METHOD (use development, ad-hoc, app-store-connect or enterprise)" ;;
esac

setup_xcode
ensure_ios_project
ensure_run_dir
ensure_node_modules
mkdir -p "$DIST_NATIVE"

DERIVED_SIM="$RUN_DIR/ios/simulator"
SIM_APP="$DERIVED_SIM/Build/Products/Debug-iphonesimulator/App.app"

build_simulator_app() {
  log_step "Building the iOS Simulator app"
  xcodebuild \
    -workspace "$ROOT/ios/App/App.xcworkspace" \
    -scheme App \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$DERIVED_SIM" \
    CODE_SIGNING_ALLOWED=NO \
    build
  [[ -d "$SIM_APP" ]] || die "xcodebuild succeeded but $SIM_APP is missing"
  log_ok "Simulator app built (launch it with scripts/run-ios.sh)"
}

build_web_bundle

log_step "Syncing the web build into the iOS project"
(cd "$ROOT" && npx cap sync ios)

log_step "Generating iOS icons and launch screen"
(cd "$ROOT" && npm run native:assets)

VERSION="$(pkg_version)"

if (( SIMULATOR_ONLY )); then
  build_simulator_app
  exit 0
fi

if [[ -z "$TEAM" ]]; then
  TEAM="$(sed -n 's/^[[:space:]]*DEVELOPMENT_TEAM = \(.*\);/\1/p' "$ROOT/ios/App/App.xcodeproj/project.pbxproj" | head -1)"
fi

IDENTITY_COUNT="$(security find-identity -v -p codesigning 2>/dev/null | sed -n 's/^ *\([0-9][0-9]*\) valid identities found.*/\1/p' | head -1)"
IDENTITY_COUNT="${IDENTITY_COUNT:-0}"

if [[ -z "$TEAM" || "$IDENTITY_COUNT" == "0" ]]; then
  log_warn "Cannot produce an installable .ipa on this machine yet."
  if [[ -z "$TEAM" ]]; then
    log_info "Missing: Apple Developer team ID."
    log_info "  Pass --team <TEAMID> (or SCJ_IOS_TEAM_ID), or set DEVELOPMENT_TEAM in Xcode."
  fi
  if [[ "$IDENTITY_COUNT" == "0" ]]; then
    log_info "Missing: an iOS signing identity."
    log_info "  Open Xcode → Settings → Accounts, add your Apple ID, then create a"
    log_info "  development certificate for the team (Xcode does this automatically)."
  fi
  log_info "When ready, rerun: scripts/build-ios.sh --team <TEAMID>"
  log_info "The bundle identifier is $(ios_bundle_id); it must be registered to your team."
  printf '\n'
  build_simulator_app
  exit 2
fi

log_info "Signing team $TEAM with $IDENTITY_COUNT valid identity/identities"

ARCHIVE_DIR="$RUN_DIR/ios/archive"
ARCHIVE_PATH="$ARCHIVE_DIR/$APP_SLUG.xcarchive"
EXPORT_DIR="$RUN_DIR/ios/export"
EXPORT_PLIST="$RUN_DIR/ios/ExportOptions.plist"
rm -rf "$ARCHIVE_DIR" "$EXPORT_DIR"
mkdir -p "$ARCHIVE_DIR"

log_step "Archiving the release build"
xcodebuild \
  -workspace "$ROOT/ios/App/App.xcworkspace" \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM" \
  CODE_SIGN_STYLE=Automatic \
  archive

cat >"$EXPORT_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>$METHOD</string>
  <key>teamID</key>
  <string>$TEAM</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
</dict>
</plist>
EOF

log_step "Exporting the .ipa ($METHOD)"
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -allowProvisioningUpdates

IPA_SOURCE="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' | head -1)"
[[ -n "$IPA_SOURCE" && -f "$IPA_SOURCE" ]] || die "Export finished without producing an .ipa in $EXPORT_DIR"

OUTPUT="$DIST_NATIVE/$APP_SLUG-$VERSION.ipa"
cp -f "$IPA_SOURCE" "$OUTPUT"
log_ok "Built $OUTPUT ($(du -h "$OUTPUT" | awk '{print $1}'))"

printf '\n'
log_info "Install on an iPhone:"
log_info "  • Connect the phone and use Xcode → Window → Devices and Simulators → '+'"
log_info "  • or AirDrop the .ipa to the phone and open it with Apple Configurator"
log_info "  • or: xcrun devicectl device install app --device <UDID> \"$OUTPUT\""
log_info "The device must be registered to team $TEAM and listed in the profile."
