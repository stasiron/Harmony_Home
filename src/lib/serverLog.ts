/** Server-side warnings — only when DEBUG_ERRORS=1 or local Vercel env. */
export function logServerWarn(scope: string, detail: unknown): void {
  if (
    process.env.DEBUG_ERRORS === "1" ||
    process.env.VERCEL_ENV === "development" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    console.warn(`[${scope}]`, detail);
  }
}
