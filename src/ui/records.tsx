import { showAlert } from "./dialogs";
import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HabitSymbol } from "./icons";
import { fonts } from "./typography";
import { router } from "expo-router";
import { useStore } from "../data/store";
import { Habit, TaskItem, Transaction } from "../domain/model";
import { habitDone, habitValue, money } from "../domain/calculations";
import { checkHabit, setTask } from "../domain/actions";
import { Button, Card, Disclosure, Row, Txt, useTheme } from "./components";
export function edit(kind: string, params: Record<string, string> = {}) {
  router.push({ pathname: "/edit", params: { kind, ...params } });
}
export function HabitRow({ habit, date }: { habit: Habit; date: string }) {
  const { state, mutate, busy } = useStore();
  const c = useTheme();
  if (!state) return null;
  const done = habitDone(state, habit, date);
  const label =
    habit.tracking === "numeric"
      ? "Enter progress"
      : done
        ? "Undo check-in"
        : "Check in";
  return (
    <Card>
      <Row>
        <View
          style={{
            height: 48,
            width: 48,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${habit.color}18`,
          }}
        >
          <HabitSymbol
            value={habit.icon}
            color={c.dark ? c.accent : habit.color}
            size={23}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Details: ${habit.name}`}
          onPress={() =>
            router.push({ pathname: "/habit", params: { id: habit.id } })
          }
          style={{ flex: 1, minHeight: 48, justifyContent: "center", gap: 3 }}
        >
          <Txt style={{ fontSize: 15, fontWeight: "600" }}>{habit.name}</Txt>
          <Txt muted style={{ fontSize: 11 }}>
            {habit.tracking === "numeric"
              ? `${habitValue(state, habit.id, date)} of ${habit.target}`
              : done
                ? "Completed"
                : habit.schedule === "daily"
                  ? "Every day"
                  : habit.schedule === "weekly"
                    ? `${habit.weeklyTarget} days a week`
                    : "Selected weekdays"}
          </Txt>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={busy}
          onPress={() =>
            habit.tracking === "numeric"
              ? edit("checkin", { id: habit.id, date })
              : void mutate((s) => checkHabit(s, habit, date))
          }
          style={{
            width: 44,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              height: 30,
              width: 30,
              borderRadius: 15,
              borderWidth: 1.5,
              borderColor: done ? c.accent : c.border,
              backgroundColor: done ? c.accent : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {done ? (
              <Ionicons name="checkmark" size={17} color={c.bg} />
            ) : habit.tracking === "numeric" ? (
              <Ionicons name="add" size={17} color={c.accent} />
            ) : null}
          </View>
        </Pressable>
      </Row>
    </Card>
  );
}
export function TaskRow({ item }: { item: TaskItem }) {
  const { state, mutate, busy } = useStore();
  const c = useTheme();
  if (!state) return null;
  const tx = state.transactions.find(
    (t) => t.taskId === item.id && t.taskDate === item.occurrenceDate,
  );
  async function toggle() {
    const completed = item.status !== "completed";
    const ok = await mutate((s) =>
      setTask(s, item, { status: completed ? "completed" : "pending" }),
    );
    if (ok && completed && !tx)
      showAlert(
        "Task completed",
        "Would you like to record an expense for this task?",
        [
          { text: "Done", style: "cancel" },
          {
            text: "Record expense",
            onPress: () =>
              edit("transaction", {
                type: "expense",
                taskId: item.id,
                taskDate: item.occurrenceDate,
                note: item.title,
                date: item.plannedDate,
              }),
          },
        ],
      );
  }
  return (
    <Card>
      <Row>
        <View style={{ flex: 1 }}>
          <Txt
            style={{
              fontWeight: "600",
              textDecorationLine:
                item.status === "completed" ? "line-through" : "none",
            }}
          >
            {item.dailyPriority ? "★ " : ""}
            {item.title}
          </Txt>
          <Txt muted>
            {item.startTime ?? "Any time"} · {item.status}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            item.status === "completed" ? "Reopen" : "Complete"
          }
          disabled={busy}
          onPress={() => void toggle()}
          style={{
            width: 44,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              height: 30,
              width: 30,
              borderRadius: 15,
              borderWidth: 1.5,
              borderColor: item.status === "completed" ? c.accent : c.border,
              backgroundColor:
                item.status === "completed" ? c.accent : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.status === "completed" && (
              <Ionicons name="checkmark" size={17} color={c.bg} />
            )}
          </View>
        </Pressable>
      </Row>
      <Disclosure title="Task options">
        {item.notes ? <Txt muted>{item.notes}</Txt> : null}
        <Row>
          <Button
            secondary
            title="Edit / reschedule"
            onPress={() =>
              edit("task", { id: item.id, occurrence: item.occurrenceDate })
            }
          />
        </Row>
        <Txt muted>
          {item.plannedDate} · {item.priority}
          {item.category ? ` · ${item.category}` : ""}
        </Txt>
        <Row>
          <Button
            secondary
            title={item.dailyPriority ? "Unpin" : "Prioritize"}
            onPress={() =>
              void mutate((s) =>
                setTask(s, item, { dailyPriority: !item.dailyPriority }),
              )
            }
          />
          {item.status === "pending" && (
            <Button
              secondary
              title="Start"
              onPress={() =>
                void mutate((s) => setTask(s, item, { status: "in progress" }))
              }
            />
          )}
        </Row>
        {tx && (
          <Button
            secondary
            title={`Linked ${tx.type}: ${money(tx.amount, state.settings.currency)}`}
            onPress={() => edit("transaction", { id: tx.id })}
          />
        )}
      </Disclosure>
    </Card>
  );
}
export function TransactionRow({
  transaction: t,
  compact = false,
  last = false,
}: {
  transaction: Transaction;
  compact?: boolean;
  last?: boolean;
}) {
  const { state } = useStore();
  const c = useTheme();
  if (!state) return null;
  const category =
    state.categories.find((v) => v.id === t.categoryId)?.name ?? "Category";
  const dateLabel = new Date(`${t.date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category}, ${t.type}, ${money(t.amount, state.settings.currency)}, ${t.date}`}
      onPress={() => edit("transaction", { id: t.id })}
      style={{
        paddingVertical: compact ? 17 : 0,
        borderBottomWidth: compact && !last ? 1 : 0,
        borderColor: c.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            height: 40,
            width: 40,
            borderRadius: 14,
            backgroundColor: c.tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={
              t.type === "income" ? "arrow-down-outline" : "arrow-up-outline"
            }
            color={c.accent}
            size={19}
          />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt style={{ fontSize: 14, fontWeight: "600" }}>{category}</Txt>
          <Txt muted style={{ fontSize: 10, lineHeight: 16 }}>
            {dateLabel} · {t.method}
            {t.taskId ? " · linked" : ""}
          </Txt>
        </View>
        <Txt style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
          {t.type === "income" ? "+" : "−"}
          {money(t.amount, state.settings.currency)}
        </Txt>
      </View>
      {t.note ? (
        <Txt muted style={{ fontSize: 11, marginTop: 7, marginLeft: 52 }}>
          {t.note}
        </Txt>
      ) : null}
    </Pressable>
  );
  return compact ? content : <Card>{content}</Card>;
}
