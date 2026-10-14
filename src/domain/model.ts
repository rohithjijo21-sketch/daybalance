import { z } from "zod";

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !isNaN(d.getTime()) && localDate(d) === value;
}
export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const dateSchema = z
  .string()
  .refine(isDate, "Use a valid YYYY-MM-DD date");
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour time)");
const id = z.string().min(1).max(100);
const text = z.string().max(2000);
const weekdays = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .refine((v) => new Set(v).size === v.length);
export const scheduleSchema = z
  .object({
    kind: z.enum(["none", "daily", "weekdays", "weekly", "monthly"]),
    weekdays: weekdays.default([]),
  })
  .refine(
    (s) => s.kind !== "weekdays" || s.weekdays.length > 0,
    "Select at least one weekday",
  );
export const habitSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(100),
    description: text,
    icon: z.string().max(10),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    start: dateSchema,
    schedule: z.enum(["daily", "weekdays", "weekly"]),
    weekdays,
    weeklyTarget: z.number().int().min(1).max(7),
    target: z.number().positive().max(100000),
    tracking: z.enum(["boolean", "numeric"]),
    reminder: timeSchema.nullable(),
    archived: z.boolean(),
  })
  .refine(
    (h) => h.schedule !== "weekdays" || h.weekdays.length > 0,
    "Select weekdays",
  );
export const checkinSchema = z.object({
  habitId: id,
  date: dateSchema,
  value: z.number().min(0).max(100000),
});
export const taskSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(150),
    notes: text,
    date: dateSchema,
    startTime: timeSchema.nullable(),
    endTime: timeSchema.nullable(),
    priority: z.enum(["low", "medium", "high"]),
    category: z.string().max(100),
    reminder: timeSchema.nullable(),
    recurrence: scheduleSchema,
    until: dateSchema.nullable(),
  })
  .refine(
    (t) => !t.endTime || (!!t.startTime && t.endTime > t.startTime),
    "End time must follow start time",
  )
  .refine(
    (t) => !t.until || t.until >= t.date,
    "End date must follow start date",
  );
export const occurrenceSchema = z
  .object({
    taskId: id,
    date: dateSchema,
    plannedDate: dateSchema,
    status: z.enum(["pending", "in progress", "completed"]),
    dailyPriority: z.boolean(),
    deleted: z.boolean(),
    title: z.string().min(1).max(150).nullable(),
    notes: text.nullable(),
    startTime: timeSchema.nullable(),
    endTime: timeSchema.nullable(),
    priority: z.enum(["low", "medium", "high"]).nullable(),
    category: z.string().max(100).nullable(),
    reminder: timeSchema.nullable(),
    overridden: z.boolean(),
  })
  .refine(
    (t) => !t.endTime || (!!t.startTime && t.endTime > t.startTime),
    "Invalid occurrence time range",
  );
export const categorySchema = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  type: z.enum(["income", "expense"]),
  archived: z.boolean(),
});
export const transactionSchema = z
  .object({
    id,
    type: z.enum(["income", "expense"]),
    amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    categoryId: id,
    date: dateSchema,
    note: text,
    method: z.enum(["cash", "UPI", "card", "bank transfer", "other"]),
    taskId: id.nullable(),
    taskDate: dateSchema.nullable(),
    recurringId: id.nullable(),
    recurringDate: dateSchema.nullable(),
  })
  .refine(
    (t) => !!t.taskId === !!t.taskDate && !!t.recurringId === !!t.recurringDate,
    "Incomplete linked occurrence",
  );
export const recurringSchema = z
  .object({
    id,
    type: z.enum(["income", "expense"]),
    amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    categoryId: id,
    start: dateSchema,
    end: dateSchema.nullable(),
    schedule: scheduleSchema,
    note: text,
    method: transactionSchema.shape.method,
    archived: z.boolean(),
  })
  .refine((r) => r.schedule.kind !== "none", "Choose a recurring schedule")
  .refine((r) => !r.end || r.end >= r.start, "End date must follow start date");
