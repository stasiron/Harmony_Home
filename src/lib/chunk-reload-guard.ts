const RELOAD_KEY = "homeharmony-chunk-reload";
const RELOAD_COOLDOWN_MS = 15_000;

const CHUNK_ERROR_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Loading chunk",
  "Importing a module script failed",
  "Cannot read properties of undefined (reading 'component')",
];

function isChunkLoadError(reason: unknown): boolean {
  const message = String(
    reason instanceof Error ? reason.message : reason ?? "",
  );
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function reloadOnceForStaleChunks(): void {
  const last = sessionStorage.getItem(RELOAD_KEY);
  const now = Date.now();
  if (last && now - Number(last) < RELOAD_COOLDOWN_MS) return;
  sessionStorage.setItem(RELOAD_KEY, String(now));
  window.location.reload();
}

export function installChunkReloadGuard(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    event.preventDefault();
    reloadOnceForStaleChunks();
  });

  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadOnceForStaleChunks();
  });
}
