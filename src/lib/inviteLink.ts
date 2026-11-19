import { normalizeInviteCode } from "@/lib/householdSetup";

/** Parametr w linku z kodu QR: https://…/?join=K7M2QX9P */
export const JOIN_PARAM = "join";

export function inviteUrl(code: string, origin = window.location.origin) {
  return `${origin}/?${JOIN_PARAM}=${encodeURIComponent(code)}`;
}

/**
 * Adres po logowaniu linkiem z maila — bez jednorazowych kodów logowania,
 * ale z `?join=`, żeby po zalogowaniu od razu dołączyć do mieszkania.
 */
export function cleanEmailLinkUrl(href: string): string {
  const url = new URL(href);
  const join = url.searchParams.get(JOIN_PARAM);
  return join
    ? `${url.pathname}?${JOIN_PARAM}=${encodeURIComponent(join)}`
    : url.pathname;
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
  const raw = url.searchParams.get(JOIN_PARAM);
  if (!raw) return readPendingInvite();
  url.searchParams.delete(JOIN_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
  const code = normalizeInviteCode(raw) || null;
  // Logowanie Google przez przekierowanie wraca bez ?join= — kod czeka
  // w tej karcie, aż dołączenie się uda albo ktoś je anuluje
  if (code) writePendingInvite(code);
  return code;
}

const PENDING_INVITE_KEY = "homeharmony-pending-join";

function readPendingInvite(): string | null {
  try {
    return sessionStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
}

function writePendingInvite(code: string) {
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, code);
  } catch {
    // tryb prywatny — kod zostaje tylko w pamięci
  }
}

/** Dołączenie zakończone (albo anulowane) — kod już nie wraca */
export function clearPendingInvite() {
  try {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // ignore
  }
}
