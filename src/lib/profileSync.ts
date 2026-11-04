/** Jak często odświeżać lastLoginAt w users/{uid} (zapis przy wczytaniu strony) */
export const PROFILE_REFRESH_MS = 12 * 60 * 60 * 1000;

/** Dokument users/{uid} ma już te dane i był odświeżony niedawno */
export function isProfileFresh(
  stored: Record<string, unknown> | undefined,
  profile: Record<string, unknown>,
  now: number,
): boolean {
  if (!stored) return false;
  for (const [key, value] of Object.entries(profile)) {
    if ((stored[key] ?? null) !== value) return false;
  }
  const lastLogin = stored.lastLoginAt as { toMillis?: () => number } | null;
  const lastMs = lastLogin?.toMillis?.();
  return typeof lastMs === "number" && now - lastMs < PROFILE_REFRESH_MS;
}
