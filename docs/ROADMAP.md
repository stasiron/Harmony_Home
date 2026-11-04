# HomeHarmony — roadmapa rozwoju

**Status:** 2026-11-04 — etap 0 i 1 zrobione w kodzie (patrz „Etap 0 + 1 — stan”); reguły czekają na deploy.

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

### Etap 0 + 1 — stan (2026-11-04)

- [x] Wiele mieszkań: `households/{id}` + członkostwo `members/{uid}` (role admin / member) + przełącznik mieszkań (`users/{uid}/memberships`)
- [x] Reguły Firestore oparte o członkostwo, testowane na emulatorze (`npm run test:rules`)
- [x] Podział dokumentu na podkolekcje — dokument per element (`src/hooks/useSyncedList.ts`)
- [x] Domownicy, strefy i plan → dane mieszkania (`profiles`, `zones`, `assets/floorPlan`)
- [x] Blokada edycji elementów (`locked`, `createdBy`) — obowiązki, zadania, todo, pranie
- [x] Zaproszenia kodem (`invites/{code}`), także dla urządzeń bez konta
- [x] Kreator mieszkania: nazwa, preset (4), domownicy, opcjonalny plan; bez planu — prompt do skopiowania
- [x] Migracja pierwszego mieszkania (`src/lib/legacyHousehold.ts`, przycisk dla właściciela)
- [ ] Kalendarze Google per mieszkanie — dziś tylko pierwsze (`features.legacyCalendar`, `src/config/calendars`); endpointy kalendarza na serwerze nie sprawdzają logowania
- [ ] Dynamiczne pokoje zamiast `ChoreRoom`
- [ ] Prywatne miejsca (`users/{uid}/private`) — reguły gotowe, moduły (lodówka, instrukcje) w etapach 6–7

**Wdrożenie (kolejność ważna):**

Stare reguły produkcyjne obejmują tylko dokumenty `users/{uid}` i `households/{id}` — każda podkolekcja (`members`, `profiles`, obowiązki, `memberships`) i `invites` są zablokowane, więc migracja nie przejdzie przed deployem reguł. Dlatego reguły mają **okres przejściowy** (`legacyTransition` w `firestore.rules`): dokument `households/homeharmony` zostaje dostępny dla każdego zalogowanego, ale tylko w polach starego modelu.

1. `firebase deploy --only firestore:rules` — reguły z okresem przejściowym; stara aplikacja rodziny działa dalej.
2. Deploy aplikacji (Vercel).
3. Właściciel loguje się Google → „Przenieś HomeHarmony” → Ustawienia → Mieszkanie → „Utwórz kod”.
4. Domownicy i tablet dołączają kodem.
5. Usuń `legacyTransition` z reguł (i jej test), deploy reguł, potem wygeneruj nowy kod zaproszenia — w okresie przejściowym kod był widoczny dla każdego zalogowanego.

---

## Decyzje (2026-11-04, odpowiedzi właściciela)

1. **Domownik bez konta** — tak. To profil w mieszkaniu (imię, kolor), używany np. na wspólnym tablecie. Urządzenie bez konta dołącza kodem zaproszenia (sesja anonimowa). **Brak dostępu do prywatnych miejsc** (prywatna lodówka, instrukcje…) — te wymagają konta Google.
2. **Kilka mieszkań na osobę** — tak → przełącznik mieszkań (`users/{uid}/memberships`).
3. **Role i edycja:**
   - a) Obowiązki, zadania, todo, zakupy, pranie, plany gości mają przycisk **„Zablokuj edycję”**. Włączyć go może tylko twórca (z kontem). Zablokowane edytuje tylko twórca i administrator; pozostali mogą je dalej **odhaczać** (zmiana pól wykonania).
   - b) Sprawy całego mieszkania — **strefy, plan, nazwa, domownicy, zaproszenia** — tylko administrator. Wyjątek: każdy może przełączyć „Heavy Day”.
4. **Presety:** Rodzina, Studenckie, Para, Jednoosobowe (`src/config/presets.ts`). Preset kopiuje się do mieszkania przy tworzeniu.
5. **Migracja:** obecne mieszkanie (`households/homeharmony`) migruje się jako pierwsze, z historią. Stare pola dokumentu zostają nietknięte (rollback).
6. **Brak zdjęcia planu** → mapa ukryta + przycisk „Skopiuj prompt” do wygenerowania planu w stylu obecnego (`src/lib/floorPlanPrompt.ts`).

### Model danych (wdrożony)

```
households/{hid}                     name, preset, ownerId, zones[], floorPlan{kind}, features{}, legacy pola (homeharmony)
households/{hid}/members/{uid}       role admin|member, profileId, anonymous, inviteCode
households/{hid}/profiles/{id}       domownik (User) — admin
households/{hid}/assets/floorPlan    obraz planu (data URL, ≤ ~900 KB) — admin
households/{hid}/{chores|zadania|todos|todoFolders|shopping|laundry|guestPlans}/{id}
                                     element + createdBy, createdAt, locked
invites/{code}                       householdId — get dla zalogowanych, tworzy admin
users/{uid}/memberships/{hid}        lista mieszkań użytkownika
users/{uid}/private/**               prywatne dane — tylko konto Google
```

Reguły: `firestore.rules`, testy: `npm run test:rules` (emulator).

---

## Historia

| Data | Notatka |
|---|---|
| 2026-11-04 | Pierwsza wersja — audyt kodu vs wizja multi-mieszkań |
| 2026-11-04 | Porządki + poprawki sync; pierwsze punkty etapu 0 |
| 2026-11-04 | Decyzje 1–6; multi-mieszkania, reguły, podkolekcje, blokady, presety, kreator, migracja |
