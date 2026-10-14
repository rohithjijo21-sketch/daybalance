import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useStore } from "../../src/data/store";
import { isDate, localDate } from "../../src/domain/model";
import { habitDone, scheduled } from "../../src/domain/calculations";
import {
  Button,
  Card,
  Segmented,
  Disclosure,
  DateNav,
  Empty,
  Screen,
  Txt,
  Section,
  Eyebrow,
  ProgressRing,
  Row,
  useTheme,
} from "../../src/ui/components";
import { edit, HabitRow } from "../../src/ui/records";
export default function Habits() {
  const { state, now } = useStore();
  const c = useTheme();
  const params = useLocalSearchParams<{ date?: string }>();
  const [selected, setDate] = useState<string | null>(null);
  useEffect(() => setDate(null), [params.date]);
  const date = selected ?? params.date ?? localDate(new Date(now));
  const [tab, setTab] = useState("active");
  if (!state) return <Screen title="Habits">{null}</Screen>;
  const list = state.habits.filter((h) => h.archived === (tab === "archived"));
  const eligible = list.filter((h) => scheduled(h, date));
  const done = eligible.filter((h) => habitDone(state, h, date)).length;
  return (
    <Screen title="Habits" subtitle="Small rituals. Steady days.">
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Segmented
            values={["active", "archived"]}
            value={tab}
            onChange={setTab}
          />
        </View>
        <Button
          title="+"
          accessibilityLabel="+ New habit"
          onPress={() => edit("habit")}
        />
      </View>
      <DateNav date={date} onChange={setDate} />
      {tab === "active" ? (
        <Card tone="soft">
          <Row>
            <View style={{ flex: 1, gap: 6 }}>
              <Eyebrow>DAILY CONSISTENCY</Eyebrow>
              <Txt large style={{ fontSize: 38 }}>
                {done.toString().padStart(2, "0")}{" "}
                <Txt
                  style={{
                    fontFamily: "Newsreader",
                    fontSize: 27,
                    color: c.muted,
                  }}
                >
                  / {eligible.length.toString().padStart(2, "0")}
                </Txt>
              </Txt>
              <Txt muted style={{ fontSize: 12 }}>
                scheduled habits complete
              </Txt>
            </View>
            <ProgressRing
              value={eligible.length ? done / eligible.length : 0}
              label={`${eligible.length ? Math.round((done / eligible.length) * 100) : 0}%`}
            />
          </Row>
        </Card>
      ) : (
        <Card tone="soft">
          <Eyebrow>YOUR COLLECTION</Eyebrow>
          <Txt large>{list.length} archived routines</Txt>
          <Txt muted>Your history is kept, ready to revisit.</Txt>
        </Card>
      )}
      <Section title={tab === "active" ? "Your routines" : "Past routines"} />
      {!isDate(date) ? (
        <Txt>Enter a valid date.</Txt>
      ) : list.length ? (
        list.map((h) => (
          <View key={h.id} style={{ gap: 8 }}>
            <HabitRow habit={h} date={date} />
            {!scheduled(h, date) && (
              <Txt muted style={{ fontSize: 11 }}>
                Not scheduled on this day. Extra check-ins do not affect daily
                rates.
              </Txt>
            )}
          </View>
        ))
      ) : (
        <Empty
          title={tab === "active" ? "Start small" : "Nothing archived yet"}
          body="A routine can be as simple as a glass of water or a few quiet minutes."
          action={tab === "active" ? "Create a habit" : undefined}
          onPress={() => edit("habit")}
        />
      )}
      <Disclosure title="How completion works">
        <Card>
          <Txt muted>
            Scheduled days count toward daily rates. An unfinished today does
            not break a streak. Weekly targets count completed weeks, including
            a partial first week with the full target.
          </Txt>
        </Card>
      </Disclosure>
    </Screen>
  );
}
