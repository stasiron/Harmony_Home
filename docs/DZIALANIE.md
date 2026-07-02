# HomeHarmony (Homebase) — jak działa aplikacja

Aplikacja webowa dla domu: obowiązki, zadania, kalendarz, goście, mapa mieszkania, lista zakupów, statystyki. UI pod kiosk / tablet w kuchni (nazwa w meta: **Homebase**).

---

## 1. Główne pojęcia

### Obowiązek (`Task`)

Powtarzalna (lub jednorazowa) odpowiedzialność domowa **przypisana do domowników**.

- Harmonogram powtarzania (`schedule`) → progi czasu `tMin` / `tSuggested` / `tMax`
- `assignedTo: string[]` — jeden lub wielu domowników
- Może mieć **przypięte zadania** (`linkedZadanieIds`)
- Status z własnego harmonogramu **albo** z agregacji przypiętych zadań (wtedy harmonogram obowiązku jest pomijany)

### Zadanie (`Zadanie`)

Konkretna czynność ze szczegółami — **bez przypisania osoby**.

- Progi czasu: `tMin` (sugerowane), `tMax` (krytyczne) w dniach od `lastCompleted`
- `lastCompletedBy` — kto odhaczył (dla % wykonania obowiązku)
- Lokalizacja na mapie jak obowiązek (pinezka / linia / obszar / strefa)
- **Nie** ma harmonogramu `schedule` w UI — tylko min/max dni

### Domownik (`User`)

Członek gospodarstwa: imię, avatar (litera), kolor, `heavyDay` (tryb „ciężkiego dnia” — widzi tylko must).

### Strefa domu (`HomeZone`)

Drzewo w ustawieniach:

- **grupa** (`kind: "group"`) — folder bez kształtu, np. „Strefa dzienna”
- **przestrzeń** (`kind: "space"`) — wielokąt na planie + opcjonalne `room`

Dane: `content/data/homeZones.json` lub draft w localStorage.

---

## 2. Statusy obowiązków i zadań

Typ: `safe` | `suggested` | `must` | `done`

### Pojedynczy element (obowiązek bez zadań / samo zadanie)

Na podstawie `daysSince(lastCompleted)` vs `tMin` / `tMax`:

| Dni od wykonania | Status |
|------------------|--------|
| &lt; tMin | `done` / `safe` |
| ≥ tMin, &lt; tMax | `suggested` |
| ≥ tMax | `must` |

### Obowiązek z przypiętymi zadaniami

Status liczy `choreZadaniaStatus.ts`:

- **Czerwony (`must`)** — choć jedno zadanie krytyczne
- **Pomarańczowy (`suggested`)** — ≥ 50% **wagi** zadań „do zrobienia”
- **Zielony** — wszystkie zadania świeże

Waga zadania: `src/config/choreWeight.ts`  
`WAGA = estimatedMinutes × (importance / MAKS_TRUDNOSC + 1)`

### Ważność (`importance` 1–5)

| Poziom | Etykieta |
|--------|----------|
| 5 | Krytyczna |
| 4 | Wysoka |
| 3 | Średnia (domyślna) |
| 2 | Niska |
| 1 | Bardzo niska |

Wpływa na: sortowanie przy gościach/PANIC, status `must` przy panic/guestsMode, mnożnik wagi.

---

## 3. Harmonogram powtarzania (tylko obowiązki)

W „Dodaj obowiązek” przy `recurrence: "recurring"`:

- Co X dni / tygodni / miesięcy
- Wybrane dni tygodnia (Pn–Nd) + co ile tygodni

JSON (`schedule`):

```json
{ "type": "interval", "unit": "days", "every": 2 }
{ "type": "weekly", "weekdays": [6], "everyWeeks": 1 }
```

Z harmonogramu: `deriveThresholds()` → `tMin`, `tSuggested`, `tMax`.  
Brak `schedule` → domyślnie co 7 dni.

Etykieta na karcie: `formatScheduleLabel()` — np. „Co 2 dni”, „So · co tydzień”.

---

## 4. Tryb gości (`guestsMode`)

**Intencja:** przygotowanie na przyjście gości. Nie musi być automatyczny — plan: ręczny przełącznik lub kalendarz.

**Teraz w kodzie:**

- Auto z kalendarza: `useGuestCalendarSync` co 15 min sprawdza wydarzenia gości
- Sort listy po ważności na `/chores`
- Badge ważności na kartach
- Ważność ≥ 4 → wymuszony status `must`
- **Nie** ukrywa pozycji spoza top — w przeciwieństwie do PANIC

Szczegóły TODO: `docs/gaps/03-tryb-gosci.md`

---

## 5. PANIC (dashboard)

Przycisk **Guests Panic Button** na stronie głównej (`/`).

- Klik = **włącz / wyłącz** (bez wyboru czasu)
- Na `/chores`: tylko obowiązki i zadania z ważnością **≥ 3**
- Sort: ważność ↓ → status → nazwa; numery 1, 2, 3…
- Ważność ≥ 4 → `must`
- **Nie** zapisuje się w Firestore — po odświeżeniu wyłączone

Osobna sprawa: tryb **PANIC na mapie** — **wyłączony w UI**, kod zamrożony. Patrz `docs/gaps/04-panic.md`.

---

## 6. Strona `/chores` — obowiązki i zadania

### Mapa (`ApartmentMap`)

Na górze strony. Pokazuje **tylko obowiązki** z geometrią.

