import React, { useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { useStore } from "../../src/data/store";
import { isDate, localDate } from "../../src/domain/model";
import {
  addDays,
  budgetProgress,
  currencyDigits,
  dates,
  habitDone,
  habitStats,
  money,
  scheduled,
  taskItems,
  totals,
  weekStart,
} from "../../src/domain/calculations";
import {
  Card,
  Choices,
  Disclosure,
  Field,
  Progress,
  Screen,
  Section,
  Txt,
  useTheme,
  Eyebrow,
} from "../../src/ui/components";
import { fonts } from "../../src/ui/typography";
export default function Insights() {
  const { state, now } = useStore();
  const c = useTheme();
  const { width } = useWindowDimensions();
  const today = localDate(new Date(now));
  const [period, setPeriod] = useState("week");
  const [date, setDate] = useState(today);
  const [customFrom, setFrom] = useState(addDays(today, -6));
  const [customTo, setTo] = useState(today);
  if (!state) return <Screen title="Insights">{null}</Screen>;
  const valid = isDate(date) && isDate(customFrom) && isDate(customTo);
  if (!valid)
    return (
      <Screen title="Insights">
        <Field label="Date (YYYY-MM-DD)" value={date} onChange={setDate} />
        <Field label="From" value={customFrom} onChange={setFrom} />
        <Field label="To" value={customTo} onChange={setTo} />
        <Txt>Use valid dates.</Txt>
      </Screen>
    );
  const from =
    period === "week"
      ? weekStart(date, state.settings.weekStart)
      : period === "month"
        ? `${date.slice(0, 7)}-01`
        : customFrom;
  const to =
    period === "week"
      ? addDays(from, 6)
      : period === "month"
        ? `${date.slice(0, 7)}-${new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0).getDate()}`
        : customTo;
  const tasks = taskItems(state, from, to);
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = taskItems(state, today, today, true).filter(
    (t) => t.plannedDate < today,
  ).length;
  const sum = totals(state, from, to);
  const fmt = (n: number) => money(n, state.settings.currency);
  const categories = state.categories
    .filter((cat) => cat.type === "expense")
    .map((cat, i) => ({
      name: cat.name,
      amount: state.transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.categoryId === cat.id &&
            t.date >= from &&
            t.date <= to,
        )
        .reduce((n, t) => n + t.amount, 0),
      color: ["#95532F", "#C39166", "#867060", "#D9B583", "#9B835B", "#B77662"][
        i % 6
      ]!,
    }))
    .filter((v) => v.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const habits = state.habits.map((h) => ({
    h,
    stats: habitStats(state, h, today, from, to < today ? to : today),
  }));
  const habitCompleted = habits.reduce((n, v) => n + v.stats.completed, 0);
  const habitPlanned = habits.reduce((n, v) => n + v.stats.planned, 0);
  const timeline = from <= to ? dates(from, to) : [];
  const plotted = timeline.slice(-31);
  const taskPeak = Math.max(
    1,
    ...plotted.map(
      (d) =>
        taskItems(state, d, d).filter((t) => t.status === "completed").length,
    ),
  );
  const taskChartMax = taskPeak <= 5 ? taskPeak : Math.ceil(taskPeak / 5) * 5;
  const weeks = [
    ...new Set(timeline.map((d) => weekStart(d, state.settings.weekStart))),
  ];
  const chartWidth = Math.max(160, Math.min(width, 620) - 104);
  const reviewFrom = weekStart(date, state.settings.weekStart),
    reviewTo = addDays(reviewFrom, 6);
  const reviewTasks = taskItems(state, reviewFrom, reviewTo);
  const reviewTotals = totals(state, reviewFrom, reviewTo);
  const reviewHabits = state.habits.reduce(
    (n, h) =>
      n +
      dates(reviewFrom, reviewTo).filter(
        (d) => scheduled(h, d) && habitDone(state, h, d),
      ).length,
    0,
  );
  const highest = state.categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      amount: state.transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.categoryId === c.id &&
            t.date >= reviewFrom &&
            t.date <= reviewTo,
        )
        .reduce((n, t) => n + t.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount)[0];
  return (
    <Screen title="Insights" subtitle="A clearer view of your rhythm.">
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card tone="soft">
            <Eyebrow>HABITS</Eyebrow>
            <Txt large style={{ fontSize: 36 }}>
              {habitPlanned
                ? `${Math.round((habitCompleted / habitPlanned) * 100)}%`
                : "—"}
            </Txt>
            <Txt muted style={{ fontSize: 10 }}>
              goal completion
            </Txt>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Eyebrow>TASKS</Eyebrow>
            <Txt large style={{ fontSize: 36 }}>
              {tasks.length
                ? `${Math.round((completed / tasks.length) * 100)}%`
                : "—"}
            </Txt>
            <Txt muted style={{ fontSize: 10 }}>
              plan completed
            </Txt>
          </Card>
        </View>
      </View>
      <Disclosure title="Change period">
        <Choices
          label="Period"
          values={["week", "month", "custom"]}
          value={period}
          onChange={setPeriod}
        />
        <Field
          label="Date in period (YYYY-MM-DD)"
          value={date}
          onChange={setDate}
        />
        {period === "custom" && (
          <>
            <Field
              label="From (YYYY-MM-DD)"
              value={customFrom}
              onChange={setFrom}
            />
            <Field label="To (YYYY-MM-DD)" value={customTo} onChange={setTo} />
          </>
        )}
      </Disclosure>
      <Txt muted style={{ fontSize: 11 }}>
        {from} to {to}
        {to < from ? " · End must follow start" : ""}
      </Txt>
      <Section title="Your consistency" />
      <Card>
        <Progress
          value={habitPlanned ? habitCompleted / habitPlanned : 0}
          label={`${habitCompleted} / ${habitPlanned} scheduled days or weekly goals completed`}
        />
        <Disclosure title="By routine">
          {habits.map(({ h, stats }) => (
            <View key={h.id} style={{ gap: 6 }}>
              <Txt style={{ fontWeight: "600" }}>
                {h.name}
                {h.archived ? " (archived)" : ""}
              </Txt>
              <Txt muted>
                {Math.round(stats.rate * 100)}% · current {stats.current},
                longest {stats.longest} {stats.unit}
              </Txt>
            </View>
          ))}
        </Disclosure>
        {!habits.length && (
          <Txt muted>Create a habit to begin seeing consistency.</Txt>
        )}
      </Card>
      <Section title="Planner" />
      <Card>
        <Txt>
          {completed} of {tasks.length} planned tasks completed · {overdue}{" "}
          currently overdue
        </Txt>
        <Progress
          value={tasks.length ? completed / tasks.length : 0}
          label={`${tasks.length ? Math.round((completed / tasks.length) * 100) : 0}% task completion`}
        />
        <Disclosure title="Completion trend">
          {plotted.length > 0 && (
            <BarChart
              width={chartWidth}
              height={150}
              barWidth={18}
              spacing={18}
              noOfSections={Math.min(5, taskChartMax)}
              maxValue={taskChartMax}
              yAxisTextStyle={{
                color: c.muted,
                fontFamily: fonts.body,
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: c.muted,
                fontSize: 10,
                fontFamily: fonts.body,
              }}
              yAxisColor={c.border}
              xAxisColor={c.border}
              frontColor={c.accent}
              data={plotted.map((d) => ({
                value: taskItems(state, d, d).filter(
                  (t) => t.status === "completed",
                ).length,
                label: d.slice(5),
              }))}
            />
          )}
          <Txt muted>
            Completed tasks by day. Scroll the chart for all labels; the last 31
            days of the selected range are shown.
          </Txt>
          {weeks.slice(-8).map((w) => {
            const group = tasks.filter(
              (t) => t.plannedDate >= w && t.plannedDate <= addDays(w, 6),
            );
            return (
              <Txt muted key={w}>
                Week from {w}:{" "}
                {group.filter((t) => t.status === "completed").length} /{" "}
                {group.length} tasks completed
              </Txt>
            );
          })}
        </Disclosure>
      </Card>
      <Section title="Income & expenses" />
      <Card>
        <Txt>
          Income {fmt(sum.income)} · Expenses {fmt(sum.expenses)}
        </Txt>
        <Txt style={{ fontWeight: "700" }}>
          Net {sum.net < 0 ? "deficit" : "surplus"} {fmt(Math.abs(sum.net))}
        </Txt>
        <BarChart
          width={chartWidth}
          height={140}
          barWidth={48}
          spacing={40}
          noOfSections={3}
          yAxisTextStyle={{
            color: c.muted,
            fontFamily: fonts.body,
            fontSize: 10,
          }}
          xAxisLabelTextStyle={{
            color: c.muted,
            fontFamily: fonts.body,
            fontSize: 11,
          }}
          yAxisColor={c.border}
          xAxisColor={c.border}
          data={[
            {
              value: sum.income / 10 ** currencyDigits(state.settings.currency),
              label: "Income",
              frontColor: c.accent,
            },
            {
              value:
                sum.expenses / 10 ** currencyDigits(state.settings.currency),
              label: "Expenses",
              frontColor: "#BA8E4D",
            },
          ]}
        />
        <Txt muted>
          Chart values are in {state.settings.currency}; zero means no recorded
          amount.
        </Txt>
      </Card>
      <Section title="Expenses by category" />
      <Card>
        {categories.length ? (
          <>
            <View style={{ alignItems: "center" }}>
              <PieChart
                data={categories.map((v) => ({
                  value: v.amount,
                  color: v.color,
                }))}
                radius={95}
                donut
                innerRadius={62}
                innerCircleColor={c.card}
              />
            </View>
            {categories.map((v) => (
              <Txt key={v.name}>
                {v.name}: {fmt(v.amount)} ·{" "}
                {Math.round((v.amount / sum.expenses) * 100)}%
              </Txt>
            ))}
          </>
        ) : (
          <Txt muted>No recorded expenses in this period.</Txt>
        )}
      </Card>
      <Disclosure title="Spending trends & budgets">
        <Section title="Daily spending" />
        <Card>
          {plotted.length > 0 && (
            <BarChart
              width={chartWidth}
              height={150}
              barWidth={18}
              spacing={18}
              noOfSections={3}
              frontColor={c.accent}
              yAxisTextStyle={{
                color: c.muted,
                fontFamily: fonts.body,
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: c.muted,
                fontFamily: fonts.body,
                fontSize: 10,
              }}
              yAxisColor={c.border}
              xAxisColor={c.border}
              data={plotted.map((d) => ({
                value:
                  totals(state, d, d).expenses /
                  10 ** currencyDigits(state.settings.currency),
                label: d.slice(5),
              }))}
            />
          )}
          <Txt muted>
            Daily recorded expenses in {state.settings.currency}, last 31 days
            of this range.
          </Txt>
          <Txt>
            Total spending {fmt(sum.expenses)} across {timeline.length} days.
          </Txt>
        </Card>
        <Section title="Budget progress" />
        {state.budgets
          .filter((b) => b.month === date.slice(0, 7))
          .map((b) => {
            const p = budgetProgress(state, b);
            return (
              <Card key={b.id}>
                <Txt>
                  {b.categoryId
                    ? state.categories.find((c) => c.id === b.categoryId)?.name
                    : "Overall"}{" "}
                  · {b.month}
                </Txt>
                <Progress
                  value={p.used}
                  label={`${Math.round(p.used * 100)}% · ${p.state}`}
                />
                <Txt>
                  {fmt(p.spent)} spent · {fmt(p.remaining)} remaining
                </Txt>
              </Card>
            );
          })}
      </Disclosure>
      <Card>
        <Section title="Weekly review" />
        <Txt muted>
          {reviewFrom} to {reviewTo}
        </Txt>
        <Txt>
          {reviewHabits} habit check-in days completed.{" "}
          {reviewTasks.filter((t) => t.status === "completed").length} of{" "}
          {reviewTasks.length} tasks completed.
        </Txt>
        <Txt>
          Income {fmt(reviewTotals.income)} · Expenses{" "}
          {fmt(reviewTotals.expenses)}
        </Txt>
        <Txt>
          {highest && highest.amount > 0
            ? `Highest spending category: ${highest.name} (${fmt(highest.amount)}).`
            : "No spending recorded this week."}
        </Txt>
        <Txt muted>
          {reviewTotals.income >= reviewTotals.expenses
            ? "Recorded income met or exceeded recorded expenses."
            : "Recorded expenses exceeded recorded income."}
        </Txt>
      </Card>
    </Screen>
  );
}
