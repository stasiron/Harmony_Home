import { foodKey } from "@/lib/kitchen";

/**
 * Biblioteka emotek dla kuchni i zapasów — pogrupowana, z polskimi
 * słowami do wyszukiwania i do podpowiadania emotki po nazwie produktu.
 */
export type EmojiEntry = { emoji: string; words: string[] };
export type EmojiGroup = { id: string; label: string; items: EmojiEntry[] };

const e = (emoji: string, words: string): EmojiEntry => ({
  emoji,
  words: words.split(" "),
});

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: "dairy",
    label: "Nabiał",
    items: [
      e("🥛", "mleko kefir maślanka jogurt pitny"),
      e("🧀", "ser mozzarella feta gouda cheddar parmezan twarog brie"),
      e("🧈", "maslo margaryna"),
      e("🥚", "jajka jajko"),
      e("🍦", "lody jogurt deser smietana"),
      e("🥣", "jogurt platki owsianka musli"),
    ],
  },
  {
    id: "produce",
    label: "Warzywa i owoce",
    items: [
      e("🍎", "jablko jablka"),
      e("🍌", "banan banany"),
      e("🍋", "cytryna limonka"),
      e("🍊", "pomarancza mandarynka"),
      e("🍇", "winogrona"),
      e("🍓", "truskawki truskawka"),
      e("🫐", "borowki jagody"),
      e("🍐", "gruszka"),
      e("🥑", "awokado"),
      e("🍅", "pomidor pomidory"),
      e("🥒", "ogorek ogorki"),
      e("🥕", "marchew marchewka"),
      e("🥔", "ziemniaki ziemniak"),
      e("🧅", "cebula"),
      e("🧄", "czosnek"),
      e("🫑", "papryka"),
      e("🥦", "brokul brokuly kalafior"),
      e("🥬", "salata kapusta szpinak rukola"),
      e("🌽", "kukurydza"),
      e("🍄", "pieczarki grzyby"),
      e("🌿", "natka koperek bazylia ziola"),
    ],
  },
  {
    id: "meat",
    label: "Mięso i ryby",
    items: [
      e("🍗", "kurczak piers udko drob indyk"),
      e("🥩", "wolowina stek mieso wieprzowina schab"),
      e("🥓", "boczek bekon"),
      e("🌭", "parowki kielbasa"),
      e("🍖", "zeberka mieso"),
      e("🐟", "ryba losos dorsz tunczyk"),
      e("🦐", "krewetki owoce morza"),
      e("🥪", "szynka wedlina"),
    ],
  },
  {
    id: "bakery",
    label: "Pieczywo i spiżarnia",
    items: [
      e("🍞", "chleb tost"),
      e("🥖", "bagietka bulka"),
      e("🥐", "rogal croissant"),
      e("🍝", "makaron spaghetti"),
      e("🍚", "ryz kasza"),
      e("🥫", "puszka konserwa fasola groszek sos"),
      e("🫘", "fasola ciecierzyca soczewica"),
      e("🧂", "sol przyprawy pieprz"),
      e("🫒", "oliwa oliwki olej"),
      e("🍯", "miod dzem"),
      e("🥜", "orzechy maslo orzechowe"),
      e("🌾", "maka"),
      e("🍬", "cukier slodycze cukierki"),
      e("🍫", "czekolada"),
      e("🍪", "ciastka herbatniki"),
      e("🥨", "precle chipsy przekaski paluszki"),
    ],
  },
  {
    id: "frozen",
    label: "Mrożonki i dania",
    items: [
      e("🧊", "lod kostki mrozonki"),
      e("🍕", "pizza"),
      e("🥟", "pierogi uszka"),
      e("🍟", "frytki"),
      e("🍲", "zupa gulasz"),
    ],
  },
  {
    id: "drinks",
    label: "Napoje",
    items: [
      e("💧", "woda"),
      e("🧃", "sok"),
      e("🥤", "napoj cola"),
      e("☕", "kawa"),
      e("🍵", "herbata"),
      e("🍺", "piwo"),
      e("🍷", "wino"),
    ],
  },
  {
    id: "household",
    label: "Chemia i dom",
    items: [
      e("🧻", "papier toaletowy reczniki papierowe"),
      e("🧼", "mydlo"),
      e("🧴", "plyn szampon zel balsam"),
      e("🧽", "gabki gabka zmywak"),
      e("🫧", "plyn do naczyn proszek kapsulki pranie"),
      e("🗑️", "worki smieci"),
      e("🪥", "szczoteczka pasta"),
      e("💡", "zarowka"),
      e("🔋", "baterie"),
      e("🧹", "miotla mop"),
    ],
  },
  {
    id: "things",
    label: "Dom i rzeczy",
    items: [
      e("📁", "folder inne dokumenty"),
      e("🔧", "naprawa narzedzia klucz"),
      e("🧰", "skrzynka narzedzia"),
      e("🪴", "rosliny kwiaty"),
      e("🚗", "samochod auto"),
      e("🐾", "zwierzeta"),
      e("📺", "telewizor sprzet rtv"),
      e("🎮", "gry konsola"),
      e("🧒", "dzieci"),
      e("🛏️", "sypialnia lozko posciel"),
      e("🚿", "lazienka prysznic"),
      e("🔌", "prad gniazdko elektryka"),
      e("📦", "paczka pudelko zapas"),
    ],
  },
  {
    id: "other",
    label: "Inne",
    items: [
      e("🍽️", "obiad danie"),
      e("🥗", "salatka"),
      e("🍳", "sniadanie jajecznica"),
      e("🥘", "danie kuchnia"),
      e("🐶", "pies karma"),
      e("🐱", "kot karma"),
      e("💊", "leki"),
      e("🎁", "prezent"),
    ],
  },
];

const ALL = EMOJI_GROUPS.flatMap((g) => g.items);

/** Emotka po nazwie produktu („Mozzarella” → 🧀); null — nic nie pasuje */
export function suggestEmoji(name: string): string | null {
  const words = foodKey(name).split(" ").filter(Boolean);
  if (words.length === 0) return null;
  for (const word of words) {
    const hit = ALL.find((entry) =>
      entry.words.some((w) =>
        word.startsWith(w.slice(0, Math.max(4, w.length - 2))),
      ),
    );
    if (hit) return hit.emoji;
  }
  return null;
}

/** Wyszukiwanie w bibliotece (po polsku, bez znaków diakrytycznych) */
export function searchEmoji(query: string): EmojiEntry[] {
  const q = foodKey(query);
  if (!q) return ALL;
  return ALL.filter((entry) => entry.words.some((w) => w.includes(q)));
}

/** Kolory etykiet — tokeny CSS `--tag-1..8` (styles.css) */
export const TAG_COLORS = [
  "tag-1",
  "tag-2",
  "tag-3",
  "tag-4",
  "tag-5",
  "tag-6",
  "tag-7",
  "tag-8",
] as const;
