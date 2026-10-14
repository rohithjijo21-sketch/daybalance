import { csv } from "../domain/calculations";
import { parseExport, serialize, State } from "../domain/model";
export async function exportData(
  s: State,
  type: "json" | "csv",
): Promise<void> {
  const blob = new Blob([type === "json" ? serialize(s) : csv(s)], {
    type: type === "json" ? "application/json" : "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DayBalance-${Date.now()}.${type}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function pickImport(): Promise<State | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        if (file.size > 30_000_000) throw new Error("Import exceeds 30 MB");
        resolve(parseExport(await file.text()));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
