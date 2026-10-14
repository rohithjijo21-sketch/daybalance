import { errorMessage } from "../domain/errors";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { State } from "../domain/model";
import { reduceState } from "../domain/actions";
import { openDatabase, persist } from "./database";
import { syncNotifications } from "../services/notifications";
type Store = {
  state: State | null;
  error: string;
  notice: string;
  busy: boolean;
  now: number;
  mutate: (fn: (s: State) => void) => Promise<boolean>;
  reload: () => void;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const current = useRef<State | null>(null);
  const lock = useRef(false);
  const refreshReminders = (s: State) => {
    void syncNotifications(s)
      .then(() => setNotice(""))
      .catch(() =>
        setNotice(
          "Your data is saved, but reminders could not be scheduled. Check notification settings.",
        ),
      );
  };
  const reload = () => {
    setError("");
    void openDatabase()
      .then((s) => {
        current.current = s;
        setState(s);
        refreshReminders(s);
      })
      .catch((e) => setError(String(e.message ?? e)));
  };
  useEffect(() => {
    reload();
    const sub = AppState.addEventListener("change", (status) => {
      if (status === "active") {
        setNow(Date.now());
        if (current.current) refreshReminders(current.current);
      }
    });
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function mutate(fn: (s: State) => void) {
    if (lock.current || !current.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const next = reduceState(current.current, fn);
      await persist(next);
      current.current = next;
      setState(next);
      refreshReminders(next);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider
      value={{ state, error, notice, busy, now, mutate, reload }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}
