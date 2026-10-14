# Install DayBalance on Android

The `preview` EAS profile creates a signed, standalone APK with the JavaScript bundle included. It works without Expo Go, a development server, or a running computer. App records stay in the phone's SQLite database.

## Create the APK

Build utilities are isolated in `.build-tools` and excluded from the app upload. Sign into your Expo account using EAS CLI, then start the configured build:

```powershell
pnpm --dir .build-tools install
node .build-tools/node_modules/eas-cli/bin/run login
$env:EAS_NO_VCS = '1'
node .build-tools/node_modules/eas-cli/bin/run build --platform android --profile preview
```

`EAS_NO_VCS` is only needed while this folder is not a Git repository. EAS creates/links the cloud project on first use and generates an Android signing key when one is not configured. Keep the same cloud project and signing credentials for subsequent updates.

Node and pnpm versions are pinned in `eas.json` to match the verified local toolchain. `.easignore` excludes generated bundles, screenshots, dependencies, and local database/export files from the source upload. No phone/browser records are copied into the cloud build.

## Install on the phone

The signed Android APK (version 1.2.1, Android version code 5, package `com.daybalance.app`) is ready: [Download DayBalance](https://github.com/rohithjijo21-sketch/daybalance/releases/download/v1.2.1/DayBalance.apk). The local copy is `DayBalance.apk`; `DayBalance-install.png` contains the same download link.

[Completed build](https://expo.dev/accounts/rohith_jijo/projects/daybalance/builds/bbb13f98-11ef-4636-b4ef-36f6302a95f3), owned by `rohith_jijo`, finished on 14 October 2026 at 10:55 PM IST. APK SHA-256: `3c25901b88c9d5a9eab074182d30b2e19fdf185a2644a733d2bb7352e27e1ab7`.

For an existing installation, export a JSON backup first and install this APK over the app. The signing key and package are unchanged; uninstalling removes local records. Older versions need this manual installation once to get in-app update notices. Future Update buttons open the newer GitHub APK download, and Android requires installation confirmation.

1. Open the completed EAS build's installation link on your Android phone.
2. Download the APK and open it.
3. Follow Android's installation prompts, allowing installation from the chosen browser if required.
4. Open **DayBalance** from the phone's app drawer.

The phone begins with empty records. To move your browser demo records, export JSON in the browser's Settings, transfer that file to the phone, and import it in DayBalance's Settings after confirming replacement. CSV is for financial records only; JSON is the full backup.

Enable reminders inside the installed app when you want to test notifications. Verify the device checklist in `VERIFICATION.md` before relying on the app for daily use.

Official reference: [Expo — build and install Android APKs](https://docs.expo.dev/build-reference/apk/).

