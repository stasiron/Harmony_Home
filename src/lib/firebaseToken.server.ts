import { createPublicKey, verify } from "node:crypto";
import { firebaseProjectId } from "@/lib/firebase";

/**
 * Weryfikacja Firebase ID tokenu na serwerze bez firebase-admin (i bez
 * kluczy serwisowych): podpis RS256 sprawdzany certyfikatami Google.
 * Używane tam, gdzie serwer musi wiedzieć, KTO pyta — np. prywatny kalendarz.
 */

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

export type VerifiedViewer = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  anonymous: boolean;
};

let certCache: { certs: Record<string, string>; expiresAt: number } | null =
  null;

async function googleCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error("token certs fetch failed");
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = /max-age=(\d+)/.exec(res.headers.get("cache-control") ?? "");
  const ttlMs = (maxAge ? Number(maxAge[1]) : 3600) * 1000;
  certCache = { certs, expiresAt: Date.now() + ttlMs };
  return certs;
}

function decodePart<T>(part: string): T {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
}

type TokenPayload = {
  aud?: string;
  iss?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  email?: string;
  email_verified?: boolean;
  firebase?: { sign_in_provider?: string };
};

/** Claimy → viewer; null, gdy token nie pasuje do projektu albo wygasł */
export function viewerFromPayload(
  payload: TokenPayload,
  projectId: string,
  nowSec: number,
): VerifiedViewer | null {
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
    return null;
  if (!payload.sub || typeof payload.exp !== "number") return null;
  if (payload.exp <= nowSec) return null;
  if (typeof payload.iat === "number" && payload.iat > nowSec + 300) {
    return null;
  }
  return {
    uid: payload.sub,
    email: payload.email?.toLowerCase() ?? null,
    emailVerified: payload.email_verified === true,
    anonymous: payload.firebase?.sign_in_provider === "anonymous",
  };
}

/** Emulator Auth wystawia niepodpisane tokeny — tylko w trybie dev:emulator */
function emulatorMode(): boolean {
  return import.meta.env.VITE_FIREBASE_EMULATOR === "1";
}

export async function verifyFirebaseIdToken(
  token: string | null | undefined,
): Promise<VerifiedViewer | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts as [
    string,
    string,
    string,
  ];

  try {
    const header = decodePart<{ alg?: string; kid?: string }>(headerPart);
    const payload = decodePart<TokenPayload>(payloadPart);
    const nowSec = Math.floor(Date.now() / 1000);

    if (emulatorMode()) {
      return viewerFromPayload(payload, firebaseProjectId, nowSec);
    }

    if (header.alg !== "RS256" || !header.kid) return null;
    const cert = (await googleCerts())[header.kid];
    if (!cert) return null;

    const valid = verify(
      "RSA-SHA256",
      Buffer.from(`${headerPart}.${payloadPart}`),
      createPublicKey(cert),
      Buffer.from(signaturePart, "base64url"),
    );
    if (!valid) return null;
    return viewerFromPayload(payload, firebaseProjectId, nowSec);
  } catch {
    return null;
  }
}
