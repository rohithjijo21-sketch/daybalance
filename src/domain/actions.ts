import {
  Habit,
  Occurrence,
  State,
  TaskItem,
  Transaction,
  localDate,
  Task,
  validateState,
} from "./model";
import {
  addDays,
  dates,
  habitValue,
  occurs,
  taskOccurrence,
} from "./calculations";
export function checkHabit(
  s: State,
  h: Habit,
  date: string,
  value?: number,
): void {
  if (date < h.start)
    throw new Error("Check-in date is before the habit starts");
  if (date > localDate())
    throw new Error("Check in on today or a previous day");
  const next = value ?? (habitValue(s, h.id, date) > 0 ? 0 : 1);
  if (
    !Number.isFinite(next) ||
    next < 0 ||
    next > 100000 ||
    (h.tracking === "boolean" && next !== 0 && next !== 1)
  )
    throw new Error(
      h.tracking === "boolean"
        ? "Enter 0 or 1 for completion"
        : "Enter a valid progress value",
    );
  s.checkins = s.checkins.filter(
    (c) => !(c.habitId === h.id && c.date === date),
  );
  if (next > 0) s.checkins.push({ habitId: h.id, date, value: next });
}
export function setTask(
  s: State,
  item: TaskItem,
  patch: Partial<Occurrence>,
): void {
  let o = s.occurrences.find(
    (o) => o.taskId === item.id && o.date === item.occurrenceDate,
  );
  if (!o) {
    o = {
      taskId: item.id,
      date: item.occurrenceDate,
      plannedDate: item.plannedDate,
      status: item.status,
      dailyPriority: item.dailyPriority,
      deleted: false,
      title: null,
      notes: null,
      startTime: null,
      endTime: null,
      priority: null,
      category: null,
      reminder: null,
      overridden: false,
    };
    s.occurrences.push(o);
  }
  if (
    patch.dailyPriority &&
    !o.dailyPriority &&
    s.occurrences.filter(
      (v) =>
        v.dailyPriority &&
        !v.deleted &&
        v.plannedDate === (patch.plannedDate ?? o!.plannedDate),
    ).length >= 3
  )
    throw new Error("Choose up to three daily priorities");
  Object.assign(o, patch);
}
export function deleteTask(
  s: State,
  item: TaskItem,
  scope: "one" | "future",
): void {
  if (scope === "one") {
    setTask(s, item, { deleted: true, dailyPriority: false });
    return;
  }
  const t = s.tasks.find((t) => t.id === item.id)!;
  t.until = addDays(item.occurrenceDate, -1);
  // Retain the series as an anchor for historical transactions and past occurrences.
  if (t.until < t.date) t.until = t.date;
  setTask(s, item, { deleted: true, dailyPriority: false });
  s.occurrences
    .filter((o) => o.taskId === item.id && o.date >= item.occurrenceDate)
    .forEach((o) => {
      o.deleted = true;
      o.dailyPriority = false;
    });
}
export function saveTask(
  s: State,
  value: Task,
  item: TaskItem | null,
  scope: "one" | "future",
  status: Occurrence["status"],
  futureId: string,
): TaskItem {
  if (item && scope === "one") {
    setTask(s, item, {
      plannedDate: value.date,
      title: value.title,
      notes: value.notes,
      startTime: value.startTime,
      endTime: value.endTime,
      priority: value.priority,
      category: value.category,
      reminder: value.reminder,
      status,
      overridden: true,
    });
    return taskOccurrence(
      s,
      s.tasks.find((t) => t.id === item.id)!,
      item.occurrenceDate,
    )!;
  }
  if (item) deleteTask(s, item, "future");
  const t = item ? { ...value, id: futureId } : value;
  s.tasks.push(t);
  const firstDate = dates(t.date, addDays(t.date, 7)).find((d) =>
    occurs(t.date, d, t.recurrence, t.until),
  );
  if (!firstDate)
    throw new Error("No task occurrence falls before the end date");
  const added = taskOccurrence(s, t, firstDate)!;
  if (status !== "pending") setTask(s, added, { status });
  if (item) {
    // The edited occurrence keeps its financial link when a new series is created.
    s.transactions
      .filter(
        (tx) => tx.taskId === item.id && tx.taskDate === item.occurrenceDate,
      )
      .forEach((tx) => {
        tx.taskId = t.id;
        tx.taskDate = firstDate;
      });
  }
  return { ...added, status };
}
export function saveTransaction(s: State, t: Transaction): void {
  if (
    s.transactions.some(
      (v) =>
        v.id !== t.id &&
        ((t.taskId && v.taskId === t.taskId && v.taskDate === t.taskDate) ||
          (t.recurringId &&
            v.recurringId === t.recurringId &&
            v.recurringDate === t.recurringDate)),
    )
  )
    throw new Error("This occurrence already has a recorded transaction");
  s.transactions = s.transactions.filter((v) => v.id !== t.id);
  s.transactions.push(t);
}
export function deleteHabit(s: State, id: string): void {
  s.habits = s.habits.filter((h) => h.id !== id);
  s.checkins = s.checkins.filter((c) => c.habitId !== id);
}
export function reduceState(s: State, fn: (draft: State) => void): State {
  const draft = JSON.parse(JSON.stringify(s)) as State;
  fn(draft);
  return validateState(draft);
}
