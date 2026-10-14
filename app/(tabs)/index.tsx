import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useStore } from "../../src/data/store";
import { isDate, localDate } from "../../src/domain/model";
import {
  habitDone,
  money,
  scheduled,
  taskItems,
  totals,
} from "../../src/domain/calculations";
import {
  Card,
  DateNav,
  Row,
  Screen,
  Section,
  Txt,
  Disclosure,
  Eyebrow,
  ProgressRing,
  useTheme,
} from "../../src/ui/components";
import { edit, TaskRow } from "../../src/ui/records";
export default function Today() {
  const { state, now, busy } = useStore();
  const c = useTheme();
  const [selected, setDate] = useState<string | null>(null);
  const date = selected ?? localDate(new Date(now));
  if (!state) return <Screen title="Today">{null}</Screen>;
  if (!isDate(date))
    return (
      <Screen title="Today">
        <DateNav date={date} onChange={setDate} />
        <Txt>Enter a valid date.</Txt>
      </Screen>
    );
  const habits = state.habits.filter((h) => !h.archived && scheduled(h, date));
  const done = habits.filter((h) => habitDone(state, h, date)).length;
  const items = taskItems(state, date, date, true);
  const remaining = items.filter((t) => t.status !== "completed");
  const priorities = items
    .filter((t) => t.dailyPriority && t.plannedDate === date)
    .slice(0, 3);
  const daily = totals(state, date, date);
  const month = localDate(new Date(now)).slice(0, 7);
  const monthly = totals(state, `${month}-01`, `${month}-31`);
  const fmt = (n: number) => money(n, state.settings.currency);
  const open = (pathname: "/habits" | "/planner" | "/money") =>
    router.push({ pathname, params: { date } });
  const quick = [
    { kind: "task", label: "Task", icon: "add-outline" },
    { kind: "habit", label: "Habit", icon: "leaf-outline" },
    { kind: "transaction", label: "Expense", icon: "arrow-up-outline" },
    { kind: "transaction", label: "Income", icon: "arrow-down-outline" },
  ] as const;
  return (
    <Screen
      title="Today"
      subtitle={
        state.settings.name
          ? `Good to see you, ${state.settings.name}.`
          : "A little space for what matters."
      }
    >
      <DateNav date={date} onChange={setDate} />
      <Card tone="soft">
        <Eyebrow>YOUR DAY, AT A GLANCE</Eyebrow>
        <Row>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt large style={{ fontSize: 56, lineHeight: 60 }}>
              {remaining.length.toString().padStart(2, "0")}
            </Txt>
            <Txt muted>tasks remaining</Txt>
          </View>
          <View style={{ alignItems: "center", gap: 6 }}>
            <ProgressRing
              value={habits.length ? done / habits.length : 0}
              label={`${done}/${habits.length}`}
            />
            <Txt muted style={{ fontSize: 11 }}>
              habits complete
            </Txt>
          </View>
        </Row>
      </Card>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {quick.map((q) => (
          <Pressable
            key={q.label}
            accessibilityRole="button"
            accessibilityLabel={`+ ${q.label}`}
            disabled={busy}
            onPress={() =>
              edit(q.kind, {
                date,
                type: q.label === "Income" ? "income" : "expense",
              })
            }
            style={{
              flex: 1,
              minHeight: 80,
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 17,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={q.icon} size={20} color={c.accent} />
            </View>
            <Txt style={{ fontSize: 11, fontWeight: "500" }}>{q.label}</Txt>
          </Pressable>
        ))}
      </View>
      <Section
        title="Today's focus"
        action="Planner"
        onPress={() => open("/planner")}
      />
      {priorities.length ? (
        priorities.map((t) => (
          <TaskRow key={`${t.id}-${t.occurrenceDate}`} item={t} />
        ))
      ) : (
        <Txt muted>Pin up to three priorities for a clear focus.</Txt>
      )}
      <Card onPress={() => open("/planner")}>
        <Section title="Your agenda" />
        <Txt muted>
          {remaining.length} remaining ·{" "}
          {
            remaining.filter((t) => t.startTime && t.plannedDate === date)
              .length
          }{" "}
          scheduled
        </Txt>
        {remaining.slice(0, 3).map((t) => (
          <Row key={`${t.id}-${t.occurrenceDate}`}>
            <Txt style={{ fontSize: 11, color: c.accent, minWidth: 58 }}>
              {t.plannedDate < date ? "Overdue" : (t.startTime ?? "Anytime")}
            </Txt>
            <Txt style={{ flex: 1, fontWeight: "500" }}>{t.title}</Txt>
          </Row>
        ))}
      </Card>
      <Card onPress={() => open("/habits")}>
        <Row>
          <View style={{ flex: 1 }}>
            <Eyebrow>YOUR ROUTINES</Eyebrow>
            <Txt
              style={{
                fontFamily: "Newsreader",
                fontSize: 25,
                lineHeight: 32,
                marginTop: 6,
              }}
            >
              {done} of {habits.length} complete
            </Txt>
          </View>
          <Ionicons name="leaf-outline" size={26} color={c.accent} />
        </Row>
        <Txt muted style={{ fontSize: 12 }}>
          {habits.length
            ? habits
                .slice(0, 2)
                .map((h) => h.name)
                .join(" · ")
            : "Begin with one simple routine."}
        </Txt>
      </Card>
      <Card onPress={() => open("/money")}>
        <Eyebrow>MONEY TODAY</Eyebrow>
        <View style={{ flexDirection: "row", gap: 24 }}>
          <View style={{ flex: 1, gap: 5 }}>
            <Txt muted style={{ fontSize: 11 }}>
              Income
            </Txt>
            <Txt style={{ fontWeight: "600", fontSize: 19, lineHeight: 26 }}>
              {fmt(daily.income)}
            </Txt>
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Txt muted style={{ fontSize: 11 }}>
              Expenses
            </Txt>
            <Txt style={{ fontWeight: "600", fontSize: 19, lineHeight: 26 }}>
              {fmt(daily.expenses)}
            </Txt>
          </View>
        </View>
        <View
          style={{ borderTopWidth: 1, borderColor: c.border, paddingTop: 12 }}
        >
          <Txt muted style={{ fontSize: 11 }}>
            Month net {monthly.net < 0 ? "deficit" : "surplus"} ·{" "}
            {fmt(Math.abs(monthly.net))}
          </Txt>
        </View>
      </Card>
      <Disclosure title="Evening check-in">
        <Card>
          <Txt>
            {done} habits completed.{" "}
            {remaining.filter((t) => t.plannedDate === date).length} tasks
            unfinished. {fmt(daily.expenses)} spent.
          </Txt>
          <Txt muted>
            Review your habits, move unfinished tasks, or record any missing
            spending.
          </Txt>
          <Txt muted>
            Month income {fmt(monthly.income)} · expenses{" "}
            {fmt(monthly.expenses)}
          </Txt>
        </Card>
      </Disclosure>
    </Screen>
  );
}