**Tryby pinezek (UI):** Inicjały | Kolory  
**Warstwy (multi-select, localStorage):** Pinezki | Linie | Obszary | Strefy

| Kształt (`mapShape`) | Znaczenie |
|----------------------|-----------|
| `pin` | punkt |
| `line` | odcinek A→B + grubość (`mapLineWidth`) |
| `area` | wielokąt ≥ 3 pkt |
| `zone` | cała strefa z drzewa — **zapisuje się, na mapie głównej jeszcze nie rysuje** |

### Lista obowiązków

Grupy: Must / Suggested / On track / Recently done — chyba że aktywny PANIC lub `guestsMode` (wtedy sort + rank).

`ChoreCard`: harmonogram, przypięte zadania jako mini-karty, % wykonania per domownik (waga zadań).

### Lista zadań

Osobna sekcja. `ZadanieCard` — odhaczanie; przy wielu assignees obowiązku pyta „Kto zrobił?”.

### Dodawanie

- **Dodaj zadanie** — `ChoreItemFormFields` w trybie `zadanie` (bez assignee, min/max dni)
- **Dodaj obowiązek** — ten sam formularz + `LinkZadaniaPicker` (multi-select istniejących zadań)

Flow: najpierw zadania → potem obowiązek z linkiem.

---

## 7. Wybór lokalizacji (`ChoreLocationPicker`)

W formularzu obowiązku/zadania:

- Plan z stałym aspect ratio (`1024/818`)
- Klik = pokój; lista **Stref** (tylko grupy) i **Pokoi** (osobny rząd pod mapą)
- Wybór strefy → `mapShape: "zone"`, podświetlenie polygonów w strefie
- Wybór pokoju → pinezka / linia / obszar w `MapGeometryPicker`

---

## 8. Ustawienia `/settings`

- **Google Account** — logowanie Firebase, sync kalendarza
- **Drzewo stref domu** (`HomeZoneEditor`) — grupy, przestrzenie, polygon, kopiuj JSON → `content/data/homeZones.json`
- **Waga zadań** — wzór i tabela przykładów (`ChoreWeightSettingsCard`)
- **Kalendarze domowników** — OAuth Google per member, włącz/wyłącz, tryb busy/full

---

## 9. Pozostałe strony

| Trasa | Funkcja |
|-------|---------|
| `/` | Dashboard: zegar/pogoda, banner statusu, nawigacja, PANIC |
| `/calendar` | Kalendarz domu: Google + obowiązki + plany gości |
| `/members` | Domownicy, heavy day, obowiązki per osoba |
| `/stats` | Wykresy: wykonane / minuty / % (proste, per obowiązek) |
| `/kitchen` | Lista zakupów + przepisy (przepisy puste w stanie początkowym) |
| `/smart` | Urządzenia smart home (puste — pod HA w przyszłości) |
| `/weather` | Pogoda (osobna strona) |

---

## 10. Skąd biorą się dane

### Stałe (JSON → rebuild)

| Plik | Zawartość |
|------|-----------|
| `content/data/chores.json` | Wbudowane obowiązki |
| `content/data/zadania.json` | Wbudowane zadania |
| `content/data/homeZones.json` | Drzewo stref |
| `content/images/apartment-floor-plan.png` | Plan mieszkania |

### Konfig w kodzie

| Plik | Zawartość |
|------|-----------|
| `src/config/household.ts` | Domyślni domownicy, mapowanie email→member |
| `src/config/choreWeight.ts` | Wzór wagi |
| `src/config/mapLine.ts` | Domyślna grubość linii |

### localStorage (przeglądarka)

| Klucz | Zawartość |
|-------|-----------|
| `homeharmony-chores` | `progress`, `userTasks`, `userZadania` |
| `homeharmony-app` | `users`, `shopping`, `guestPlans` |
| `homeharmony-home-zones-draft` | draft stref |
| warstwy mapy | `mapGeometry.ts` → `MAP_LAYERS_STORAGE_KEY` |

### Firestore (`households/homeharmony`)

Sync gdy użytkownik zalogowany (Google lub anonim):

- `progress`, `userTasks`, `userZadania`
- `users`, `shopping`, `guestPlans`

**Nie** sync: stałe z JSON, `panic`, `guestsMode` (sesja).

Pełny opis: `docs/gaps/02-obowiazki-json-firebase.md`

---

## 11. Autentykacja i domownik

`AuthContext`:

- Firebase Auth (Google lub anonimowo)
- `syncUser` — kto synchronizuje Firestore
- `memberId` — powiązanie konta z `User.id` (email w `MEMBER_EMAIL_LINKS` lub zgadywanie po imieniu)
- Opcjonalny OAuth serwerowy dla trwałego tokenu kalendarza Google

---

## 12. Kalendarz

- Połączenie per domownik w ustawieniach
- `HouseholdCalendar` — widok 3/7/14 dni lub miesiąc
- Obowiązki na osi czasu wg `choreCalendar.ts`
- `checkGuestCalendar` (server) — wykrywa gości → `guestsMode`

---

## 13. Co jest w toku / znane luki

| Temat | Plik |
|-------|------|
| Źródła danych JSON + Firebase | `docs/gaps/02-obowiazki-json-firebase.md` |
| Tryb gości (ręczny + kalendarz) | `docs/gaps/03-tryb-gosci.md` |
| PANIC + zamrożona mapa | `docs/gaps/04-panic.md` |
| Kształty na mapie (zone, zadania) | `docs/gaps/09-ksztalty-mapy.md` |

Indeks: `docs/gaps/README.md`
