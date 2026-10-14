# DayBalance 1.0.0

First standalone Android release of DayBalance, an offline app for habits, daily plans, income, expenses, budgets, and insights.

- Warm light and dark themes with bundled DM Sans and Newsreader fonts.
- Habit tracking, recurring tasks, daily priorities, and local reminders.
- Income/expense history, monthly budgets, and charts.
- Local SQLite storage with JSON backup/restore and financial CSV export.

## Android installation

Download the attached `DayBalance.apk`, open it on your phone, and follow Android's installation prompts. Allow installation from the chosen browser if asked. Expo Go and a development computer are not required.

New installations begin empty. To move records from another installation or the browser demo, export JSON in Settings and import it on the phone.

Version: 1.0.0. Android package: `com.daybalance.app`. Version code: 1.

APK SHA-256: `8a54a8314861cc360540147295aaf3686c62ca195829b2d348b6089d5ecd07fc`.

The signed cloud build and APK archive integrity checks passed. Automated validation includes strict TypeScript, lint, 20 domain tests, and 2 SQLite integration tests. Physical-phone installation, notification delivery, native sharing, and installed-app restart still require device testing. See `VERIFICATION.md` for the device checklist.
