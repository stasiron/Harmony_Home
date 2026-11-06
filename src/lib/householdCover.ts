import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { compressImage } from "@/lib/floorPlan";
import { guardWriteBudget } from "@/lib/householdSync";
import { updateHouseholdMeta } from "@/lib/householdSetup";
import type { WeatherLocation } from "@/types";

/**
 * Zdjęcie mieszkania na ekranie wejścia — jak plan, data URL w osobnym
 * dokumencie (`households/{id}/assets/cover`). Kafelek jest mały, więc
 * obraz trzymamy niewielki (~150 KB), żeby ekran wejścia ładował się szybko.
 */
const COVER_MAX_SIDE = 900;
const COVER_MAX_LENGTH = 200_000;

export function compressCover(file: File) {
  return compressImage(file, COVER_MAX_SIDE, COVER_MAX_LENGTH);
}

export async function saveCover(householdId: string, file: File) {
  const image = await compressCover(file);
  guardWriteBudget();
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  const updatedAt = new Date().toISOString();
  await setDoc(doc(db, "households", householdId, "assets", "cover"), {
    dataUrl: image.dataUrl,
    updatedAt,
  });
  await updateHouseholdMeta(householdId, { cover: { updatedAt } });
}

export async function removeCover(householdId: string) {
  guardWriteBudget();
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  await updateHouseholdMeta(householdId, { cover: null });
  await deleteDoc(doc(db, "households", householdId, "assets", "cover"));
}

export type HouseholdCardData = {
  name: string;
  /** Mniejszy podpis: miejscowość albo liczba domowników */
  subtitle: string | null;
  coverSrc: string | null;
};

/**
 * Dane kafelka na ekran wejścia — jednorazowy odczyt (nie subskrypcja),
 * żeby ekran z kilkoma mieszkaniami nie trzymał otwartych nasłuchów.
 */
export async function fetchHouseholdCard(
  householdId: string,
): Promise<HouseholdCardData | null> {
  const db = getFirestoreDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "households", householdId));
  const data = snap.data();
  if (!data) return null;

  let coverSrc: string | null = null;
  if (data.cover && typeof data.cover.updatedAt === "string") {
    const cover = await getDoc(
      doc(db, "households", householdId, "assets", "cover"),
    ).catch(() => null);
    const src = cover?.data()?.dataUrl;
    coverSrc = typeof src === "string" ? src : null;
  }

  const location = data.weatherLocation as WeatherLocation | undefined;
  return {
    name: String(data.name ?? "Mieszkanie"),
    subtitle: typeof location?.name === "string" ? location.name : null,
    coverSrc,
  };
}
