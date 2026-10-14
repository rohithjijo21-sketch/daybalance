import { openDatabase, persist } from "../src/data/database";
import { afterAll, describe, expect, it, vi } from "vitest";
import { DatabaseSync, SQLInputValue } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyState, parseExport, serialize } from "../src/domain/model";
import { checkHabit, saveTransaction, setTask } from "../src/domain/actions";
import {
  budgetProgress,
  habitDone,
  taskOccurrence,
  totals,
} from "../src/domain/calculations";
const harness = vi.hoisted(() => ({
  path: "",
  connections: [] as { close: () => void }[],
}));
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: async () => {
    const db = new DatabaseSync(harness.path);
    harness.connections.push(db);
    const adapter = {
      execAsync: async (sql: string) => {
        db.exec(sql);
      },
      runAsync: async (sql: string, ...params: SQLInputValue[]) =>
        db.prepare(sql).run(...params),
      getFirstAsync: async (sql: string) => db.prepare(sql).get(),
      getAllAsync: async (sql: string) => db.prepare(sql).all(),
      withExclusiveTransactionAsync: async (
        fn: (tx: unknown) => Promise<void>,
      ) => {
        db.exec("BEGIN IMMEDIATE");
        try {
          await fn(adapter);
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      },
    };
    return adapter;
  },
}));

const dir = mkdtempSync(join(tmpdir(), "daybalance-test-"));
harness.path = join(dir, "test.db");
afterAll(() => {
  harness.connections.forEach((db) => db.close());
  rmSync(dir, { recursive: true, force: true });
});
describe("SQLite end-to-end storage", () => {
  it("migrates, persists core flows across reopen, and restores an export", async () => {
    const s = await openDatabase();
    expect(s.transactions).toHaveLength(0);
    s.habits.push({
      id: "h",
      name: "Water",
      description: "",
      icon: "💧",
      color: "#21653D",
      start: "2026-01-01",
      schedule: "daily",
      weekdays: [],
      weeklyTarget: 3,
      target: 8,
      tracking: "numeric",
      reminder: null,
      archived: false,
    });
    checkHabit(s, s.habits[0]!, "2026-01-02", 8);
    checkHabit(s, s.habits[0]!, "2026-01-02", 8);
    s.tasks.push({
      id: "t",
      title: "Electricity bill",
      notes: "",
      date: "2026-01-02",
      startTime: "12:00",
      endTime: "12:30",
      priority: "high",
      category: "Bills",
      reminder: null,
      recurrence: { kind: "none", weekdays: [] },
      until: null,
    });
    setTask(s, taskOccurrence(s, s.tasks[0]!, "2026-01-02")!, {
      status: "completed",
      plannedDate: "2026-01-03",
    });
    saveTransaction(s, {
      id: "i",
      type: "income",
      amount: 100000,
      categoryId: "income-salary",
      date: "2026-01-02",
      note: "",
      method: "bank transfer",
      taskId: null,
      taskDate: null,
      recurringId: null,
      recurringDate: null,
    });
    saveTransaction(s, {
      id: "e",
      type: "expense",
      amount: 10000,
      categoryId: "expense-bills",
      date: "2026-01-03",
      note: "Paid",
      method: "UPI",
      taskId: "t",
      taskDate: "2026-01-02",
      recurringId: null,
      recurringDate: null,
    });
    s.budgets.push({
      id: "b",
      month: "2026-01",
      categoryId: null,
      amount: 20000,
    });
    await persist(s);
    const reopened = await openDatabase();
    expect(reopened).toEqual(s);
    expect(reopened.checkins).toHaveLength(1);
    expect(habitDone(reopened, reopened.habits[0]!, "2026-01-02")).toBe(true);
    expect(
      taskOccurrence(reopened, reopened.tasks[0]!, "2026-01-02"),
    ).toMatchObject({ status: "completed", plannedDate: "2026-01-03" });
    expect(totals(reopened, "2026-01-01", "2026-01-31")).toEqual({
      income: 100000,
      expenses: 10000,
      net: 90000,
    });
    expect(budgetProgress(reopened, reopened.budgets[0]!).remaining).toBe(
      10000,
    );
    reopened.transactions.find((t) => t.id === "e")!.amount = 15000;
    await persist(reopened);
    expect(
      totals(await openDatabase(), "2026-01-01", "2026-01-31").expenses,
    ).toBe(15000);
    const backup = serialize(reopened);
    await persist(emptyState());
    expect((await openDatabase()).habits).toHaveLength(0);
    await persist(parseExport(backup));
    expect(await openDatabase()).toEqual(reopened);
    reopened.transactions = reopened.transactions.filter((t) => t.id !== "e");
    await persist(reopened);
    expect(
      totals(await openDatabase(), "2026-01-01", "2026-01-31").expenses,
    ).toBe(0);
  });
  it("enforces SQL unique constraints and rolls back failed writes", async () => {
    const before = await openDatabase();
    const invalid = JSON.parse(JSON.stringify(before));
    invalid.checkins.push({ ...invalid.checkins[0] });
    await expect(persist(invalid)).rejects.toThrow();
    expect(await openDatabase()).toEqual(before);
  });
});
