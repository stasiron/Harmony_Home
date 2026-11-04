# HomeHarmony — roadmapa rozwoju

**Status:** 2026-11-04 — plan po audycie kodu vs wizja produktu. Nic z tego nie jest jeszcze wdrożone.

Powiązane: [`KONTEKST-DLA-AI.md`](./KONTEKST-DLA-AI.md) | [`DZIALANIE.md`](./DZIALANIE.md) | [`gaps/`](./gaps/)

---

## Wizja

Centrum dowodzenia dla **wielu mieszkań naraz**. Każde mieszkanie to osobny projekt, niewidoczny dla osób spoza niego.

Nowe mieszkanie wymaga: **nazwy**, **presetu**, **domowników**, opcjonalnie **zdjęcia planu**.

Funkcje dashboardu (od najważniejszych):

1. **Obowiązki domowe** — dla każdego domownika: co, kiedy, gdzie na planie; przypomnienia
2. **Tasks** — zadania dodatkowe, bez stałego miejsca / harmonogramu; widoczność zależna od ustawienia
3. **Rzeczy do kupienia** — kiedy ostatnio kupione, flaga „kończy się / brak”, cena, podział kosztu na domowników
4. **Lodówka** — zawartość + przepisy (co mam, czego brakuje); prywatna i wspólna
5. **Instrukcje** — „głupie, ale ważne” rzeczy (np. jak prać), uporządkowane; prywatne i wspólne
6. **PanicGuestButton** — szybkie sprzątanie przed gośćmi; tryb super szybki i zwykły; wybór poziomu czystości
7. **Smart home** — podłączenie do silnika smart w danym mieszkaniu (daleki plan)

---

## Blokada nr 1: aplikacja jest zaszyta pod jedno mieszkanie

| Co | Gdzie | Problem |
|---|---|---|
| Jeden dokument `households/homeharmony` | `src/lib/householdFirestore.ts` (`HOUSEHOLD_DOC_ID`) | Wszystkie mieszkania wylądowałyby w jednym |
| Domownicy + mapowanie e-mail → osoba | `src/config/household.ts` | Dane w kodzie, nie w mieszkaniu |
| Kalendarze per osoba | `src/config/calendars/*.ts` | Osobny plik kodu na osobę |
| Plan mieszkania | `content/images/apartment-floor-plan.png` | Import przy buildzie, brak uploadu |
| Strefy, stałe obowiązki i zadania | `content/data/*.json` | Zmiana = deploy |
| Pokoje `ChoreRoom` | `src/types/index.ts` | Sztywny union typów, używany w ~10 plikach |

### Prywatność — dziś zerowa

`firestore.rules`: każdy zalogowany (także **anonimowy**) czyta i zapisuje **każde** `households/*`. Prywatność todo to tylko filtr w UI (patrz `gaps/10-todo.md`).

### Jeden dokument-snapshot nie wystarczy

- limit Firestore **1 MB / dokument** — historia zakupów, lodówka, przepisy go zapchają,
- zapis całości (`setDoc` merge na tablicach) → dwie osoby naraz nadpisują sobie zmiany,
- nie da się ukryć części dokumentu przed członkiem mieszkania.

### Docelowy model danych (propozycja)

```
households/{householdId}                 nazwa, preset, floorPlanUrl, ownerId, createdAt
households/{householdId}/members/{uid}   rola: owner | member, memberProfile (imię, kolor…)
households/{householdId}/zones/…         drzewo stref (zamiast homeZones.json)
households/{householdId}/chores/…        obowiązki
households/{householdId}/zadania/…       zadania
households/{householdId}/todos/…         tasks (tylko publiczne / wspólne)
households/{householdId}/products/…      katalog produktów (zakupy + lodówka)
households/{householdId}/purchases/…     zakupy z ceną i podziałem
households/{householdId}/notes/…         instrukcje wspólne
households/{householdId}/recipes/…       przepisy wspólne
users/{uid}/private/{householdId}/…      prywatne: lodówka, notatki, todo
```

Reguły: dostęp do `households/{id}/**` tylko gdy istnieje `members/{request.auth.uid}`; `users/{uid}/**` tylko właściciel.

---

## Moduły: jest / zmienić / dodać

| # | Moduł | Stan | Do zrobienia |
|---|---|---|---|
| 1a | Tworzenie mieszkania | ❌ | Kreator: nazwa, preset, domownicy (zaproszenie kodem/linkiem), plan opcjonalny (Firebase Storage). Bez planu: mapa ukryta, obowiązki grupowane po pokojach |
| 1 | Obowiązki | ✅ najmocniejsza część | Render `mapShape: zone` na mapie (`gaps/09`), **przypomnienia** (dziś tylko status), **zastępstwa** (przejęcie obowiązku przez inną osobę) |
| 2 | Tasks | ⚠️ ~60% — moduł `/todo` | Widoczność private/public, `createdBy`, opis, lokalizacja — spec w `gaps/10-todo.md` |
| 3 | Rzeczy do kupienia | ⚠️ ~10% — prosta lista w `/kitchen` | Katalog produktów, data ostatniego zakupu, stan, cena, podział kosztów, saldo |
| 4 | Lodówka + przepisy | ❌ szkielet (`Recipe`, puste `recipes`) | Zawartość prywatna/wspólna, dopasowanie przepisów |
| 5 | Instrukcje | ⚠️ zaczątek — `/laundry` | Ogólny moduł z szablonami; pranie jako pierwszy szablon |
| 6 | PanicGuestButton | ⚠️ ~30% — toggle, filtr ważność ≥ 3 | Dwa tryby, poziom czystości, podział na osoby; połączyć z `guestsMode` |
| 7 | Smart home | ❌ szkielet (`/smart`, `SmartHomeDevice`) | Później — Home Assistant per mieszkanie |

