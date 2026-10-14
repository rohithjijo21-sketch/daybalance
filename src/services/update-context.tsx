import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import { AppRelease, fetchLatestRelease, newerVersion } from "./updates";

type Updates = {
  version: string;
  release: AppRelease | null;
  checking: boolean;
  message: string;
  dismissed: boolean;
  check: () => Promise<void>;
  dismiss: () => void;
  download: () => Promise<void>;
};
const Context = createContext<Updates | null>(null);
export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const version = Constants.expoConfig?.version ?? "0.0.0";
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const inFlight = useRef(false),
    lastCheck = useRef(0);
  const check = useCallback(
    async (manual = true) => {
      if (
        Platform.OS === "ios" ||
        inFlight.current ||
        (!manual && Date.now() - lastCheck.current < 6 * 60 * 60 * 1000)
      )
        return;
      inFlight.current = true;
      lastCheck.current = Date.now();
      setChecking(true);
      if (manual) setMessage("");
      try {
        const latest = await fetchLatestRelease();
        const next =
          latest && newerVersion(latest.version, version) ? latest : null;
        setRelease(next);
        if (next) {
          setDismissed(false);
          setMessage(`Version ${next.version} is available.`);
        } else if (manual)
          setMessage(
            latest
              ? "You’re up to date."
              : "No downloadable Android release is available yet.",
          );
      } catch {
        if (manual)
          setMessage(
            "Couldn’t check for updates. Connect to the internet and try again.",
          );
      } finally {
        inFlight.current = false;
        setChecking(false);
      }
    },
    [version],
  );
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void check(false);
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") void check(false);
    });
    return () => sub.remove();
  }, [check]);
  const download = async () => {
    if (!release) return;
    try {
      await Linking.openURL(release.downloadUrl);
    } catch {
      setMessage(
        "Couldn’t open the download. Try again or visit DayBalance’s GitHub Releases page.",
      );
    }
  };
  return (
    <Context.Provider
      value={{
        version,
        release,
        checking,
        message,
        dismissed,
        check: () => check(true),
        dismiss: () => setDismissed(true),
        download,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useUpdates() {
  const value = useContext(Context);
  if (!value) throw new Error("UpdateProvider is missing");
  return value;
}
