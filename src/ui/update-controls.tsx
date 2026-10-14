import React from "react";
import { Linking, Platform } from "react-native";
import { useUpdates } from "../services/update-context";
import { RELEASE_PAGE } from "../services/updates";
import { Button, Card, Section, Txt } from "./components";
export function UpdateControls() {
  const updates = useUpdates();
  return (
    <>
      <Section title="App updates" />
      <Card>
        <Txt>DayBalance {updates.version}</Txt>
        {Platform.OS === "ios" ? (
          <Txt muted>APK updates are available for Android.</Txt>
        ) : (
          <>
            <Button
              secondary
              title={updates.checking ? "Checking…" : "Check for updates"}
              disabled={updates.checking}
              onPress={() => void updates.check()}
            />
            {!!updates.message && <Txt muted>{updates.message}</Txt>}
            {updates.release && (
              <>
                <Button
                  title={`Update to ${updates.release.version}`}
                  onPress={() => void updates.download()}
                />
                <Txt muted>
                  Download and open the APK, then confirm installation in
                  Android. Export a backup first; install over the existing app.
                </Txt>
              </>
            )}
            <Button
              secondary
              title="GitHub releases"
              onPress={() => {
                void Linking.openURL(RELEASE_PAGE).catch(
                  () => void updates.check(),
                );
              }}
            />
            <Txt muted>
              Checks published GitHub releases. Your habits, plans and money
              records are never sent.
            </Txt>
          </>
        )}
      </Card>
    </>
  );
}
