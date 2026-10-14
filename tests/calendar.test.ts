import { describe, expect, it } from "vitest";
import { calendarDays, clockTime, dateAllowed, shiftMonth } from "../src/ui/calendar";

describe("calendar selection", () => {
  it("lays out leap February with the configured first weekday", () => {
    const monday = calendarDays("2024-02", 1);
    const sunday = calendarDays("2024-02", 0);
    expect(monday.indexOf("2024-02-01")).toBe(3);
    expect(sunday.indexOf("2024-02-01")).toBe(4);
    expect(monday.filter(Boolean)).toHaveLength(29);
    expect(monday).toContain("2024-02-29");
    expect(monday.length % 7).toBe(0);
    expect(calendarDays("2025-02", 1).filter(Boolean)).toHaveLength(28);
  });
  it("keeps six-week months and rollover navigation complete", () => {
    expect(calendarDays("2026-08", 1)).toHaveLength(42);
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2024-02", 12)).toBe("2025-02");
  });
  it("rejects invalid dates and enforces inclusive date limits", () => {
    expect(calendarDays("2026-13", 1)).toEqual([]);
    expect(dateAllowed("2025-02-29")).toBe(false);
    expect(dateAllowed("2026-10-14", "2026-10-01", "2026-10-14")).toBe(true);
    expect(dateAllowed("2026-10-15", undefined, "2026-10-14")).toBe(false);
    expect(dateAllowed("2026-09-30", "2026-10-01")).toBe(false);
  });
  it("converts noon, midnight, and every selectable minute to stored time", () => {
    expect(clockTime(12, 0, "AM")).toBe("00:00");
    expect(clockTime(12, 0, "PM")).toBe("12:00");
    expect(clockTime(11, 59, "PM")).toBe("23:59");
    expect(clockTime(9, 7, "AM")).toBe("09:07");
  });
});
