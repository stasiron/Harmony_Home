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

Wszystko należy do **mieszkania** (`useHousehold().householdId`). Model i decyzje: `docs/ROADMAP.md`.

| Źródło | Co |
|--------|-----|
| `households/{id}` | nazwa, preset, `ownerId`, `zones`, `floorPlan`, `inviteCode`, `features` |
| `households/{id}/members/{uid}` | konto / urządzenie, `role` admin \| member, `profileId` |
| `households/{id}/profiles` | domownicy (`User`) |
| `households/{id}/{chores,zadania,todos,todoFolders,shopping,laundry,guestPlans}` | dokument per element + `createdBy`, `createdAt`, `locked` |
| `households/{id}/assets/floorPlan` | plan (data URL ≤ ~900 KB) |
| `src/config/presets.ts` | 4 presety kopiowane przy tworzeniu mieszkania |
| `content/data/*.json` | **tylko** migracja pierwszego mieszkania (`src/lib/legacyHousehold.ts`) |

**Uprawnienia** (`firestore.rules`, testy `tests/firestore.rules.test.ts`):
- bez członkostwa — zero dostępu (też anonimowo),
- strefy, plan, nazwa, domownicy, zaproszenia — tylko admin (Heavy Day — każdy),
- `locked: true` — edytuje twórca i admin, odhaczać (`lastCompleted`, `done`, `completedBy`…) może każdy,
- zablokować może tylko twórca z kontem Google lub admin; `createdBy` nie da się podrobić,
- **okres przejściowy** (`legacyTransition`): dokument `households/homeharmony` czyta każdy zalogowany (stara wersja aplikacji), zapisuje tylko admin — do czasu przesiadki rodziny. Do usunięcia, patrz ROADMAP → „Wdrożenie”.

**Na zmianę** (`src/lib/rotation.ts`): obowiązek / zadanie z `rotation` (≥ 2 osoby, kolejność tur) i `rotationTurn` (czyja tura). Odhaczenie przesuwa turę o jedną osobę (`advanceRotation` w `completeTask` / `completeZadanie`). Widoki biorą osoby przez `effectiveAssignees(task)` — przy rotacji tylko osoba z turą. `rotationTurn` jest polem postępu w regułach (może je zmienić każdy, także przy blokadzie).

**Administrator ogólny:** konto `stasiron9102@gmail.com` (zweryfikowany e-mail Google) jest adminem każdego mieszkania — `isSuperAdmin()` w `firestore.rules` i `SUPER_ADMIN_EMAIL` w `src/lib/householdSetup.ts` (zmieniać razem). Widzi też mieszkania, do których nie dołączył (`subscribeAllHouseholds`, `Membership.superAdmin`).

**Logowanie i kalendarz:** logowanie Google prosi tylko o e-mail i profil, bez zakresu kalendarza, więc bez ekranu zgody. Kalendarz łączy się osobno przez OAuth na serwerze z refresh tokenem w Redis — konfiguracja w `docs/KALENDARZ.md`.

