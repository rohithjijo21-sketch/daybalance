# DayBalance

A local-first Android and iOS app for habits, daily plans, income, expenses, and budgets. Built with Expo SDK 55, React Native, TypeScript, Expo Router, and SQLite. The interface uses warm cream, sand, and terracotta, with a warm brown dark theme. The design pairs bundled Newsreader headings with DM Sans body text, a floating five-tab bar, icon-led habit rows, grouped financial history, and a compact weekly planner. Secondary controls expand only when needed. The fonts load from the app bundle and work offline.

## Install and run

### Install on Android

Download `DayBalance.apk` from [GitHub Releases](https://github.com/rohithjijo21-sketch/daybalance/releases/latest), open it on your Android phone, and follow the installation prompts. It runs independently of Expo Go and your computer. New installations start empty; Settings supports full JSON backup and restore.

The current signed version is also available through [Expo](https://expo.dev/artifacts/eas/CW5VdNPIvrXANZdIkP56d3hrLhpuDxpZeLyfyX7tmRA.apk). See [Android installation and building](INSTALL-ANDROID.md) for details.

### Run from source

Install Node.js 22.13+ (Node 24 recommended for the SQLite test harness) and pnpm 11. Dependencies are locked in `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm start
```

Use a compatible Expo Go SDK 55 client, or build a native debug app. A newer Expo Go client may not support this project's SDK. Android builds require Android Studio, the Android SDK, and Java; iOS builds require macOS and Xcode.

```sh
# Build and run on a connected Android device or emulator
pnpm exec expo run:android

# Build and run on iOS (macOS only)
pnpm exec expo run:ios

# Browser demo using the same screens and actual SQLite storage
pnpm web --localhost --port 8081
```

Open `http://localhost:8081` for the browser demo. The local preview server must keep running. Browser data belongs to that browser and origin; it is separate from phone data. JSON exports move records between installations.

The browser demo supports data entry, editing, budgets, charts, JSON import/export, CSV download, and persistence. Local reminders require Android/iOS. Expo's SQLite web implementation is experimental and needs SharedArrayBuffer; `metro.config.js` supplies WASM support and COOP/COEP headers. Use one demo tab at a time. Native SQLite is the primary storage target.

## Features

- **Today:** selected day, three daily priorities, agenda, habit progress, daily money, monthly net surplus/deficit, four quick actions, and optional evening review.
- **Habits:** daily, selected weekdays, or weekly goals; yes/no or numeric progress; reminders, archive/restore, deletion, historical edits, streaks, rates, and a 28-day calendar.
- **Planner:** timed and untimed tasks, status/priority/category filters, weekly overview, overdue visibility, explicit rescheduling, daily priorities, and independently completable recurring occurrences. Editing/deleting supports one occurrence or this and future occurrences. Linked habit rows use the same check-in records.
- **Money:** income/expenses, searchable history, day/week/month/custom ranges, type/category/payment filters, transaction editing/deletion, optional task links, and recurring due items that require confirmation. Monthly recurrences clamp to the last valid day. Unconfirmed entries are excluded from totals.
- **Budgets:** separate overall and category monthly limits; expenses only; used/remaining amounts and textual 80%/100% states.
- **Insights:** habit consistency and streaks, completed/planned tasks, overdue tasks, daily and weekly trends, income/expense comparison, category spending, budgets, and a factual weekly review. Charts use stored records and provide text summaries.
- **Settings:** name, theme, display currency, week start, reminders, category creation/rename/archive, versioned JSON backup/restore, CSV export, explicit sample loading, and confirmed data deletion.

Dates are selected from a calendar with month/year navigation; budgets have a month grid. Reminder and task times use hour, minute, and AM/PM selection. Optional dates and times can be cleared, and Cancel keeps the existing value. Calendars follow the configured week start and use local dates.

Changing currency keeps the same numeric amounts and relabels them; it does not convert currencies. Supported display currencies use two decimal places: INR, USD, EUR, GBP, AUD, and CAD. Money is stored as safe integer minor units. CSV exports escape quotes and formula-like note prefixes.

## Structure

```text
app/                     Expo Router screens and five bottom tabs
src/ui/                  Reusable warm UI, record cards, expandable controls, dialogs
src/domain/model.ts      Types, Zod schemas, import validation and versioned exports
src/domain/calculations.ts  Dates, recurrence, streaks, totals and budgets
src/domain/actions.ts    Shared record mutations and duplicate prevention
src/data/database.ts     Versioned SQLite migrations and atomic persistence
src/data/store.tsx       Shared state, write lock, foreground refresh and error states
src/services/            Native reminders and native/browser file transfer
tests/                   Focused domain and real SQLite integration tests
```

SQLite stores separate related tables with stable IDs, foreign keys, and unique occurrence constraints. Calendar dates are local `YYYY-MM-DD` values; reminder timestamps are derived in the device timezone. A write commits before all screens receive the new state. A failed database transaction rolls back without publishing a partial update. Deleted task occurrences retain series anchors when needed for historical financial links.

## Calculation rules

- Only scheduled days count toward daily habit rates. Unscheduled days do not break selected-weekday streaks. An unfinished current day does not break a streak before it ends.
- Numeric progress counts when the daily target is reached. Weekly habits count completed weeks, with the configured week start; an unfinished current week is not a broken streak. Partial first weeks use the full weekly target, as explained in the interface.
- Recurring tasks are generated from a series plus per-occurrence overrides. Rescheduling preserves the original occurrence key. Future edits split a series while retaining history; the edited occurrence's financial link follows the new series.
- Recorded income minus recorded expenses is **net surplus/deficit**. It is not an account balance. Income never reduces budget spending; overall and category limits are independent.
- Repeated recurring confirmations and repeated task links are rejected by both application validation and SQL uniqueness constraints.
- Reminders request permission only when enabled. Denial leaves records usable. Changes cancel and rebuild the next seven days of reminders, capped at the nearest 60 to respect platform limits. Reopening refreshes the horizon; a week without reopening can exhaust it.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm exec expo install --check
pnpm exec expo export --platform all --output-dir dist --no-bytecode
```

The test harness mocks the Expo transport with Node's real SQLite engine. It tests the actual migrations and persistence queries, including reopen, rollback, edits, deletion, and JSON restore; it does not emulate the native Expo bridge. See `VERIFICATION.md` for results and the device checklist.

## Privacy and limits

No account, analytics, advertising, backend, bank connections, AI services, subscriptions, or social features. Exported files are only passed to the device share sheet or downloaded locally. App data is local, but not separately encrypted; exported backups are plain JSON/CSV.

Native notification delivery, OS permission prompts, device share sheets, picker accessibility, and installed-app restart need testing on physical phones or emulators. Daily charts show the last 31 days of a selected range; their summaries cover the whole range. Large datasets use atomic snapshot writes, so very large imports can take longer.

## References

Dependency compatibility was checked against the installed Expo SDK. Relevant official documentation: [Expo Router installation](https://docs.expo.dev/router/installation/), [Expo SQLite](https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/), and [Expo Notifications](https://docs.expo.dev/versions/v55.0.0/sdk/notifications/).