---

## Decyzje projektowe (optymalizacje planu)

1. **Wspólny katalog produktów (3 + 4).** Produkt = nazwa, kategoria, stan (`ok` / `low` / `out`), `lastBoughtAt`, ostatnia cena. Lodówka = widok produktów spożywczych; „Do kupienia” = wszystko `low`/`out`. Oznaczenie „brak” w lodówce → automatycznie na liście zakupów. Przepisy porównują składniki z lodówką.
2. **Podział kosztów jako osobna warstwa.** `Purchase` = kto zapłacił, kwota, między kogo podzielone → saldo „kto komu ile”.
3. **Pranie wchłonięte przez Instrukcje (5).** Szablony: pranie (tryb, temp., płukania, wirowanie), sprzęt, wolny tekst. `LaundryProgram` → pierwszy szablon (z migracją danych).
4. **Jeden model widoczności (2, 4, 5).** Pole `visibility: "private" | "household"`; prywatne fizycznie w `users/{uid}/private/…`, żeby prywatność była prawdziwa, nie tylko filtrem UI.
5. **Panic v2.**
   - Nowe pole **widoczność dla gości (1–5)** na obowiązku/zadaniu — ważność ≠ widoczność.
   - **Poziom czystości** (wybredność gości) = próg widoczności.
   - **Super szybki:** jedna lista, sort wg `widoczność / estimatedMinutes`, bez przypisań.
   - **Zwykły:** rozdział między obecnych domowników z wyrównaniem czasu + grupowanie po strefach.
   - `guestsMode` z kalendarza → tylko podpowiedź „za 2 dni goście — włączyć?”, nie osobny tryb.
6. **Preset = szablon danych, nie kod.** Obecne `chores.json` / `zadania.json` / `homeZones.json` → preset „Mieszkanie studenckie”. Przy tworzeniu mieszkania preset kopiuje się do jego kolekcji, potem każdy edytuje swoją kopię.
7. **Słownik przed rozbudową.** Dziś: `Task` = obowiązek, `Zadanie` = podzadanie obowiązku, „Tasks” z wizji = moduł `Todo`. Ustalić nazwy raz, zanim dojdą nowe moduły.

---

## Kolejność etapów

| Etap | Zakres | Dlaczego tu |
|---|---|---|
| **0. Fundament** | Multi-mieszkanie, członkostwo i role, zaproszenia, reguły Firestore, podział danych na kolekcje, przeniesienie domowników / kalendarzy / stref / planu do danych, dynamiczne pokoje zamiast `ChoreRoom` | Każdy moduł napisany wcześniej trzeba by przepisać |
| **1. Kreator + presety** | Nowe mieszkanie, preset, upload planu, migracja obecnego mieszkania jako pierwszego | Bez tego nie da się testować wielu mieszkań |
| **2. Domknięcie obowiązków** | Strefy na mapie, przypomnienia (push), zastępstwa | Priorytet nr 1, prawie gotowy |
| **3. Tasks** | Widoczność, opis, lokalizacja | Spec gotowy (`gaps/10-todo.md`) |
| **4. Panic v2** | Widoczność dla gości, dwa tryby, poziom czystości, połączenie z `guestsMode` | Opiera się na danych obowiązków |
| **5. Produkty + zakupy** | Katalog, stany, ceny, podział kosztów | Nowa domena; Panic przesunięty przed nią |
| **6. Lodówka + przepisy** | Na katalogu z etapu 5 | |
| **7. Instrukcje** | Szablony, migracja prania | Najmniej zależności |
| **8. Smart home** | Home Assistant per mieszkanie | Daleki plan |

### Etap 0 — co już zrobione (2026-11-04)

- [x] `householdId` jako parametr warstwy sync (`subscribeHousehold`, `saveHouseholdToFirestore`, `AppProvider householdId`) — domyślnie `DEFAULT_HOUSEHOLD_ID`
- [x] Edycje wbudowanych obowiązków/zadań zapisywane jako nadpisania (`customized`) — krok w stronę „preset = kopia danych”
- [x] Testy logiki zapisu (Vitest) + czysty `tsc` / lint
- [ ] Reguły Firestore oparte o członkostwo — **czeka na pytania 1–3**
- [ ] Podział dokumentu na podkolekcje
- [ ] Domownicy / kalendarze / strefy / plan → dane mieszkania
- [ ] Dynamiczne pokoje zamiast `ChoreRoom`

---

## Pytania otwarte (do decyzji przed etapem 0)

1. Czy domownik może istnieć **bez konta Google** (np. tylko na tablecie w kuchni)? Dziś tak.
2. Czy jedna osoba może należeć do **kilku mieszkań** naraz? → przełącznik mieszkań.
3. **Role:** kto edytuje obowiązki, plan, strefy — tylko właściciel czy każdy domownik?
4. Jakie **presety** poza studenckim (rodzinny, para, jednoosobowe)?
5. **Migracja:** obecne mieszkanie z historią jako pierwsze, czy start od zera?

---

## Historia

| Data | Notatka |
|---|---|
| 2026-11-04 | Pierwsza wersja — audyt kodu vs wizja multi-mieszkań |
| 2026-11-04 | Porządki + poprawki sync; pierwsze punkty etapu 0 |
