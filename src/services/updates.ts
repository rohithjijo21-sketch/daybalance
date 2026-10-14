export const RELEASE_API =
  "https://api.github.com/repos/rohithjijo21-sketch/daybalance/releases/latest";
export const RELEASE_PAGE =
  "https://github.com/rohithjijo21-sketch/daybalance/releases/latest";
export type AppRelease = {
  version: string;
  downloadUrl: string;
  pageUrl: string;
};

export function newerVersion(candidate: string, current: string): boolean {
  const parse = (v: string) =>
    /^v?\d+\.\d+\.\d+$/.test(v)
      ? v.replace(/^v/, "").split(".").map(Number)
      : null;
  const next = parse(candidate),
    installed = parse(current);
  if (!next || !installed) return false;
  for (let i = 0; i < 3; i++) {
    if (next[i]! !== installed[i]!) return next[i]! > installed[i]!;
  }
  return false;
}

export function installableRelease(input: unknown): AppRelease | null {
  if (!input || typeof input !== "object") return null;
  const r = input as Record<string, unknown>;
  if (
    r.draft !== false ||
    r.prerelease !== false ||
    typeof r.tag_name !== "string" ||
    !/^v?\d+\.\d+\.\d+$/.test(r.tag_name) ||
    !Array.isArray(r.assets)
  )
    return null;
  const prefix = `https://github.com/rohithjijo21-sketch/daybalance/releases/download/${encodeURIComponent(r.tag_name)}/`;
  const asset = r.assets.find((a: unknown) => {
    if (!a || typeof a !== "object") return false;
    const v = a as Record<string, unknown>;
    return (
      v.name === "DayBalance.apk" &&
      v.state === "uploaded" &&
      typeof v.size === "number" &&
      v.size > 0 &&
      v.browser_download_url === `${prefix}DayBalance.apk`
    );
  }) as Record<string, unknown> | undefined;
  return asset
    ? {
        version: r.tag_name.replace(/^v/, ""),
        downloadUrl: asset.browser_download_url as string,
        pageUrl: `https://github.com/rohithjijo21-sketch/daybalance/releases/tag/${encodeURIComponent(r.tag_name)}`,
      }
    : null;
}

export async function fetchLatestRelease(): Promise<AppRelease | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(
        "Update check unavailable. Try again when you have an internet connection.",
      );
    return installableRelease(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
