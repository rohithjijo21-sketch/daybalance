import React, { useEffect, useState } from "react";
import { Pressable, View, Keyboard } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Txt, useTheme } from "../../src/ui/components";
import { fonts } from "../../src/ui/typography";
const icons = {
  index: ["sunny-outline", "sunny"],
  habits: ["leaf-outline", "leaf"],
  planner: ["calendar-outline", "calendar"],
  money: ["wallet-outline", "wallet"],
  insights: ["stats-chart-outline", "stats-chart"],
} as const;
export default function TabLayout() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, descriptors, navigation }) =>
        keyboardOpen ? null : (
          <View
            style={{
              position: "absolute",
              bottom: Math.max(12, insets.bottom),
              left: 16,
              right: 16,
              backgroundColor: c.card,
              borderRadius: 25,
              borderWidth: 1,
              borderColor: c.border,
              paddingHorizontal: 6,
              paddingVertical: 10,
              flexDirection: "row",
              boxShadow: c.dark
                ? "0 6px 28px rgba(0,0,0,.25)"
                : "0 6px 28px rgba(73,55,42,.09)",
            }}
          >
            {state.routes.map((route, index) => {
              const active = state.index === index;
              const label = descriptors[route.key]?.options.title ?? route.name;
              const pair = icons[route.name as keyof typeof icons];
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  aria-selected={active}
                  onPress={() => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!active && !event.defaultPrevented)
                      navigation.navigate(route.name, route.params);
                  }}
                  onLongPress={() =>
                    navigation.emit({ type: "tabLongPress", target: route.key })
                  }
                  style={{
                    flex: 1,
                    minHeight: 52,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 30,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? c.tint : "transparent",
                    }}
                  >
                    <Ionicons
                      name={pair[active ? 1 : 0]}
                      size={20}
                      color={active ? c.accent : c.muted}
                    />
                  </View>
                  <Txt
                    style={{
                      fontFamily: active ? fonts.semibold : fonts.medium,
                      fontSize: 10,
                      lineHeight: 14,
                      color: active ? c.text : c.muted,
                    }}
                  >
                    {label}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        )
      }
    >
      <Tabs.Screen name="index" options={{ title: "Today" }} />
      <Tabs.Screen name="habits" options={{ title: "Habits" }} />
      <Tabs.Screen name="planner" options={{ title: "Planner" }} />
      <Tabs.Screen name="money" options={{ title: "Money" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
    </Tabs>
  );
}
