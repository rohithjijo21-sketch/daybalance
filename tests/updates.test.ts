import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchLatestRelease,
  installableRelease,
  newerVersion,
} from "../src/services/updates";
const release = () => ({
  tag_name: "v1.2.0",
  draft: false,
  prerelease: false,
  assets: [
    {
      name: "DayBalance.apk",
      state: "uploaded",
      size: 100,
      browser_download_url:
        "https://github.com/rohithjijo21-sketch/daybalance/releases/download/v1.2.0/DayBalance.apk",
    },
  ],
});
afterEach(() => vi.unstubAllGlobals());
describe("Android release discovery", () => {
  it("compares numeric versions rather than strings and never downgrades", () => {
    expect(newerVersion("v1.10.0", "1.2.9")).toBe(true);
    expect(newerVersion("2.0.0", "1.99.99")).toBe(true);
    expect(newerVersion("1.2.0", "1.2.0")).toBe(false);
    expect(newerVersion("1.1.9", "1.2.0")).toBe(false);
    expect(newerVersion("1.3.0-beta", "1.2.0")).toBe(false);
  });
  it("requires a published stable release with the exact uploaded APK", () => {
    expect(installableRelease(release())?.version).toBe("1.2.0");
    expect(installableRelease({ ...release(), draft: true })).toBeNull();
    expect(installableRelease({ ...release(), prerelease: true })).toBeNull();
    expect(installableRelease({ ...release(), assets: [] })).toBeNull();
    const r = release();
    r.assets[0]!.state = "new";
    expect(installableRelease(r)).toBeNull();
  });
  it("rejects external and other-repository download destinations", () => {
    const r = release();
    r.assets[0]!.browser_download_url = "https://example.com/DayBalance.apk";
    expect(installableRelease(r)).toBeNull();
    r.assets[0]!.browser_download_url =
      "https://github.com/other/daybalance/releases/download/v1.2.0/DayBalance.apk";
    expect(installableRelease(r)).toBeNull();
  });
  it("handles a missing release and fails cleanly on server errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 404 }));
    expect(await fetchLatestRelease()).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 503, ok: false }),
    );
    await expect(fetchLatestRelease()).rejects.toThrow("unavailable");
  });
});
