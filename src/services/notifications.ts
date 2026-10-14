import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { State, localDate } from "../domain/model";
import {
  addDays,
  habitDone,
  scheduled,
  taskItems,
} from "../domain/calculations";
if (Platform.OS !== "web")
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
export async function enableReminders(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "DayBalance reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const existing = await Notifications.getPermissionsAsync();
  return (
    existing.granted || (await Notifications.requestPermissionsAsync()).granted
  );
}
let queue = Promise.resolve();
export function syncNotifications(s: State): Promise<void> {
  queue = queue
    .catch(() => {})
    .then(async () => {
      if (Platform.OS === "web") return;
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (
        !s.settings.notifications ||
        !(await Notifications.getPermissionsAsync()).granted
      )
        return;
      const today = localDate();
      const reminders: { title: string; date: Date }[] = [];
      const put = (title: string, day: string, time: string) => {
        const d = new Date(`${day}T${time}:00`);
        if (d.getTime() > Date.now()) reminders.push({ title, date: d });
      };
      for (let i = 0; i < 7; i++) {
        const day = addDays(today, i);
        s.habits
          .filter(
            (h) =>
              !h.archived &&
              h.reminder &&
              scheduled(h, day) &&
              !habitDone(s, h, day),
          )
          .forEach((h) => put(h.name, day, h.reminder!));
        if (s.settings.evening)
          put("Your evening check-in", day, s.settings.evening);
      }
      taskItems(s, today, addDays(today, 6))
        .filter((t) => t.reminder && t.status !== "completed")
        .forEach((t) => put(t.title, t.plannedDate, t.reminder!));
      // iOS limits pending notifications; prioritize the nearest 60.
      for (const r of reminders
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 60))
        await Notifications.scheduleNotificationAsync({
          content: {
            title: r.title,
            body: "Open DayBalance to review your day.",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: r.date,
            channelId: "reminders",
          },
        });
    });
  return queue;
}
