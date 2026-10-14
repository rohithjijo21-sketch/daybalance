import { AppDialog } from "../src/ui/dialogs";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "../src/data/store";
import { useTheme } from "../src/ui/components";
function Navigation() {
  const c = useTheme();
  return (
    <>
      <AppDialog />
      <StatusBar style={c.dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="edit" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="habit" />
      </Stack>
    </>
  );
}
export default function Layout() {
  const [loaded, error] = useFonts({
    DMSans: require("@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf"),
    DMSansMedium: require("@expo-google-fonts/dm-sans/500Medium/DMSans_500Medium.ttf"),
    DMSansSemiBold: require("@expo-google-fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf"),
    DMSansBold: require("@expo-google-fonts/dm-sans/700Bold/DMSans_700Bold.ttf"),
    Newsreader: require("@expo-google-fonts/newsreader/400Regular/Newsreader_400Regular.ttf"),
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAF4EA",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#95532F" />
      </View>
    );
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Navigation />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
