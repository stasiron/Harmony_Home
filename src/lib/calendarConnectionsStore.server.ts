import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CalendarDisplayMode } from "@/config/calendars/types";

export type StoredCalendar = {
  googleCalendarId: string;
  summary: string;
  enabled: boolean;
  display: CalendarDisplayMode;
  color: string;
  label: string;
};

export type MemberConnection = {
  memberId: string;
  googleEmail: string;
  refreshToken: string;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  connectedAt: string;
  calendars: StoredCalendar[];
};

export type CalendarConnectionsStore = {
  members: Record<string, MemberConnection>;
};

const STORE_KEY = "homeharmony:calendar-connections";
const DATA_DIR = process.env.CALENDAR_DATA_DIR ?? join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "calendar-connections.json");

function emptyStore(): CalendarConnectionsStore {
  return { members: {} };
}

async function readFromFile(): Promise<CalendarConnectionsStore> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CalendarConnectionsStore;
    return { members: parsed.members ?? {} };
  } catch {
    return emptyStore();
  }
}

async function writeToFile(store: CalendarConnectionsStore) {
  if (process.env.VERCEL) return;
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    // read-only FS on serverless
  }
}

async function readFromKv(): Promise<CalendarConnectionsStore | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)
    return null;
  try {
    const { kv } = await import("@vercel/kv");
    const value = await kv.get<CalendarConnectionsStore>(STORE_KEY);
    return value ?? emptyStore();
  } catch {
    return null;
  }
}

async function writeToKv(store: CalendarConnectionsStore) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  const { kv } = await import("@vercel/kv");
  await kv.set(STORE_KEY, store);
}

export async function readCalendarConnectionsStore(): Promise<CalendarConnectionsStore> {
  const fromKv = await readFromKv();
  if (fromKv) return fromKv;
  return readFromFile();
}

export async function writeCalendarConnectionsStore(
  store: CalendarConnectionsStore,
) {
  await writeToFile(store);
  await writeToKv(store);
}

export async function upsertMemberConnection(connection: MemberConnection) {
  const store = await readCalendarConnectionsStore();
  store.members[connection.memberId] = connection;
  await writeCalendarConnectionsStore(store);
}

export async function updateMemberConnection(
  memberId: string,
  updater: (
    current: MemberConnection | undefined,
  ) => MemberConnection | undefined,
) {
  const store = await readCalendarConnectionsStore();
  const next = updater(store.members[memberId]);
  if (!next) {
    delete store.members[memberId];
  } else {
    store.members[memberId] = next;
  }
  await writeCalendarConnectionsStore(store);
}

export function publicMemberConnection(connection: MemberConnection) {
  return {
    memberId: connection.memberId,
    googleEmail: connection.googleEmail,
    connectedAt: connection.connectedAt,
    calendars: connection.calendars.map((c) => ({
      googleCalendarId: c.googleCalendarId,
      summary: c.summary,
      enabled: c.enabled,
      display: c.display,
      color: c.color,
      label: c.label,
    })),
  };
}
