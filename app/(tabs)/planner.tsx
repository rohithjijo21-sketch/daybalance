import { DateField } from "../../src/ui/pickers";
import { View, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { useStore } from "../../src/data/store";
import { isDate, localDate } from "../../src/domain/model";
import {
  addDays,
  dates,
  scheduled,
  taskItems,
  weekStart,
} from "../../src/domain/calculations";
import { setTask } from "../../src/domain/actions";
import {
  Button,
  Card,
  Choices,
  Disclosure,
  confirm,
  DateNav,
  Empty,
  Field,
  Screen,
  Section,
  Txt,
  useTheme,
} from "../../src/ui/components";
import { edit, HabitRow, TaskRow } from "../../src/ui/records";
export default function Planner() {
  const { state, mutate, now } = useStore();
  const c = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const [selected, setDate] = useState<string | null>(null);
  useEffect(() => setDate(null), [params.date]);
  const date = selected ?? params.date ?? localDate(new Date(now));
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("");
  const [move, setMove] = useState(addDays(localDate(), 1));
  if (!state) return <Screen title="Planner">{null}</Screen>;
  if (!isDate(date))
    return (
      <Screen title="Planner">
        <DateNav date={date} onChange={setDate} />
        <Txt>Enter a valid date.</Txt>
      </Screen>
    );
  const all = taskItems(state, date, date, true);
  const filtered = all.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      (priority === "all" || t.priority === priority) &&
      (!category || t.category.toLowerCase().includes(category.toLowerCase())),
  );
  const overdue = filtered.filter((t) => t.plannedDate < date);
  const current = filtered.filter((t) => t.plannedDate === date);
  const habits = state.habits.filter((h) => !h.archived && scheduled(h, date));
  const week = weekStart(date, state.settings.weekStart);
  return (
    <Screen title="Planner" subtitle="A thoughtful plan, with room to breathe.">
      <DateNav date={date} onChange={setDate} />
      <Button title="+ Add task" onPress={() => edit("task", { date })} />
      <View style={{ flexDirection: "row", gap: 4 }}>
        {dates(week, addDays(week, 6)).map((d) => {
          const tasks = taskItems(state, d, d);
          const completed = tasks.filter(
            (t) => t.status === "completed",
          ).length;
          return (
            <Pressable
              key={d}
              accessibilityRole="button"
              accessibilityLabel={`${d}: ${completed} of ${tasks.length} tasks completed`}
              onPress={() => setDate(d)}
              style={{
                flex: 1,
                minHeight: 74,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                backgroundColor: d === date ? c.accent : "transparent",
              }}
            >
              <Txt
                style={{
                  fontSize: 9,
                  lineHeight: 14,
                  color: d === date ? c.bg : c.muted,
                }}
              >
                {new Date(`${d}T12:00:00`)
                  .toLocaleDateString("en", { weekday: "short" })
                  .slice(0, 2)
                  .toUpperCase()}
              </Txt>
              <Txt
                style={{
                  fontWeight: "600",
                  fontSize: 18,
                  color: d === date ? c.bg : c.text,
                }}
              >
                {Number(d.slice(8))}
              </Txt>
              <View
                style={{
                  height: 3,
                  width: 3,
                  borderRadius: 2,
                  backgroundColor: tasks.length
                    ? d === date
                      ? c.bg
                      : c.accent
                    : "transparent",
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <Disclosure title="Filter tasks">
        <Choices
          label="Status"
          values={["all", "pending", "in progress", "completed"]}
          value={status}
          onChange={setStatus}
        />
        <Choices
          label="Priority"
          values={["all", "low", "medium", "high"]}
          value={priority}
          onChange={setPriority}
        />
        <Field
          label="Filter category"
          value={category}
          onChange={setCategory}
          placeholder="Any category"
        />
      </Disclosure>
      {overdue.length > 0 && (
        <>
          <Section title="Overdue" />
          {overdue.map((t) => (
            <TaskRow key={`${t.id}-${t.occurrenceDate}`} item={t} />
          ))}
        </>
      )}
      {current.some((t) => t.startTime) && <Section title="Scheduled" />}
      {current
        .filter((t) => t.startTime)
        .map((t) => (
          <TaskRow key={`${t.id}-${t.occurrenceDate}`} item={t} />
        ))}
      {current.some((t) => !t.startTime) && <Section title="Untimed" />}
      {current
        .filter((t) => !t.startTime)
        .map((t) => (
          <TaskRow key={`${t.id}-${t.occurrenceDate}`} item={t} />
        ))}
      {!filtered.length && (
        <Empty
          title="A little breathing room"
          body="Add a task or change the filters to see your plan."
        />
      )}
      {habits.length > 0 && <Section title="Habits" />}
      {habits.map((h) => (
        <HabitRow key={h.id} habit={h} date={date} />
      ))}
      <Disclosure title="Move unfinished tasks">
        <Card>
          <Section title="Move unfinished tasks" />
          <DateField label="Move to date" value={move} onChange={setMove} />
          <Button
            secondary
            title="Move all unfinished tasks shown"
            disabled={
              !isDate(move) || !filtered.some((t) => t.status !== "completed")
            }
            onPress={() =>
              confirm(
                "Move unfinished tasks?",
                `Move ${filtered.filter((t) => t.status !== "completed").length} tasks to ${move}? Their original recurring occurrences remain independent.`,
                () =>
                  void mutate((s) =>
                    filtered
                      .filter((t) => t.status !== "completed")
                      .forEach((t) =>
                        setTask(s, t, {
                          plannedDate: move,
                          dailyPriority: false,
                        }),
                      ),
                  ),
              )
            }
          />
        </Card>
      </Disclosure>
    </Screen>
  );
}
