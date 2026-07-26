import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useGuestCalendarSync } from "@/hooks/useGuestCalendarSync";
import {
  loadInitialGuestPlans,
  loadInitialShopping,
  loadInitialTodos,
  loadInitialUsers,
  persistAppState,
  readAppStorage,
} from "@/lib/appStorage";
import {
  buildInitialTasks,
  buildInitialZadania,
  buildTasksFromParts,
  buildZadaniaFromParts,
  persistChoreState,
  readChoreStorage,
} from "@/lib/choreStorage";
import type { ChoreItemAddInput, ZadanieAddInput } from "@/lib/choreItemForm";
import {
  applyZadanieThresholds,
  choreStatusFromLinkedZadania,
  thresholdStatus,
} from "@/lib/choreZadaniaStatus";
import { normalizeAssignedTo } from "@/lib/choreAssignees";
import { resolveLinkedZadania } from "@/lib/zadania";
import { applyScheduleToTask, DEFAULT_SCHEDULE } from "@/lib/choreRecurrence";
import {
  normalizeTaskImportance,
  PANIC_GUESTS_MIN_IMPORTANCE,
  resolveImportance,
} from "@/lib/choreImportance";
import {
  isGuestsModeMust,
  isPanicGuestsMust,
} from "@/lib/choreSort";
import {
  isEmptyHousehold,
  saveHouseholdToFirestore,
  snapshotFromChoreState,
  snapshotHash,
  subscribeHousehold,
  type HouseholdSnapshot,
} from "@/lib/householdFirestore";
import {
  applyTodoToggle,
  buildTodoItem,
  isTodoOpen,
  type TodoAddInput,
} from "@/lib/todoHelpers";
import type {
  ChoreRoom,
  GuestPlan,
  MapPin,
  MapPoint,
  PanicState,
  Recipe,
  RecurrenceSchedule,
  ShoppingItem,
  SmartHomeDevice,
  Status,
  Task,
  TaskImportance,
  TaskMapShape,
  TaskRecurrence,
  TodoItem,
  User,
  Zadanie,
} from "@/types";

interface AppState {
  users: User[];
  tasks: Task[];
  zadania: Zadanie[];
  shopping: ShoppingItem[];
  todos: TodoItem[];
  recipes: Recipe[];
  devices: SmartHomeDevice[];
  guestsMode: boolean;
  guestCalendarHint: string | null;
  guestPlans: GuestPlan[];
  panic: PanicState | null;

  // derived helpers
  daysSince: (iso: string) => number;
  statusOf: (item: Task | Zadanie) => Status;
  visibleTasks: Task[];
  visibleZadania: Zadanie[];
  alertCount: number;

  // actions
  completeTask: (id: string) => void;
  completeZadanie: (id: string, completedBy?: string) => void;
  toggleUserHeavyDay: (userId: string) => void;
  setGuestsMode: (v: boolean) => void;
  addGuestPlan: (plan: Omit<GuestPlan, "id">) => void;
  startPanic: () => void;
  endPanic: () => void;
  toggleShopping: (id: string) => void;
  addShopping: (items: Omit<ShoppingItem, "id" | "checked">[]) => void;
  addTodo: (input: TodoAddInput) => void;
  toggleTodo: (id: string, memberId?: string | null) => void;
  setTodoAssignee: (id: string, memberId: string | null) => void;
  removeTodo: (id: string) => void;
  clearDoneTodos: () => void;
  triggerDevice: (id: string) => void;
  addUser: (name: string) => void;
  addTask: (input: ChoreItemAddInput & { linkedZadanieIds?: string[] }) => void;
  updateTask: (
    id: string,
    input: ChoreItemAddInput & { linkedZadanieIds?: string[] },
  ) => void;
  addZadanie: (input: ZadanieAddInput) => void;
  updateZadanie: (id: string, input: ZadanieAddInput) => void;
}

const AppContext = createContext<AppState | null>(null);

