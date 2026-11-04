/**
 * Wersja liczona przy buildzie z gita (scripts/app-version.mjs):
 * data ostatniego commita i który to commit tego dnia, np. `2026-11-04:3.0`.
 */
declare const __APP_VERSION__: string | undefined;
declare const __APP_COMMIT__: string | undefined;

export const APP_VERSION =
  typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";

export const APP_COMMIT =
  typeof __APP_COMMIT__ === "string" ? __APP_COMMIT__ : "";
