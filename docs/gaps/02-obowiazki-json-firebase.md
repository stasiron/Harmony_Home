# §2 — Skąd biorą się obowiązki i zadania

## Jak jest teraz

Lista w aplikacji to **suma trzech źródeł**:

### 1. Stałe z pliku JSON (po rebuildzie)

| Plik | Co ładuje |
|------|-----------|
| `content/data/chores.json` | Wbudowane obowiązki (`source: "builtin"`) |
| `content/data/zadania.json` | Wbudowane zadania (`source: "builtin"`) |

Import w kodzie: `src/config/chores.ts`, `src/config/zadania.ts`.  
Zmiana pliku → **nowy deploy / rebuild** — potem ta sama lista dla całego zespołu.

### 2. Własne wpisy użytkownika (localStorage)

- Obowiązki dodane w UI → `userTasks`
- Zadania dodane w UI → `userZadania`
- Postęp (`lastCompleted`) → `progress`

Klucz: `src/lib/choreStorage.ts`

### 3. Firebase Firestore (sync domu)

Dokument: `households/homeharmony` (`src/lib/householdFirestore.ts`)

Synchronizowane pola:
- `progress`
- `userTasks`
- `userZadania`
- (+ domownicy, zakupy, plany gości)

**Stałe z JSON nie idą do Firestore** — ładują się z kodu przy każdym starcie i łączą z danymi z chmury / localStorage.

## Docelowa zasada

> Zespół **powtarzalnych** obowiązków = `chores.json` (+ ewentualnie `zadania.json`).  
> Do tego dochodzą rzeczy z Firebase: co kto dodał w UI + kiedy ostatnio wykonano.

## Brakuje / do rozważenia

- [ ] **PANIC / tryb gości w Firestore** — dziś tylko w pamięci sesji (po odświeżeniu strony PANIC się wyłącza).
- [ ] **Jedno źródło prawdy dla gości** — kalendarz vs ręczny przełącznik (patrz `03-tryb-gosci.md`).
- [ ] **Import JSON z ustawień** bez ręcznego commita (opcjonalnie, nie planowane).

## Pliki

- `src/config/chores.ts`, `src/config/zadania.ts`
- `src/lib/choreStorage.ts`
- `src/lib/householdFirestore.ts`
- `src/context/AppContext.tsx` — składanie listy przy starcie
