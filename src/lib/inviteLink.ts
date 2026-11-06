import { normalizeInviteCode } from "@/lib/householdSetup";

/** Parametr w linku z kodu QR: https://…/?join=K7M2QX9P */
export const JOIN_PARAM = "join";

export function inviteUrl(code: string, origin = window.location.origin) {
  return `${origin}/?${JOIN_PARAM}=${encodeURIComponent(code)}`;
}

/** Kod z zeskanowanego QR — link z `?join=` albo sam kod */
export function inviteCodeFromScan(text: string): string | null {
  const raw = text.trim();
  try {
    const url = new URL(raw);
    const code = url.searchParams.get(JOIN_PARAM);
    return code ? normalizeInviteCode(code) || null : null;
  } catch {
    const code = normalizeInviteCode(raw);
    return code.length >= 6 && code.length <= 12 ? code : null;
  }
}

/**
 * Kod z adresu strony (wejście z linku QR) — zdejmujemy go z paska adresu,
 * żeby nie został w historii ani przy odświeżeniu.
 */
export function takeInviteCodeFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get(JOIN_PARAM);
  if (!code) return null;
  url.searchParams.delete(JOIN_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
  return normalizeInviteCode(code) || null;
}
