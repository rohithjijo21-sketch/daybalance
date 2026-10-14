import { DateField } from "../../src/ui/pickers";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { useStore } from "../../src/data/store";
import { isDate, localDate } from "../../src/domain/model";
import {
  addDays,
  budgetProgress,
  dueItems,
  money,
  totals,
  weekStart,
} from "../../src/domain/calculations";
import {
  Button,
  Card,
  Choices,
  Disclosure,
  Empty,
  Eyebrow,
  useTheme,
  Field,
  Progress,
  Row,
  Screen,
  Section,
  Txt,
} from "../../src/ui/components";
import { edit, TransactionRow } from "../../src/ui/records";
export default function Money() {
  const { state, now } = useStore();
  const c = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = localDate(new Date(now));
  const [period, setPeriod] = useState("monthly");
  const [date, setDate] = useState(params.date ?? today);
  useEffect(() => {
    if (params.date) setDate(params.date);
  }, [params.date]);
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [method, setMethod] = useState("all");
  const [dueLimit, setDueLimit] = useState(20);
  if (!state) return <Screen title="Money">{null}</Screen>;
  const valid = isDate(date) && isDate(from) && isDate(to);
  const start = valid
    ? period === "daily"
      ? date
      : period === "weekly"
        ? weekStart(date, state.settings.weekStart)
        : period === "monthly"
          ? `${date.slice(0, 7)}-01`
          : from
    : today;
  const end = valid
    ? period === "daily"
      ? date
      : period === "weekly"
        ? addDays(start, 6)
        : period === "monthly"
          ? addDays(
              `${date.slice(0, 7)}-${new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0).getDate()}`,
              0,
            )
          : to
    : today;
  const tx = state.transactions
    .filter(
      (t) =>
        t.date >= start &&
        t.date <= end &&
        (type === "all" || t.type === type) &&
        (category === "all" || t.categoryId === category) &&
        (method === "all" || t.method === method) &&
        `${t.note} ${state.categories.find((c) => c.id === t.categoryId)?.name} ${t.amount}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const income = tx
    .filter((t) => t.type === "income")
    .reduce((n, t) => n + t.amount, 0);
  const expenses = tx
    .filter((t) => t.type === "expense")
    .reduce((n, t) => n + t.amount, 0);
  const fmt = (n: number) => money(n, state.settings.currency);
  const due = dueItems(state, today);
  const upcoming = dueItems(state, addDays(today, 30), addDays(today, 1));
  const budgets = state.budgets.filter((b) => b.month === date.slice(0, 7));
  return (
    <Screen title="Money" subtitle="A little clarity for your finances.">
      <Card tone="soft">
        <Eyebrow>
          {period === "monthly"
            ? "MONTHLY OVERVIEW"
            : period === "weekly"
              ? "WEEKLY OVERVIEW"
              : period === "daily"
                ? "DAILY OVERVIEW"
                : "PERIOD OVERVIEW"}
        </Eyebrow>
        <Txt large style={{ fontSize: 38, lineHeight: 46 }}>
          {fmt(Math.abs(income - expenses))}
        </Txt>
        <Txt muted style={{ fontSize: 12 }}>
          Net {income - expenses < 0 ? "deficit" : "surplus"} · income minus
          expenses
        </Txt>
        <View
          style={{
            flexDirection: "row",
            gap: 24,
            borderTopWidth: 1,
            borderColor: c.border,
            paddingTop: 18,
            marginTop: 4,
          }}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Txt muted style={{ fontSize: 10 }}>
              INCOME
            </Txt>
            <Txt style={{ fontWeight: "600", fontSize: 18, lineHeight: 26 }}>
              {fmt(income)}
            </Txt>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt muted style={{ fontSize: 10 }}>
              EXPENSES
            </Txt>
            <Txt style={{ fontWeight: "600", fontSize: 18, lineHeight: 26 }}>
              {fmt(expenses)}
            </Txt>
          </View>
        </View>
        <Txt muted style={{ fontSize: 10 }}>
          {start} — {end}
          {type !== "all" || category !== "all" || method !== "all" || search
            ? " · Filtered"
            : ""}
        </Txt>
      </Card>
      <Row>
        <Button
          title="+ Expense"
          onPress={() => edit("transaction", { type: "expense", date: today })}
        />
        <Button
          secondary
          title="+ Income"
          onPress={() => edit("transaction", { type: "income", date: today })}
        />
      </Row>
      <Disclosure title="Period & filters">
        <Choices
          label="Period"
          values={["daily", "weekly", "monthly", "custom"]}
          value={period}
          onChange={setPeriod}
        />
        {period === "custom" ? (
          <>
            <DateField label="From" value={from} onChange={setFrom} />
            <DateField label="To" value={to} onChange={setTo} />
          </>
        ) : (
          <DateField label="Date in period" value={date} onChange={setDate} />
        )}
        {(!valid || end < start) && (
          <Txt>Enter valid dates with the end on or after the start.</Txt>
        )}
      </Disclosure>

      <Disclosure title="Search & filters">
        <Field
          label="Search transactions"
          value={search}
          onChange={setSearch}
          placeholder="Category or note"
        />
        <Choices
          label="Transaction type"
          values={["all", "expense", "income"]}
          value={type}
          onChange={setType}
        />
        <Row>
          <Button
            title="All categories"
            secondary={category !== "all"}
            onPress={() => setCategory("all")}
          />
          {state.categories
            .filter((c) =>
              state.transactions.some((t) => t.categoryId === c.id),
            )
            .map((c) => (
              <Button
                key={c.id}
                title={c.name}
                secondary={category !== c.id}
                onPress={() => setCategory(c.id)}
              />
            ))}
        </Row>
        <Choices
          label="Payment method"
          values={["all", "cash", "UPI", "card", "bank transfer", "other"]}
          value={method}
          onChange={setMethod}
        />
      </Disclosure>
      <Section title="Transactions" />
      {tx.length ? (
        <Card>
          {tx.map((t, i) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              compact
              last={i === tx.length - 1}
            />
          ))}
        </Card>
      ) : (
        <Empty
          title="No transactions in this view"
          body="Record income or an expense, or adjust your filters."
        />
      )}
      <Section
        title="Monthly budgets"
        action="+ Set budget"
        onPress={() => edit("budget", { month: date.slice(0, 7) })}
      />
      {budgets.map((b) => {
        const p = budgetProgress(state, b);
        return (
          <Card key={b.id} onPress={() => edit("budget", { id: b.id })}>
            <Txt style={{ fontWeight: "700" }}>
              {b.categoryId
                ? state.categories.find((c) => c.id === b.categoryId)?.name
                : "Overall expenses"}
            </Txt>
            <Txt>
              Limit {fmt(b.amount)} · Spent {fmt(p.spent)}
            </Txt>
            <Progress
              value={p.used}
              label={`${Math.round(p.used * 100)}% used · ${p.state}`}
            />
            <Txt>
              {p.remaining < 0 ? "Over budget" : "Remaining"}{" "}
              {fmt(Math.abs(p.remaining))}
            </Txt>
          </Card>
        );
      })}
      {!budgets.length && (
        <Txt muted>
          No budget for {date.slice(0, 7)}. Overall and category limits are
          independent.
        </Txt>
      )}
      <Disclosure title="Recurring entries">
        <Section
          title="Recurring entries"
          action="+ Add"
          onPress={() => edit("recurring")}
        />
        <Txt muted>
          Due and upcoming entries are excluded from recorded totals until you
          confirm them.
        </Txt>
        {state.recurring.map((r) => (
          <Card key={r.id} onPress={() => edit("recurring", { id: r.id })}>
            <Txt>
              {state.categories.find((c) => c.id === r.categoryId)?.name} ·{" "}
              {fmt(r.amount)} · {r.schedule.kind}
              {r.archived ? " · Archived" : ""}
            </Txt>
            <Txt muted>
              {r.start}
              {r.end ? ` to ${r.end}` : ""}
              {r.note ? ` · ${r.note}` : ""}
            </Txt>
          </Card>
        ))}
        <Section title={`Due for confirmation (${due.length})`} />
        {due.slice(0, dueLimit).map((d) => (
          <Card key={`${d.rule.id}-${d.date}`}>
            <Txt>
              {d.date} · {d.rule.type} · {fmt(d.rule.amount)}
            </Txt>
            <Txt muted>
              {state.categories.find((c) => c.id === d.rule.categoryId)?.name} ·{" "}
              {d.rule.note}
            </Txt>
            <Button
              secondary
              title="Confirm and record"
              onPress={() =>
                edit("transaction", { recurringId: d.rule.id, date: d.date })
              }
            />
          </Card>
        ))}
        {due.length > dueLimit && (
          <Button
            secondary
            title="Show more due entries"
            onPress={() => setDueLimit(dueLimit + 20)}
          />
        )}
        <Section title="Upcoming · next 30 days" />
        {upcoming.slice(0, 20).map((d) => (
          <Txt key={`${d.rule.id}-${d.date}`} muted>
            {d.date} ·{" "}
            {state.categories.find((c) => c.id === d.rule.categoryId)?.name} ·{" "}
            {fmt(d.rule.amount)} (not recorded)
          </Txt>
        ))}
        {!upcoming.length && <Txt muted>No upcoming recurring entries.</Txt>}
      </Disclosure>
      <Disclosure title="Unfiltered totals">
        <Txt muted>
          Selected-period totals before search filters: income{" "}
          {fmt(totals(state, start, end).income)}, expenses{" "}
          {fmt(totals(state, start, end).expenses)}.
        </Txt>
      </Disclosure>
    </Screen>
  );
}