const USER_COLORS = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
] as const;

function roomToCategory(room: ChoreRoom): Task["category"] {
  if (room === "whole") return "general";
  if (room === "kitchen") return "kitchen";
  if (room === "bathroom") return "bathroom";
  if (room === "bedroom" || room === "bedroom2") return "bedroom";
  if (room === "living" || room === "dining") return "living";
  return "general";
}

const GUEST_PRIORITY_ROOMS: ChoreRoom[] = [
  "living",
  "dining",
  "bathroom",
  "kitchen",
  "hallway",
  "whole",
];

function buildUserItem(input: ChoreItemAddInput) {
  const recurrence = input.recurrence ?? "recurring";
  const defaultImportance: TaskImportance =
    input.importance ??
    (GUEST_PRIORITY_ROOMS.includes(input.room) ? 4 : 3);

  const base = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description,
    room: input.room,
    rooms: input.rooms,
    category: roomToCategory(input.room),
    estimatedMinutes: input.estimatedMinutes,
    assignedTo: normalizeAssignedTo(input.assignedTo),
    mapShape: input.mapShape,
    zoneId: input.zoneId,
    zoneIds: input.zoneIds,
    mapPins: input.mapPins,
    mapLine: input.mapLine,
    mapLineWidth: input.mapLineWidth,
    mapArea: input.mapArea,
    recurrence,
    source: "user" as const,
    lastCompleted: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 14,
    ).toISOString(),
    isGuestPriority: defaultImportance >= 4,
    isExpressBlitz: defaultImportance >= 5,
    importance: defaultImportance,
  };

  return recurrence === "recurring"
    ? applyScheduleToTask({
        ...base,
        schedule: input.schedule ?? DEFAULT_SCHEDULE,
      })
    : {
        ...base,
        tMin: 0,
        tSuggested: 0,
        tMax: 0,
      };
}

function buildUserZadanie(input: ZadanieAddInput): Zadanie {
  const item = buildUserItem({ ...input, recurrence: "once" });
  return applyZadanieThresholds(item as unknown as Zadanie, input.tMin, input.tMax);
}

function patchZadanieFromInput(
  zadanie: Zadanie,
  input: ZadanieAddInput,
): Zadanie {
  const importance =
    input.importance ??
    zadanie.importance ??
    (GUEST_PRIORITY_ROOMS.includes(input.room) ? 4 : 3);

  return applyZadanieThresholds(
    {
      ...zadanie,
      name: input.name.trim(),
      description: input.description,
      room: input.room,
      rooms: input.rooms,
      category: roomToCategory(input.room),
      estimatedMinutes: input.estimatedMinutes,
      mapShape: input.mapShape,
      zoneId: input.zoneId,
      zoneIds: input.zoneIds,
      mapPins: input.mapPins,
      mapLine: input.mapLine,
      mapLineWidth: input.mapLineWidth,
      mapArea: input.mapArea,
      importance,
      isGuestPriority: importance >= 4,
      isExpressBlitz: importance >= 5,
    },
    input.tMin,
    input.tMax,
  );
}

function patchTaskFromInput(
  task: Task,
  input: ChoreItemAddInput & { linkedZadanieIds?: string[] },
): Task {
  const recurrence = input.recurrence ?? task.recurrence;
  const importance =
    input.importance ??
    task.importance ??
    (GUEST_PRIORITY_ROOMS.includes(input.room) ? 4 : 3);

  const base: Task = {
    ...task,
    name: input.name.trim(),
    description: input.description,
    room: input.room,
    rooms: input.rooms,
    category: roomToCategory(input.room),
    estimatedMinutes: input.estimatedMinutes,
    assignedTo: normalizeAssignedTo(input.assignedTo ?? task.assignedTo),
    mapShape: input.mapShape,
    zoneId: input.zoneId,
    zoneIds: input.zoneIds,
    mapPins: input.mapPins,
    mapLine: input.mapLine,
    mapLineWidth: input.mapLineWidth,
    mapArea: input.mapArea,
    recurrence,
    importance,
    isGuestPriority: importance >= 4,
    isExpressBlitz: importance >= 5,
    linkedZadanieIds: input.linkedZadanieIds,
  };

  if (recurrence === "recurring") {
    const { lastCompleted: _lastCompleted, ...withoutLast } = base;
    return {
      ...applyScheduleToTask({
        ...withoutLast,
        schedule: input.schedule ?? task.schedule ?? DEFAULT_SCHEDULE,
      }),
      lastCompleted: task.lastCompleted,
    };
  }

  return {
    ...base,
    schedule: undefined,
    tMin: 0,
    tSuggested: 0,
    tMax: 0,
  };
}

