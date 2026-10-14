import React from "react";
import { Ionicons } from "@expo/vector-icons";
export const habitIcons = [
  { value: "🌱", name: "Growth", glyph: "leaf-outline" },
  { value: "💧", name: "Water", glyph: "water-outline" },
  { value: "📖", name: "Reading", glyph: "book-outline" },
  { value: "🚶", name: "Walking", glyph: "walk-outline" },
  { value: "🧘", name: "Mindfulness", glyph: "body-outline" },
  { value: "🌙", name: "Sleep", glyph: "moon-outline" },
  { value: "✍️", name: "Writing", glyph: "create-outline" },
  { value: "💪", name: "Fitness", glyph: "barbell-outline" },
] as const;
export function HabitSymbol({
  value,
  color,
  size = 24,
}: {
  value: string;
  color: string;
  size?: number;
}) {
  return (
    <Ionicons
      name={habitIcons.find((i) => i.value === value)?.glyph ?? "leaf-outline"}
      size={size}
      color={color}
    />
  );
}
