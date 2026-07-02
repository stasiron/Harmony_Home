# §4 — PANIC (dashboard) vs tryb PANIC na mapie

## PANIC z dashboardu — docelowo (wdrożone)

**Gdzie:** przycisk „Guests Panic Button” na dashboardzie (`QuickActions.tsx`).

**Zachowanie:**
- Jedno kliknięcie → **włącz** / **wyłącz** (bez wyboru czasu).
- Na `/chores`: lista obowiązków **tylko ważność ≥ 3**, sort **od najważniejszych**.
- Ważność **≥ 4** → status `must`.
- Numery 1, 2, 3… na kartach.
- Zadania (`visibleZadania`) — ten sam filtr ≥ 3 w trybie PANIC.

**Czego nie ma (świadomie odrzucone):**
- ❌ Timer 15 / 30 / 45 min
- ❌ Dialog „Express Blitzkrieg”

**Stan w kodzie:** `PanicState = { active: boolean }`, `startPanic()` / `endPanic()`.

**Nie zapisuje się** w Firestore — po odświeżeniu strony PANIC się wyłącza.

### TODO PANIC (dashboard)

- [ ] Persist stanu PANIC (opcjonalnie).
- [ ] Osobny nagłówek sekcji zamiast tylko dopisku „· PANIC_GOSCIE”.
- [ ] Spójność z trybem gości — kiedy oba aktywne naraz.

---

## Tryb PANIC na mapie — **ZAMROŻONY** (nie usuwać)

Kolory pinezek wg **ważności** (nie wg czasu do terminu).  
**Wyłączony z UI** — kod zostaje na przyszłość.

### Gdzie leży kod

| Plik | Co robi |
|------|---------|
| `src/lib/mapPinStyles.ts` | `MapDisplayMode` zawiera `"panic"`; `importanceToMapStatus()`, `PANIC_MAP_LEGEND`; **`MAP_DISPLAY_MODES_UI`** — tylko `initials` + `status` w przełączniku |
| `src/lib/mapGeometry.ts` | `visualStatusForTask()` — gałąź `colorMode === "panic"`; filtrowanie zadań `importance >= 3` w `resolveMapRenderables()` |
| `src/components/chores/ApartmentMap.tsx` | `MapLegend` dla panic; hover pokazuje ważność gdy `colorMode === "panic"` |

### Jak przywrócić

1. Dodać `"panic"` z powrotem do `MAP_DISPLAY_MODES_UI` w `mapPinStyles.ts`.
2. Ewentualnie domyślny `colorMode` — bez zmian w reszcie.

### Różnica: dashboard PANIC ≠ mapa PANIC

- **Dashboard PANIC** — filtr i sort listy obowiązków.
- **Mapa PANIC** (zamrożona) — tylko sposób malowania pinezek; nie włącza się przyciskiem z dashboardu.
