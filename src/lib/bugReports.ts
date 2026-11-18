import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { guardWriteBudget } from "@/lib/householdSync";
import type { BugReport } from "@/types";

/** Miejsce na ekranie wskazane palcem/myszką */
export type PickedSpot = {
  selector: string | null;
  elementText: string | null;
  heading: string | null;
  x: number | null;
  y: number | null;
};

const MAX_TEXT = 160;

function clip(text: string | null | undefined, max = MAX_TEXT) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** Krótka ścieżka CSS do elementu — do odnalezienia go w kodzie */
export function selectorFor(element: Element | null): string | null {
  if (!element) return null;
  const parts: string[] = [];
  let el: Element | null = element;
  for (let depth = 0; el && depth < 6 && el !== document.body; depth++) {
    let part = el.tagName.toLowerCase();
    if (el.id) {
      parts.unshift(`${part}#${el.id}`);
      break;
    }
    const label = el.getAttribute("aria-label");
    const role = el.getAttribute("role");
    if (label) part += `[aria-label="${label.slice(0, 40)}"]`;
    else if (role) part += `[role="${role}"]`;
    const parent: Element | null = el.parentElement;
    if (parent) {
      const same = [...parent.children].filter(
        (c) => c.tagName === el!.tagName,
      );
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(el) + 1})`;
    }
    parts.unshift(part);
    el = parent;
  }
  return parts.join(" > ");
}

/** Najbliższy nagłówek sekcji, w której jest element */
function headingFor(element: Element | null): string | null {
  let el: Element | null = element;
  while (el && el !== document.body) {
    const heading = el.querySelector("h1, h2, h3, [role=heading]");
    if (heading && heading !== element) return clip(heading.textContent, 80);
    el = el.parentElement;
  }
  return clip(document.querySelector("h1")?.textContent, 80);
}

const INTERACTIVE =
  "button, a, input, select, textarea, label, [role=button], [role=tab], [role=checkbox], [role=switch], [role=combobox], li, h1, h2, h3";

export function describeSpot(
  picked: Element | null,
  x: number,
  y: number,
): PickedSpot {
  // Najbliższy „konkretny” element (przycisk, pole, wiersz listy) zamiast
  // kontenera, w który akurat trafił palec
  const element = picked?.closest(INTERACTIVE) ?? picked;
  return {
    selector: selectorFor(element),
    elementText: clip(
      element?.getAttribute("aria-label") ||
        (element as HTMLElement | null)?.innerText ||
        element?.textContent,
    ),
    heading: headingFor(element),
    x: Math.round(x),
    y: Math.round(y),
  };
}

export async function sendBugReport(
  report: Omit<BugReport, "id" | "status" | "createdAt">,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  guardWriteBudget();
  await setDoc(doc(collection(db, "bugReports")), {
    ...report,
    description: report.description.slice(0, 4000),
    status: "new",
    createdAt: new Date().toISOString(),
  });
}

/** Lista zgłoszeń — tylko administrator ogólny (reguły) */
export function subscribeBugReports(
  onData: (reports: BugReport[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    query(
      collection(db, "bugReports"),
      orderBy("createdAt", "desc"),
      limit(100),
    ),
    (snap) =>
      onData(snap.docs.map((d) => ({ ...(d.data() as BugReport), id: d.id }))),
    (err) => onError?.(err),
  );
}

export async function setBugReportStatus(
  id: string,
  status: BugReport["status"],
) {
  const db = getFirestoreDb();
  if (!db) return;
  guardWriteBudget();
  await updateDoc(doc(db, "bugReports", id), { status });
}

export async function deleteBugReport(id: string) {
  const db = getFirestoreDb();
  if (!db) return;
  guardWriteBudget();
  await deleteDoc(doc(db, "bugReports", id));
}
