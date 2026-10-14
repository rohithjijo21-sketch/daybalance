import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { csv } from "../domain/calculations";
import { parseExport, serialize, State } from "../domain/model";
export async function exportData(
  s: State,
  type: "json" | "csv",
): Promise<void> {
  const file = new File(Paths.cache, `DayBalance-${Date.now()}.${type}`);
  try {
    file.create({ overwrite: true });
    file.write(type === "json" ? serialize(s) : csv(s));
    if (!(await Sharing.isAvailableAsync()))
      throw new Error("File sharing is unavailable on this device");
    await Sharing.shareAsync(file.uri, {
      mimeType: type === "json" ? "application/json" : "text/csv",
      dialogTitle: "Export DayBalance",
      UTI:
        type === "json" ? "public.json" : "public.comma-separated-values-text",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function pickImport(): Promise<State | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "application/octet-stream"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error("No file selected");
  if (asset.size && asset.size > 30_000_000)
    throw new Error("Import exceeds 30 MB");
  const file = new File(asset.uri);
  try {
    return parseExport(await file.text());
  } finally {
    if (file.exists) file.delete();
  }
}
