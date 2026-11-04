import { execFileSync } from "node:child_process";

/**
 * Tylko dla vite.config.ts (build, Node) — nie importuj w aplikacji.
 * Wersja z historii gita: data ostatniego commita i który to commit tego
 * dnia, np. `2026-11-04:3.0`.
 */

const TIME_ZONE = "Europe/Warsaw";

function git(args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** Data w strefie Warszawy, np. 2026-11-04 */
export function localDate(unixSeconds: number, timeZone = TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

/** @param commitTimes czasy commitów (unix s), od najnowszego */
export function versionFromCommitTimes(
  commitTimes: number[],
  timeZone = TIME_ZONE,
): string | null {
  if (commitTimes.length === 0) return null;
  const day = localDate(commitTimes[0]!, timeZone);
  let count = 0;
  for (const time of commitTimes) {
    if (localDate(time, timeZone) !== day) break;
    count += 1;
  }
  return `${day}:${count}.0`;
}

export function resolveAppVersion(): { version: string; commit: string } {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "";
  try {
    const times = git(["log", "-n", "200", "--format=%ct"])
      .split("\n")
      .filter(Boolean)
      .map(Number);
    const version = versionFromCommitTimes(times);
    if (!version) throw new Error("no commits");
    return {
      version,
      commit: vercelSha || git(["rev-parse", "--short=7", "HEAD"]),
    };
  } catch {
    // Build bez .git — przynajmniej data buildu
    return { version: `${localDate(Date.now() / 1000)}:?`, commit: vercelSha };
  }
}
