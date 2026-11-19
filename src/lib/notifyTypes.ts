/** Kategorie powiadomień — każdą można wyłączyć w Ustawieniach */
export const NOTIFY_CATEGORIES = [
  {
    id: "chores",
    label: "Obowiązki i przypomnienia",
    hint: "Poranne podsumowanie i przypomnienia mieszkania",
  },
  {
    id: "money",
    label: "Rachunki i zwroty",
    hint: "Nowy rachunek, prośba o zwrot",
  },
  { id: "board", label: "Ogłoszenia", hint: "Nowe ogłoszenie na tablicy" },
  { id: "issues", label: "Usterki", hint: "Nowa usterka w mieszkaniu" },
  {
    id: "guests",
    label: "Goście i wyjazdy",
    hint: "Zapowiedź gościa, czyjś wyjazd",
  },
] as const;

export type NotifyCategory = (typeof NOTIFY_CATEGORIES)[number]["id"];

export type NotifyKind =
  | "refund"
  | "bill"
  | "announcement"
  | "issue"
  | "guest"
  | "absence"
  | "bugReport";
