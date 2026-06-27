import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGuestCalendarSync } from "@/hooks/useGuestCalendarSync";
import {
  loadInitialGuestPlans,
  loadInitialShopping,
  loadInitialUsers,
  persistAppState,
} from "@/lib/appStorage";
import { buildInitialTasks, persistTasks } from "@/lib/choreStorage";
import type {
  ChoreRoom,
  GuestPlan,
  MapPin,
  PanicState,
  Recipe,
  ShoppingItem,
  SmartHomeDevice,
  Status,
  Task,
  TaskRecurrence,
  User,
} from "@/types";

interface AppState {
  users: User[];
  tasks: Task[];
  shopping: ShoppingItem[];
  recipes: Recipe[];
  devices: SmartHomeDevice[];
  guestsMode: boolean;
  guestCalendarHint: string | null;
  guestPlans: GuestPlan[];
  panic: PanicState | null;

  // derived helpers
  daysSince: (iso: string) => number;
  statusOf: (task: Task) => Status;
  visibleTasks: Task[];
  alertCount: number;

  // actions
  completeTask: (id: string) => void;
  toggleUserHeavyDay: (userId: string) => void;
  setGuestsMode: (v: boolean) => void;
  addGuestPlan: (plan: Omit<GuestPlan, "id">) => void;
  startPanic: (minutes: 15 | 30 | 45) => void;
  endPanic: () => void;
  toggleShopping: (id: string) => void;
  addShopping: (items: Omit<ShoppingItem, "id" | "checked">[]) => void;
  triggerDevice: (id: string) => void;
  addUser: (name: string) => void;
  addTask: (input: {
    name: string;
    description?: string;
    room: ChoreRoom;
    estimatedMinutes: number;
    assignedTo?: string;
    mapPins?: MapPin[];
    recurrence?: TaskRecurrence;
  }) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadInitialUsers);
  const [tasks, setTasks] = useState<Task[]>(buildInitialTasks);
  const [shopping, setShopping] = useState<ShoppingItem[]>(loadInitialShopping);
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

  useGuestCalendarSync(setGuestsMode, setGuestCalendarHint);

  useEffect(() => {
    persistTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    persistAppState({ users, shopping, guestPlans });
  }, [users, shopping, guestPlans]);

  const daysSince = useCallback((iso: string) => {
    const d = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(d);
  }, []);

  const statusOf = useCallback(
    (task: Task): Status => {
      const d = daysSince(task.lastCompleted);
      if (guestsMode && task.isGuestPriority) return "must";
      if (panic?.active && task.isExpressBlitz) return "must";
      if (d < task.tMin) return "done";
      if (d >= task.tMax) return "must";
      if (d >= task.tSuggested) return "suggested";
      return "safe";
    },
    [daysSince, guestsMode, panic],
  );

  const visibleTasks = useMemo(() => {
    if (panic?.active) return tasks.filter((t) => t.isExpressBlitz);
    const heavyDayUserIds = new Set(
      users.filter((u) => u.heavyDay).map((u) => u.id),
    );
    return tasks.filter((t) => {
      if (!t.assignedTo || !heavyDayUserIds.has(t.assignedTo)) return true;
      return statusOf(t) === "must";
    });
  }, [tasks, panic, statusOf, users]);

  const alertCount = useMemo(
    () => tasks.filter((t) => statusOf(t) === "must").length,
    [tasks, statusOf],
  );

  const completeTask = useCallback((id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;
      if (task.recurrence === "once" && task.source === "user") {
        return prev.filter((t) => t.id !== id);
      }
      return prev.map((t) =>
        t.id === id ? { ...t, lastCompleted: new Date().toISOString() } : t,
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

  const startPanic = useCallback((minutes: 15 | 30 | 45) => {
    setPanic({ active: true, minutes, startedAt: new Date().toISOString() });
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
              assignedTo: users[0]?.id ?? "",
              recurrence: "once",
              source: "user",
              lastCompleted: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 10,
              ).toISOString(),
              tMin: 0,
              tSuggested: 0,
              tMax: 0,
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
    (input: {
      name: string;
      description?: string;
      room: ChoreRoom;
      estimatedMinutes: number;
      assignedTo?: string;
      mapPins?: MapPin[];
      recurrence?: TaskRecurrence;
    }) => {
      const trimmed = input.name.trim();
      if (!trimmed || input.estimatedMinutes < 1) return;
      setTasks((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: trimmed,
          description: input.description,
          room: input.room,
          category: roomToCategory(input.room),
          estimatedMinutes: input.estimatedMinutes,
          assignedTo: input.assignedTo ?? "",
          mapPins: input.mapPins,
          recurrence: input.recurrence ?? "recurring",
          source: "user",
          lastCompleted: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 14,
          ).toISOString(),
          tMin: 3,
          tSuggested: 5,
          tMax: 7,
          isGuestPriority: GUEST_PRIORITY_ROOMS.includes(input.room),
          isExpressBlitz: false,
        },
      ]);
    },
    [],
  );

  const value: AppState = {
    users,
    tasks,
    shopping,
    recipes,
    devices,
    guestsMode,
    guestCalendarHint,
    guestPlans,
    panic,
    daysSince,
    statusOf,
    visibleTasks,
    alertCount,
    completeTask,
    toggleUserHeavyDay,
    setGuestsMode,
    addGuestPlan,
    startPanic,
    endPanic,
    toggleShopping,
    addShopping,
    triggerDevice,
    addUser,
    addTask,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