function completeRecurringItem<T extends { id: string; recurrence: TaskRecurrence; source: Task["source"] }>(
  items: T[],
  id: string,
): T[] {
  const item = items.find((entry) => entry.id === id);
  if (!item) return items;
  if (item.recurrence === "once" && item.source === "user") {
    return items.filter((entry) => entry.id !== id);
  }
  return items.map((entry) =>
    entry.id === id
      ? { ...entry, lastCompleted: new Date().toISOString() }
      : entry,
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { syncUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>(loadInitialUsers);
  const [tasks, setTasks] = useState<Task[]>(buildInitialTasks);
  const [zadania, setZadania] = useState<Zadanie[]>(buildInitialZadania);
  const [shopping, setShopping] = useState<ShoppingItem[]>(loadInitialShopping);
  const [todos, setTodos] = useState<TodoItem[]>(loadInitialTodos);
  const [recipes] = useState<Recipe[]>([]);
  const [devices, setDevices] = useState<SmartHomeDevice[]>([]);
  const [guestsMode, setGuestsMode] = useState(false);
  const [guestCalendarHint, setGuestCalendarHint] = useState<string | null>(
    null,
  );
  const [guestPlans, setGuestPlans] = useState<GuestPlan[]>(
    loadInitialGuestPlans,
  );
  const [panic, setPanic] = useState<PanicState | null>(null);

  const remoteHashRef = useRef<string | null>(null);
  const pendingLocalHashRef = useRef<string | null>(null);
  const clientHydratedRef = useRef(false);
  const initialSyncDoneRef = useRef(false);
  const [firestoreReady, setFirestoreReady] = useState(false);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const zadaniaRef = useRef(zadania);
  zadaniaRef.current = zadania;
  const usersRef = useRef(users);
  usersRef.current = users;
  const shoppingRef = useRef(shopping);
  shoppingRef.current = shopping;
  const todosRef = useRef(todos);
  todosRef.current = todos;
  const guestPlansRef = useRef(guestPlans);
  guestPlansRef.current = guestPlans;

  useGuestCalendarSync(setGuestsMode, setGuestCalendarHint);

  const buildCurrentSnapshot = useCallback((): HouseholdSnapshot => {
    return {
      ...snapshotFromChoreState(tasksRef.current, zadaniaRef.current),
      users: usersRef.current,
      shopping: shoppingRef.current,
      guestPlans: guestPlansRef.current,
      todos: todosRef.current,
    };
  }, []);

  const applyHouseholdSnapshot = useCallback((snapshot: HouseholdSnapshot) => {
    const incomingHash = snapshotHash(snapshot);
    if (incomingHash === remoteHashRef.current) return;

    const pending = pendingLocalHashRef.current;
    if (pending && pending !== incomingHash) return;

    remoteHashRef.current = incomingHash;
    pendingLocalHashRef.current = null;
    setTasks(
      buildTasksFromParts(snapshot.progress, snapshot.userTasks),
    );
    setZadania(
      buildZadaniaFromParts(snapshot.progress, snapshot.userZadania),
    );
    if (snapshot.users.length > 0) setUsers(snapshot.users);
    setShopping(snapshot.shopping);
    setGuestPlans(snapshot.guestPlans);
    setTodos(snapshot.todos);
  }, []);

  const buildLocalSnapshot = useCallback((): HouseholdSnapshot => {
    const chores = readChoreStorage();
    const app = readAppStorage();
    return {
      progress: chores.progress,
      userTasks: chores.userTasks,
      userZadania: chores.userZadania,
      users: app.users.length > 0 ? app.users : loadInitialUsers(),
      shopping: app.shopping,
      guestPlans: app.guestPlans,
      todos: app.todos,
    };
  }, []);

  // SSR nie widzi localStorage — fallback tylko gdy brak Firestore sync.
  useEffect(() => {
    if (authLoading || clientHydratedRef.current) return;
    clientHydratedRef.current = true;
    if (syncUser) return;

    setTasks(buildInitialTasks());
    setZadania(buildInitialZadania());
    setUsers(loadInitialUsers());
    setShopping(loadInitialShopping());
    setGuestPlans(loadInitialGuestPlans());
    setTodos(loadInitialTodos());
  }, [authLoading, syncUser]);

  // Firestore: wspólny stan obowiązków na wszystkich urządzeniach.
  useEffect(() => {
    if (!syncUser) {
      initialSyncDoneRef.current = false;
      setFirestoreReady(false);
      return;
    }

    let cancelled = false;

    const unsubscribe = subscribeHousehold(
      (snapshot) => {
        if (cancelled) return;

        if (!initialSyncDoneRef.current) {
          initialSyncDoneRef.current = true;
          if (isEmptyHousehold(snapshot)) {
            const local = buildLocalSnapshot();
            if (!isEmptyHousehold(local)) {
              remoteHashRef.current = snapshotHash(local);
              void saveHouseholdToFirestore(local).catch((err) => {
                console.error("Firestore household upload failed:", err);
              });
              applyHouseholdSnapshot(local);
              setFirestoreReady(true);
              return;
            }
          }
        }

        applyHouseholdSnapshot(snapshot);
        setFirestoreReady(true);
      },
      (err) => {
        console.error("Firestore household sync failed:", err);
      },
    );

    return () => {
      cancelled = true;
      unsubscribe?.();
      initialSyncDoneRef.current = false;
      setFirestoreReady(false);
    };
  }, [syncUser, applyHouseholdSnapshot, buildLocalSnapshot]);

  useEffect(() => {
    persistChoreState(tasks, zadania);
  }, [tasks, zadania]);

  useEffect(() => {
    persistAppState({ users, shopping, guestPlans, todos });
  }, [users, shopping, guestPlans, todos]);

  useEffect(() => {
    if (!syncUser) return;

    const snapshot = buildCurrentSnapshot();
    const hash = snapshotHash(snapshot);
    if (hash === remoteHashRef.current) return;

    pendingLocalHashRef.current = hash;
    if (!firestoreReady) return;

    const timer = setTimeout(() => {
      void saveHouseholdToFirestore(snapshot)
        .then(() => {
          remoteHashRef.current = hash;
          pendingLocalHashRef.current = null;
        })
        .catch((err) => {
          console.error("Firestore household save failed:", err);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [syncUser, firestoreReady, tasks, zadania, users, shopping, guestPlans, todos, buildCurrentSnapshot]);

  const daysSince = useCallback((iso: string) => {
    const d = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(d);
  }, []);

  const zadanieStatusOf = useCallback(
    (zadanie: Zadanie): Status => {
      if (guestsMode && isGuestsModeMust(zadanie, true)) return "must";
      if (isPanicGuestsMust(zadanie, !!panic?.active)) return "must";
      return thresholdStatus(
        daysSince(zadanie.lastCompleted),
        zadanie.tMin,
        zadanie.tMax,
      );
    },
    [daysSince, guestsMode, panic],
  );

  const statusOf = useCallback(
    (item: Task | Zadanie): Status => {
      if (guestsMode && isGuestsModeMust(item, true)) return "must";
      if (isPanicGuestsMust(item, !!panic?.active)) return "must";

      if ("linkedZadanieIds" in item && item.linkedZadanieIds?.length) {
        const linked = resolveLinkedZadania(item.linkedZadanieIds, zadania);
        const derived = choreStatusFromLinkedZadania(
          item,
          linked,
          zadanieStatusOf,
        );
        if (derived) return derived;
      }

      return thresholdStatus(
        daysSince(item.lastCompleted),
        item.tMin,
        item.tMax,
      );
    },
    [daysSince, guestsMode, panic, zadania, zadanieStatusOf],
  );

  const visibleZadania = useMemo(() => {
    if (panic?.active) {
      return zadania.filter(
        (z) => resolveImportance(z) >= PANIC_GUESTS_MIN_IMPORTANCE,
      );
    }
    return zadania;
  }, [zadania, panic]);

  const visibleTasks = useMemo(() => {
    if (panic?.active) {
      return tasks.filter(
        (t) => resolveImportance(t) >= PANIC_GUESTS_MIN_IMPORTANCE,
      );
    }
    const heavyDayUserIds = new Set(
      users.filter((u) => u.heavyDay).map((u) => u.id),
    );
    return tasks.filter((t) => {
      const assignees = normalizeAssignedTo(t.assignedTo);
      if (
        assignees.length === 0 ||
        !assignees.some((id) => heavyDayUserIds.has(id))
      ) {
        return true;
      }
      return statusOf(t) === "must";
    });
  }, [tasks, panic, statusOf, users]);

  const alertCount = useMemo(
    () => tasks.filter((t) => statusOf(t) === "must").length,
    [tasks, statusOf],
  );

  const completeTask = useCallback((id: string) => {
    setTasks((prev) => completeRecurringItem(prev, id));
  }, []);

  const completeZadanie = useCallback((id: string, completedBy?: string) => {
    setZadania((prev) => {
      const item = prev.find((z) => z.id === id);
      if (!item) return prev;
      if (item.recurrence === "once" && item.source === "user") {
        return prev.filter((z) => z.id !== id);
      }
      return prev.map((z) =>
        z.id === id
          ? {
              ...z,
              lastCompleted: new Date().toISOString(),
              lastCompletedBy: completedBy,
            }
          : z,
      );
    });
  }, []);

  const toggleUserHeavyDay = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, heavyDay: !u.heavyDay } : u)),
    );
  }, []);

  const addGuestPlan = useCallback((plan: Omit<GuestPlan, "id">) => {
    setGuestPlans((prev) => [...prev, { ...plan, id: crypto.randomUUID() }]);
    setGuestsMode(true);
  }, []);

  const startPanic = useCallback(() => {
    setPanic({ active: true });
  }, []);
  const endPanic = useCallback(() => setPanic(null), []);

  const toggleShopping = useCallback((id: string) => {
    setShopping((prev) =>
      prev.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)),
    );
  }, []);

  const addShopping = useCallback(
    (items: Omit<ShoppingItem, "id" | "checked">[]) => {
      setShopping((prev) => {
        const next = [...prev];
        items.forEach((it) => {
          if (
            !next.some((s) => s.name.toLowerCase() === it.name.toLowerCase())
          ) {
            next.push({ ...it, id: crypto.randomUUID(), checked: false });
          }
        });
        return next;
      });
    },
    [],
  );

  const addTodo = useCallback((input: TodoAddInput) => {
    const item = buildTodoItem(input);
    if (!item) return;
    setTodos((prev) => [item, ...prev]);
  }, []);

  const toggleTodo = useCallback(
    (id: string, memberId?: string | null) => {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id ? applyTodoToggle(t, usersRef.current, memberId ?? null) : t,
        ),
      );
    },
    [],
  );

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setTodoAssignee = useCallback((id: string, memberId: string | null) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id && t.scope === "personal"
          ? { ...t, assignedTo: memberId }
          : t,
      ),
    );
  }, []);

  const clearDoneTodos = useCallback(() => {
    setTodos((prev) =>
      prev.filter((t) => isTodoOpen(t, usersRef.current)),
    );
  }, []);

  const triggerDevice = useCallback(
    (id: string) => {
      setDevices((prev) => {
        const dev = prev.find((d) => d.id === id);
        if (!dev) return prev;
        const nowTriggered = !dev.triggered;

        if (nowTriggered && dev.linkedTaskId) {
          setTasks((tprev) =>
            tprev.map((t) =>
              t.id === dev.linkedTaskId
                ? { ...t, lastCompleted: new Date().toISOString() }
                : t,
            ),
          );
        }
        if (nowTriggered && dev.generatesTask) {
          setTasks((tprev) => {
            if (tprev.some((t) => t.name === dev.generatesTask)) return tprev;
            const newTask: Task = {
              id: crypto.randomUUID(),
              name: dev.generatesTask!,
              room: "hallway",
              category: "general",
              estimatedMinutes: 5,
              assignedTo: users[0] ? [users[0].id] : [],
              recurrence: "once",
              source: "user",
              lastCompleted: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 10,
              ).toISOString(),
              tMin: 0,
              tSuggested: 0,
              tMax: 0,
              importance: 3,
              isGuestPriority: false,
              isExpressBlitz: false,
            };
            return [newTask, ...tprev];
          });
        }

        return prev.map((d) =>
          d.id === id ? { ...d, triggered: nowTriggered } : d,
        );
      });
    },
    [users],
  );

  const addUser = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUsers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: trimmed,
        avatar: trimmed.charAt(0).toUpperCase(),
        color: USER_COLORS[prev.length % USER_COLORS.length],
        active: true,
        heavyDay: false,
      },
    ]);
  }, []);

  const addTask = useCallback(
    (input: ChoreItemAddInput & { linkedZadanieIds?: string[] }) => {
      const trimmed = input.name.trim();
      if (!trimmed || input.estimatedMinutes < 1) return;

      const task: Task = {
        ...buildUserItem(input),
        linkedZadanieIds: input.linkedZadanieIds,
      };

      setTasks((prev) => [...prev, task]);
    },
    [],
  );

  const updateTask = useCallback(
    (
      id: string,
      input: ChoreItemAddInput & { linkedZadanieIds?: string[] },
    ) => {
      const trimmed = input.name.trim();
      if (!trimmed || input.estimatedMinutes < 1) return;

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? patchTaskFromInput(task, input) : task,
        ),
      );
    },
    [],
  );

  const addZadanie = useCallback((input: ZadanieAddInput) => {
    if (!input.name.trim() || input.estimatedMinutes < 1) return;
    setZadania((prev) => [...prev, buildUserZadanie(input)]);
  }, []);

  const updateZadanie = useCallback((id: string, input: ZadanieAddInput) => {
    if (!input.name.trim() || input.estimatedMinutes < 1) return;
    setZadania((prev) =>
      prev.map((zadanie) =>
        zadanie.id === id ? patchZadanieFromInput(zadanie, input) : zadanie,
      ),
    );
  }, []);

  const value: AppState = {
    users,
    tasks,
    zadania,
    shopping,
    todos,
    recipes,
    devices,
    guestsMode,
    guestCalendarHint,
    guestPlans,
    panic,
    daysSince,
    statusOf,
    visibleTasks,
    visibleZadania,
    alertCount,
    completeTask,
    completeZadanie,
    toggleUserHeavyDay,
    setGuestsMode,
    addGuestPlan,
    startPanic,
    endPanic,
    toggleShopping,
    addShopping,
    addTodo,
    toggleTodo,
    setTodoAssignee,
    removeTodo,
    clearDoneTodos,
    triggerDevice,
    addUser,
    addTask,
    updateTask,
    addZadanie,
    updateZadanie,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
