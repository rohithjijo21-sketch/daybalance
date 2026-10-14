# Verification — 14 October 2026

## Automated checks

Version 1.2.0 adds GitHub update discovery, a dismissible in-app update card, and Settings controls. TypeScript/lint and all30 tests pass. Four new release tests cover numeric version comparison/no downgrades, stable published APK requirements, download destination validation, and missing-release/server-error handling. Native browser download/installer confirmation still needs a phone check.

Version 1.1.0 replaces every editable date/month and reminder/task time text field with shared selection controls. TypeScript and lint pass; all 26 tests pass (20 domain, 2 SQLite, 4 calendar/time tests). Calendar tests cover leap years, week-start alignment, six-week months, year rollover, invalid dates, inclusive bounds, midnight and noon.

The live browser demo verified date selection, cancellation without changing the original value, year/month selection and 29 February 2024, budget month selection, selecting 9:30 PM, and clearing an optional time. A 360 × 780 viewport showed the calendar and its actions without clipping. Existing stored records were not changed during picker checks. Physical-device picker interaction remains untested.

| Check                                 | Result               |
| ------------------------------------- | -------------------- |
| Strict TypeScript                     | Passed               |
| ESLint with zero warnings allowed     | Passed               |
| Domain tests                          | 20 passed            |
| SQLite integration tests              | 2 passed             |
| Expo SDK dependency compatibility     | Passed               |
| Dependency peer checks                | No issues            |
| Android JavaScript bundle             | Compiled             |
| iOS JavaScript bundle                 | Compiled             |
| Browser bundle and SQLite worker/WASM | Compiled and running |

The SQLite integration test runs the application's actual SQL against Node's real SQLite engine. It covers schema migration, foreign keys, unique occurrences, transaction rollback, save/reopen, income/expense edits/deletion, linked task records, budget calculations, and export/validated restore. It does not exercise the native Expo bridge.

Domain tests cover scheduled-day streaks/rates, the unfinished-current-day exception, weekly goals and weekly streaks, numeric targets/undo, archive history, integer money parsing, independent budgets, month-end/leap-year recurrence, due-entry confirmation, duplicate recurring/task links, independent task completion/rescheduling/deletion, priority limits, future series edits, weekday starts, week-start settings, malformed imports, and CSV escaping.

## Live browser checks

- Started the real Expo app at `http://localhost:8081` using SQLite, with no records initially.
- Created a reading habit and checked it in. Today immediately showed **1 of 1 habits completed**.
- Created and prioritized a timed electricity-bill task, completed it, and used the optional expense action.
- Recorded a **₹1,200** task-linked expense and **₹25,000** income. Money and Today showed **₹23,800 net surplus**.
- Set a **₹10,000** overall budget. Progress showed **12% used** and **₹8,800 remaining**.
- Opened Insights and verified stored-data task, income/expense, category, spending, and budget summaries.
- Reloaded the application and verified that the habit, check-in, completed task, financial link, transactions, and totals persisted.
- Viewed dark and light themes; after the requested redesign, verified the warm cream/terracotta dashboard at **320 × 740** and restored the browser's normal viewport.
- Verified the appearance picker displays actual Terracotta, Caramel, Cocoa, and Clay swatches, with accessible names and a selected checkmark. No hex codes are shown as choices.

The demo records were created explicitly while demonstrating the app. Normal installations begin empty. The separate sample-data action requires confirmation.

## Premium design pass

Updated all screens with bundled DM Sans/Newsreader typography, serif display headings, a floating navigation bar, overview cards, icon-led habit rows, grouped financial transactions, a weekly date strip, and grouped Settings sections. Existing records and domain calculations are retained. Native keyboard behavior and native font rendering still require the device checks below.

## Still requiring an Android/iOS device

The signed standalone Android APK completed successfully on Expo EAS on 14 October 2026 (build `31686354-57dc-4fd6-8217-423bb2927680`). The downloaded 100,531,985-byte archive passed ZIP integrity checks and contains the Android manifest, compiled classes, and embedded JavaScript bundle. Physical phone installation remains untested. The cloud dependency doctor passed 19/20 checks with a build-tool placement warning; EAS CLI was subsequently isolated in `.build-tools` for future builds. A local doctor rerun was limited by this host's missing npm/Git tooling.

No Android SDK/emulator, connected phone, or iOS simulator was available on this Windows host. Native installation, installed-app restart, actual notification delivery/cancellation/permission denial, share sheets/document picker, OS keyboard avoidance, and device accessibility need a device pass. Browser reload and the SQL reopen tests verify persistence but are not a substitute for an installed-app restart.

JSON validation and successful restore are verified in the database integration test. Native JSON/CSV share and file-picker interactions have not been manually exercised.

## Device checklist

1. Create a habit, check in, undo, and edit a previous day; confirm Today and Planner update.
2. Create a timed task, complete it, reopen/reschedule it, and move unfinished tasks; confirm overdue visibility.
3. Record income and an expense, edit/delete them, and verify totals and budgets.
4. Complete a linked habit in Planner and confirm there is one check-in record.
5. Complete a task, record an optional linked expense, and confirm repeated links are rejected.
6. Enable a reminder, test permission denial/grant, then edit/delete the record and verify notification changes.
7. Force-close/reopen and confirm records persist.
8. Export JSON and CSV, import the JSON after confirmation, and verify the restored records and preferences.

Reminders have a seven-day rolling horizon and a nearest-60 cap; reopening refreshes the schedule. Browser notifications are intentionally unavailable. Large datasets use atomic snapshot writes, and charts limit plotted daily bars to the last 31 days of the selected period.
