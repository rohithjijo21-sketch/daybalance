import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useStore } from "../src/data/store";
import { localDate } from "../src/domain/model";
import {
  addDays,
  dates,
  habitDone,
  habitStats,
  habitValue,
  scheduled,
} from "../src/domain/calculations";
import {
  Button,
  Card,
  Progress,
  Row,
  Screen,
  Txt,
  useTheme,
} from "../src/ui/components";
import { edit } from "../src/ui/records";
export default function HabitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, now } = useStore();
  const c = useTheme();
  const today = localDate(new Date(now));
  const [end, setEnd] = useState(today);
  const h = state?.habits.find((h) => h.id === id);
  if (!state || !h)
    return (
      <Screen title="Habit unavailable" back>
        <Txt>The habit may have been deleted.</Txt>
      </Screen>
    );
  const stats = habitStats(state, h, today);
  const history = dates(addDays(end, -27), end);
  return (
    <Screen
      title={h.name}
      subtitle={
        h.archived
          ? "Archived · history retained"
          : h.description || "Your consistency, at your pace"
      }
      back
    >
      <Button title="Edit habit" onPress={() => edit("habit", { id })} />
      <Card>
        <Row>
          <Txt>
            Current streak: {stats.current} {stats.unit}
          </Txt>
          <Txt>
            Longest: {stats.longest} {stats.unit}
          </Txt>
        </Row>
        <Progress
          value={stats.rate}
          label={`${Math.round(stats.rate * 100)}% completion · ${stats.completed} of ${stats.planned} ${h.schedule === "weekly" ? "weekly goals" : "scheduled days"}`}
        />
        <Txt muted>
          {h.schedule === "weekly"
            ? `${h.weeklyTarget} completed days per week make a completed week. The current week does not break a streak before it ends. A partial first week uses the full target.`
            : "Only scheduled days count. An unfinished current day does not break a streak before the day ends. Numeric progress counts once the target is reached."}
        </Txt>
      </Card>
      <Row>
        <Button
          secondary
          title="Earlier 28 days"
          onPress={() => setEnd(addDays(end, -28))}
        />
        <Button
          secondary
          title="Later 28 days"
          disabled={end >= today}
          onPress={() =>
            setEnd(addDays(end, 28) > today ? today : addDays(end, 28))
          }
        />
      </Row>
      <Card>
        <Txt style={{ fontWeight: "700" }}>
          Completion history · tap a day to edit
        </Txt>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {history.map((d) => {
            const complete = habitDone(state, h, d);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${d}: ${complete ? "completed" : scheduled(h, d) ? "incomplete" : "not scheduled"}, progress ${habitValue(state, h.id, d)}`}
                key={d}
                disabled={d > today || d < h.start}
                onPress={() => edit("checkin", { id, date: d })}
                style={{
                  minWidth: 48,
                  minHeight: 48,
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: complete ? h.color : c.tint,
                  opacity: scheduled(h, d) ? 1 : 0.4,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Txt
                  style={{ color: complete ? "#FFFFFF" : c.text, fontSize: 12 }}
                >
                  {d.slice(5)}
                </Txt>
                <Txt
                  style={{ color: complete ? "#FFFFFF" : c.text, fontSize: 12 }}
                >
                  {complete ? "✓" : "·"}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <Txt muted>
          ✓ Completed · faded days not scheduled · {history[0]} to {end}
        </Txt>
      </Card>
    </Screen>
  );
}
