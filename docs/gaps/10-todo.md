# TODO (proste sprawy) — spec dla AI

**Status audytu:** 2026-08-07  
**Kod:** `src/routes/todo.tsx`, `src/lib/todoHelpers.ts`, `src/types` (`TodoItem`), sync w `AppContext` + `householdFirestore.ts`  
**Nie mylić z:** obowiązkami (`Task` / `/chores`) ani `MemberMustTodos` (to lista obowiązków „must”, nie ten moduł).

---

## Cel produktu

Proste sprawy do zapamiętania (nie powtarzalne obowiązki domowe). Dane **w Firebase** (dokument household), żeby działały na wielu urządzeniach. localStorage = cache / offline seed, nie źródło prawdy gdy jest auth.

---

## Wymagane zachowanie (target)

### 1. Typy list / widoczność

| Id | Opis | Widoczność | Status w kodzie |
|----|------|------------|-----------------|
| **A** | Jedna osoba, **prywatne** | Tylko **przypisany** + **twórca** | ❌ brak (`createdBy`, `visibility`) |
| **B** | Jedna osoba, **publiczne** | Wszyscy widzą: że jest zadanie, **komu** przypisane, **treść** | ⚠️ częściowo — dziś personal widać u wszystkich, bez przełącznika prywatne/publiczne |
| **C** | Dla dowolnego domownika | `household` + `anyone` — jeden odhacza = zrobione | ✅ jest |
| **D** | Dla każdego domownika z osobna | `household` + `everyone` — każdy odhacza swoje; widać kto zrobił | ✅ jest |

**Mapowanie docelowe w modelu:**

```
scope: "personal" | "household"
visibility: "private" | "public"   // tylko personal; household zawsze „public” w sensie domu
assignedTo: string | null          // personal
createdBy: string                  // kto utworzył (wymagane do A)
householdMode: "anyone" | "everyone"  // tylko household
```

**Filtr listy (UI):** pokaż todo gdy:
- `scope === "household"`, **lub**
- `visibility === "public"`, **lub**
- `visibility === "private"` i (`assignedTo === actorId` lub `createdBy === actorId`)

Reguły Firestore: dziś cały dokument `households/{id}` jest wspólny dla zalogowanych — **prawdziwa prywatność po stronie serwera nie istnieje**. UI filtruje; treść prywatnych i tak leci w syncu. To świadomy kompromis (jak reszta appki) — nie obiecywać „szyfrowania prywatnych” bez osobnej kolekcji / rules.

### 2. Pola treści

| Pole | Wymagane | Status |
|------|----------|--------|
| Nazwa zadania | tak | ⚠️ dziś jedno pole `text` (= nazwa) |
| Opis zadania | tak (może puste?) | ❌ brak `description` |
| Nazwa miejsca (słownie) | opcjonalna | ❌ brak `placeName` |

Gdy mapka wyłączona: użytkownik może wpisać `placeName` albo zostawić puste.

### 3. Lokalizacja na mapie (opcjonalna)

Flow:
1. Przycisk **„Dodaj lokalizację”**
2. Wybór mapki (na razie tylko **dom** — jedna mapa)
3. Wybór znacznika na planie: **punkt (pin) / linia / obszar / pokój / strefa**

Reuse z chores: `TaskMapShape`, `MapPinPicker` / `MapGeometryPicker`, `ChoreLocationPicker`, typy geometrii jak na `Task`.

**Docelowe pola na `TodoItem` (gdy lokalizacja włączona):**

```
locationEnabled?: boolean
mapId?: "home"                 // na razie stałe
mapShape?: "pin" | "line" | "area" | "zone" | "room"
mapPins? / mapLine? / mapLineWidth? / mapArea?
zoneId? / zoneIds?
room? / rooms?                 // gdy „pokój”
placeName?: string             // niezależnie / gdy mapa off
```

Status: ❌ todo nie ma żadnej geometrii ani UI lokalizacji.

### 4. Sync Firebase / multi-device

| Element | Status |
|---------|--------|
| `todos` + `todoFolders` w `HouseholdSnapshot` | ✅ |
| Zapis debounce ~300 ms do Firestore | ✅ |
| Listener realtime (`subscribeHousehold`) | ✅ |
| Seed gdy chmura pusta / stare doki bez todos | ✅ `seedEmptyListsFromLocal` |
| Persist localStorage równolegle | ✅ cache |
| Rules: zalogowany R/W całego household | ✅ (brak per-todo ACL) |

**Werdykt:** sync jest — przy zalogowanym użytkowniku zmiany na jednym urządzeniu powinny wejść na drugie. Bez logowania = tylko localStorage (nie „w sieci”).

### 5. Extra w kodzie (nie w briefie usera)

- Foldery / zakładki — ✅ zostawić (nie koliduje)
- Eksport JSON — ✅
- Assignee „Nikt” na personal — ⚠️ doprecyzować z userem

---

## Co jest vs czego nie ma (checklista)

### Jest
- [x] Tworzenie personal / household
- [x] Household anyone + everyone + `completedBy`
- [x] Przypisanie osoby (personal)
- [x] Toggle done, usuwanie, clear done
- [x] Foldery
- [x] Sync Firestore + localStorage
- [x] Eksport JSON

### Brak / do zrobienia
- [ ] `createdBy` przy tworzeniu
- [ ] `visibility: private | public` + filtr widoczności
- [ ] Osobne: **nazwa** + **opis** (dziś tylko `text`)
- [ ] `placeName` opcjonalne
- [ ] Przycisk lokalizacji → wybór mapy → kształt (pin/line/area/room/zone)
- [ ] Normalizacja nowych pól w `normalizeTodo` (żeby sync nie gubił)
- [ ] (Opcjonalnie później) prawdziwa prywatność w Firestore

---

## Plan implementacji (kolejność)

1. Rozszerzyć `TodoItem` + `normalizeTodo` + `buildTodoItem` / `TodoAddInput`
2. Formularz `/todo`: nazwa, opis, miejsce, prywatne/publiczne, lokalizacja (reuse pickerów chores)
3. Filtr listy wg widoczności + `actorId`
4. Wyświetlanie opisu / miejsca / mini-info o mapie na wierszu
5. Smoke: dwa browsery / konta — create → pojawia się po syncu
6. Zaktualizować `docs/KONTEKST-DLA-AI.md` (krótka wzmianka o TODO)

---

## Pytania otwarte (przed / w trakcie)

Zapisane też w czacie — odpowiedzi usera nadpisują tę sekcję.

1. Prywatne (A): czy twórca może przypisać prywatne **komuś innemu**, a widzą tylko ta dwójka?
2. Opis: obowiązkowy czy może być pusty?
3. Foldery: zostawiamy?
4. „Nikt” (bez assignedTo) przy public/private — dozwolone?
5. Czy todo ma pojawiać się na głównej `ApartmentMap` (jak obowiązki), czy tylko picker przy tworzeniu?

---

## Pliki do ruszenia

| Plik | Rola |
|------|------|
| `src/types/index.ts` | model |
| `src/lib/todoHelpers.ts` | build / open / toggle |
| `src/lib/appStorage.ts` | `normalizeTodo` |
| `src/context/AppContext.tsx` | `addTodo` — `createdBy` z auth |
| `src/routes/todo.tsx` | UI |
| ewent. nowy `TodoLocationFields.tsx` | mapa / miejsce |
| `docs/KONTEKST-DLA-AI.md` | ściąga |

---

## Historia

| Data | Notatka |
|------|---------|
| 2026-08-07 | Pierwszy audyt vs brief usera; sync Firebase OK; brak privacy/opisu/mapy |
