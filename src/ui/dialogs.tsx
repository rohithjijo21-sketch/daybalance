import { fonts } from "./typography";
import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertButton,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTheme } from "./components";
type Dialog = { title: string; body: string; buttons: AlertButton[] };
let dispatch: ((d: Dialog) => void) | null = null;
export function showAlert(
  title: string,
  body: string,
  buttons: AlertButton[] = [{ text: "OK" }],
): void {
  if (Platform.OS === "web" && dispatch) dispatch({ title, body, buttons });
  else Alert.alert(title, body, buttons);
}
export function AppDialog() {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const c = useTheme();
  useEffect(() => {
    dispatch = setDialog;
    return () => {
      dispatch = null;
    };
  }, []);
  return (
    <Modal
      visible={!!dialog}
      transparent
      animationType="fade"
      onRequestClose={() => setDialog(null)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#00000066",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          accessibilityViewIsModal
          style={{
            width: "100%",
            maxWidth: 440,
            padding: 24,
            borderRadius: 22,
            backgroundColor: c.card,
            gap: 20,
          }}
        >
          <Text
            style={{ fontSize: 27, fontFamily: fonts.display, color: c.text }}
          >
            {dialog?.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.body,
              lineHeight: 24,
              color: c.text,
            }}
          >
            {dialog?.body}
          </Text>
          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
            {dialog?.buttons.map((b, i) => (
              <Pressable
                accessibilityRole="button"
                key={i}
                onPress={() => {
                  setDialog(null);
                  b.onPress?.();
                }}
                style={{
                  minHeight: 48,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor:
                    b.style === "destructive" ? c.danger : c.tint,
                }}
              >
                <Text
                  style={{
                    color: b.style === "destructive" ? c.bg : c.accent,
                    fontFamily: fonts.semibold,
                  }}
                >
                  {b.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
