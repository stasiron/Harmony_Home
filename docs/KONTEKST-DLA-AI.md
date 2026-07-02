# HomeHarmony — kontekst dla agentów AI i nowych czatów

**Przeczytaj ten plik na start każdej sesji** nad tym repozytorium. Zawiera esencję działania + struktury + zasady pracy.

Szczegóły: [`DZIALANIE.md`](./DZIALANIE.md) | [`STRUKTURA-I-TECHNOLOGIE.md`](./STRUKTURA-I-TECHNOLOGIE.md) | [`gaps/`](./gaps/)

---

## Czym jest projekt

**HomeHarmony / Homebase** — aplikacja webowa (React, TanStack Start) dla gospodarstwa domowego:

- **Obowiązki** (`Task`) — powtarzalne, przypisane do domowników, harmonogram
- **Zadania** (`Zadanie`) — szczegółowe czynności bez osoby; linkowane do obowiązków
- **Mapa mieszkania** — plan PNG + pinezki / linie / obszary / strefy
- **Goście** — tryb `guestsMode` + przycisk **PANIC** na dashboardzie
- **Kalendarz** Google, domownicy, zakupy, statystyki, smart home (szkielet)

Docelowy UX: tablet/kiosk w domu. Język UI: **polski + angielski** (mieszany).

---

## Model danych (must know)

```
Obowiązek (Task)
  ├── assignedTo: string[]     ← tylko tutaj osoby
  ├── schedule?                ← harmonogram (recurring)
  ├── linkedZadanieIds?        ← powiązane Zadania
  └── mapShape, geometria

Zadanie (Zadanie)
  ├── tMin, tMax (dni)         ← zamiast harmonogramu
  ├── importance (1–5)       ← goście/PANIC + mnożnik wagi
  ├── estimatedMinutes         ← czas + składnik wagi
  ├── lastCompletedBy?         ← kto wykonał (dla % obowiązku)
  └── bez assignedTo
```

**Status:** `safe` | `suggested` | `must` | `done`  
Obowiązek z zadaniami → status z **wag** zadań (50% próg), nie z własnego harmonogramu.

**Waga:** `WAGA = minuty × (ważność/5 + 1)` — `src/config/choreWeight.ts`

---

## Skąd biorą się listy

| Źródło | Co |
|--------|-----|
| `content/data/chores.json` | Stałe obowiązki (rebuild) |
| `content/data/zadania.json` | Stałe zadania (rebuild) |
| `content/data/homeZones.json` | Strefy mapy (rebuild) |
| localStorage | `userTasks`, `userZadania`, `progress`, users, shopping |
| Firestore `households/homeharmony` | Sync powyższego między urządzeniami |

**Zasada:** zespół powtarzalnych obowiązków = JSON + to co przyszło z Firebase. Zmiana JSON = deploy.

---

## Tryby gości — nie mylić!

| | `guestsMode` | `panic` (dashboard) |
|---|--------------|---------------------|
| **Cel** | Przygotowanie na gości (plan: kalendarz / ręcznie) | Nagły tryb „rób najważniejsze” |
| **Włączenie** | Dziś: auto z kalendarza; ręczne — TODO | Przycisk na `/` — toggle |
| **Filtr listy** | Nie — wszystko widać | Tylko ważność ≥ 3 |
| **Sort** | Po ważności | Po ważności + rank 1,2,3… |
| **Persist** | Nie po refresh | Nie po refresh |
| **Timer** | Nie | Nie (usunięty) |

Tryb **PANIC na mapie** (kolory wg ważności) — **wyłączony w UI**, kod zamrożony. Nie przywracać bez prośby. → `docs/gaps/04-panic.md`

---

## Mapa mieszkania — zasady

- Tylko **obowiązki** na `ApartmentMap` (zadania nie — TODO)
- **Linia** = użytkownik zaznacza 2 punkty + grubość — to „obszar” zadania wzdłuż linii
- **Obszar** = polygon ≥ 3 pkt
- **Strefy** na mapie = nazwa + kontur przy hover (bez kolorowego fill całego pokoju)
- **`mapShape: "zone"`** — zapis OK, **render na głównej mapie brak** (TODO)

→ `docs/gaps/09-ksztalty-mapy.md`

---

## Gdzie co edytować (ściąga)

| Chcę zmienić… | Plik |
|---------------|------|
| Stałe obowiązki | `content/data/chores.json` |
| Stałe zadania | `content/data/zadania.json` |
| Strefy / plan pokoi | `content/data/homeZones.json` lub Ustawienia → Drzewo stref |
| Plan mieszkania (obrazek) | `content/images/apartment-floor-plan.png` |
| Domyślni domownicy | `src/config/household.ts` |
| Wzór wagi | `src/config/choreWeight.ts` |
| Logika statusów | `src/lib/choreZadaniaStatus.ts`, `AppContext.statusOf` |
| Harmonogram | `src/lib/choreRecurrence.ts` |
| Sync chmura | `src/lib/householdFirestore.ts` |
| Strona obowiązków | `src/routes/chores.tsx` |
| Globalny stan | `src/context/AppContext.tsx` |
| Typy | `src/types/index.ts` |

