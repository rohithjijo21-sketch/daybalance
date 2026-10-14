import { showAlert } from "../src/ui/dialogs";
import { errorMessage } from "../src/domain/errors";
import React, { useState } from "react";

import { router, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import { useStore } from "../src/data/store";
import {
  checkHabit,
  deleteHabit,
  deleteTask,
  saveTransaction,
  saveTask,
} from "../src/domain/actions";
import {
  amountInput,
  habitValue,
  parseAmount,
  taskOccurrence,
} from "../src/domain/calculations";
import {
  Habit,
  habitSchema,
  isDate,
  localDate,
  Recurring,
  recurringSchema,
  Schedule,
  State,
  Task,
  taskSchema,
  Transaction,
  transactionSchema,
} from "../src/domain/model";
import { enableReminders } from "../src/services/notifications";
import {
  Button,
  Card,
  Choices,
  ColorPicker,
  IconPicker,
  Disclosure,
  confirm,
  Field,
  Row,
  Screen,
  Txt,
  useTheme,
  Weekdays,
} from "../src/ui/components";
type Params = Record<string, string>;
const newId = () => Crypto.randomUUID();
function ErrorText({ error }: { error: string }) {
  const c = useTheme();
  return error ? <Txt style={{ color: c.danger }}>{error}</Txt> : null;
}
function RecurrenceFields({
  value,
  onChange,
}: {
  value: Schedule;
  onChange: (s: Schedule) => void;
}) {
  return (
    <>
      <Choices
        label="Recurrence"
        values={["none", "daily", "weekdays", "weekly", "monthly"] as const}
        value={value.kind}
        onChange={(kind) => onChange({ ...value, kind })}
      />
      {value.kind === "weekdays" && (
        <Weekdays
          value={value.weekdays}
          onChange={(weekdays) => onChange({ ...value, weekdays })}
        />
      )}
      <Txt muted>
        Each occurrence is independent. Monthly schedules use the last valid day
        in shorter months.
      </Txt>
    </>
  );
}
async function reminderPermission(
  s: State,
  hasReminder: boolean,
): Promise<boolean> {
  if (!hasReminder) return s.settings.notifications;
  const allowed = await enableReminders();
  if (!allowed)
    showAlert(
      "Reminders unavailable",
      "Your record will still be saved. Enable notifications in device settings to receive reminders.",
    );
  return allowed;
}
export default function Edit() {
  const p = useLocalSearchParams<Params>();
  const { state } = useStore();
  if (!state)
    return (
      <Screen title="Loading" back>
        {null}
      </Screen>
    );
  switch (p.kind) {
    case "habit":
      return <HabitForm p={p} state={state} />;
    case "checkin":
      return <CheckinForm p={p} state={state} />;
    case "task":
      return <TaskForm p={p} state={state} />;
    case "transaction":
      return <TransactionForm p={p} state={state} />;
    case "recurring":
      return <RecurringForm p={p} state={state} />;
    case "budget":
      return <BudgetForm p={p} state={state} />;
    case "category":
      return <CategoryForm p={p} state={state} />;
    default:
      return (
        <Screen title="Unknown form" back>
          <Txt>Please return to the previous screen.</Txt>
        </Screen>
      );
  }
}
function HabitForm({ p, state }: { p: Params; state: State }) {
  const { mutate, busy } = useStore();
  const existing = state.habits.find((h) => h.id === p.id);
  const [h, setH] = useState<Habit>(
    existing ?? {
      id: newId(),
      name: "",
      description: "",
      icon: "🌱",
      color: "#95532F",
      start: localDate(),
      schedule: "daily",
      weekdays: [1, 2, 3, 4, 5],
      weeklyTarget: 3,
      tracking: "boolean",
      target: 1,
      reminder: null,
      archived: false,
    },
  );
  const [target, setTarget] = useState(String(h.target));
  const [weekly, setWeekly] = useState(String(h.weeklyTarget));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const put = <K extends keyof Habit>(k: K, v: Habit[K]) =>
    setH({ ...h, [k]: v });
  async function save() {
    if (saving || busy) return;
    setSaving(true);
    try {
      const value = habitSchema.parse({
        ...h,
        target: Number(target),
        weeklyTarget: Number(weekly),
      });
      const notifications = await reminderPermission(state, !!value.reminder);
      if (
        await mutate((s) => {
          s.habits = s.habits.filter((v) => v.id !== value.id);
          s.habits.push(value);
          if (value.reminder) s.settings.notifications = notifications;
        })
      )
        router.back();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen title={existing ? "Edit habit" : "A new routine"} back>
      <Field label="Name" value={h.name} onChange={(v) => put("name", v)} />
      <Disclosure title="Description & appearance">
        <Field
          label="Description (optional)"
          value={h.description}
          onChange={(v) => put("description", v)}
          multiline
        />
        <IconPicker value={h.icon} onChange={(v) => put("icon", v)} />
        <ColorPicker value={h.color} onChange={(v) => put("color", v)} />
      </Disclosure>
      <Field
        label="Start date (YYYY-MM-DD)"
        value={h.start}
        onChange={(v) => put("start", v)}
      />
      <Choices
        label="Schedule"
        values={["daily", "weekdays", "weekly"] as const}
        value={h.schedule}
        onChange={(v) => put("schedule", v)}
      />
      {h.schedule === "weekdays" && (
        <Weekdays value={h.weekdays} onChange={(v) => put("weekdays", v)} />
      )}
      {h.schedule === "weekly" && (
        <Field
          label="Days completed per week (1–7)"
          value={weekly}
          onChange={setWeekly}
          number
        />
      )}
      <Choices
        label="Tracking type"
        values={["Check off", "Numeric target"]}
        value={h.tracking === "boolean" ? "Check off" : "Numeric target"}
        onChange={(v) =>
          put("tracking", v === "Check off" ? "boolean" : "numeric")
        }
      />
      {h.tracking === "numeric" && (
        <Field
          label="Daily numeric target"
          value={target}
          onChange={setTarget}
          number
        />
      )}
      <Disclosure title="Reminder">
        <Field
          label="Reminder (optional HH:MM)"
          value={h.reminder ?? ""}
          onChange={(v) => put("reminder", v || null)}
        />
      </Disclosure>
      <ErrorText error={error} />
      <Button
        title={saving ? "Saving…" : "Save habit"}
        disabled={saving}
        onPress={() => void save()}
      />
      {existing && (
        <>
          <Button
            secondary
            title={h.archived ? "Restore habit" : "Archive habit"}
            onPress={() =>
              void mutate((s) => {
                s.habits.find((v) => v.id === h.id)!.archived = !h.archived;
              }).then((ok) => {
                if (ok) router.back();
              })
            }
          />
          <Button
            danger
            title="Delete habit and history"
            onPress={() =>
              confirm(
                "Delete this habit?",
                "All its check-ins will also be deleted.",
                () =>
                  void mutate((s) => deleteHabit(s, h.id)).then((ok) => {
                    if (ok) router.back();
                  }),
              )
            }
          />
        </>
      )}
    </Screen>
  );
}
function CheckinForm({ p, state }: { p: Params; state: State }) {
  const { mutate } = useStore();
  const h = state.habits.find((h) => h.id === p.id);
  const [date, setDate] = useState(p.date ?? localDate());
  const [value, setValue] = useState(
    String(h ? habitValue(state, h.id, date) : 0),
  );
  const [error, setError] = useState("");
  if (!h)
    return (
      <Screen title="Habit unavailable" back>
        {null}
      </Screen>
    );
  async function save() {
    try {
      if (!isDate(date) || date > localDate())
        throw new Error("Choose today or a previous valid date");
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 100000)
        throw new Error("Enter a value from 0 to 100000");
      if (await mutate((s) => checkHabit(s, h!, date, n))) router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Screen title={h.name} subtitle="Edit check-in" back>
      <Field
        label="Date (YYYY-MM-DD)"
        value={date}
        onChange={(d) => {
          setDate(d);
          setValue(String(habitValue(state, h.id, d)));
        }}
      />
      <Field
        label={
          h.tracking === "numeric"
            ? `Progress (target ${h.target})`
            : "Completion: 0 = undone, 1 = done"
        }
        value={value}
        onChange={setValue}
        number
      />
      <Txt muted>
        Set progress to 0 to undo this check-in. Dates use your local timezone.
      </Txt>
      <ErrorText error={error} />
      <Button title="Save progress" onPress={() => void save()} />
    </Screen>
  );
}
function TaskForm({ p, state }: { p: Params; state: State }) {
  const { mutate, busy } = useStore();
  const existing = state.tasks.find((t) => t.id === p.id);
  const item = existing
    ? taskOccurrence(state, existing, p.occurrence ?? existing.date)
    : null;
  const [t, setT] = useState<Task>(
    item
      ? { ...item, date: item.plannedDate }
      : (existing ?? {
          id: newId(),
          title: "",
          notes: "",
          date: p.date ?? localDate(),
          startTime: null,
          endTime: null,
          priority: "medium",
          category: "",
          reminder: null,
          recurrence: { kind: "none", weekdays: [] },
          until: null,
        }),
  );
  const [scope, setScope] = useState("this occurrence");
  const [status, setStatus] = useState(item?.status ?? "pending");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const put = <K extends keyof Task>(k: K, v: Task[K]) =>
    setT({ ...t, [k]: v });
  async function save() {
    if (saving || busy) return;
    setSaving(true);
    try {
      const value = taskSchema.parse(t);
      let savedItem: ReturnType<typeof saveTask> | null = null;
      const notifications = await reminderPermission(state, !!value.reminder);
      const ok = await mutate((s) => {
        savedItem = saveTask(
          s,
          value,
          item,
          scope === "this occurrence" ? "one" : "future",
          status,
          newId(),
        );
        if (value.reminder) s.settings.notifications = notifications;
      });
      if (ok) {
        router.back();
        if (
          status === "completed" &&
          item?.status !== "completed" &&
          savedItem
        ) {
          const completedItem = savedItem as NonNullable<
            ReturnType<typeof saveTask>
          >;
          if (
            !state.transactions.some(
              (v) =>
                v.taskId === completedItem.id &&
                v.taskDate === completedItem.occurrenceDate,
            )
          )
            showAlert(
              "Task completed",
              "Would you like to record an expense?",
              [
                { text: "Done", style: "cancel" },
                {
                  text: "Record expense",
                  onPress: () =>
                    router.push({
                      pathname: "/edit",
                      params: {
                        kind: "transaction",
                        type: "expense",
                        taskId: completedItem.id,
                        taskDate: completedItem.occurrenceDate,
                        note: completedItem.title,
                        date: completedItem.plannedDate,
                      },
                    }),
                },
              ],
            );
        }
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen title={existing ? "Edit task" : "New task"} back>
      {item && existing?.recurrence.kind !== "none" && (
        <Choices
          label="Apply changes to"
          values={["this occurrence", "this and future occurrences"]}
          value={scope}
          onChange={setScope}
        />
      )}
      <Field label="Title" value={t.title} onChange={(v) => put("title", v)} />
      <Field
        label="Planned date (YYYY-MM-DD)"
        value={t.date}
        onChange={(v) => put("date", v)}
      />
      <Choices
        label="Priority"
        values={["low", "medium", "high"] as const}
        value={t.priority}
        onChange={(v) => put("priority", v)}
      />
      <Disclosure title="Time, notes & repeat">
        <Field
          label="Notes (optional)"
          value={t.notes}
          onChange={(v) => put("notes", v)}
          multiline
        />
        <Field
          label="Start time (optional HH:MM)"
          value={t.startTime ?? ""}
          onChange={(v) => put("startTime", v || null)}
        />
        <Field
          label="End time (optional HH:MM)"
          value={t.endTime ?? ""}
          onChange={(v) => put("endTime", v || null)}
        />
        <Choices
          label="Status"
          values={["pending", "in progress", "completed"] as const}
          value={status}
          onChange={setStatus}
        />
        <Field
          label="Category (optional)"
          value={t.category}
          onChange={(v) => put("category", v)}
        />
        <Field
          label="Reminder (optional HH:MM)"
          value={t.reminder ?? ""}
          onChange={(v) => put("reminder", v || null)}
        />
        {(!item || scope !== "this occurrence") && (
          <>
            <RecurrenceFields
              value={t.recurrence}
              onChange={(v) => put("recurrence", v)}
            />
            <Field
              label="Recurrence end date (optional)"
              value={t.until ?? ""}
              onChange={(v) => put("until", v || null)}
            />
          </>
        )}
      </Disclosure>
      <ErrorText error={error} />
      <Button
        title={saving ? "Saving…" : "Save task"}
        disabled={saving}
        onPress={() => void save()}
      />
      {item && (
        <Button
          danger
          title="Delete task"
          onPress={() =>
            confirm(
              "Delete task?",
              `Delete ${scope}? Past occurrences and linked financial history are retained.`,
              () =>
                void mutate((s) =>
                  deleteTask(
                    s,
                    item,
                    scope === "this occurrence" ? "one" : "future",
                  ),
                ).then((ok) => {
                  if (ok) router.back();
                }),
            )
          }
        />
      )}
    </Screen>
  );
}
function TransactionForm({ p, state }: { p: Params; state: State }) {
  const { mutate } = useStore();
  const existing = state.transactions.find((t) => t.id === p.id);
  const rule = state.recurring.find((r) => r.id === p.recurringId);
  const initialType = p.type === "income" ? "income" : "expense";
  const [t, setT] = useState<Transaction>(
    existing ?? {
      id: newId(),
      type: rule?.type ?? initialType,
      amount: rule?.amount ?? 0,
      categoryId:
        rule?.categoryId ??
        state.categories.find((c) => c.type === initialType && !c.archived)
          ?.id ??
        "",
      date: p.date ?? localDate(),
      note: rule?.note ?? p.note ?? "",
      method: rule?.method ?? "UPI",
      taskId: p.taskId ?? null,
      taskDate: p.taskDate ?? null,
      recurringId: rule?.id ?? null,
      recurringDate: rule ? (p.date ?? localDate()) : null,
    },
  );
  const [amount, setAmount] = useState(
    t.amount ? amountInput(t.amount, state.settings.currency) : "",
  );
  const [error, setError] = useState("");
  const put = <K extends keyof Transaction>(k: K, v: Transaction[K]) =>
    setT({ ...t, [k]: v });
  const categories = state.categories.filter(
    (c) => c.type === t.type && (!c.archived || c.id === t.categoryId),
  );
  const links = state.occurrences.filter(
    (o) => !o.deleted && o.status === "completed",
  );
  async function save() {
    try {
      const value = transactionSchema.parse({
        ...t,
        amount: parseAmount(amount, state.settings.currency),
      });
      if (await mutate((s) => saveTransaction(s, value))) router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Screen
      title={
        existing
          ? "Edit transaction"
          : rule
            ? "Confirm due entry"
            : "Record money"
      }
      back
    >
      <Choices
        label="Type"
        values={["expense", "income"] as const}
        value={t.type}
        onChange={(type) =>
          setT({
            ...t,
            type,
            categoryId:
              state.categories.find((c) => c.type === type && !c.archived)
                ?.id ?? "",
          })
        }
      />
      <Field
        label={`Amount (${state.settings.currency})`}
        value={amount}
        onChange={setAmount}
        number
      />
      <CategoryPicker
        categories={categories}
        value={t.categoryId}
        onChange={(v) => put("categoryId", v)}
      />
      <Field
        label="Date (YYYY-MM-DD)"
        value={t.date}
        onChange={(v) => put("date", v)}
      />
      <Field
        label="Note (optional)"
        value={t.note}
        onChange={(v) => put("note", v)}
        multiline
      />
      <Choices
        label="Payment method"
        values={["cash", "UPI", "card", "bank transfer", "other"] as const}
        value={t.method}
        onChange={(v) => put("method", v)}
      />
      <Card>
        <Txt style={{ fontWeight: "600" }}>Linked planner task</Txt>
        {t.taskId ? (
          <>
            <Txt>
              {state.tasks.find((v) => v.id === t.taskId)?.title} · {t.taskDate}
            </Txt>
            <Button
              secondary
              title="Remove task link"
              onPress={() => setT({ ...t, taskId: null, taskDate: null })}
            />
          </>
        ) : (
          <>
            <Txt muted>
              Optional. One transaction can be linked to each completed
              occurrence.
            </Txt>
            {links.slice(-20).map((o) => (
              <Button
                key={`${o.taskId}-${o.date}`}
                secondary
                title={`${state.tasks.find((v) => v.id === o.taskId)?.title} · ${o.date}`}
                onPress={() =>
                  setT({ ...t, taskId: o.taskId, taskDate: o.date })
                }
              />
            ))}
          </>
        )}
      </Card>
      {rule && (
        <Txt muted>
          This due entry will affect recorded totals only after you save. Its
          occurrence key prevents duplicate confirmation.
        </Txt>
      )}
      <ErrorText error={error} />
      <Button title="Save transaction" onPress={() => void save()} />
      {existing && (
        <Button
          danger
          title="Delete transaction"
          onPress={() =>
            confirm(
              "Delete transaction?",
              "This removes the recorded amount from totals and budgets. A recurring occurrence will become due again.",
              () =>
                void mutate((s) => {
                  s.transactions = s.transactions.filter((v) => v.id !== t.id);
                }).then((ok) => {
                  if (ok) router.back();
                }),
            )
          }
        />
      )}
    </Screen>
  );
}
function CategoryPicker({
  categories,
  value,
  onChange,
}: {
  categories: State["categories"];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <Txt style={{ fontWeight: "600" }}>Category</Txt>
      <Row>
        {categories.map((c) => (
          <Button
            key={c.id}
            secondary={c.id !== value}
            title={`${c.name}${c.archived ? " (archived)" : ""}`}
            onPress={() => onChange(c.id)}
          />
        ))}
      </Row>
      {!categories.length && <Txt>Create a category in Settings first.</Txt>}
    </>
  );
}
function RecurringForm({ p, state }: { p: Params; state: State }) {
  const { mutate } = useStore();
  const existing = state.recurring.find((r) => r.id === p.id);
  const [r, setR] = useState<Recurring>(
    existing ?? {
      id: newId(),
      type: "expense",
      amount: 0,
      categoryId:
        state.categories.find((c) => c.type === "expense" && !c.archived)?.id ??
        "",
      start: localDate(),
      end: null,
      schedule: { kind: "monthly", weekdays: [] },
      note: "",
      method: "UPI",
      archived: false,
    },
  );
  const [amount, setAmount] = useState(
    r.amount ? amountInput(r.amount, state.settings.currency) : "",
  );
  const [error, setError] = useState("");
  const put = <K extends keyof Recurring>(k: K, v: Recurring[K]) =>
    setR({ ...r, [k]: v });
  async function save() {
    try {
      const value = recurringSchema.parse({
        ...r,
        amount: parseAmount(amount, state.settings.currency),
      });
      if (
        await mutate((s) => {
          s.recurring = s.recurring.filter((v) => v.id !== r.id);
          s.recurring.push(value);
        })
      )
        router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Screen title={existing ? "Edit recurring entry" : "Recurring money"} back>
      <Txt muted>
        Due entries require confirmation. Editing a schedule does not change
        recorded transactions.
      </Txt>
      <Choices
        label="Type"
        values={["expense", "income"] as const}
        value={r.type}
        onChange={(type) =>
          setR({
            ...r,
            type,
            categoryId:
              state.categories.find((c) => c.type === type && !c.archived)
                ?.id ?? "",
          })
        }
      />
      <Field
        label={`Amount (${state.settings.currency})`}
        value={amount}
        onChange={setAmount}
        number
      />
      <CategoryPicker
        categories={state.categories.filter(
          (c) => c.type === r.type && (!c.archived || c.id === r.categoryId),
        )}
        value={r.categoryId}
        onChange={(v) => put("categoryId", v)}
      />
      <Field
        label="Start date (YYYY-MM-DD)"
        value={r.start}
        onChange={(v) => put("start", v)}
      />
      <Field
        label="End date (optional)"
        value={r.end ?? ""}
        onChange={(v) => put("end", v || null)}
      />
      <RecurrenceFields
        value={r.schedule}
        onChange={(v) => put("schedule", v)}
      />
      <Field
        label="Note (optional)"
        value={r.note}
        onChange={(v) => put("note", v)}
      />
      <Choices
        label="Payment method"
        values={["cash", "UPI", "card", "bank transfer", "other"] as const}
        value={r.method}
        onChange={(v) => put("method", v)}
      />
      <ErrorText error={error} />
      <Button title="Save recurring entry" onPress={() => void save()} />
      {existing && (
        <Button
          secondary
          title={
            r.archived ? "Resume recurring entry" : "Archive recurring entry"
          }
          onPress={() =>
            void mutate((s) => {
              s.recurring.find((v) => v.id === r.id)!.archived = !r.archived;
            }).then((ok) => {
              if (ok) router.back();
            })
          }
        />
      )}
    </Screen>
  );
}
function BudgetForm({ p, state }: { p: Params; state: State }) {
  const { mutate } = useStore();
  const existing = state.budgets.find((b) => b.id === p.id);
  const [month, setMonth] = useState(
    existing?.month ?? p.month ?? localDate().slice(0, 7),
  );
  const [category, setCategory] = useState<string | null>(
    existing?.categoryId ?? null,
  );
  const [amount, setAmount] = useState(
    existing ? amountInput(existing.amount, state.settings.currency) : "",
  );
  const [error, setError] = useState("");
  async function save() {
    try {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
        throw new Error("Use YYYY-MM for the month");
      const b = {
        id: existing?.id ?? newId(),
        month,
        categoryId: category,
        amount: parseAmount(amount, state.settings.currency),
      };
      if (
        await mutate((s) => {
          s.budgets = s.budgets.filter(
            (v) =>
              v.id !== b.id &&
              !(v.month === month && v.categoryId === category),
          );
          s.budgets.push(b);
        })
      )
        router.back();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Screen title="Monthly budget" back>
      <Field label="Month (YYYY-MM)" value={month} onChange={setMonth} />
      <Button
        title="Overall monthly expenses"
        secondary={category !== null}
        onPress={() => setCategory(null)}
      />
      <CategoryPicker
        categories={state.categories.filter(
          (c) => c.type === "expense" && (!c.archived || c.id === category),
        )}
        value={category ?? ""}
        onChange={setCategory}
      />
      <Field
        label={`Budget limit (${state.settings.currency})`}
        value={amount}
        onChange={setAmount}
        number
      />
      <Txt muted>
        Overall and category budgets are separate limits. Only recorded expenses
        count. Income does not reduce spending.
      </Txt>
      <ErrorText error={error} />
      <Button title="Save budget" onPress={() => void save()} />
      {existing && (
        <Button
          danger
          title="Delete budget"
          onPress={() =>
            confirm(
              "Delete budget?",
              "Recorded expenses will be retained.",
              () =>
                void mutate((s) => {
                  s.budgets = s.budgets.filter((v) => v.id !== existing.id);
                }).then((ok) => {
                  if (ok) router.back();
                }),
            )
          }
        />
      )}
    </Screen>
  );
}
function CategoryForm({ p, state }: { p: Params; state: State }) {
  const { mutate } = useStore();
  const existing = state.categories.find((c) => c.id === p.id);
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<"income" | "expense">(
    existing?.type ?? "expense",
  );
  const [error, setError] = useState("");
  return (
    <Screen title={existing ? "Edit category" : "New category"} back>
      <Field label="Category name" value={name} onChange={setName} />
      {!existing && (
        <Choices
          label="Type"
          values={["expense", "income"] as const}
          value={type}
          onChange={setType}
        />
      )}
      <ErrorText error={error} />
      <Button
        title="Save category"
        onPress={() => {
          if (!name.trim()) {
            setError("Enter a category name");
            return;
          }
          void mutate((s) => {
            if (
              s.categories.some(
                (c) =>
                  c.id !== existing?.id &&
                  c.type === type &&
                  c.name.toLowerCase() === name.trim().toLowerCase(),
              )
            )
              throw new Error("This category name already exists");
            if (existing)
              s.categories.find((c) => c.id === existing.id)!.name =
                name.trim();
            else
              s.categories.push({
                id: newId(),
                name: name.trim(),
                type,
                archived: false,
              });
          }).then((ok) => {
            if (ok) router.back();
          });
        }}
      />
      {existing && (
        <Button
          secondary
          title={existing.archived ? "Restore category" : "Archive category"}
          onPress={() =>
            void mutate((s) => {
              s.categories.find((c) => c.id === existing.id)!.archived =
                !existing.archived;
            }).then((ok) => {
              if (ok) router.back();
            })
          }
        />
      )}
      <Txt muted>
        Renaming and archiving preserve the category ID and transaction history.
      </Txt>
    </Screen>
  );
}
