# Developer shell scripts

Convenience wrappers around the npm/Gradle/Xcode tooling. Every script prints
`--help`, validates its tools, and reports what it changed.

All paths are relative to the repository root, so they can be run from anywhere:

```bash
scripts/run-web.sh
scripts/build-android.sh --install
```

Runtime state lives in `.run/` (PID files, logs, temporary Xcode output) and
finished installables land in `dist-native/`. Both folders are gitignored.

## 1. Run the web game — `run-web.sh`

Starts the Vite dev server in the background, waits until it answers, and opens
the browser.

```bash
scripts/run-web.sh                 # http://localhost:5173
scripts/run-web.sh --port 8080     # custom port
scripts/run-web.sh --no-open       # do not open a browser
```

- Installs npm dependencies and generates art assets on first use.
- Refuses to start if the port is taken by something else.
- Log: `.run/logs/web.log`, PID: `.run/web.pid`.

## 2. Stop the web game — `stop-web.sh`

```bash
scripts/stop-web.sh                # stop the default port
scripts/stop-web.sh --port 8080
```

Stops the recorded process tree, then frees anything else still listening on the
port (for example a server started with `npm run dev`). Safe to run twice.

## 3. Build an installable Android file — `build-android.sh`

Builds the web bundle, syncs it into the Capacitor project and assembles a
**release APK**:

```
dist-native/Santa-Christmas-Journey-<version>.apk
```

```bash
scripts/build-android.sh              # release APK
scripts/build-android.sh --install    # APK + adb install on the connected device
scripts/build-android.sh --aab        # Play Store upload bundle instead
```

Signing:

- With `android/keystore.properties` present, the APK/AAB is signed with that
  release key (see the main README for the keystore setup).
- Without it, the release build is signed with the local Android **debug** key so
  it remains installable for side-loading and device testing. The script warns
  about this; such a build cannot be uploaded to Google Play.

Requirements: JDK 17–23 (JDK 21 recommended), Android SDK, and the platform
matching `compileSdkVersion`. The script picks a compatible JDK automatically and
writes `android/local.properties`.

Install on a phone by copying the APK over and opening it (allowing installs from
unknown sources), or with `adb install -r <file>`.

## 4. Build an installable iOS file — `build-ios.sh`

Builds the web bundle, syncs it into the Capacitor project, archives and exports
a signed `.ipa`:

```
dist-native/Santa-Christmas-Journey-<version>.ipa
```

```bash
scripts/build-ios.sh --team ABCDE12345                 # development .ipa
scripts/build-ios.sh --team ABCDE12345 --method ad-hoc
scripts/build-ios.sh --simulator                       # no signing needed
```

Requirements: macOS with Xcode, an Apple Developer team, a valid iOS signing
identity and a registered bundle identifier.

- Without a team or a signing identity the script explains exactly what is
  missing, still builds the Simulator app to validate the project, and exits with
  code **2**.
- `--method` accepts `development` (default), `ad-hoc`, `app-store-connect` and
  `enterprise`.
- The archive is created under `.run/ios/`; only the exported `.ipa` is kept in
  `dist-native/`.

## 5. Run the Android emulator — `run-android-emulator.sh`

Boots an AVD in the background and waits until Android reports
`sys.boot_completed`.

```bash
scripts/run-android-emulator.sh                    # first available AVD
scripts/run-android-emulator.sh --avd Pixel_10
scripts/run-android-emulator.sh --avd Pixel_10 --cold
```

- Reuses an emulator that is already running with the same AVD.
- Skips the boot animation; `--cold` ignores the saved snapshot.
- Boot timeout: 300 s (`--timeout`, or `SCJ_EMULATOR_TIMEOUT`).
- Log: `.run/logs/android-emulator.log`, PID: `.run/android-emulator.pid`.

Create an AVD in Android Studio → Device Manager if none exists.

## 6. Stop the Android emulator — `stop-android-emulator.sh`

```bash
scripts/stop-android-emulator.sh
```

Gracefully shuts the emulator down via `adb emu kill`, waits for it to disappear,
then falls back to the recorded process id if needed. Safe to run twice.

## 7. Run the game on iOS — `run-ios.sh`

Builds the web bundle, syncs iOS, builds the Simulator app, installs and launches
it in the iOS Simulator.

```bash
scripts/run-ios.sh                          # booted device, else iPhone 17 Pro
scripts/run-ios.sh --device "iPhone Air"
scripts/run-ios.sh --no-open                # keep the Simulator window in place
```

- Lists the available devices when the requested one does not exist.
- Waits for the simulator to finish booting before installing.
- Remembers the used device in `.run/ios-simulator.udid` for `stop-ios.sh`.

## 8. Stop the iOS Simulator — `stop-ios.sh`

```bash
scripts/stop-ios.sh                 # the device used by run-ios.sh
scripts/stop-ios.sh --all           # every booted simulator
scripts/stop-ios.sh --quit          # also close Simulator.app
```

## Environment overrides

| Variable | Used by | Meaning |
| --- | --- | --- |
| `SCJ_WEB_PORT` | run/stop web | Default port (5173) |
| `SCJ_WEB_TIMEOUT` | run-web | Seconds to wait for the dev server (180) |
| `SCJ_STOP_TIMEOUT` | stop-web | Seconds before forcing shutdown (15) |
| `SCJ_JAVA_HOME` | Android scripts | Explicit JDK 17–23 home |
| `SCJ_ANDROID_SDK` | Android scripts | Android SDK path |
| `SCJ_ANDROID_AVD` | run Android emulator | Default AVD name |
| `SCJ_EMULATOR_TIMEOUT` | run Android emulator | Boot timeout in seconds (300) |
| `SCJ_IOS_DEVICE` | run-ios | Default simulator name |
| `SCJ_IOS_TEAM_ID` | build-ios | Apple Developer team ID |
| `SCJ_IOS_METHOD` | build-ios | Export method (development) |
| `SCJ_IOS_BUNDLE_ID` | run/build iOS | Override the bundle identifier |
| `NO_COLOR` | all | Disable coloured output |

## Troubleshooting

- **`Unsupported class file major version`** — Gradle is running on a JDK newer
  than 23. The scripts pick JDK 21 automatically when it is installed; otherwise
  install it or set `SCJ_JAVA_HOME`.
- **No AVDs found** — create one in Android Studio → Device Manager, or set
  `SCJ_ANDROID_AVD` to an existing AVD name (`emulator -list-avds`).
- **`The emulator process exited during startup`** — read
  `.run/logs/android-emulator.log`; usually a missing system image or a
  virtualisation/GPU problem. Try `--cold`.
- **iOS `.ipa` not produced** — run `scripts/build-ios.sh` once to see which
  signing piece is missing, add your Apple ID in Xcode → Settings → Accounts,
  then pass `--team`.
- **Port stays busy** — `stop-web.sh` force-kills the listener after the timeout;
  `lsof -i tcp:5173` shows what is left.
