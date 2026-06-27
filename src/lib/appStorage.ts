import { DEFAULT_MEMBERS } from "@/config/household";
import type { GuestPlan, ShoppingItem, User } from "@/types";

const STORAGE_KEY = "homeharmony-app";

type AppStorage = {
  users: User[];
  shopping: ShoppingItem[];
  guestPlans: GuestPlan[];
};

function emptyStorage(): AppStorage {
  return { users: [], shopping: [], guestPlans: [] };
}

function readStorage(): AppStorage {
  if (typeof window === "undefined") return emptyStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStorage();
    const parsed = JSON.parse(raw) as Partial<AppStorage>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
      guestPlans: Array.isArray(parsed.guestPlans) ? parsed.guestPlans : [],
    };
  } catch {
    return emptyStorage();
  }
}

export function loadInitialUsers(): User[] {
  const stored = readStorage().users;
  if (stored.length > 0) return stored;
  return [...DEFAULT_MEMBERS];
}

export function loadInitialShopping(): ShoppingItem[] {
  return readStorage().shopping;
}

export function loadInitialGuestPlans(): GuestPlan[] {
  return readStorage().guestPlans;
}

export function persistAppState(state: AppStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
