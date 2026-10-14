# Publishing DayBalance updates

Keep application source in Git and publish APK files as GitHub Release attachments. APKs and personal database/export files are excluded from Git tracking.

## Source changes

1. Edit the app and run `pnpm typecheck`, `pnpm lint`, and `pnpm test` with Node 24 and pnpm 11.
2. Commit the changes and push to the repository.
3. Before a new Android release, update the version in `package.json` and `app.json`, and increase `expo.android.versionCode` in `app.json`.
4. Build the preview APK using the commands in [INSTALL-ANDROID.md](INSTALL-ANDROID.md).
5. Create a GitHub Release with a matching version tag, release notes, and the new APK attached as `DayBalance.apk`.

## Installed app updates

Users download and install the newer APK from Releases. Updates must keep the Android package `com.daybalance.app`, use the same Android signing key, and have a higher version code. An ordinary update preserves local app data; users should export a JSON backup before updating. Uninstalling the app removes its local data.

The original EAS project is owned by `rohith_jijo`. Keep that project and its signing credentials for official DayBalance updates. Signing credentials must never be committed to GitHub.

Forks should create their own Expo project, Android package, and signing credentials rather than attempting to use the original project's build access.

Starting in version 1.2.0, Android checks GitHub's latest published release on launch/foreground (at most once every six hours), and Settings offers a manual check. Releases must use a stable `vX.Y.Z` tag and have an uploaded asset named `DayBalance.apk`. Drafts, prereleases, unfinished uploads, and older versions are ignored. Users tap Update to open the APK download, then open it and confirm installation in Android. Older app versions require a manual installation of version1.2.0 once to acquire this feature.
