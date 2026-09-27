# iOS development signing and device setup

This checklist is for the private development workflow only. It does not publish to the App Store or TestFlight, and it does not use Ad Hoc distribution.

The repository currently has no `ios/` Xcode project. Complete the one-time Xcode project-generation steps first; after the project is committed, copy the project-specific bundle identifiers, scheme names, and verified commands into `ios/README.md`.

## Prerequisites on the Mac

- macOS with Xcode 26.6 installed.
- Open Xcode once and accept the license/components prompts.
- Confirm the active developer directory:

```bash
xcode-select -p
xcodebuild -version
xcrun devicectl help
```

If the wrong Xcode is selected, choose the installed Xcode app in Xcode > Settings > Locations > Command Line Tools, or switch it explicitly:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Use the actual Xcode app path if it differs. Apple documents `xcodebuild`, `simctl`, and `devicectl` as Xcode-provided command-line tools; `xcrun devicectl help` is the source of truth for the installed command syntax.

## One-time project and signing setup in Xcode

1. Create an iOS App project in Xcode 26.6:
   - Product Name: `GermanArticle`
   - Interface: SwiftUI
   - Language: Swift
   - Save it under `ios/GermanArticle/` in this repository.
2. Add a Widget Extension target named `GermanArticleWidget`.
3. Choose stable bundle identifiers, for example:
   - App: `com.lucaspal.GermanArticle`
   - Widget: `com.lucaspal.GermanArticleWidget`
   Record the final values in `ios/README.md`; do not change them casually after device provisioning has been created.
4. For both the app and widget targets, open Signing & Capabilities:
   - Select Luca's Apple development team.
   - Enable Automatically manage signing.
   - Confirm Xcode shows no signing errors.
5. Do not add App Groups unless the implementation actually needs a shared recent-word cache. If an App Group is later added, record only its identifier and configuration—not profiles or certificates—in Git.
6. Commit the generated project files under `ios/GermanArticle/`. Never commit `.p12`, private keys, provisioning profiles, exported credentials, or local Xcode user state containing secrets.

## Pair and trust a physical iPhone

1. Connect the iPhone to the Mac with a cable.
2. Unlock it and choose **Trust** when iOS asks whether to trust the Mac. Enter the device passcode.
3. In Xcode, open Window > Devices and Simulators and wait for the device to finish preparing/pairing.
4. On the iPhone, open Settings > Privacy & Security > Developer Mode, turn it on, accept the restart, then confirm **Enable** after the restart. Enter the passcode if requested.
5. In Xcode, select the iPhone as the run destination. Resolve any “Preparing” or “unavailable” state before attempting a device build.
6. Verify from Terminal:

```bash
xcrun devicectl list devices
```

Record the observed device name, OS, and availability in the local work log or `ios/README.md`; do not commit a UDID unless the project explicitly needs it. This Linux worker cannot run the command or confirm Luca's device, so no device result is claimed here.

If the device is visible in Finder but unavailable to Xcode/devicectl, reconnect it, unlock it, confirm trust, confirm Developer Mode, and check Xcode's Devices and Simulators window before retrying. Do not run signing or device commands with `sudo` unless Apple support specifically requires it.

## Repeatable simulator checks

Run these from the repository root after the iOS implementation creates the scripts described by the plan:

```bash
bash ios/scripts/test.sh
bash ios/scripts/build-simulator.sh
xcrun simctl boot 'iPhone 17' || true
bash ios/scripts/install-simulator.sh
```

The simulator path is independent of physical-device signing and should remain the fallback when an iPhone is unavailable.

## Device build

From the repository root, use the project’s actual scheme and project path:

```bash
xcodebuild \
  -project ios/GermanArticle/GermanArticle.xcodeproj \
  -scheme GermanArticle \
  -destination 'generic/platform=iOS' \
  -configuration Debug \
  build
```

Success means the command exits 0 without code-signing or provisioning errors. The first successful build may create or update local signing assets through Xcode's automatic signing; those assets remain outside Git.

## Archive and export (development only)

Archive a device build to a local, ignored directory:

```bash
mkdir -p build/ios
xcodebuild \
  -project ios/GermanArticle/GermanArticle.xcodeproj \
  -scheme GermanArticle \
  -destination 'generic/platform=iOS' \
  -configuration Debug \
  -archivePath build/ios/GermanArticle.xcarchive \
  archive
```

If an installable package is needed, create a local `ExportOptions.plist` from the repository template (when one exists), set its signing method to the development workflow selected in Xcode, and export:

```bash
xcodebuild -exportArchive \
  -archivePath build/ios/GermanArticle.xcarchive \
  -exportOptionsPlist build/ios/ExportOptions.plist \
  -exportPath build/ios/export
```

Keep `ExportOptions.plist` out of Git if it contains team-specific or machine-specific values. Prefer Xcode-managed installation for a development build. If using `devicectl`, first inspect the installed syntax and then run the command it reports:

```bash
xcrun devicectl help
xcrun devicectl device install app --device <device-identifier> build/ios/export/GermanArticle.app
```

The exact `devicectl` install arguments must be verified on the Mac with Xcode 26.6; this worker has no Mac or device and has not executed that command. Installing the archived `.ipa` through Xcode's Devices and Simulators window is the supported GUI fallback.

## Free Personal Team limitations

A free Personal Team can be used for development on a personally owned device, but development provisioning is time-limited and may require periodic rebuilding/reinstallation. Treat any expiration or reinstall message shown by Xcode as the current source of truth. Do not add paid Ad Hoc distribution, App Store submission, TestFlight, or public hosting to this workflow.

## Verification record

Not run in this Linux workspace:

- Xcode 26.6 GUI project creation/signing.
- `xcrun devicectl list devices`.
- Physical-device build or installation.
- Archive/export against the generated Xcode project.

These checks must be recorded with actual command output after Luca runs them on the Mac. The root PWA is intentionally untouched by this task.

## Apple references

- Xcode command-line tool reference: https://developer.apple.com/documentation/xcode/xcode-command-line-tool-reference
- Configuring command-line tools: https://developer.apple.com/documentation/xcode/configuring-command-line-tools-settings
- Enabling Developer Mode: https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device
- Distributing to registered devices: https://developer.apple.com/documentation/xcode/distributing-your-app-to-registered-devices
- Managing apps on devices: https://developer.apple.com/documentation/xcode/managing-apps-on-devices
