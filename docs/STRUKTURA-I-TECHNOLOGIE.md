# HomeHarmony — struktura projektu i technologie

---

## 1. Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Framework | **React 19** + **TanStack Start** (SSR / full-stack) |
| Routing | **TanStack Router** (file-based, `src/routes/`) |
| Server | **Nitro** (API, deploy Vercel) |
| Build | **Vite 8** |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (Radix) |
| Stan UI | **React Context** (`AppContext`, `AuthContext`) |
| Cache zapytań | **TanStack Query** |
| Auth + DB | **Firebase** (Auth + Firestore) |
| Wykresy | **Recharts** |
| Walidacja / formy | **Zod**, **react-hook-form** (częściowo) |
| Deploy | **Vercel** (`vercel.json`, preset Nitro) |
| Node | ≥ 20 |

Alias importów: `@/` → `src/`, `@content/` → `content/` (`tsconfig.json`).

---

## 2. Drzewo katalogów (skrót)

```
HomeHarmony/
├── content/                    # Zasoby edytowalne (JSON, obrazy)
│   ├── data/
│   │   ├── chores.json         # Stałe obowiązki
│   │   ├── zadania.json        # Stałe zadania
│   │   └── homeZones.json      # Drzewo stref mapy
│   └── images/
│       └── apartment-floor-plan.png
├── docs/
│   ├── DZIALANIE.md            # Jak działa aplikacja
│   ├── STRUKTURA-I-TECHNOLOGIE.md
│   ├── KONTEKST-DLA-AI.md      # Briefing dla agentów / czatów
│   └── gaps/                   # Luki i TODO (szczegóły)
├── public/                     # Statyczne assety (legacy plan w public/images też)
├── scripts/                    # postbuild, restore-chores
├── src/
│   ├── components/
│   │   ├── calendar/           # HouseholdCalendar, DayColumn
│   │   ├── chores/             # Obowiązki, mapa, formularze, strefy
│   │   ├── dashboard/          # QuickActions, StatusBanner, ClockWeather
│   │   ├── settings/           # GoogleAccountCard, ChoreWeightSettingsCard
│   │   ├── ui/                 # shadcn primitives
│   │   ├── MainNav.tsx
│   │   └── Shell.tsx
│   ├── config/                 # Stałe konfiguracyjne TS
│   ├── context/                # AppContext, AuthContext
│   ├── hooks/
│   ├── lib/                    # Logika domenowa, Firebase, kalendarz, mapa
│   ├── routes/                 # Strony (TanStack file routes)
│   ├── server/                 # API routes handler
│   ├── types/index.ts          # Typy domenowe
│   ├── styles.css
│   ├── router.tsx
│   ├── start.ts / server.ts
│   └── version.ts              # APP_VERSION
├── firebase.json
├── firestore.rules
├── vite.config.ts
├── nitro.config.ts
├── package.json
└── .env.example
```

---

## 3. Warstwy aplikacji

