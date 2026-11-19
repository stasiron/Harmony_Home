import webpush from "web-push";
import { getAppOrigin } from "@/lib/googleOAuth.server";
import { verifyFirebaseIdToken } from "@/lib/firebaseToken.server";
import {
  deleteDocument,
  firestoreServerConfigured,
  setDocument,
  getDocument,
  listDocuments,
  type RestDoc,
} from "@/lib/firestoreRest.server";
import { formatPLN, openShare } from "@/lib/money";
import { digestLines } from "@/lib/digest";
import {
  absenceOn,
  assigneesWithAbsences,
  normalizeAbsence,
} from "@/lib/absence";
import { SUPER_ADMIN_EMAIL } from "@/lib/householdSetup";
import {
  NOTIFY_CATEGORIES,
  isNotifyKind,
  type NotifyCategory,
  type NotifyKind,
} from "@/lib/notifyTypes";
import type { Absence, Bill, Purchase, Task } from "@/types";

// ─── Konfiguracja ──────────────────────────────────────────────────────────

function vapidKeys() {
  const publicKey = (
    process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY
  )?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  return publicKey && privateKey ? { publicKey, privateKey } : null;
}

export function pushConfigured(): boolean {
  return Boolean(vapidKeys() && firestoreServerConfigured());
}

let vapidReady = false;
function ensureVapid(): boolean {
  const keys = vapidKeys();
  if (!keys) return false;
  if (!vapidReady) {
    // Temat VAPID: adres aplikacji (https) — bez prywatnych e-maili.
    // Lokalnie (http) usługi push i tak nie dostają tego adresu.
    const origin = getAppOrigin();
    const subject = origin.startsWith("https://")
      ? origin
      : "https://localhost";
    webpush.setVapidDetails(subject, keys.publicKey, keys.privateKey);
    vapidReady = true;
  }
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Dokąd prowadzi kliknięcie */
  url: string;
  /** Ten sam tag zastępuje poprzednie powiadomienie */
  tag?: string;
};

// ─── Wysyłka ───────────────────────────────────────────────────────────────

/** Czy osoba chce powiadomienia tej kategorii (domyślnie wszystkie) */
async function wants(uid: string, category: NotifyCategory): Promise<boolean> {
  const user = await getDocument(`users/${uid}`);
  const prefs = user?.data.notify as Record<string, unknown> | undefined;
  return prefs?.[category] !== false;
}

