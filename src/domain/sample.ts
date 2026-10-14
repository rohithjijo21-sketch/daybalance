import { addDays, weekStart } from "./calculations";
import { emptyState, localDate, State } from "./model";
export function sampleData(settings: State["settings"]): State {
  const s = emptyState();
  s.settings = { ...settings };
  const today = localDate();
  const start = addDays(today, -13);
  s.habits = [
    {
      id: "sample-water",
      name: "Drink water",
      description: "A glass at a time",
      icon: "💧",
      color: "#456EA8",
      start,
      schedule: "daily",
      weekdays: [],
      weeklyTarget: 3,
      target: 8,
      tracking: "numeric",
      reminder: null,
      archived: false,
    },
    {
      id: "sample-walk",
      name: "Take a walk",
      description: "Some fresh air",
      icon: "🚶",
      color: "#21653D",
      start,
      schedule: "weekdays",
      weekdays: [1, 2, 3, 4, 5],
      weeklyTarget: 3,
      target: 1,
      tracking: "boolean",
      reminder: null,
      archived: false,
    },
  ];
  for (let i = 0; i < 14; i++) {
    s.checkins.push({
      habitId: "sample-water",
      date: addDays(start, i),
      value: i % 4 === 0 ? 4 : 8,
    });
    if (i % 3 !== 0)
      s.checkins.push({
        habitId: "sample-walk",
        date: addDays(start, i),
        value: 1,
      });
  }
  s.tasks = [
    {
      id: "sample-task",
      title: "Plan groceries",
      notes: "Check the pantry first",
      date: today,
      startTime: "18:00",
      endTime: "18:30",
      priority: "high",
      category: "Home",
      reminder: null,
      recurrence: { kind: "none", weekdays: [] },
      until: null,
    },
  ];
  s.occurrences = [
    {
      taskId: "sample-task",
      date: today,
      plannedDate: today,
      status: "pending",
      dailyPriority: true,
      deleted: false,
      title: null,
      notes: null,
      startTime: null,
      endTime: null,
      priority: null,
      category: null,
      reminder: null,
      overridden: false,
    },
  ];
  s.transactions = [
    {
      id: "sample-income",
      type: "income",
      amount: 5000000,
      categoryId: "income-salary",
      date: `${today.slice(0, 7)}-01`,
      note: "Sample salary",
      method: "bank transfer",
      taskId: null,
      taskDate: null,
      recurringId: null,
      recurringDate: null,
    },
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `sample-expense-${i}`,
      type: "expense" as const,
      amount: (300 + i * 50) * 100,
      categoryId: i % 2 ? "expense-transport" : "expense-food",
      date: addDays(weekStart(today, settings.weekStart), i),
      note: "Sample expense",
      method: "UPI" as const,
      taskId: null,
      taskDate: null,
      recurringId: null,
      recurringDate: null,
    })),
  ];
  s.budgets = [
    {
      id: "sample-budget",
      month: today.slice(0, 7),
      categoryId: null,
      amount: 2000000,
    },
  ];
  return s;
}
