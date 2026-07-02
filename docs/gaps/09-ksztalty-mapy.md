# §9 — Kształty na mapie mieszkania

## Co to jest „kształt”

Sposób, w jaki **obowiązek** (ew. w przyszłości **zadanie**) jest narysowany na planie.

Wybór w formularzu: `ChoreItemFormFields` → po wyborze pokoju/strefy → `MapGeometryPicker` (pinezka / linia / obszar) lub cała strefa z listy.

| Kształt (`mapShape`) | Znaczenie | Jak ustawić |
|----------------------|-----------|-------------|
| **pin** | Punkt na planie | 1 klik |
| **line** | Odcinek A→B = „obszar” zadania wzdłuż linii | 2 punkty + suwak **grubości** (`mapLineWidth`) |
| **area** | Zamknięta przestrzeń | Wielokąt ≥ 3 punkty |
| **zone** | Cała strefa z drzewa domu (grupa + dzieci) | Wybór grupy w `ChoreLocationPicker` — bez rysowania |

Etykiety: `src/lib/taskMap.ts` → `TASK_MAP_SHAPE_LABELS`.

## Warstwy vs kształty

Na `/chores` w `ApartmentMap` włącza się warstwy (multi-select, `localStorage`):

| Warstwa | Pokazuje |
|---------|----------|
| Pinezki | tylko `mapShape: "pin"` |
| Linie | tylko `mapShape: "line"` |
| Obszary | tylko `mapShape: "area"` |
| Strefy | nazwy stref z drzewa (nie kształt obowiązku) |

Żeby zobaczyć linię, muszą być włączone **Linie** i obowiązek musi mieć kształt linia.

## Co działa ✅

- Pinezka, linia (z grubością), obszar (polygon).
- `ChoreLocationPicker`: aspect ratio planu, hover/zaznaczenie pokoi, strefy = grupy, pokoje = osobny rząd.
- Tylko **obowiązki** trafiają na mapę (`ApartmentMap` dostaje `visibleTasks`).

## TODO 🔜

### 1. Kształt `zone` na mapie głównej

**Problem:** Obowiązek z `mapShape: "zone"` zapisuje się w danych, ale `resolveMapRenderables()` w `src/lib/mapGeometry.ts` **nie rysuje** go na planie.

**Do zrobienia:**
- [ ] Dla `zone` — podświetlić wielokąty wszystkich przestrzeni w drzewie strefy (`polygonsForZone`).
- [ ] Kolor wg statusu obowiązku (jak linia/obszar).
- [ ] Etykieta / legenda opcjonalnie.

### 2. Zadania na mapie

**Problem:** Osobne zadania (`Zadanie`) nie są przekazywane do `ApartmentMap` — nawet z pinezką w JSON nie widać ich na planie.

**Do zrobienia:**
- [ ] Przekazać `visibleZadania` do mapy (osobna warstwa lub razem z obowiązkami).
- [ ] Ustalić wizualnie: ten sam styl co obowiązki vs inny (np. mniejsza pinezka).

### 3. Spójność picker ↔ mapa główna

- [ ] Podgląd linii/obszaru w `MapGeometryPicker` już jest — upewnić się po wdrożeniu `zone` na głównej mapie.

## Pliki

| Plik | Rola |
|------|------|
| `src/lib/mapGeometry.ts` | `resolveMapRenderables`, warstwy |
| `src/components/chores/ApartmentMap.tsx` | Mapa na `/chores` |
| `src/components/chores/MapGeometryPicker.tsx` | Rysowanie w formularzu |
| `src/components/chores/ChoreLocationPicker.tsx` | Pokój / strefa |
| `src/config/mapLine.ts` | Domyślna i zakres grubości linii |

## Czego nie ma (świadomie)

- Kolorowe **wypełnienie całych stref** wg statusu zadań w pokoju — kiedyś rozważane, dziś strefy = tylko nazwa + kontur przy hover (`ZoneMapOverlay`). Martwy helper: `homeZoneVisualStatus()` w `mapGeometry.ts`.
