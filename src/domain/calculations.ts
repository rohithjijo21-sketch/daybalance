import { Habit, localDate, Schedule, State, TaskItem } from "./model";
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + n);
  return localDate(d);
}
export function dayOfWeek(date: string): number {
  return new Date(`${date}T12:00:00`).getDay();
}
export function weekStart(date: string, first: number): string {
  return addDays(date, -((dayOfWeek(date) - first + 7) % 7));
}
export function dates(from: string, to: string): string[] {
  const result: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    result.push(d);
    if (result.length > 100000) throw new Error("Date range is too large");
  }
  return result;
}
export function occurs(
  start: string,
  date: string,
  schedule: Schedule,
  end: string | null = null,
): boolean {
  if (date < start || (end && date > end)) return false;
  switch (schedule.kind) {
    case "none":
      return date === start;
    case "daily":
      return true;
    case "weekdays":
      return schedule.weekdays.includes(dayOfWeek(date));
    case "weekly":
      return dayOfWeek(start) === dayOfWeek(date);
    case "monthly": {
      const d = new Date(`${date}T12:00:00`);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === Math.min(Number(start.slice(8)), last);
    }
  }
}
export function scheduled(h: Habit, date: string): boolean {
  return (
    date >= h.start &&
    (h.schedule !== "weekdays" || h.weekdays.includes(dayOfWeek(date)))
  );
}
export function habitValue(s: State, id: string, date: string): number {
  return (
    s.checkins.find((c) => c.habitId === id && c.date === date)?.value ?? 0
  );
}
export function habitDone(s: State, h: Habit, date: string): boolean {
  return habitValue(s, h.id, date) >= (h.tracking === "boolean" ? 1 : h.target);
}
export function habitStats(
  s: State,
  h: Habit,
  today: string,
  from = h.start,
  to = today,
) {
  const eligible = dates(from > h.start ? from : h.start, to).filter((d) =>
    scheduled(h, d),
  );
  if (h.schedule === "weekly") {
    const first = s.settings.weekStart;
    const weeks = [
      ...new Set(dates(h.start, today).map((d) => weekStart(d, first))),
    ];
    const done = (w: string) =>
      dates(w, addDays(w, 6)).filter(
        (d) => d >= h.start && d <= today && habitDone(s, h, d),
      ).length >= h.weeklyTarget;
    const currentWeek = weekStart(today, first);
    let longest = 0,
      run = 0;
    for (const w of weeks) {
      if (done(w)) {
        run++;
        longest = Math.max(longest, run);
      } else if (w !== currentWeek) run = 0;
    }
    const periodWeeks = [...new Set(eligible.map((d) => weekStart(d, first)))];
    const completed = periodWeeks.filter(done).length;
    return {
      current: run,
      longest,
      completed,
      planned: periodWeeks.length,
      rate: periodWeeks.length ? completed / periodWeeks.length : 0,
      unit: "weeks",
    };
  }
  const all = dates(h.start, today).filter((d) => scheduled(h, d));
  let longest = 0,
    run = 0;
  for (const d of all) {
    if (habitDone(s, h, d)) {
      run++;
      longest = Math.max(longest, run);
    } else if (d !== today) run = 0;
  }
  const completed = eligible.filter((d) => habitDone(s, h, d)).length;
  return {
    current: run,
    longest,
    completed,
    planned: eligible.length,
    rate: eligible.length ? completed / eligible.length : 0,
    unit: "days",
  };
}
export function taskOccurrence(
  s: State,
  task: State["tasks"][number],
  date: string,
): TaskItem | null {
  const o = s.occurrences.find((o) => o.taskId === task.id && o.date === date);
  if (
    o?.deleted ||
    (!o && !occurs(task.date, date, task.recurrence, task.until))
  )
    return null;
  return {
    ...task,
    ...(o?.overridden
      ? {
          title: o.title ?? task.title,
          notes: o.notes ?? task.notes,
          startTime: o.startTime,
          endTime: o.endTime,
          priority: o.priority ?? task.priority,
          category: o.category ?? task.category,
          reminder: o.reminder,
        }
      : {}),
    occurrenceDate: date,
    plannedDate: o?.plannedDate ?? date,
    status: o?.status ?? "pending",
    dailyPriority: o?.dailyPriority ?? false,
  };
}
export function taskItems(
  s: State,
  from: string,
  to: string,
  overdue = false,
): TaskItem[] {
  const result: TaskItem[] = [];
  for (const task of s.tasks) {
    const start = overdue && task.date < from ? task.date : from;
    const candidates = new Set(dates(start, to));
    s.occurrences
      .filter(
        (o) =>
          o.taskId === task.id &&
          o.plannedDate <= to &&
          (o.plannedDate >= from || overdue),
      )
      .forEach((o) => candidates.add(o.date));
    for (const date of candidates) {
      const item = taskOccurrence(s, task, date);
      if (
        item &&
        item.plannedDate <= to &&
        (item.plannedDate >= from || (overdue && item.status !== "completed"))
      )
        result.push(item);
    }
  }
  return result.sort(
    (a, b) =>
      a.plannedDate.localeCompare(b.plannedDate) ||
      (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"),
  );
}
export function totals(s: State, from: string, to: string) {
  const tx = s.transactions.filter((t) => t.date >= from && t.date <= to);
  const income = tx
    .filter((t) => t.type === "income")
    .reduce((n, t) => n + t.amount, 0);
  const expenses = tx
    .filter((t) => t.type === "expense")
    .reduce((n, t) => n + t.amount, 0);
  return { income, expenses, net: income - expenses };
}
export function budgetProgress(s: State, b: State["budgets"][number]) {
  const spent = s.transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.date.startsWith(b.month) &&
        (!b.categoryId || t.categoryId === b.categoryId),
    )
    .reduce((n, t) => n + t.amount, 0);
  return {
    spent,
    remaining: b.amount - spent,
    used: spent / b.amount,
    state:
      spent >= b.amount
        ? "Limit reached"
        : spent >= b.amount * 0.8
          ? "80% used"
          : "Within budget",
  };
}
export function dueItems(s: State, to: string, from?: string) {
  return s.recurring
    .filter((r) => !r.archived)
    .flatMap((r) =>
      dates(from && from > r.start ? from : r.start, to)
        .filter(
          (d) =>
            occurs(r.start, d, r.schedule, r.end) &&
            !s.transactions.some(
              (t) => t.recurringId === r.id && t.recurringDate === d,
            ),
        )
        .map((date) => ({ rule: r, date })),
    );
}
export function currencyDigits(currency: string): number {
  return (
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}
export function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    amount / 10 ** currencyDigits(currency),
  );
}
export function parseAmount(raw: string, currency: string): number {
  const digits = currencyDigits(currency);
  if (
    !new RegExp(`^\\d+(?:\\.\\d{1,${Math.max(1, digits)}})?$`).test(
      raw.trim(),
    ) ||
    (digits === 0 && raw.includes("."))
  )
    throw new Error(
      `Enter a positive amount with at most ${digits} decimal places`,
    );
  const [whole, decimal = ""] = raw.trim().split(".");
  const amount =
    Number(whole) * 10 ** digits + Number(decimal.padEnd(digits, "0"));
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("Enter a positive, valid amount");
  return amount;
}
export function amountInput(amount: number, currency: string): string {
  return (amount / 10 ** currencyDigits(currency)).toFixed(
    currencyDigits(currency),
  );
}
export function csv(s: State): string {
  const quote = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[=+@\-]/, "'$&")
      .replace(/"/g, '""')}"`;
  return [
    "Date,Type,Amount,Currency,Category,Payment method,Note,Task ID,Task occurrence",
    ...s.transactions.map((t) =>
      [
        t.date,
        t.type,
        amountInput(t.amount, s.settings.currency),
        s.settings.currency,
        s.categories.find((c) => c.id === t.categoryId)?.name,
        t.method,
        t.note,
        t.taskId,
        t.taskDate,
      ]
        .map(quote)
        .join(","),
    ),
  ].join("\r\n");
}
