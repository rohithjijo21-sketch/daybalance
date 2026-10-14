import { describe, expect, it } from "vitest";
import {
  checkHabit,
  deleteTask,
  reduceState,
  saveTransaction,
  saveTask,
  setTask,
} from "../src/domain/actions";
import {
  addDays,
  budgetProgress,
  csv,
  dueItems,
  habitDone,
  habitStats,
  occurs,
  parseAmount,
  taskItems,
  taskOccurrence,
  totals,
  weekStart,
} from "../src/domain/calculations";
import {
  emptyState,
  Habit,
  parseExport,
  serialize,
  Task,
  Transaction,
  validateState,
} from "../src/domain/model";

const habit = (patch: Partial<Habit> = {}): Habit => ({
  id: "h",
  name: "Walk",
  description: "",
  icon: "🌱",
  color: "#21653D",
  start: "2026-01-01",
  schedule: "daily",
  weekdays: [],
  weeklyTarget: 3,
  target: 1,
  tracking: "boolean",
  reminder: null,
  archived: false,
  ...patch,
});
const task = (patch: Partial<Task> = {}): Task => ({
  id: "t",
  title: "Pay bill",
  notes: "",
  date: "2026-01-01",
  startTime: null,
  endTime: null,
  priority: "high",
  category: "Home",
  reminder: null,
  recurrence: { kind: "daily", weekdays: [] },
  until: null,
  ...patch,
});
const tx = (patch: Partial<Transaction> = {}): Transaction => ({
  id: "tx",
  type: "expense",
  amount: 10000,
  categoryId: "expense-bills",
  date: "2026-01-03",
  note: "",
  method: "UPI",
  taskId: null,
  taskDate: null,
  recurringId: null,
  recurringDate: null,
  ...patch,
});
function withHabit(h: Habit) {
  const s = emptyState();
  s.habits = [h];
  return s;
}
describe("habit schedules and streaks", () => {
  it("does not break current streak until today ends", () => {
    const h = habit();
    const s = withHabit(h);
    ["2026-01-01", "2026-01-02"].forEach((date) => checkHabit(s, h, date));
    expect(habitStats(s, h, "2026-01-03")).toMatchObject({
      current: 2,
      longest: 2,
      completed: 2,
      planned: 3,
    });
    expect(habitStats(s, h, "2026-01-04").current).toBe(0);
  });
  it("ignores unscheduled weekends and measures only scheduled days", () => {
    const h = habit({
      start: "2026-01-02",
      schedule: "weekdays",
      weekdays: [1, 2, 3, 4, 5],
    });
    const s = withHabit(h);
    ["2026-01-02", "2026-01-05"].forEach((d) => checkHabit(s, h, d));
    expect(habitStats(s, h, "2026-01-05")).toMatchObject({
      current: 2,
      planned: 2,
      rate: 1,
    });
  });
  it("numeric habits complete only at their target and support undo", () => {
    const h = habit({ tracking: "numeric", target: 8 });
    const s = withHabit(h);
    checkHabit(s, h, "2026-01-01", 7);
    expect(habitDone(s, h, "2026-01-01")).toBe(false);
    checkHabit(s, h, "2026-01-01", 8);
    expect(habitDone(s, h, "2026-01-01")).toBe(true);
    expect(s.checkins).toHaveLength(1);
    checkHabit(s, h, "2026-01-01", 0);
    expect(s.checkins).toHaveLength(0);
  });
  it("uses weekly goal completion and keeps unfinished current week alive", () => {
    const h = habit({
      start: "2026-01-05",
      schedule: "weekly",
      weeklyTarget: 3,
    });
    const s = withHabit(h);
    ["2026-01-05", "2026-01-06", "2026-01-07"].forEach((d) =>
      checkHabit(s, h, d),
    );
    expect(habitStats(s, h, "2026-01-14")).toMatchObject({
      current: 1,
      longest: 1,
      completed: 1,
      planned: 2,
    });
    expect(habitStats(s, h, "2026-01-19").current).toBe(0);
    ["2026-01-12", "2026-01-13", "2026-01-14"].forEach((d) =>
      checkHabit(s, h, d),
    );
    expect(habitStats(s, h, "2026-01-14")).toMatchObject({
      current: 2,
      longest: 2,
      rate: 1,
    });
  });
  it("keeps records when archived and does not create planner task duplicates", () => {
    const h = habit();
    let s = withHabit(h);
    s = reduceState(s, (d) => checkHabit(d, h, "2026-01-01"));
    s = reduceState(s, (d) => {
      d.habits[0]!.archived = true;
    });
    expect(s.checkins).toHaveLength(1);
    expect(s.tasks).toHaveLength(0);
  });
});
describe("money and budgets", () => {
  it("parses minor units exactly and rejects invalid inputs", () => {
    expect(parseAmount("0.10", "INR")).toBe(10);
    expect(parseAmount("123.45", "INR")).toBe(12345);
    for (const v of ["0", "-1", "NaN", "1.234", "1e3", "Infinity", ""])
      expect(() => parseAmount(v, "INR")).toThrow();
  });
  it("income does not reduce budget spending and limits remain separate", () => {
    const s = emptyState();
    s.transactions = [
      tx(),
      tx({
        id: "i",
        type: "income",
        categoryId: "income-salary",
        amount: 50000,
      }),
    ];
    expect(totals(s, "2026-01-01", "2026-01-31")).toEqual({
      income: 50000,
      expenses: 10000,
      net: 40000,
    });
    const overall = {
      id: "b",
      month: "2026-01",
      amount: 12000,
      categoryId: null,
    };
    const category = {
      ...overall,
      id: "c",
      categoryId: "expense-bills",
      amount: 9000,
    };
    expect(budgetProgress(s, overall)).toMatchObject({
      spent: 10000,
      remaining: 2000,
      state: "80% used",
    });
    expect(budgetProgress(s, category)).toMatchObject({
      spent: 10000,
      remaining: -1000,
      state: "Limit reached",
    });
  });
  it("edits and deletes immediately affect totals", () => {
    let s = emptyState();
    s = reduceState(s, (d) => saveTransaction(d, tx()));
    s = reduceState(s, (d) => saveTransaction(d, tx({ amount: 20000 })));
    expect(totals(s, "2026-01-01", "2026-01-31").expenses).toBe(20000);
    s = reduceState(s, (d) => {
      d.transactions = [];
    });
    expect(totals(s, "2026-01-01", "2026-01-31").expenses).toBe(0);
  });
});
describe("recurrence and independent occurrences", () => {
  it("edits this occurrence without changing the series, and preserves a linked expense when splitting future edits", () => {
    const s = emptyState();
    s.tasks = [task()];
    const first = taskOccurrence(s, s.tasks[0]!, "2026-01-02")!;
    saveTask(
      s,
      { ...s.tasks[0]!, title: "Updated", date: "2026-01-02" },
      first,
      "one",
      "completed",
      "unused",
    );
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-03")?.title).toBe(
      "Pay bill",
    );
    saveTransaction(s, tx({ taskId: "t", taskDate: "2026-01-02" }));
    const edited = saveTask(
      s,
      { ...s.tasks[0]!, title: "New series", date: "2026-01-02" },
      taskOccurrence(s, s.tasks[0]!, "2026-01-02")!,
      "future",
      "completed",
      "new-series",
    );
    expect(edited.status).toBe("completed");
    expect(s.transactions[0]!.taskId).toBe("new-series");
    expect(() =>
      saveTransaction(
        s,
        tx({ id: "duplicate", taskId: "new-series", taskDate: "2026-01-02" }),
      ),
    ).toThrow();
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-01")).not.toBeNull();
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-03")).toBeNull();
    validateState(s);
  });
  it("starts selected-weekday tasks on their next scheduled day", () => {
    const s = emptyState();
    const t = task({
      date: "2026-01-03",
      recurrence: { kind: "weekdays", weekdays: [1] },
    });
    const item = saveTask(s, t, null, "one", "completed", "unused");
    expect(item.occurrenceDate).toBe("2026-01-05");
    expect(item.status).toBe("completed");
    expect(taskItems(s, "2026-01-03", "2026-01-03")).toHaveLength(0);
  });
  it("clamps the 31st including leap years", () => {
    const monthly = { kind: "monthly" as const, weekdays: [] };
    expect(occurs("2024-01-31", "2024-02-29", monthly)).toBe(true);
    expect(occurs("2025-01-31", "2025-02-28", monthly)).toBe(true);
    expect(occurs("2026-01-31", "2026-04-30", monthly)).toBe(true);
    expect(occurs("2026-01-31", "2026-04-29", monthly)).toBe(false);
    expect(occurs("2026-01-31", "2026-05-31", monthly, "2026-04-30")).toBe(
      false,
    );
  });
  it("completes and reschedules one task occurrence independently", () => {
    const s = emptyState();
    s.tasks = [task()];
    const first = taskOccurrence(s, s.tasks[0]!, "2026-01-01")!;
    setTask(s, first, { status: "completed" });
    setTask(s, taskOccurrence(s, s.tasks[0]!, "2026-01-02")!, {
      plannedDate: "2026-01-05",
    });
    expect(taskItems(s, "2026-01-02", "2026-01-02")).toHaveLength(0);
    expect(taskItems(s, "2026-01-05", "2026-01-05")).toHaveLength(2);
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-03")?.status).toBe(
      "pending",
    );
    expect(
      taskItems(s, "2026-01-04", "2026-01-04", true).some(
        (t) => t.occurrenceDate === "2026-01-03",
      ),
    ).toBe(true);
  });
  it("deletes just one or all future occurrences while preserving past completion", () => {
    const s = emptyState();
    s.tasks = [task()];
    setTask(s, taskOccurrence(s, s.tasks[0]!, "2026-01-01")!, {
      status: "completed",
    });
    deleteTask(s, taskOccurrence(s, s.tasks[0]!, "2026-01-03")!, "one");
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-04")).not.toBeNull();
    deleteTask(s, taskOccurrence(s, s.tasks[0]!, "2026-01-04")!, "future");
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-05")).toBeNull();
    expect(taskOccurrence(s, s.tasks[0]!, "2026-01-01")?.status).toBe(
      "completed",
    );
  });
  it("shows recurring money as due and counts only confirmed items once", () => {
    const s = emptyState();
    s.recurring = [
      {
        id: "r",
        type: "expense",
        amount: 10000,
        categoryId: "expense-bills",
        start: "2026-01-31",
        end: null,
        schedule: { kind: "monthly", weekdays: [] },
        note: "Bill",
        method: "UPI",
        archived: false,
      },
    ];
    expect(dueItems(s, "2026-02-28").map((d) => d.date)).toEqual([
      "2026-01-31",
      "2026-02-28",
    ]);
    expect(totals(s, "2026-01-01", "2026-02-28").expenses).toBe(0);
    saveTransaction(s, tx({ recurringId: "r", recurringDate: "2026-01-31" }));
    expect(dueItems(s, "2026-02-28")).toHaveLength(1);
    expect(() =>
      saveTransaction(
        s,
        tx({ id: "duplicate", recurringId: "r", recurringDate: "2026-01-31" }),
      ),
    ).toThrow("already");
  });
  it("does not automatically transact when completing a task, and rejects duplicate links", () => {
    const s = emptyState();
    s.tasks = [task()];
    setTask(s, taskOccurrence(s, s.tasks[0]!, "2026-01-01")!, {
      status: "completed",
    });
    expect(s.transactions).toHaveLength(0);
    saveTransaction(s, tx({ taskId: "t", taskDate: "2026-01-01" }));
    expect(() =>
      saveTransaction(
        s,
        tx({ id: "dup", taskId: "t", taskDate: "2026-01-01" }),
      ),
    ).toThrow();
  });
  it("limits daily priorities and uses the configured week start", () => {
    const s = emptyState();
    s.tasks = Array.from({ length: 4 }, (_, i) => task({ id: `t${i}` }));
    for (const t of s.tasks.slice(0, 3))
      setTask(s, taskOccurrence(s, t, "2026-01-01")!, { dailyPriority: true });
    expect(() =>
      setTask(s, taskOccurrence(s, s.tasks[3]!, "2026-01-01")!, {
        dailyPriority: true,
      }),
    ).toThrow();
    expect(weekStart("2026-01-04", 1)).toBe("2025-12-29");
    expect(weekStart("2026-01-04", 0)).toBe("2026-01-04");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
describe("versioned backup validation", () => {
  it("round-trips all data", () => {
    const s = withHabit(habit());
    checkHabit(s, s.habits[0]!, "2026-01-01");
    s.tasks = [task()];
    s.transactions = [tx()];
    expect(parseExport(serialize(s))).toEqual(s);
  });
  it("rejects corrupt, unsupported, orphan and duplicate exports", () => {
    expect(() => parseExport("{}")).toThrow();
    const envelope = JSON.parse(serialize(emptyState()));
    envelope.version = 2;
    expect(() => parseExport(JSON.stringify(envelope))).toThrow();
    const s = emptyState();
    s.checkins = [{ habitId: "missing", date: "2026-01-01", value: 1 }];
    expect(() => validateState(s)).toThrow("reference");
    s.checkins = [];
    s.transactions = [tx(), tx()];
    expect(() => validateState(s)).toThrow("Duplicate");
  });
  it("rejects invalid calendar dates and negative financial amounts", () => {
    const s = emptyState();
    s.transactions = [tx({ date: "2026-02-30" })];
    expect(() => validateState(s)).toThrow();
    s.transactions = [tx({ amount: -1 })];
    expect(() => validateState(s)).toThrow();
  });
  it("escapes CSV quotes and spreadsheet formula prefixes", () => {
    const s = emptyState();
    s.transactions = [tx({ note: '=HYPERLINK("bad")' })];
    expect(csv(s)).toContain('"\'=HYPERLINK(""bad"")"');
  });
});
