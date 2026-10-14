import React, { useState } from "react";
import { Keyboard, Modal, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../data/store";
import { isDate, localDate } from "../domain/model";
import { Button, Row, Txt, useTheme } from "./components";
import { calendarDays, clockTime, dateAllowed, shiftMonth } from "./calendar";

const months = Array.from({ length: 12 }, (_, i) =>
  new Date(2024, i, 1).toLocaleDateString("en-IN", { month: "short" }),
);
function friendly(value: string, monthOnly = false) {
  const date = monthOnly ? `${value}-01` : value;
  return isDate(date)
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
        day: monthOnly ? undefined : "numeric",
        month: "long",
        year: "numeric",
      })
    : "Select date";
}

function PickerSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const c = useTheme();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(20,14,10,0.55)",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss picker"
          onPress={onClose}
          style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.card,
            borderRadius: 26,
            padding: 18,
            maxHeight: "90%",
            width: "100%",
            maxWidth: 420,
            alignSelf: "center",
            gap: 16,
          }}
        >
          <Row>
            <Txt style={{ flex: 1, fontSize: 25 }}>{title}</Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close picker"
              onPress={onClose}
              style={{
                minHeight: 44,
                minWidth: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={22} color={c.text} />
            </Pressable>
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 16 }}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PickerTrigger({
  label,
  value,
  placeholder,
  onPress,
  time = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  time?: boolean;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <Txt style={{ fontWeight: "500", fontSize: 12, letterSpacing: 0.3 }}>
        {label}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityHint={
          time ? "Opens the time picker" : "Opens the calendar"
        }
        onPress={() => {
          Keyboard.dismiss();
          onPress();
        }}
        style={{
          minHeight: 54,
          padding: 16,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.card,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Txt muted={!value} style={{ flex: 1, fontSize: 16 }}>
          {value || placeholder}
        </Txt>
        <Ionicons
          name={time ? "time-outline" : "calendar-outline"}
          color={c.accent}
          size={21}
        />
      </Pressable>
    </View>
  );
}

export function CalendarPicker({
  value,
  onChange,
  onClose,
  label = "Choose a date",
  optional = false,
  monthOnly = false,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  label?: string;
  optional?: boolean;
  monthOnly?: boolean;
  min?: string;
  max?: string;
}) {
  const c = useTheme();
  const { state } = useStore();
  const today = localDate();
  const initial = monthOnly ? `${value}-01` : value;
  const fallback = min && today < min ? min : max && today > max ? max : today;
  const seed = dateAllowed(initial, min, max) ? initial : fallback;
  const [selected, setSelected] = useState(monthOnly ? seed.slice(0, 7) : seed);
  const [month, setMonth] = useState(seed.slice(0, 7));
  const [panel, setPanel] = useState<"days" | "months" | "years">(
    monthOnly ? "months" : "days",
  );
  const [yearPage, setYearPage] = useState(
    Math.floor(Number(month.slice(0, 4)) / 12) * 12,
  );
  const year = Number(month.slice(0, 4));
  const start = state?.settings.weekStart ?? 1;
  const cells = calendarDays(month, start);
  const commit = (next: string) => {
    onChange(next);
    onClose();
  };
  const chip = (
    title: string,
    active: boolean,
    onPress: () => void,
    disabled = false,
    width: `${number}%` = "33.333%",
    a11y = title,
  ) => (
    <View key={a11y} style={{ width, padding: 2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityState={{ selected: active, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={{
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 13,
          backgroundColor: active ? c.accent : "transparent",
          opacity: disabled ? 0.3 : 1,
          borderWidth: a11y === friendly(today) && !active ? 1 : 0,
          borderColor: c.accent,
        }}
      >
        <Txt
          style={{
            color: active ? c.bg : c.text,
            fontWeight: active ? "600" : "400",
            fontSize: 14,
          }}
        >
          {title}
        </Txt>
      </Pressable>
    </View>
  );
  return (
    <PickerSheet title={label} onClose={onClose}>
      <Txt muted>{friendly(selected, monthOnly)}</Txt>
      <Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            panel === "days"
              ? "Previous month"
              : panel === "years"
                ? "Previous years"
                : "Previous year"
          }
          disabled={
            panel === "days"
              ? year <= 1 && month.endsWith("01")
              : panel === "years"
                ? yearPage <= 1
                : year <= 1
          }
          onPress={() =>
            panel === "years"
              ? setYearPage(Math.max(1, yearPage - 12))
              : setMonth(shiftMonth(month, panel === "days" ? -1 : -12))
          }
          style={{
            minWidth: 44,
            minHeight: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={20} color={c.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Row>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose month"
              onPress={() => setPanel("months")}
              style={{ padding: 8 }}
            >
              <Txt style={{ fontWeight: "600" }}>
                {months[Number(month.slice(5, 7)) - 1]}
              </Txt>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose year"
              onPress={() => {
                setYearPage(Math.floor(year / 12) * 12);
                setPanel("years");
              }}
              style={{ padding: 8 }}
            >
              <Txt style={{ fontWeight: "600" }}>
                {panel === "years"
                  ? `${yearPage}–${Math.min(9999, yearPage + 11)}`
                  : year}
              </Txt>
            </Pressable>
          </Row>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            panel === "days"
              ? "Next month"
              : panel === "years"
                ? "Next years"
                : "Next year"
          }
          disabled={
            panel === "days"
              ? year >= 9999 && month.endsWith("12")
              : panel === "years"
                ? yearPage + 12 > 9999
                : year >= 9999
          }
          onPress={() =>
            panel === "years"
              ? setYearPage(yearPage + 12)
              : setMonth(shiftMonth(month, panel === "days" ? 1 : 12))
          }
          style={{
            minWidth: 44,
            minHeight: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={c.text} />
        </Pressable>
      </Row>
      {panel === "days" ? (
        <View>
          <View style={{ flexDirection: "row" }}>
            {Array.from({ length: 7 }, (_, i) => (i + start) % 7).map((d) => (
              <View
                key={d}
                style={{
                  width: "14.285714%",
                  alignItems: "center",
                  paddingBottom: 8,
                }}
              >
                <Txt muted style={{ fontSize: 11 }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]}
                </Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {cells.map((d, i) =>
              d ? (
                chip(
                  String(Number(d.slice(8))),
                  selected === d,
                  () => setSelected(d),
                  !dateAllowed(d, min, max),
                  "14.285714%",
                  friendly(d),
                )
              ) : (
                <View
                  key={`empty-${i}`}
                  style={{ width: "14.285714%", minHeight: 48 }}
                />
              ),
            )}
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {panel === "months"
            ? months.map((name, i) => {
                const m = `${String(year).padStart(4, "0")}-${String(i + 1).padStart(2, "0")}`;
                const disabled = !!(
                  (min && m < min.slice(0, 7)) ||
                  (max && m > max.slice(0, 7))
                );
                return chip(
                  name,
                  monthOnly ? selected === m : month === m,
                  () => {
                    setMonth(m);
                    if (monthOnly) setSelected(m);
                    else setPanel("days");
                  },
                  disabled,
                  "33.333%",
                  `${name} ${year}`,
                );
              })
            : Array.from({ length: 12 }, (_, i) => yearPage + i)
                .filter((y) => y >= 1 && y <= 9999)
                .map((y) =>
                  chip(String(y), year === y, () => {
                    setMonth(`${String(y).padStart(4, "0")}-${month.slice(5)}`);
                    setPanel("months");
                  }),
                )}
        </View>
      )}
      <Row>
        <Button
          secondary
          title={monthOnly ? "This month" : "Today"}
          disabled={!dateAllowed(today, min, max)}
          onPress={() => {
            setSelected(monthOnly ? today.slice(0, 7) : today);
            setMonth(today.slice(0, 7));
            setPanel(monthOnly ? "months" : "days");
          }}
        />
        {optional && (
          <Button secondary title="Clear date" onPress={() => commit("")} />
        )}
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Button secondary title="Cancel" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Use date"
            disabled={
              monthOnly
                ? !dateAllowed(
                    `${selected}-01`,
                    min ? `${min.slice(0, 7)}-01` : undefined,
                    max,
                  )
                : !dateAllowed(selected, min, max)
            }
            onPress={() => commit(selected)}
          />
        </View>
      </Row>
    </PickerSheet>
  );
}

export function DateField({
  label,
  value,
  onChange,
  optional = false,
  monthOnly = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  monthOnly?: boolean;
  min?: string;
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PickerTrigger
        label={label}
        value={value ? friendly(value, monthOnly) : ""}
        placeholder={
          optional ? "Not set" : monthOnly ? "Select month" : "Select date"
        }
        onPress={() => setOpen(true)}
      />
      {open && (
        <CalendarPicker
          label={label}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
          optional={optional}
          monthOnly={monthOnly}
          min={min}
          max={max}
        />
      )}
    </>
  );
}

function TimePicker({
  label,
  value,
  onChange,
  onClose,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const seed = /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "09:00";
  const [hour, setHour] = useState(Number(seed.slice(0, 2)) % 12 || 12);
  const [minute, setMinute] = useState(Number(seed.slice(3)));
  const [period, setPeriod] = useState<"AM" | "PM">(
    Number(seed.slice(0, 2)) >= 12 ? "PM" : "AM",
  );
  const time = clockTime(hour, minute, period);
  const commit = (v: string) => {
    onChange(v);
    onClose();
  };
  const column = (
    title: string,
    values: (string | number)[],
    selected: string | number,
    choose: (v: string | number) => void,
  ) => (
    <View style={{ flex: 1, gap: 8 }}>
      <Txt muted style={{ textAlign: "center", fontSize: 12 }}>
        {title}
      </Txt>
      <ScrollView
        style={{ height: 220, backgroundColor: c.bg, borderRadius: 16 }}
        nestedScrollEnabled
        contentOffset={{
          x: 0,
          y: Math.max(0, values.indexOf(selected) - 2) * 44,
        }}
      >
        {values.map((v) => (
          <Pressable
            key={v}
            accessibilityRole="button"
            accessibilityLabel={`${title} ${v}`}
            accessibilityState={{ selected: v === selected }}
            onPress={() => choose(v)}
            style={{
              height: 44,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 12,
              backgroundColor: v === selected ? c.accent : "transparent",
            }}
          >
            <Txt
              style={{ color: v === selected ? c.bg : c.text, fontSize: 18 }}
            >
              {typeof v === "number" ? String(v).padStart(2, "0") : v}
            </Txt>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
  return (
    <PickerSheet title={label} onClose={onClose}>
      <Txt
        style={{ fontSize: 32, textAlign: "center" }}
      >{`${hour}:${String(minute).padStart(2, "0")} ${period}`}</Txt>
      <Txt muted style={{ textAlign: "center" }}>
        Select an hour, minute and AM or PM.
      </Txt>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {column(
          "Hour",
          Array.from({ length: 12 }, (_, i) => i + 1),
          hour,
          (v) => setHour(Number(v)),
        )}
        {column(
          "Minute",
          Array.from({ length: 60 }, (_, i) => i),
          minute,
          (v) => setMinute(Number(v)),
        )}
        {column("Period", ["AM", "PM"], period, (v) =>
          setPeriod(v as "AM" | "PM"),
        )}
      </View>
      <Button secondary title="Clear time" onPress={() => commit("")} />
      <Row>
        <View style={{ flex: 1 }}>
          <Button secondary title="Cancel" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Use time" onPress={() => commit(time)} />
        </View>
      </Row>
    </PickerSheet>
  );
}

export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hours = Number(value.slice(0, 2));
  return (
    <>
      <PickerTrigger
        label={label}
        time
        value={
          value
            ? `${hours % 12 || 12}:${value.slice(3)} ${hours >= 12 ? "PM" : "AM"}`
            : ""
        }
        placeholder="Not set"
        onPress={() => setOpen(true)}
      />
      {open && (
        <TimePicker
          label={label}
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
