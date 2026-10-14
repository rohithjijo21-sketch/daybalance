import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";
import { emptyState, State, validateState } from "../domain/model";
let db: SQLite.SQLiteDatabase;
async function transaction(
  fn: (tx: SQLite.SQLiteDatabase) => Promise<void>,
): Promise<void> {
  if (Platform.OS === "web") await db.withTransactionAsync(() => fn(db));
  else await db.withExclusiveTransactionAsync(fn);
}
export const migrations = [
  `
CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);
CREATE TABLE habits (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE tasks (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE categories (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE recurring (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id), payload TEXT NOT NULL);
CREATE TABLE checkins (habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE, day TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(habit_id,day));
CREATE TABLE occurrences (task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE, day TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(task_id,day));
CREATE TABLE transactions (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id), task_id TEXT REFERENCES tasks(id), task_day TEXT, recurring_id TEXT REFERENCES recurring(id), recurring_day TEXT, payload TEXT NOT NULL, UNIQUE(task_id,task_day), UNIQUE(recurring_id,recurring_day));
CREATE TABLE budgets (id TEXT PRIMARY KEY, month TEXT NOT NULL, category_id TEXT REFERENCES categories(id), payload TEXT NOT NULL);
CREATE UNIQUE INDEX budget_limit ON budgets(month,COALESCE(category_id,''));
`,
];
export async function openDatabase(): Promise<State> {
  db = await SQLite.openDatabaseAsync("daybalance.db");
  await db.execAsync("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const version = row?.user_version ?? 0;
  if (version > migrations.length)
    throw new Error(
      "Database version is newer than this app. Please update DayBalance.",
    );
  for (let i = version; i < migrations.length; i++)
    await transaction(async (tx) => {
      await tx.execAsync(migrations[i]!);
      await tx.execAsync(`PRAGMA user_version=${i + 1}`);
    });
  const setting = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM settings WHERE id=1",
  );
  if (!setting) {
    const s = emptyState();
    await persist(s);
    return s;
  }
  const state = emptyState();
  state.settings = JSON.parse(setting.payload);
  for (const table of [
    "habits",
    "tasks",
    "categories",
    "recurring",
    "checkins",
    "occurrences",
    "transactions",
    "budgets",
  ] as const) {
    const rows = await db.getAllAsync<{ payload: string }>(
      `SELECT payload FROM ${table}`,
    );
    (state[table] as unknown[]) = rows.map((r) => JSON.parse(r.payload));
  }
  return validateState(state);
}
export async function persist(s: State): Promise<void> {
  await transaction(async (tx) => {
    for (const table of [
      "transactions",
      "budgets",
      "checkins",
      "occurrences",
      "recurring",
      "habits",
      "tasks",
      "categories",
      "settings",
    ])
      await tx.runAsync(`DELETE FROM ${table}`);
    await tx.runAsync(
      "INSERT INTO settings VALUES (1,?)",
      JSON.stringify(s.settings),
    );
    for (const table of ["habits", "tasks", "categories"] as const)
      for (const r of s[table])
        await tx.runAsync(
          `INSERT INTO ${table} VALUES (?,?)`,
          r.id,
          JSON.stringify(r),
        );
    for (const r of s.recurring)
      await tx.runAsync(
        "INSERT INTO recurring VALUES (?,?,?)",
        r.id,
        r.categoryId,
        JSON.stringify(r),
      );
    for (const r of s.checkins)
      await tx.runAsync(
        "INSERT INTO checkins VALUES (?,?,?)",
        r.habitId,
        r.date,
        JSON.stringify(r),
      );
    for (const r of s.occurrences)
      await tx.runAsync(
        "INSERT INTO occurrences VALUES (?,?,?)",
        r.taskId,
        r.date,
        JSON.stringify(r),
      );
    for (const r of s.transactions)
      await tx.runAsync(
        "INSERT INTO transactions VALUES (?,?,?,?,?,?,?)",
        r.id,
        r.categoryId,
        r.taskId,
        r.taskDate,
        r.recurringId,
        r.recurringDate,
        JSON.stringify(r),
      );
    for (const r of s.budgets)
      await tx.runAsync(
        "INSERT INTO budgets VALUES (?,?,?,?)",
        r.id,
        r.month,
        r.categoryId,
        JSON.stringify(r),
      );
  });
}