```
┌─────────────────────────────────────────────────────────┐
│  src/routes/*.tsx          — strony, kompozycja UI       │
├─────────────────────────────────────────────────────────┤
│  src/components/           — komponenty prezentacyjne    │
├─────────────────────────────────────────────────────────┤
│  src/context/              — globalny stan + akcje       │
├─────────────────────────────────────────────────────────┤
│  src/lib/                  — logika bez UI              │
│  src/config/               — stałe, loadery JSON        │
├─────────────────────────────────────────────────────────┤
│  content/data/*.json       — dane wbudowane (build)     │
├─────────────────────────────────────────────────────────┤
│  localStorage              — offline / przed sync       │
├─────────────────────────────────────────────────────────┤
│  Firestore households/     — sync między urządzeniami   │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Routing (`src/routes/`)

| Plik | URL | Opis |
|------|-----|------|
| `index.tsx` | `/` | Dashboard |
| `chores.tsx` | `/chores` | Obowiązki + zadania + mapa |
| `calendar.tsx` | `/calendar` | Kalendarz domu |
| `members.tsx` | `/members` | Domownicy |
| `stats.tsx` | `/stats` | Statystyki |
| `kitchen.tsx` | `/kitchen` | Zakupy + przepisy |
| `smart.tsx` | `/smart` | Smart home (szkielet) |
| `settings.tsx` | `/settings` | Ustawienia |
| `weather.tsx` | `/weather` | Pogoda |
| `__root.tsx` | — | Providers, `<Outlet />`, błędy |

`routeTree.gen.ts` — generowany przez TanStack Router (nie edytować ręcznie).

---

## 5. Konteksty

### `AppContext` (`src/context/AppContext.tsx`)

Centralny stan domu:

- `tasks`, `zadania`, `users`, `shopping`, `guestPlans`, `devices`, `recipes`
- `guestsMode`, `panic`, `guestCalendarHint`
- `statusOf`, `daysSince`, `visibleTasks`, `visibleZadania`
- Akcje: `completeTask`, `completeZadanie`, `addTask`, `addZadanie`, `startPanic`, …
- Sync Firestore: subscribe + debounced save (300 ms), hash anty-pętli

### `AuthContext` (`src/context/AuthContext.tsx`)

- Firebase `user`, `syncUser`, `memberId`
- `signInWithGoogle`, `signOut`, `linkMember`
- Integracja z kalendarzem Google

---

## 6. Moduły domenowe (`src/lib/`)

| Moduł | Odpowiedzialność |
|-------|------------------|
| `choreStorage.ts` | localStorage obowiązków/zadań, merge z JSON |
| `choreRecurrence.ts` | Harmonogram, etykiety, progi z schedule |
| `choreZadaniaStatus.ts` | Status obowiązku z linked zadań, progi zadania |
| `choreAssignees.ts` | `assignedTo[]`, % wykonania per osoba |
| `choreImportance.ts` | Ważność, stałe PANIC |
| `choreSort.ts` | Sort panic/guests |
| `choreCalendar.ts` | Obowiązki na kalendarzu |
| `choreItemForm.ts` | Stan formularza dodawania |
| `zadania.ts` | Resolve linked zadań |
| `mapGeometry.ts` | Warstwy mapy, renderowanie pin/line/area |
| `mapHitTest.ts` | Klik w pokój/strefę, `roomForSpace` |
| `mapPinStyles.ts` | Kolory statusu, tryby mapy |
| `zoneTree.ts` | Drzewo stref, `polygonsForZone` |
| `householdFirestore.ts` | Firestore CRUD snapshot |
| `appStorage.ts` | localStorage users/shopping/guestPlans |
| `contentPaths.ts` | URL planu mieszkania |
| `firebase.ts` | Inicjalizacja Firebase |
| `calendar/*` | API kalendarza, iCal, indeks dni |
| `googleOAuth.server.ts` | OAuth serwerowy |
| `server/api-routes.ts` | `/api/health`, `/api/auth/google`, … |

---

## 7. Konfiguracja (`src/config/`)

| Plik | Rola |
|------|------|
| `chores.ts` | Import `content/data/chores.json` → `PERMANENT_CHORES` |
| `zadania.ts` | Import `content/data/zadania.json` → `PERMANENT_ZADANIA` |
| `homeZones.ts` | Load stref: plik → draft localStorage |
| `household.ts` | `DEFAULT_MEMBERS`, `MEMBER_EMAIL_LINKS` |
| `choreWeight.ts` | Wzór wagi zadań |
| `mapLine.ts` | min/max/default grubości linii |
| `rooms.ts` | Etykiety pokoi, fallback pozycje pin |
| `calendars/*.ts` | Konfig kalendarzy per osoba (iCal fallback) |

---

## 8. Komponenty obowiązków (`src/components/chores/`)

| Komponent | Rola |
|-----------|------|
| `ApartmentMap.tsx` | Mapa na `/chores` |
| `ChoreCard.tsx` / `ZadanieCard.tsx` | Karty listy |
| `AddChoreDialog.tsx` / `AddZadanieDialog.tsx` | Dodawanie |
| `ChoreItemFormFields.tsx` | Wspólny formularz (chore / zadanie) |
| `ChoreLocationPicker.tsx` | Pokój / strefa |
| `MapGeometryPicker.tsx` | Rysowanie pin/line/area |
| `RecurrencePicker.tsx` | Harmonogram obowiązku |
| `AssigneeMultiPicker.tsx` | Wielu domowników |
| `LinkZadaniaPicker.tsx` | Link zadań do obowiązku |
| `HomeZoneEditor.tsx` | Drzewo stref w ustawieniach |
| `ZoneMapOverlay.tsx` | Overlay stref/pokoi na planie |

---

## 9. API serwerowe

Handler: `src/server/api-routes.ts` (Nitro / TanStack Start).

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/health` | GET | Diagnostyka deployu |
| `/api/debug` | GET | Pełny raport (token `DEBUG_SECRET`) |
| `/api/auth/google` | GET | Start OAuth kalendarza |
| `/api/auth/google/callback` | GET | Callback OAuth |

Funkcje server (`*.server.ts`): kalendarz, OAuth, diagnostyka.

---

## 10. Firebase

**Projekt:** `harmony-home-95c3b` (zmienne `VITE_FIREBASE_*` w `.env`)

**Firestore:**

- `users/{uid}` — profil użytkownika
- `households/homeharmony` — snapshot domu (jeden dokument na instalację)

**Rules** (`firestore.rules`): zalogowany użytkownik może czytać/pisać `households` i własny `users`.

---

## 11. Persystencja — przepływ

1. **Start:** `buildInitialTasks()` / `buildInitialZadania()` z localStorage + merge JSON
2. **Po zalogowaniu:** `subscribeHousehold` → nadpisuje stan jeśli hash się zgadza
3. **Zmiana stanu:** debounce → `saveHouseholdToFirestore` + `persistChoreState` + `persistAppState`
4. **Stałe z JSON:** zawsze z bundla — zmiana pliku = **rebuild + deploy**

---

## 12. Build i deploy

```bash
npm run dev      # Vite dev server
npm run build    # Produkcja + postbuild patch Vercel
npm run preview
```

- `vite.config.ts` — TanStack Start, Nitro preset `vercel` gdy `VERCEL=1`
- `src/version.ts` — `APP_VERSION` wyświetlana w ustawieniach
- Po deployu: stare chunki → `chunk-reload-guard` w `__root.tsx`

---

## 13. Konwencje kodu

- **Typy** — `src/types/index.ts`
- **Polski UI** — mieszany z angielskim (Chores, Must do — do stopniowej polonizacji)
- **Obowiązek** = `Task`, **Zadanie** = `Zadanie` (nie mylić z ang. "task")
- **Nie commitować** `.env` — wzór w `.env.example`
- **Minimalny diff** — nie refaktorować poza zakresem zadania
- **Stałe obowiązki** — edycja `content/data/chores.json`, nie hardcode w komponentach
- **Strefy** — `content/data/homeZones.json` lub edytor w ustawieniach

---

## 14. Powiązane dokumenty

- `docs/DZIALANIE.md` — logika biznesowa
- `docs/KONTEKST-DLA-AI.md` — instrukcja dla agentów
- `docs/gaps/` — otwarte luki
- `Zapis konwersacji.txt` — historia wymagań (może zawierać nieaktualności; priorytet: `docs/`)
