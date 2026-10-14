import { TimeField } from "../src/ui/pickers";
import { UpdateControls } from "../src/ui/update-controls";
import { showAlert } from "../src/ui/dialogs";
import { errorMessage } from "../src/domain/errors";
import React, { useState } from "react";

import { useStore } from "../src/data/store";
import { emptyState, settingsSchema } from "../src/domain/model";
import { sampleData } from "../src/domain/sample";
import { enableReminders } from "../src/services/notifications";
import { exportData, pickImport } from "../src/services/transfer";
import {
  Button,
  Card,
  Choices,
  Disclosure,
  confirm,
  Field,
  Screen,
  Section,
  Txt,
} from "../src/ui/components";
import { edit } from "../src/ui/records";
export default function Settings() {
  const { state, mutate } = useStore();
  const [draft, setDraft] = useState(state?.settings ?? emptyState().settings);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  if (!state)
    return (
      <Screen title="Settings" back>
        {null}
      </Screen>
    );
  async function save() {
    if (working) return;
    setWorking(true);
    setMessage("");
    try {
      const value = settingsSchema.parse(draft);
      if (value.notifications) {
        const allowed = await enableReminders();
        value.notifications = allowed;
        if (!allowed)
          showAlert(
            "Permission not granted",
            "Your app data is saved. Notifications are unavailable; you can enable them in device settings.",
          );
      }
      if (value.currency !== state!.settings.currency) {
        confirm(
          "Change display currency?",
          `Existing amounts will keep the same numbers and use ${value.currency}. This does not convert money or calculate exchange rates.`,
          () =>
            void mutate((s) => {
              s.settings = value;
            }).then((ok) => {
              if (ok) {
                setDraft(value);
                setMessage("Settings saved.");
              }
            }),
        );
      } else if (
        await mutate((s) => {
          s.settings = value;
        })
      ) {
        setDraft(value);
        setMessage("Settings saved.");
      }
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setWorking(false);
    }
  }
  async function transfer(type: "json" | "csv" | "import") {
    if (working) return;
    setWorking(true);
    setMessage("");
    try {
      if (type === "import") {
        const incoming = await pickImport();
        if (incoming)
          confirm(
            "Replace all DayBalance data?",
            `${incoming.habits.length} habits, ${incoming.tasks.length} task series and ${incoming.transactions.length} transactions validated. This replaces your current data and settings. Export a backup first if you need it. Notification permission will not be requested by importing.`,
            () =>
              void mutate((s) => Object.assign(s, incoming)).then((ok) => {
                if (ok) {
                  setDraft(incoming.settings);
                  setMessage("Data restored successfully.");
                }
              }),
          );
      } else await exportData(state!, type);
    } catch (e) {
      setMessage(errorMessage(e));
    } finally {
      setWorking(false);
    }
  }
  return (
    <Screen title="Settings" subtitle="Local, private, and yours" back>
      <UpdateControls />
      <Section title="Personalize your space" />
      <Card>
        <Field
          label="Display name"
          value={draft.name}
          onChange={(name) => setDraft({ ...draft, name })}
        />
        <Choices
          label="Theme"
          values={["system", "light", "dark"] as const}
          value={draft.theme}
          onChange={(theme) => setDraft({ ...draft, theme })}
        />
        <Choices
          label="Display currency"
          values={["INR", "USD", "EUR", "GBP", "AUD", "CAD"] as const}
          value={draft.currency}
          onChange={(currency) => setDraft({ ...draft, currency })}
        />
        <Txt muted>
          Changing display currency relabels the existing amounts. It does not
          convert them.
        </Txt>
        <Choices
          label="First day of week"
          values={["Monday", "Sunday"]}
          value={draft.weekStart === 1 ? "Monday" : "Sunday"}
          onChange={(v) =>
            setDraft({ ...draft, weekStart: v === "Monday" ? 1 : 0 })
          }
        />
      </Card>
      <Section title="Reminders" />
      <Card>
        <Choices
          label="Reminders"
          values={["off", "on"]}
          value={draft.notifications ? "on" : "off"}
          onChange={(v) => setDraft({ ...draft, notifications: v === "on" })}
        />
        <TimeField
          label="Evening check-in reminder"
          value={draft.evening ?? ""}
          onChange={(v) =>
            setDraft({
              ...draft,
              evening: v || null,
              notifications: v ? true : draft.notifications,
            })
          }
        />
        <Txt muted>
          Reminders cover the next seven days, refreshed when you open the app.
          The nearest 60 notifications are scheduled. Notification permission is
          requested when you save enabled reminders.
        </Txt>
      </Card>
      <Button
        title="Save settings"
        disabled={working}
        onPress={() => void save()}
      />
      {!!message && (
        <Card>
          <Txt>{message}</Txt>
        </Card>
      )}
      <Disclosure title="Manage categories">
        <Section
          title="Categories"
          action="+ New"
          onPress={() => edit("category")}
        />
        {state.categories.map((c) => (
          <Button
            key={c.id}
            secondary
            title={`${c.name} · ${c.type}${c.archived ? " · archived" : ""}`}
            onPress={() => edit("category", { id: c.id })}
          />
        ))}
      </Disclosure>
      <Section title="Your data" />
      <Card>
        <Txt>
          No account, analytics, advertising, or external data services. Records
          stay in local SQLite storage.
        </Txt>
        <Button
          secondary
          title="Export all data · JSON"
          disabled={working}
          onPress={() => void transfer("json")}
        />
        <Button
          secondary
          title="Export transactions · CSV"
          disabled={working}
          onPress={() => void transfer("csv")}
        />
        <Button
          secondary
          title="Import JSON backup"
          disabled={working}
          onPress={() => void transfer("import")}
        />
        <Txt muted>
          Imports accept DayBalance version 1 exports, validate fields and
          references, then ask before replacing data.
        </Txt>
      </Card>
      <Card>
        <Section title="Try sample data" />
        <Txt muted>
          Explicitly replaces current records with a small example dataset.
          Export your records first to keep a backup.
        </Txt>
        <Button
          secondary
          title="Try sample data"
          onPress={() =>
            confirm(
              "Load sample data?",
              "This replaces all existing records. Your preferences are kept.",
              () =>
                void mutate((s) => Object.assign(s, sampleData(s.settings))),
            )
          }
        />
      </Card>
      <Card>
        <Section title="Delete all user data" />
        <Field
          label="Type DELETE to enable deletion"
          value={confirmation}
          onChange={setConfirmation}
        />
        <Button
          danger
          title="Delete all data"
          disabled={confirmation !== "DELETE"}
          onPress={() =>
            confirm(
              "Permanently delete all data?",
              "All records and preferences will be removed from this device. This cannot be undone without a backup.",
              () =>
                void mutate((s) => Object.assign(s, emptyState())).then(
                  (ok) => {
                    if (ok) {
                      setDraft(emptyState().settings);
                      setConfirmation("");
                      setMessage("All user data deleted.");
                    }
                  },
                ),
            )
          }
        />
      </Card>
    </Screen>
  );
}
