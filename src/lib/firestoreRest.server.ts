import { createSign } from "node:crypto";
import { firebaseProjectId } from "@/lib/firebase";

/**
 * Firestore z serwera bez firebase-admin: REST + token konta serwisowego
 * (JWT podpisany RS256 przez node:crypto). Konto serwisowe omija reguły —
 * każdą funkcję, która z tego korzysta, trzeba osobno zabezpieczyć
 * (sprawdzenie ID tokenu i członkostwa, sekret crona).
 *
 * FIREBASE_SERVICE_ACCOUNT — JSON klucza konta serwisowego (albo base64).
 * Emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 (token „owner”).
 */

type ServiceAccount = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

function serviceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function emulatorHost(): string | null {
  return process.env.FIRESTORE_EMULATOR_HOST?.trim() || null;
}

export function firestoreServerConfigured(): boolean {
  return Boolean(emulatorHost() || serviceAccount());
}

function projectId(): string {
  return serviceAccount()?.project_id || firebaseProjectId;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (emulatorHost()) return "owner";
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const account = serviceAccount();
  if (!account) throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
  const now = Math.floor(Date.now() / 1000);
  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(account.private_key.replace(/\\n/g, "\n"), "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`Service account token: ${res.status}`);
  const body = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return body.access_token;
}

function baseUrl(): string {
  const host = emulatorHost();
  const root = host ? `http://${host}` : "https://firestore.googleapis.com";
  return `${root}/v1/projects/${projectId()}/databases/(default)/documents`;
}

// ─── Wartości Firestore ↔ JS ──────────────────────────────────────────────

type FsValue = Record<string, unknown>;

function decodeValue(value: FsValue): unknown {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) {
    const values = (value.arrayValue as { values?: FsValue[] }).values ?? [];
    return values.map(decodeValue);
  }
  if ("mapValue" in value) {
    return decodeFields(
      (value.mapValue as { fields?: Record<string, FsValue> }).fields ?? {},
    );
  }
  return null;
}

function decodeFields(
  fields: Record<string, FsValue>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]),
  );
}

export type RestDoc = { id: string; data: Record<string, unknown> };

function toDoc(raw: {
  name: string;
  fields?: Record<string, FsValue>;
}): RestDoc {
  return {
    id: raw.name.split("/").pop() ?? "",
    data: decodeFields(raw.fields ?? {}),
  };
}

/**
 * Każdy segment ścieżki escapowany — dane od klienta (id, rodzaj zdarzenia)
 * nie wyjdą poza zamierzony dokument (`..`, `/`, `?`). Konto serwisowe
 * omija reguły, więc to jedyna ochrona.
 */
function safePath(path: string): string {
  const [rawPath, query] = path.split("?", 2) as [string, string | undefined];
  const segments = rawPath.split("/");
  if (segments.some((s) => !s || s === "." || s === "..")) {
    throw new Error(`Firestore: niedozwolona ścieżka ${rawPath}`);
  }
  const encoded = segments.map(encodeURIComponent).join("/");
  return query === undefined ? encoded : `${encoded}?${query}`;
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl()}/${safePath(path)}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(init?.headers ?? {}),
    },
  });
}

/** Dokument albo null, gdy nie istnieje */
export async function getDocument(path: string): Promise<RestDoc | null> {
  const res = await call(path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET ${path}: ${res.status}`);
  return toDoc(await res.json());
}

/** Wszystkie dokumenty kolekcji (stronicowanie po 300) */
export async function listDocuments(path: string): Promise<RestDoc[]> {
  const docs: RestDoc[] = [];
  let pageToken = "";
  for (let page = 0; page < 50; page++) {
    const query = new URLSearchParams({ pageSize: "300" });
    if (pageToken) query.set("pageToken", pageToken);
    const res = await call(`${path}?${query}`);
    if (res.status === 404) return docs;
    if (!res.ok) throw new Error(`Firestore LIST ${path}: ${res.status}`);
    const body = (await res.json()) as {
      documents?: { name: string; fields?: Record<string, FsValue> }[];
      nextPageToken?: string;
    };
    docs.push(...(body.documents ?? []).map(toDoc));
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }
  return docs;
}

/** Zapis prostego dokumentu (liczby i teksty) — nadpisuje cały dokument */
export async function setDocument(
  path: string,
  data: Record<string, string | number>,
): Promise<void> {
  const fields = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      typeof v === "number"
        ? Number.isInteger(v)
          ? { integerValue: String(v) }
          : { doubleValue: v }
        : { stringValue: v },
    ]),
  );
  const res = await call(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error(`Firestore SET ${path}: ${res.status}`);
}

export async function deleteDocument(path: string): Promise<void> {
  const res = await call(path, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Firestore DELETE ${path}: ${res.status}`);
  }
}