/** Wysyła na wszystkie urządzenia osoby; martwe subskrypcje usuwa */
export async function sendToUid(
  uid: string,
  category: NotifyCategory,
  payload: PushPayload,
): Promise<number> {
  if (!ensureVapid() || !(await wants(uid, category))) return 0;
  const subs = await listDocuments(`users/${uid}/pushSubscriptions`);
  let sent = 0;
  await Promise.all(
    subs.map(async (sub) => {
      const endpoint = sub.data.endpoint;
      const keys = sub.data.keys as { p256dh?: string; auth?: string } | null;
      if (typeof endpoint !== "string" || !keys?.p256dh || !keys.auth) return;
      try {
        await webpush.sendNotification(
          { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 12, urgency: "normal" },
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // Urządzenie wyrejestrowane — subskrypcja już nie zadziała
        if (status === 404 || status === 410) {
          await deleteDocument(`users/${uid}/pushSubscriptions/${sub.id}`);
        } else {
          console.warn("push failed", status);
        }
      }
    }),
  );
  return sent;
}

async function sendToMany(
  uids: Iterable<string>,
  category: NotifyCategory,
  payload: PushPayload,
): Promise<number> {
  const results = await Promise.all(
    [...new Set(uids)].map((uid) => sendToUid(uid, category, payload)),
  );
  return results.reduce((s, n) => s + n, 0);
}

// ─── Mieszkanie ────────────────────────────────────────────────────────────

type MemberRef = { uid: string; profileId: string | null; role: string };

async function membersOf(householdId: string): Promise<MemberRef[]> {
  const docs = await listDocuments(`households/${householdId}/members`);
  return docs.map((d) => ({
    uid: d.id,
    profileId: typeof d.data.profileId === "string" ? d.data.profileId : null,
    role: typeof d.data.role === "string" ? d.data.role : "member",
  }));
}

async function profileNames(householdId: string): Promise<Map<string, string>> {
  const docs = await listDocuments(`households/${householdId}/profiles`);
  return new Map(
    docs.map((d) => [d.id, typeof d.data.name === "string" ? d.data.name : ""]),
  );
}

function uidsForProfiles(members: MemberRef[], profiles: Iterable<string>) {
  const wanted = new Set(profiles);
  return members
    .filter((m) => m.profileId && wanted.has(m.profileId))
    .map((m) => m.uid);
}

// ─── Zdarzenia z aplikacji ─────────────────────────────────────────────────

export type NotifyRequest = {
  idToken?: string | null;
  householdId: string;
  kind: NotifyKind;
  refId: string;
};

/**
 * Powiadomienie o zdarzeniu. Treść budujemy z dokumentu w bazie, nie
 * z tekstu od klienta — nikt nie roześle innym dowolnej wiadomości.
 */
export async function notifyImpl(
  req: NotifyRequest,
): Promise<{ ok: boolean; sent: number; reason?: string }> {
  if (!pushConfigured())
    return { ok: false, sent: 0, reason: "not-configured" };
  const viewer = await verifyFirebaseIdToken(req.idToken);
  if (!viewer) return { ok: false, sent: 0, reason: "unauthenticated" };
  const hid = req.householdId;
  if (
    !isNotifyKind(req.kind) ||
    typeof hid !== "string" ||
    typeof req.refId !== "string" ||
    !/^[\w-]{1,128}$/.test(hid) ||
    !/^[\w-]{1,128}$/.test(req.refId)
  ) {
    return { ok: false, sent: 0, reason: "bad-request" };
  }
  // Limit: to samo zdarzenie najwyżej raz na jakiś czas, osoba najwyżej
  // kilkanaście wywołań na godzinę — nikt nie zaspamuje domowników
  const limited = await rateLimited(viewer.uid, hid, req.kind, req.refId);
  if (limited) return { ok: false, sent: 0, reason: limited };

  if (req.kind === "bugReport") {
    // Do administratora ogólnego — jego konto znajdziemy po członkostwach
    const report = await getDocument(`bugReports/${req.refId}`);
    if (!report || report.data.uid !== viewer.uid) {
      return { ok: false, sent: 0, reason: "not-found" };
    }
    const admins = await superAdminUids();
    const sent = await sendToMany(admins, "issues", {
      title: "Nowe zgłoszenie błędu",
      body: String(report.data.description ?? "").slice(0, 120),
      url: "/settings?section=reports",
      tag: `bug-${req.refId}`,
    });
    return { ok: true, sent };
  }

  const members = await membersOf(hid);
  if (!members.some((m) => m.uid === viewer.uid)) {
    return { ok: false, sent: 0, reason: "not-member" };
  }
  const others = members.filter((m) => m.uid !== viewer.uid).map((m) => m.uid);
  const names = await profileNames(hid);
  const nameOf = (id: string | null | undefined) =>
    (id && names.get(id)) || "Ktoś";

  switch (req.kind) {
    case "refund": {
      const doc = await getDocument(`households/${hid}/purchases/${req.refId}`);
      if (!doc) return { ok: false, sent: 0, reason: "not-found" };
      const purchase = { ...(doc.data as unknown as Purchase), id: doc.id };
      let sent = 0;
      for (const debtor of Object.keys(purchase.shares ?? {})) {
        const amount = openShare(purchase, debtor);
        if (amount <= 0) continue;
        sent += await sendToMany(uidsForProfiles(members, [debtor]), "money", {
          title: `${nameOf(purchase.paidBy)} prosi o zwrot`,
          body: `${formatPLN(amount)} za „${purchase.title}”`,
          url: "/bills?tab=purchases",
          tag: `refund-${doc.id}`,
        });
      }
      return { ok: true, sent };
    }
    case "bill": {
      const doc = await getDocument(`households/${hid}/bills/${req.refId}`);
      if (!doc) return { ok: false, sent: 0, reason: "not-found" };
      const bill = doc.data as unknown as Bill;
      let sent = 0;
      for (const member of members) {
        if (member.uid === viewer.uid) continue;
        const share = member.profileId ? bill.shares?.[member.profileId] : null;
        sent += await sendToUid(member.uid, "money", {
          title: `Rachunek: ${bill.name}`,
          body: share
            ? `${formatPLN(bill.amount)} — Twoja część ${formatPLN(share)}`
            : formatPLN(bill.amount),
          url: "/bills",
          tag: `bill-${doc.id}`,
        });
      }
      return { ok: true, sent };
    }
    case "announcement": {
      const doc = await getDocument(
        `households/${hid}/announcements/${req.refId}`,
      );
      if (!doc) return { ok: false, sent: 0, reason: "not-found" };
      const sent = await sendToMany(others, "board", {
        title: `Ogłoszenie: ${String(doc.data.title ?? "")}`.slice(0, 80),
        body: String(doc.data.body ?? "").slice(0, 140),
        url: "/board",
        tag: `post-${doc.id}`,
      });
      return { ok: true, sent };
    }
    case "issue": {
      const doc = await getDocument(`households/${hid}/todos/${req.refId}`);
      if (!doc || doc.data.folderId !== "usterki") {
        return { ok: false, sent: 0, reason: "not-found" };
      }
      const sent = await sendToMany(others, "issues", {
        title: "Nowa usterka",
        body: String(doc.data.text ?? "").slice(0, 140),
        url: "/todo",
        tag: `issue-${doc.id}`,
      });
      return { ok: true, sent };
    }
    case "guest": {
      const doc = await getDocument(
        `households/${hid}/guestPlans/${req.refId}`,
      );
      if (!doc) return { ok: false, sent: 0, reason: "not-found" };
      const when = new Date(String(doc.data.when ?? ""));
      const host = nameOf(doc.data.hostId as string | null);
      const sent = await sendToMany(others, "guests", {
        title: `${host} zapowiada gościa`,
        body: `${String(doc.data.title || doc.data.notes || "Goście")} · ${when.toLocaleString(
          "pl-PL",
          {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Warsaw",
          },
        )}`,
        url: "/calendar",
        tag: `guest-${doc.id}`,
      });
      return { ok: true, sent };
    }
    case "absence": {
      const doc = await getDocument(`households/${hid}/absences/${req.refId}`);
      if (!doc) return { ok: false, sent: 0, reason: "not-found" };
      const sent = await sendToMany(others, "guests", {
        title: `${nameOf(doc.data.profileId as string)} wyjeżdża`,
        body: `${String(doc.data.from)} – ${String(doc.data.to)}${
          doc.data.mode === "reassign"
            ? " · obowiązki przechodzą na pozostałych"
            : " · obowiązki się przesuwają"
        }`,
        url: "/calendar",
        tag: `absence-${doc.id}`,
      });
      return { ok: true, sent };
    }
    default:
      return { ok: false, sent: 0, reason: "bad-kind" };
  }
}

/** Jak długo to samo zdarzenie nie wyśle się ponownie */
const EVENT_COOLDOWN_MS: Partial<Record<NotifyKind, number>> = {
  // „Przypomnij” o zwrocie — najwyżej co 6 godzin
  refund: 6 * 3600_000,
};
const DEFAULT_COOLDOWN_MS = 24 * 3600_000;
const USER_LIMIT = { calls: 15, windowMs: 3600_000 };

/**
 * Limity w bazie (kolekcja notifyLog — klienci nie mają do niej dostępu,
 * pisze tylko serwer kontem serwisowym). Zwraca powód odmowy albo null.
 */
async function rateLimited(
  uid: string,
  householdId: string,
  kind: NotifyKind,
  refId: string,
): Promise<string | null> {
  const now = Date.now();
  const userPath = `notifyLog/u_${uid}`;
  const user = await getDocument(userPath);
  const windowStart = Number(user?.data.windowStart ?? 0);
  const calls = Number(user?.data.calls ?? 0);
  const inWindow = now - windowStart < USER_LIMIT.windowMs;
  if (inWindow && calls >= USER_LIMIT.calls) return "rate-limited";

  const eventPath = `notifyLog/e_${householdId}_${kind}_${refId}`.slice(
    0,
    1400,
  );
  const event = await getDocument(eventPath);
  const last = Number(event?.data.at ?? 0);
  const cooldown = EVENT_COOLDOWN_MS[kind] ?? DEFAULT_COOLDOWN_MS;
  if (now - last < cooldown) return "already-sent";

  await Promise.all([
    setDocument(userPath, {
      windowStart: inWindow ? windowStart : now,
      calls: inWindow ? calls + 1 : 1,
    }),
    setDocument(eventPath, { at: now, by: uid }),
  ]);
  return null;
}

async function superAdminUids(): Promise<string[]> {
  // Konto administratora ogólnego ma dokument users/{uid} z e-mailem
  const users = await listDocuments("users");
  return users
    .filter(
      (u) =>
        typeof u.data.email === "string" &&
        u.data.email.toLowerCase() === SUPER_ADMIN_EMAIL,
    )
    .map((u) => u.id);
}

export async function testPushImpl(
  idToken: string | null | undefined,
): Promise<{ ok: boolean; sent: number; reason?: string }> {
  if (!pushConfigured())
    return { ok: false, sent: 0, reason: "not-configured" };
  const viewer = await verifyFirebaseIdToken(idToken);
  if (!viewer) return { ok: false, sent: 0, reason: "unauthenticated" };
  // Test omija preferencje — ma przyjść zawsze
  const subs = await listDocuments(`users/${viewer.uid}/pushSubscriptions`);
  if (subs.length === 0) return { ok: false, sent: 0, reason: "no-device" };
  ensureVapid();
  let sent = 0;
  for (const sub of subs) {
    const keys = sub.data.keys as { p256dh: string; auth: string };
    try {
      await webpush.sendNotification(
        { endpoint: String(sub.data.endpoint), keys },
        JSON.stringify({
          title: "HomeHarmony",
          body: "Powiadomienia działają na tym urządzeniu.",
          url: "/settings",
          tag: "test",
        } satisfies PushPayload),
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await deleteDocument(`users/${viewer.uid}/pushSubscriptions/${sub.id}`);
      }
    }
  }
  return { ok: sent > 0, sent };
}

// ─── Przypomnienia (cron) ──────────────────────────────────────────────────

const WARSAW = "Europe/Warsaw";

function warsawParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: WARSAW,
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    hour: Number(get("hour")),
    weekday: weekdays.indexOf(get("weekday")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

type ReminderSettings = {
  dailyHour: number;
  extra: { time: string; days: number[]; text: string }[];
};

function remindersOf(meta: Record<string, unknown>): ReminderSettings {
  const raw = (meta.reminders ?? {}) as Partial<ReminderSettings>;
  return {
    dailyHour:
      typeof raw.dailyHour === "number" &&
      raw.dailyHour >= 0 &&
      raw.dailyHour < 24
        ? raw.dailyHour
        : 8,
    extra: Array.isArray(raw.extra) ? raw.extra : [],
  };
}

async function digestForHousehold(
  household: RestDoc,
  now: Date,
  today: string,
): Promise<number> {
  const hid = household.id;
  const [members, chores, zadania, bills, purchases, names, absenceDocs] =
    await Promise.all([
      membersOf(hid),
      listDocuments(`households/${hid}/chores`),
      listDocuments(`households/${hid}/zadania`),
      listDocuments(`households/${hid}/bills`),
      listDocuments(`households/${hid}/purchases`),
      profileNames(hid),
      listDocuments(`households/${hid}/absences`),
    ]);
  const absences = absenceDocs
    .map((d) => normalizeAbsence({ ...d.data, id: d.id }))
    .filter((a): a is Absence => a !== null);
  const present = [...names.keys()];
  const items = [...chores, ...zadania].map(
    (d) => ({ ...d.data, id: d.id }) as unknown as Task,
  );
  const billList = bills.map(
    (d) => ({ ...d.data, id: d.id }) as unknown as Bill,
  );
  const purchaseList = purchases.map(
    (d) => ({ ...d.data, id: d.id }) as unknown as Purchase,
  );
  let sent = 0;
  for (const member of members) {
    const pid = member.profileId;
    // Nieobecny dziś — bez porannego podsumowania
    if (!pid || absenceOn(absences, pid, today)) continue;
    const lines = digestLines({
      profileId: pid,
      items,
      bills: billList,
      purchases: purchaseList,
      nameOf: (id) => names.get(id) || "ktoś",
      now,
      today,
      // Kolejka pomija nieobecnych, „przekaż innym” trafia do obecnych
      assigneesOf: (item) =>
        assigneesWithAbsences(item as Task, absences, today, present),
    });
    if (lines.length === 0) continue;
    sent += await sendToUid(member.uid, "chores", {
      title: "Na dziś w domu",
      body: lines.join("\n"),
      url: "/",
      tag: `digest-${today}`,
    });
  }
  return sent;
}

/**
 * daily — wywołanie Vercel Cron raz dziennie: podsumowanie dla wszystkich
 * (chyba że REMINDERS_HOURLY=1 — wtedy wszystko robi wywołanie godzinowe).
 * hourly — zewnętrzny wyzwalacz co godzinę: podsumowanie o godzinie
 * ustawionej w mieszkaniu + dodatkowe przypomnienia właściciela.
 */
export async function runReminders(
  mode: "daily" | "hourly",
  now = new Date(),
): Promise<{ households: number; sent: number; skipped?: string }> {
  if (!pushConfigured())
    return { households: 0, sent: 0, skipped: "not-configured" };
  const hourlyEnabled = process.env.REMINDERS_HOURLY === "1";
  if (mode === "daily" && hourlyEnabled) {
    return { households: 0, sent: 0, skipped: "hourly-mode" };
  }
  const { hour, weekday, date } = warsawParts(now);
  const households = await listDocuments("households");
  let sent = 0;
  for (const household of households) {
    const settings = remindersOf(household.data);
    try {
      if (mode === "daily" || settings.dailyHour === hour) {
        sent += await digestForHousehold(household, now, date);
      }
      if (mode === "hourly") {
        const due = settings.extra.filter(
          (r) =>
            Number(String(r.time).split(":")[0]) === hour &&
            (!Array.isArray(r.days) ||
              r.days.length === 0 ||
              r.days.includes(weekday)),
        );
        if (due.length > 0) {
          const members = await membersOf(household.id);
          for (const reminder of due) {
            sent += await sendToMany(
              members.map((m) => m.uid),
              "chores",
              {
                title: String(household.data.name ?? "HomeHarmony"),
                body: String(reminder.text || "Przypomnienie"),
                url: "/",
                tag: `extra-${household.id}-${reminder.time}`,
              },
            );
          }
        }
      }
    } catch (err) {
      console.error("reminders failed for household", household.id, err);
    }
  }
  return { households: households.length, sent };
}

export { NOTIFY_CATEGORIES };
