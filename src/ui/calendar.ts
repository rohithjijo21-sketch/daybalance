import { isDate, localDate } from "../domain/model";

export function calendarDays(
  month: string,
  weekStart: 0 | 1,
): (string | null)[] {
  const first = `${month}-01`;
  if (!isDate(first)) return [];
  const date = new Date(`${first}T12:00:00`);
  const offset = (date.getDay() - weekStart + 7) % 7;
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= end; day++)
    cells.push(`${month}-${String(day).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function shiftMonth(month: string, amount: number): string {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  return localDate(date).slice(0, 7);
}

export function dateAllowed(date: string, min?: string, max?: string): boolean {
  return isDate(date) && (!min || date >= min) && (!max || date <= max);
}

export function clockTime(
  hour: number,
  minute: number,
  period: "AM" | "PM",
): string {
  return `${String((hour % 12) + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
