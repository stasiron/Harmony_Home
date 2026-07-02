# §3 — Tryb gości (`guestsMode`)

## Intencja (Twoja wizja)

Tryb na **nadchodzących gości** — nie musi włączać się sam.

Ktoś może go włączyć:
- z kalendarza (plan wizyty),
- ręcznie w UI (do dodania),
- lub innym mechanizmem — **doprecyzujemy później**.

To **osobna rzecz** od **PANIC** (przycisk na dashboardzie) — patrz `04-panic.md`.

## Jak jest teraz w kodzie

| Zachowanie | Stan |
|------------|------|
| `guestsMode` w `AppContext` | ✅ |
| Auto z kalendarza Google | ✅ `useGuestCalendarSync` — włącza gdy w kalendarzu widać gości |
| Ręczny przełącznik w ustawieniach | ❌ brak |
| Sort po ważności na `/chores` | ✅ |
| Badge ważności na kartach | ✅ |
| Ważność ≥ 4 → status `must` | ✅ `isGuestsModeMust` |
| **Nie** chowa reszty listy (w przeciwieństwie do PANIC) | ✅ |

## Ważność w „Dodaj zadanie”

Pole **Ważność (1–5)** w wspólnym formularzu (`ChoreItemFormFields`):

1. **Goście / PANIC** — co pokazać wyżej, co oznaczyć jako must.
2. **Waga w obowiązku** — wzór w `src/config/choreWeight.ts`:  
   `WAGA = czas × (ważność / MAKS + 1)` → próg 50% i % wykonania per domownik.

Pole minut („Trudność (min)”) = czas pracy, nie to samo co ważność.

## TODO

- [ ] **Ręczne włączanie/wyłączanie** trybu gości (np. Ustawienia lub banner).
- [ ] **Spójność z kalendarzem** — jeden przełącznik vs auto; uniknąć konfliktu z PANIC.
- [ ] **Persist** `guestsMode` (localStorage lub Firestore) jeśli ma przetrwać odświeżenie.
- [ ] **Kopia / UX** po polsku (część UI nadal po angielsku).

## Pliki

- `src/context/AppContext.tsx` — `guestsMode`, `setGuestsMode`
- `src/hooks/useGuestCalendarSync.ts`
- `src/lib/choreSort.ts`, `src/lib/choreImportance.ts`
- `src/components/chores/ChoreItemFormFields.tsx`