---

## Architektura w 5 krokach

1. **Routes** (`src/routes/`) — strony, wołają komponenty
2. **Components** — UI; ciężka logika → `lib/`
3. **AppContext** — stan domu, `statusOf`, sync Firestore
4. **lib/** — czysta logika domenowa
5. **content/data/** — dane wbudowane importowane przy buildzie

Stack: React 19, TanStack Start/Router, Vite, Tailwind, shadcn, Firebase, Nitro→Vercel.

---

## Zasady dla agenta (obowiązkowe)

1. **Minimalny diff** — tylko to, o co prosi użytkownik
2. **Nie commituj** bez wyraźnej prośby
3. **Nie usuwaj** zamrożonego kodu (np. mapa PANIC) — ukrywaj / dokumentuj
4. **Obowiązek ≠ Zadanie** — nie łącz w jeden typ
5. **Osoby tylko na obowiązku** — zadania mają `lastCompletedBy`
6. **Po zmianie JSON w content/** — użytkownik musi zrobić rebuild/deploy
7. **Sprawdź `docs/gaps/`** przed implementacją — może być już opisane jako TODO lub świadomie odłożone
8. **Język odpowiedzi:** polski (użytkownik polskojęzyczny)
9. **Wersja:** `src/version.ts` — podbij przy release jeśli proszą o wersjonowanie

---

## Otwarte TODO (nie implementuj bez prośby)

| Priorytet | Temat | Dokument |
|-----------|-------|----------|
| 🔜 | Render `mapShape: zone` na mapie | `gaps/09-ksztalty-mapy.md` |
| 🔜 | Zadania na mapie | `gaps/09-ksztalty-mapy.md` |
| 🔜 | Ręczny przełącznik trybu gości | `gaps/03-tryb-gosci.md` |
| 🔜 | Persist PANIC / guestsMode | `gaps/04-panic.md`, `03-tryb-gosci.md` |
| ⚙️ | Polonizacja UI (Chores, Must do…) | — |
| ⚙️ | Smart home / Home Assistant | `routes/smart.tsx` — szkielet |
| ⚙️ | Przepisy w kitchen | `recipes` puste w AppContext |

---

## Typowe zadania — gdzie szukać

| Zadanie użytkownika | Pierwsze pliki |
|---------------------|----------------|
| Nowy stały obowiązek | `content/data/chores.json`, ewent. `zadania.json` + `linkedZadanieIds` |
| Zmiana mapy / stref | `homeZones.json`, `HomeZoneEditor.tsx`, `mapHitTest.ts` |
| Nowe pole w formularzu | `ChoreItemFormFields.tsx`, `choreItemForm.ts`, `types/index.ts` |
| Zmiana sortowania panic | `choreSort.ts`, `routes/chores.tsx`, `AppContext` `visibleTasks` |
| Kalendarz / goście | `useGuestCalendarSync.ts`, `check-guest-calendar.server.ts` |
| Firebase nie sync | `AuthContext`, `householdFirestore.ts`, `firestore.rules` |
| Błąd po deployu | `/api/health`, `chunk-reload-guard`, `docs/STRUKTURA` §12 |

---

## Słowniczek

| Termin w UI/kodzie | Znaczenie |
|--------------------|-----------|
| Task / obowiązek | `Task` |
| Zadanie | `Zadanie` (osobny typ) |
| Chore | często = obowiązek w kodzie ang. |
| member / domownik | `User` |
| PANIC / PANIC_GOSCIE | tryb dashboardu, nie mylić z trybem mapy |
| guestsMode | tryb gości |
| builtin | `source` z JSON |
| user | `source` dodane w UI |
| heavyDay | domownik widzi tylko must |

---

## Pliki do ignorowania / ostrożnie

- `.vercel/output/` — artefakty buildu
- `routeTree.gen.ts` — generowany
- `Zapis konwersacji.txt` — historia czatu; przy konflikcie wierz `docs/`
- Duplikaty ścieżek `src\` vs `src/` na Windows — ten sam kod

---

## Szybki test po zmianach

```bash
npm run build
npm run lint
```

Ręcznie: `/chores` (mapa + lista), `/` (PANIC toggle), Ustawienia → strefy, dodaj obowiązek z zadaniem.

---

## Historia dokumentacji

| Plik | Rola |
|------|------|
| `docs/KONTEKST-DLA-AI.md` | **Ten plik** — start dla każdego czatu |
| `docs/DZIALANIE.md` | Pełny opis funkcjonalności |
| `docs/STRUKTURA-I-TECHNOLOGIE.md` | Kod, foldery, deploy |
| `docs/gaps/*.md` | Luki i decyzje produktowe |
| `Zapis konwersacji.txt` | Archiwum rozmów (może być nieaktualne) |

**Przy każdej większej zmianie produktowej** — zaktualizuj odpowiedni plik w `docs/` lub `docs/gaps/`.