**Sync — pułapki:**
- `useSyncedList` = `setState` + zapis różnicy do Firestore od razu (bez debounce). Odrzucony zapis cofa snapshot z serwera + toast.
- Stan startowy pusty (SSR = pierwszy render klienta). Cache offline daje Firestore (IndexedDB), nie localStorage.
- Nowe pole w elemencie → normalizer musi je przepuścić (`pickItemMeta` w `appStorage.ts`).
- Kalendarze Google tylko gdy `household.features.legacyCalendar` (pierwsze mieszkanie).
- Plan Spark: 20 tys. zapisów / 50 tys. odczytów dziennie. Każdy zapis aplikacji przechodzi przez bezpiecznik (`guardWriteBudget` w `householdSync.ts`, `WRITE_BUDGET`: 40 zapisów/min → `WriteBudgetExceededError` + toast) na wypadek pętli zapisów — nowy kod zapisujący do Firestore też musi go wołać. Pola tekstowe nie zapisują na każdą literę (np. nazwa strefy: 800 ms po ostatniej literze). Profil `users/{uid}` zapisywany tylko przy zmianie albo raz na 12 h (`src/lib/profileSync.ts`).
- Nigdy nie testuj na produkcyjnej bazie (`npm run dev`) — karty zostawione otwarte po zatrzymaniu serwera dalej synchronizują.
- Lokalny `npm run dev` łączy się z **produkcyjnym** Firestore. Do testów: `npm run emulators` + `npm run dev:emulator` (wymaga Javy 21).

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
| Obowiązki / zadania mieszkania | UI (dane w Firestore); szablony nowych mieszkań — `src/config/presets.ts` |
| Strefy / plan pokoi | Ustawienia → Drzewo stref (admin) |
| Plan mieszkania (obrazek) | Ustawienia → Plan mieszkania; prompt: `src/lib/floorPlanPrompt.ts` |
| Presety nowego mieszkania | `src/config/presets.ts` |
| Mieszkanie, członkostwo, role | `src/context/HouseholdContext.tsx`, `src/lib/householdSetup.ts` |
| Uprawnienia | `firestore.rules` + `tests/firestore.rules.test.ts` |
| Wzór wagi | `src/config/choreWeight.ts` |
| Logika statusów | `src/lib/choreZadaniaStatus.ts`, `AppContext.statusOf` |
| Harmonogram | `src/lib/choreRecurrence.ts` |
| Sync chmura | `src/hooks/useSyncedList.ts`, `src/lib/householdSync.ts` |
| Strona obowiązków | `src/routes/chores.tsx` |
| Strona prania | `src/routes/laundry.tsx` |
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
6. **`content/data/*.json`** — dziś tylko źródło migracji pierwszego mieszkania; nowe mieszkania biorą presety
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
| Nowy obowiązek w presecie | `src/config/presets.ts` (`CHORES`, `ZADANIA`) |
| Zmiana mapy / stref | `homeZones.json`, `HomeZoneEditor.tsx`, `mapHitTest.ts` |
| Nowe pole w formularzu | `ChoreItemFormFields.tsx`, `choreItemForm.ts`, `types/index.ts` |
| Zmiana sortowania panic | `choreSort.ts`, `routes/chores.tsx`, `AppContext` `visibleTasks` |
| Kalendarz / goście | `useGuestCalendarSync.ts`, `check-guest-calendar.server.ts` |
| Firebase nie sync | `AuthContext`, `householdFirestore.ts`, `firestore.rules` |
| Moduł TODO (sprawy, nie chores) | `routes/todo.tsx`, `todoHelpers.ts`, `docs/gaps/10-todo.md` |
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
npx tsc --noEmit
npm run lint
npm test
npm run test:rules   # emulator, Java 21
npm run build
```

Testy (Vitest, `src/**/*.test.ts`) — logika zapisu i statusów bez przeglądarki. Formatowanie: `.prettierrc` (80 znaków, LF); końce linii wymusza `.gitattributes`.

Ręcznie: `/chores` (mapa + lista), `/` (PANIC toggle), Ustawienia → strefy, dodaj obowiązek z zadaniem.

---

## Historia dokumentacji

| Plik | Rola |
|------|------|
| `docs/KONTEKST-DLA-AI.md` | **Ten plik** — start dla każdego czatu |
| `docs/DZIALANIE.md` | Pełny opis funkcjonalności |
| `docs/STRUKTURA-I-TECHNOLOGIE.md` | Kod, foldery, deploy |
| `docs/gaps/*.md` | Luki i decyzje produktowe |
| `docs/ROADMAP.md` | Wizja multi-mieszkań, decyzje, model danych, etapy, kolejność wdrożenia |
| `Zapis konwersacji.txt` | Archiwum rozmów (może być nieaktualne) |

**Przy każdej większej zmianie produktowej** — zaktualizuj odpowiedni plik w `docs/` lub `docs/gaps/`.