export const budgetSchema = z.object({
  id,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  categoryId: id.nullable(),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
export const settingsSchema = z.object({
  name: z.string().max(100),
  theme: z.enum(["system", "light", "dark"]),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AUD", "CAD"]),
  weekStart: z.union([z.literal(0), z.literal(1)]),
  notifications: z.boolean(),
  evening: timeSchema.nullable(),
});
export const stateSchema = z.object({
  habits: z.array(habitSchema).max(10000),
  checkins: z.array(checkinSchema).max(200000),
  tasks: z.array(taskSchema).max(20000),
  occurrences: z.array(occurrenceSchema).max(200000),
  categories: z.array(categorySchema).max(10000),
  transactions: z.array(transactionSchema).max(200000),
  recurring: z.array(recurringSchema).max(10000),
  budgets: z.array(budgetSchema).max(10000),
  settings: settingsSchema,
});
export type Habit = z.infer<typeof habitSchema>;
export type Task = z.infer<typeof taskSchema>;
export type Occurrence = z.infer<typeof occurrenceSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Recurring = z.infer<typeof recurringSchema>;
export type State = z.infer<typeof stateSchema>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type TaskItem = Task & {
  occurrenceDate: string;
  plannedDate: string;
  status: Occurrence["status"];
  dailyPriority: boolean;
};
export const defaultSettings: State["settings"] = {
  name: "",
  theme: "system",
  currency: "INR",
  weekStart: 1,
  notifications: false,
  evening: null,
};
export function emptyState(): State {
  const categories: State["categories"] = [];
  for (const [type, names] of [
    [
      "expense",
      [
        "Food",
        "Groceries",
        "Transport",
        "Shopping",
        "Bills",
        "Health",
        "Education",
        "Entertainment",
        "Other",
      ],
    ],
    [
      "income",
      ["Salary", "Allowance", "Freelance", "Business", "Gifts", "Other"],
    ],
  ] as const) {
    names.forEach((name) =>
      categories.push({
        id: `${type}-${name.toLowerCase()}`,
        name,
        type,
        archived: false,
      }),
    );
  }
  return {
    habits: [],
    checkins: [],
    tasks: [],
    occurrences: [],
    categories,
    transactions: [],
    recurring: [],
    budgets: [],
    settings: { ...defaultSettings },
  };
}
export function validateState(input: unknown): State {
  const s = stateSchema.parse(input);
  let aggregate = 0;
  for (const t of s.transactions) {
    aggregate += t.amount;
    if (!Number.isSafeInteger(aggregate))
      throw new Error("Total recorded amounts exceed the supported precision");
  }
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length)
      throw new Error(`Duplicate ${label}`);
  };
  for (const table of [
    "habits",
    "tasks",
    "categories",
    "transactions",
    "recurring",
    "budgets",
  ] as const)
    unique(
      s[table].map((v) => v.id),
      table,
    );
  unique(
    s.checkins.map((c) => `${c.habitId}|${c.date}`),
    "check-ins",
  );
  unique(
    s.occurrences.map((c) => `${c.taskId}|${c.date}`),
    "task occurrences",
  );
  unique(
    s.budgets.map((c) => `${c.month}|${c.categoryId ?? "overall"}`),
    "budgets",
  );
  unique(
    s.transactions
      .filter((t) => t.recurringId)
      .map((t) => `${t.recurringId}|${t.recurringDate}`),
    "recurring transactions",
  );
  unique(
    s.transactions
      .filter((t) => t.taskId)
      .map((t) => `${t.taskId}|${t.taskDate}`),
    "task-linked transactions",
  );
  const has = (table: { id: string }[], value: string) =>
    table.some((t) => t.id === value);
  for (const c of s.checkins)
    if (!has(s.habits, c.habitId)) throw new Error("Unknown habit reference");
  for (const o of s.occurrences)
    if (!has(s.tasks, o.taskId)) throw new Error("Unknown task reference");
  for (const t of [...s.transactions, ...s.recurring])
    if (!s.categories.some((c) => c.id === t.categoryId && c.type === t.type))
      throw new Error("Invalid transaction category");
  for (const t of s.transactions) {
    if (t.taskId && !has(s.tasks, t.taskId))
      throw new Error("Unknown linked task");
    if (t.recurringId && !has(s.recurring, t.recurringId))
      throw new Error("Unknown recurring entry");
  }
  for (const b of s.budgets)
    if (
      b.categoryId &&
      !s.categories.some((c) => c.id === b.categoryId && c.type === "expense")
    )
      throw new Error("Invalid budget category");
  const counts = new Map<string, number>();
  s.occurrences
    .filter((o) => o.dailyPriority && !o.deleted)
    .forEach((o) =>
      counts.set(o.plannedDate, (counts.get(o.plannedDate) ?? 0) + 1),
    );
  if ([...counts.values()].some((n) => n > 3))
    throw new Error("Only three daily priorities allowed");
  return s;
}
export function parseExport(raw: string): State {
  if (raw.length > 30_000_000) throw new Error("Import exceeds 30 MB");
  const envelope = z
    .object({
      app: z.literal("DayBalance"),
      version: z.literal(1),
      exportedAt: z.string().datetime(),
      data: z.unknown(),
    })
    .parse(JSON.parse(raw));
  return validateState(envelope.data);
}
export function serialize(s: State): string {
  return JSON.stringify(
    {
      app: "DayBalance",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: s,
    },
    null,
    2,
  );
}
