import type { User } from "@/types";

/**
 * Domyślni domownicy — edytuj ten plik pod swoją rodzinę.
 *
 * Wyzeruj listę (`[]`) żeby startować bez nikogo i dodawać tylko z UI.
 * Usuń pojedynczy wpis albo zmień pola (name, avatar, color, active).
 * id zostaw stabilne jeśli później przypiszesz obowiązki w plikach.
 */
export const DEFAULT_MEMBERS: User[] = [
  { id: "member-1", name: "Maciek", avatar: "M", color: "chart-1", active: true, heavyDay: false },
  { id: "member-2", name: "Ania", avatar: "A", color: "chart-2", active: true, heavyDay: false },
  { id: "member-3", name: "Stas", avatar: "S", color: "chart-3", active: true, heavyDay: false },
  { id: "member-4", name: "Tymek", avatar: "T", color: "chart-4", active: true, heavyDay: false },
];
