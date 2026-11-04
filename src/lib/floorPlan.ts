import {
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import {
  updateHouseholdMeta,
  type FloorPlanUpload,
} from "@/lib/householdSetup";
import { FLOOR_PLAN_SIZE, FLOOR_PLAN_SRC } from "@/lib/contentPaths";
import type { FloorPlanRef } from "@/types";

/**
 * Plan mieszkania trzymamy jako data URL w osobnym dokumencie Firestore
 * (`households/{id}/assets/floorPlan`) — bez Firebase Storage i planu Blaze.
 * Dokument ma limit 1 MB, więc obraz zmniejszamy i kompresujemy.
 */
const MAX_SIDE = 1600;
const MAX_DATA_URL_LENGTH = 900_000;

export type FloorPlanImage = { src: string; width: number; height: number };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nie udało się wczytać obrazka."));
    };
    img.src = url;
  });
}

export async function compressFloorPlan(file: File): Promise<FloorPlanUpload> {
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));

  for (let attempt = 0; attempt < 6; attempt++) {
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);

    for (const quality of [0.85, 0.7, 0.55]) {
      const dataUrl = canvas.toDataURL("image/webp", quality);
      const usable = dataUrl.startsWith("data:image/webp")
        ? dataUrl
        : canvas.toDataURL("image/jpeg", quality);
      if (usable.length <= MAX_DATA_URL_LENGTH) {
        return { dataUrl: usable, width, height };
      }
    }
    scale *= 0.75;
  }
  throw new Error("Obrazek jest za duży — spróbuj mniejszego pliku.");
}

export async function saveFloorPlan(
  householdId: string,
  plan: FloorPlanUpload,
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  const updatedAt = new Date().toISOString();
  await setDoc(doc(db, "households", householdId, "assets", "floorPlan"), {
    ...plan,
    updatedAt,
  });
  await updateHouseholdMeta(householdId, {
    floorPlan: {
      kind: "upload",
      width: plan.width,
      height: plan.height,
      updatedAt,
    },
  });
}

export async function removeFloorPlan(householdId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore niedostępny");
  await updateHouseholdMeta(householdId, { floorPlan: { kind: "none" } });
  await deleteDoc(doc(db, "households", householdId, "assets", "floorPlan"));
}

/** Obraz planu dla danego `FloorPlanRef`; null = mieszkanie bez planu */
export function subscribeFloorPlanImage(
  householdId: string,
  ref: FloorPlanRef,
  onData: (image: FloorPlanImage | null) => void,
): Unsubscribe | null {
  if (ref.kind === "none") {
    onData(null);
    return null;
  }
  if (ref.kind === "bundled") {
    onData({ src: FLOOR_PLAN_SRC, ...FLOOR_PLAN_SIZE });
    return null;
  }
  const db = getFirestoreDb();
  if (!db) return null;
  return onSnapshot(
    doc(db, "households", householdId, "assets", "floorPlan"),
    (snap) => {
      const data = snap.data();
      onData(
        typeof data?.dataUrl === "string"
          ? {
              src: data.dataUrl,
              width: Number(data.width) || ref.width,
              height: Number(data.height) || ref.height,
            }
          : null,
      );
    },
    (err) => {
      console.error("Floor plan load failed:", err);
      onData(null);
    },
  );
}
