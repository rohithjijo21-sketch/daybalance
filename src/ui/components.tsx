import { showAlert } from "./dialogs";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../data/store";
import { addDays } from "../domain/calculations";
import { isDate } from "../domain/model";
import { fonts } from "./typography";
import Svg, { Circle } from "react-native-svg";
import { HabitSymbol, habitIcons } from "./icons";
import { CalendarPicker } from "./pickers";
export function useTheme() {
  const { state } = useStore();
  const system = useColorScheme();
  const dark =
    state?.settings.theme === "dark" ||
    (state?.settings.theme !== "light" && system === "dark");
  return dark
    ? {
        dark: true,
        bg: "#251E1A",
        card: "#332A24",
        text: "#FAEFE1",
        muted: "#CFBBA8",
        accent: "#E7B18B",
        tint: "#49382C",
        border: "#554438",
        danger: "#F3AC99",
      }
    : {
        dark: false,
        bg: "#FAF4EA",
        card: "#FFFCF7",
        text: "#49372A",
        muted: "#816957",
        accent: "#95532F",
        tint: "#F0E1CD",
        border: "#E8D9C6",
        danger: "#A94331",
      };
}
export function Txt({
  children,
  muted = false,
  large = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  large?: boolean;
  style?: object;
}) {
  const c = useTheme();
  const flat = StyleSheet.flatten(style as TextStyle) ?? {};
  const family = large
    ? fonts.display
    : flat.fontWeight === "700"
      ? fonts.bold
      : flat.fontWeight === "600"
        ? fonts.semibold
        : flat.fontWeight === "500"
          ? fonts.medium
          : fonts.body;
  return (
    <Text
      style={[
        {
          color: muted ? c.muted : c.text,
          fontSize: large ? 40 : 14,
          lineHeight: large ? 46 : 22,
          fontFamily: family,
          letterSpacing: large ? -1 : 0,
        },
        {
          ...flat,
          fontWeight: undefined,
          fontFamily: flat.fontFamily ?? family,
        },
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  title,
  accessibilityLabel,
  onPress,
  secondary = false,
  danger = false,
  disabled = false,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const c = useTheme();
  const { busy } = useStore();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: secondary
          ? "transparent"
          : danger
            ? c.danger
            : c.accent,
        borderWidth: secondary ? 1 : 0,
        borderColor: c.border,
        opacity: disabled || busy ? 0.4 : pressed ? 0.75 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: fonts.semibold,
          color: secondary ? c.accent : c.bg,
          fontSize: 13,
          letterSpacing: 0.2,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Row({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {children}
    </View>
  );
}
export function Card({
  children,
  onPress,
  tone = "plain",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  tone?: "plain" | "soft";
}) {
  const c = useTheme();
  const body = (
    <View
      style={{
        backgroundColor: tone === "soft" ? c.tint : c.card,
        borderRadius: 24,
        padding: 22,
        gap: 14,
        borderWidth: 1,
        borderColor: tone === "soft" ? "transparent" : c.border,
      }}
    >
      {children}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  const c = useTheme();
  return (
    <Row>
      <Txt style={{ fontSize: 23, fontFamily: fonts.display, flex: 1 }}>
        {title}
      </Txt>
      {!!action && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Txt style={{ fontSize: 12, fontWeight: "600", color: c.accent }}>
            {action}
          </Txt>
          <Ionicons name="arrow-forward" size={14} color={c.accent} />
        </Pressable>
      )}
    </Row>
  );
}
export function Empty({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <Card>
      <Txt style={{ fontSize: 19, fontWeight: "600" }}>{title}</Txt>
      <Txt muted>{body}</Txt>
      {!!action && <Button title={action} onPress={onPress!} />}
    </Card>
  );
}
export function Screen({
  title,
  subtitle,
  children,
  back = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  back?: boolean;
}) {
  const c = useTheme();
  const { state, error, notice, reload } = useStore();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: back ? 64 : 128,
            gap: 24,
            width: "100%",
            maxWidth: 620,
            alignSelf: "center",
          }}
        >
          <Row>
            {back && (
              <Pressable
                accessibilityLabel="Back"
                accessibilityRole="button"
                onPress={() => router.back()}
                style={{ padding: 12 }}
              >
                <Ionicons name="arrow-back" color={c.text} size={24} />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              {!back && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Image
                    source={require("../../assets/brand/icon.png")}
                    accessibilityLabel="DayBalance logo"
                    style={{ width: 24, height: 24, borderRadius: 7 }}
                  />
                  <Eyebrow>DAYBALANCE</Eyebrow>
                </View>
              )}
              <Txt
                large
                style={{
                  fontSize: back ? 32 : 42,
                  lineHeight: back ? 40 : 50,
                  marginTop: back ? 0 : 7,
                }}
              >
                {title}
              </Txt>
              {!!subtitle && (
                <Txt muted style={{ fontSize: 13, marginTop: 3 }}>
                  {subtitle}
                </Txt>
              )}
            </View>
            {!back && (
              <Pressable
                accessibilityLabel="Settings"
                accessibilityRole="button"
                onPress={() => router.push("/settings")}
                style={{
                  padding: 13,
                  backgroundColor: c.card,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <Ionicons name="settings-outline" size={20} color={c.text} />
              </Pressable>
            )}
          </Row>
          {!!error && (
            <Card>
              <Text accessibilityRole="alert" style={{ color: c.danger }}>
                {error}
              </Text>
              {!state && <Button title="Try again" onPress={reload} />}
            </Card>
          )}
          {!!notice && <Txt muted>{notice}</Txt>}
          {state ? (
            children
          ) : !error ? (
            <ActivityIndicator color={c.accent} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  number = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  number?: boolean;
  multiline?: boolean;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <Txt style={{ fontWeight: "500", fontSize: 12, letterSpacing: 0.3 }}>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={number ? "decimal-pad" : "default"}
        multiline={multiline}
        autoCapitalize="none"
        style={{
          backgroundColor: c.card,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          minHeight: 54,
          color: c.text,
          fontSize: 16,
          fontFamily: fonts.body,
          ...(multiline
            ? { minHeight: 95, textAlignVertical: "top" as const }
            : {}),
        }}
      />
    </View>
  );
}
export function Choices<T extends string | number>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Txt style={{ fontWeight: "600" }}>{label}</Txt>
      <Row>
        {values.map((v) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: value === v }}
            aria-checked={value === v}
            key={v}
            onPress={() => onChange(v)}
            style={{
              minHeight: 44,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: value === v ? "transparent" : c.border,
              backgroundColor: value === v ? c.accent : "transparent",
            }}
          >
            <Text
              style={{
                color: value === v ? c.bg : c.accent,
                fontFamily: fonts.medium,
                fontSize: 12,
              }}
            >
              {v}
            </Text>
          </Pressable>
        ))}
      </Row>
    </View>
  );
}
export function ColorPicker({
  value,
  onChange,
  colors = ["#95532F", "#A97749", "#8B6C59", "#A95242"],
}: {
  value: string;
  onChange: (color: string) => void;
  colors?: readonly string[];
}) {
  const c = useTheme();
  const names: Record<string, string> = {
    "#95532F": "Terracotta",
    "#A97749": "Caramel",
    "#8B6C59": "Cocoa",
    "#A95242": "Clay",
    "#21653D": "Forest green",
    "#456EA8": "Blue",
    "#8656A2": "Purple",
    "#A66A2E": "Amber",
  };
  const options = colors.includes(value) ? colors : [...colors, value];
  return (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontWeight: "600" }}>Color</Txt>
      <Row>
        {options.map((color) => {
          const selected = value.toLowerCase() === color.toLowerCase();
          return (
            <Pressable
              key={color}
              accessibilityRole="radio"
              accessibilityLabel={names[color] ?? "Current color"}
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              onPress={() => onChange(color)}
              style={{
                minWidth: 56,
                minHeight: 56,
                padding: 4,
                borderRadius: 17,
                borderWidth: 2,
                borderColor: selected ? c.accent : c.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  height: 44,
                  width: 44,
                  borderRadius: 12,
                  backgroundColor: color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selected && (
                  <Ionicons name="checkmark" size={24} color="#FFF9F0" />
                )}
              </View>
            </Pressable>
          );
        })}
      </Row>
      <Txt muted>{names[value] ?? "Current color"}</Txt>
    </View>
  );
}
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Txt style={{ fontSize: 12, fontWeight: "500" }}>Icon</Txt>
      <Row>
        {habitIcons.map((icon) => (
          <Pressable
            key={icon.value}
            accessibilityRole="radio"
            accessibilityLabel={icon.name}
            aria-checked={value === icon.value}
            accessibilityState={{ checked: value === icon.value }}
            onPress={() => onChange(icon.value)}
            style={{
              minWidth: 48,
              minHeight: 48,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: value === icon.value ? c.accent : c.border,
              backgroundColor: value === icon.value ? c.tint : c.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HabitSymbol value={icon.value} color={c.accent} size={22} />
          </Pressable>
        ))}
      </Row>
    </View>
  );
}
export function Weekdays({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  const c = useTheme();
  return (
    <Row>
      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
        <Pressable
          accessibilityLabel={
            [
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ][i]
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: value.includes(i) }}
          key={i}
          onPress={() =>
            onChange(
              value.includes(i) ? value.filter((v) => v !== i) : [...value, i],
            )
          }
          style={{
            minHeight: 44,
            minWidth: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: value.includes(i) ? c.accent : c.tint,
          }}
        >
          <Text style={{ color: value.includes(i) ? c.bg : c.accent }}>
            {d}
          </Text>
        </Pressable>
      ))}
    </Row>
  );
}
export function DateNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (d: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <View style={{ gap: 10 }}>
      <Row>
        <Button
          secondary
          title="‹"
          accessibilityLabel="Previous day"
          disabled={!isDate(date)}
          onPress={() => onChange(addDays(date, -1))}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change selected date"
          onPress={() => setEditing(true)}
          style={{
            flex: 1,
            minHeight: 46,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt style={{ fontWeight: "600" }}>
            {isDate(date)
              ? new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })
              : "Choose a date"}
          </Txt>
        </Pressable>
        <Button
          secondary
          title="›"
          accessibilityLabel="Next day"
          disabled={!isDate(date)}
          onPress={() => onChange(addDays(date, 1))}
        />
      </Row>
      {(editing || !isDate(date)) && (
        <CalendarPicker
          label="Selected day"
          value={date}
          onChange={onChange}
          onClose={() => setEditing(false)}
        />
      )}
    </View>
  );
}
export function Disclosure({
  title,
  children,
  initialOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const c = useTheme();
  return (
    <View style={{ gap: open ? 16 : 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          minHeight: 46,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Txt style={{ flex: 1, fontWeight: "600", color: c.accent }}>
          {title}
        </Txt>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={c.accent}
        />
      </Pressable>
      {open ? children : null}
    </View>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Txt muted style={{ fontSize: 12 }}>
        {label}
      </Txt>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
        style={{
          height: 5,
          backgroundColor: c.tint,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.min(100, Math.max(0, value * 100))}%`,
            height: 5,
            backgroundColor: c.accent,
          }}
        />
      </View>
    </View>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return (
    <Txt
      style={{
        fontFamily: fonts.semibold,
        fontSize: 10,
        lineHeight: 15,
        letterSpacing: 2,
        color: c.muted,
      }}
    >
      {children}
    </Txt>
  );
}
export function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const c = useTheme();
  const circumference = 2 * Math.PI * 33;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{
        width: 80,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={80} height={80} style={{ position: "absolute" }}>
        <Circle
          cx={40}
          cy={40}
          r={33}
          stroke={c.border}
          strokeWidth={5}
          fill="none"
        />
        <Circle
          cx={40}
          cy={40}
          r={33}
          stroke={c.accent}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={
            circumference * (1 - Math.min(1, Math.max(0, value)))
          }
          transform="rotate(-90 40 40)"
        />
      </Svg>
      <Txt style={{ fontSize: 20, fontWeight: "600" }}>{label}</Txt>
    </View>
  );
}
export function Segmented({
  values,
  value,
  onChange,
}: {
  values: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const c = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.tint,
        borderRadius: 16,
        padding: 4,
        gap: 4,
      }}
    >
      {values.map((v) => (
        <Pressable
          key={v}
          accessibilityRole="radio"
          accessibilityLabel={v}
          accessibilityState={{ checked: value === v }}
          aria-checked={value === v}
          onPress={() => onChange(v)}
          style={{
            flex: 1,
            minHeight: 42,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: value === v ? c.card : "transparent",
          }}
        >
          <Txt
            style={{
              fontFamily: value === v ? fonts.semibold : fonts.medium,
              fontSize: 12,
              textTransform: "capitalize",
            }}
          >
            {v}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}
export function confirm(title: string, body: string, action: () => void) {
  showAlert(title, body, [
    { text: "Cancel", style: "cancel" },
    { text: "Confirm", style: "destructive", onPress: action },
  ]);
}
export const styles = StyleSheet.create({
  strong: { fontWeight: "700" },
  small: { fontSize: 12 },
});
