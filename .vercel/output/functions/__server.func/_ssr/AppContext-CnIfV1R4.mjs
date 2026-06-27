import { i as __toESM } from "../_runtime.mjs";
import { l as createServerFn } from "./esm-Dova13aH.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as createSsrRpc } from "./createSsrRpc-C-mhK0Jn.mjs";
import { t as DEFAULT_MEMBERS } from "./googleOAuth-BhEtEXPI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AppContext-CnIfV1R4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var checkGuestCalendar = createServerFn({ method: "GET" }).handler(createSsrRpc("73d61eab497ade0575f45a2623c1ae1954ba3019d69988096d65e4569ab3f488"));
var GUEST_CALENDAR_REFRESH_MS = 900 * 1e3;
function useGuestCalendarSync(setGuestsMode, setGuestCalendarHint) {
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		const sync = async () => {
			try {
				const status = await checkGuestCalendar();
				if (cancelled) return;
				setGuestsMode(status.active);
				setGuestCalendarHint(status.active ? status.eventTitle : null);
			} catch {
				if (!cancelled) setGuestCalendarHint(null);
			}
		};
		sync();
		const id = setInterval(sync, GUEST_CALENDAR_REFRESH_MS);
		return () => {
			cancelled = true;
			clearInterval(id);
		};
	}, [setGuestsMode, setGuestCalendarHint]);
}
var STORAGE_KEY$1 = "homeharmony-app";
function emptyStorage$1() {
	return {
		users: [],
		shopping: [],
		guestPlans: []
	};
}
function readStorage$1() {
	if (typeof window === "undefined") return emptyStorage$1();
	try {
		const raw = localStorage.getItem(STORAGE_KEY$1);
		if (!raw) return emptyStorage$1();
		const parsed = JSON.parse(raw);
		return {
			users: Array.isArray(parsed.users) ? parsed.users : [],
			shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
			guestPlans: Array.isArray(parsed.guestPlans) ? parsed.guestPlans : []
		};
	} catch {
		return emptyStorage$1();
	}
}
function loadInitialUsers() {
	const stored = readStorage$1().users;
	if (stored.length > 0) return stored;
	return [...DEFAULT_MEMBERS];
}
function loadInitialShopping() {
	return readStorage$1().shopping;
}
function loadInitialGuestPlans() {
	return readStorage$1().guestPlans;
}
function persistAppState(state) {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY$1, JSON.stringify(state));
}
/**
* Stałe, powtarzalne obowiązki — edytuj ten plik.
* Nie dodawaj ich ręcznie w UI; ładują się przy każdym starcie.
* `assignedTo` = id z src/config/household.ts (member-1 …).
*
* Wyzeruj `[]` jeśli na razie bez stałych zadań.
*/
var PERMANENT_CHORES = [
	{
		id: "permanent-trash",
		name: "Wynieś śmieci",
		description: "Worki do pojemnika na podwórku",
		room: "kitchen",
		category: "kitchen",
		estimatedMinutes: 5,
		assignedTo: "member-1",
		recurrence: "recurring",
		source: "builtin",
		tMin: 1,
		tSuggested: 2,
		tMax: 3,
		isGuestPriority: true,
		isExpressBlitz: false
	},
	{
		id: "permanent-vacuum-living",
		name: "Odkurz salon",
		room: "living",
		category: "living",
		estimatedMinutes: 20,
		assignedTo: "member-2",
		mapPins: [{
			x: 20,
			y: 24
		}],
		recurrence: "recurring",
		source: "builtin",
		tMin: 3,
		tSuggested: 5,
		tMax: 7,
		isGuestPriority: true,
		isExpressBlitz: true
	},
	{
		id: "permanent-bathroom",
		name: "Wyczyść łazienkę",
		room: "bathroom",
		category: "bathroom",
		estimatedMinutes: 25,
		assignedTo: "",
		recurrence: "recurring",
		source: "builtin",
		tMin: 5,
		tSuggested: 7,
		tMax: 10,
		isGuestPriority: true,
		isExpressBlitz: false
	}
];
var PERMANENT_CHORE_IDS = new Set(PERMANENT_CHORES.map((t) => t.id));
var STORAGE_KEY = "homeharmony-chores";
var defaultLastCompleted = () => (/* @__PURE__ */ new Date(Date.now() - 1e3 * 60 * 60 * 24 * 14)).toISOString();
function emptyStorage() {
	return {
		progress: {},
		userTasks: []
	};
}
function readStorage() {
	if (typeof window === "undefined") return emptyStorage();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return emptyStorage();
		const parsed = JSON.parse(raw);
		return {
			progress: parsed.progress ?? {},
			userTasks: Array.isArray(parsed.userTasks) ? parsed.userTasks : []
		};
	} catch {
		return emptyStorage();
	}
}
function buildInitialTasks() {
	const { progress, userTasks } = readStorage();
	const permanent = PERMANENT_CHORES.map((template) => ({
		...template,
		lastCompleted: progress[template.id] ?? defaultLastCompleted()
	}));
	const custom = userTasks.map((task) => ({
		...task,
		lastCompleted: progress[task.id] ?? task.lastCompleted ?? defaultLastCompleted()
	}));
	return [...permanent, ...custom];
}
function persistTasks(tasks) {
	if (typeof window === "undefined") return;
	const progress = Object.fromEntries(tasks.map((t) => [t.id, t.lastCompleted]));
	const userTasks = tasks.filter((t) => !PERMANENT_CHORE_IDS.has(t.id));
	localStorage.setItem(STORAGE_KEY, JSON.stringify({
		progress,
		userTasks
	}));
}
var AppContext = (0, import_react.createContext)(null);
var USER_COLORS = [
	"chart-1",
	"chart-2",
	"chart-3",
	"chart-4",
	"chart-5"
];
function roomToCategory(room) {
	if (room === "whole") return "general";
	if (room === "kitchen") return "kitchen";
	if (room === "bathroom") return "bathroom";
	if (room === "bedroom" || room === "bedroom2") return "bedroom";
	if (room === "living" || room === "dining") return "living";
	return "general";
}
var GUEST_PRIORITY_ROOMS = [
	"living",
	"dining",
	"bathroom",
	"kitchen",
	"hallway",
	"whole"
];
function AppProvider({ children }) {
	const [users, setUsers] = (0, import_react.useState)(loadInitialUsers);
	const [tasks, setTasks] = (0, import_react.useState)(buildInitialTasks);
	const [shopping, setShopping] = (0, import_react.useState)(loadInitialShopping);
	const [recipes] = (0, import_react.useState)([]);
	const [devices, setDevices] = (0, import_react.useState)([]);
	const [guestsMode, setGuestsMode] = (0, import_react.useState)(false);
	const [guestCalendarHint, setGuestCalendarHint] = (0, import_react.useState)(null);
	const [guestPlans, setGuestPlans] = (0, import_react.useState)(loadInitialGuestPlans);
	const [panic, setPanic] = (0, import_react.useState)(null);
	useGuestCalendarSync(setGuestsMode, setGuestCalendarHint);
	(0, import_react.useEffect)(() => {
		persistTasks(tasks);
	}, [tasks]);
	(0, import_react.useEffect)(() => {
		persistAppState({
			users,
			shopping,
			guestPlans
		});
	}, [
		users,
		shopping,
		guestPlans
	]);
	const daysSince = (0, import_react.useCallback)((iso) => {
		const d = (Date.now() - new Date(iso).getTime()) / (1e3 * 60 * 60 * 24);
		return Math.floor(d);
	}, []);
	const statusOf = (0, import_react.useCallback)((task) => {
		const d = daysSince(task.lastCompleted);
		if (guestsMode && task.isGuestPriority) return "must";
		if (panic?.active && task.isExpressBlitz) return "must";
		if (d < task.tMin) return "done";
		if (d >= task.tMax) return "must";
		if (d >= task.tSuggested) return "suggested";
		return "safe";
	}, [
		daysSince,
		guestsMode,
		panic
	]);
	const value = {
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
		visibleTasks: (0, import_react.useMemo)(() => {
			if (panic?.active) return tasks.filter((t) => t.isExpressBlitz);
			const heavyDayUserIds = new Set(users.filter((u) => u.heavyDay).map((u) => u.id));
			return tasks.filter((t) => {
				if (!t.assignedTo || !heavyDayUserIds.has(t.assignedTo)) return true;
				return statusOf(t) === "must";
			});
		}, [
			tasks,
			panic,
			statusOf,
			users
		]),
		alertCount: (0, import_react.useMemo)(() => tasks.filter((t) => statusOf(t) === "must").length, [tasks, statusOf]),
		completeTask: (0, import_react.useCallback)((id) => {
			setTasks((prev) => {
				const task = prev.find((t) => t.id === id);
				if (!task) return prev;
				if (task.recurrence === "once" && task.source === "user") return prev.filter((t) => t.id !== id);
				return prev.map((t) => t.id === id ? {
					...t,
					lastCompleted: (/* @__PURE__ */ new Date()).toISOString()
				} : t);
			});
		}, []),
		toggleUserHeavyDay: (0, import_react.useCallback)((userId) => {
			setUsers((prev) => prev.map((u) => u.id === userId ? {
				...u,
				heavyDay: !u.heavyDay
			} : u));
		}, []),
		setGuestsMode,
		addGuestPlan: (0, import_react.useCallback)((plan) => {
			setGuestPlans((prev) => [...prev, {
				...plan,
				id: crypto.randomUUID()
			}]);
			setGuestsMode(true);
		}, []),
		startPanic: (0, import_react.useCallback)((minutes) => {
			setPanic({
				active: true,
				minutes,
				startedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
		}, []),
		endPanic: (0, import_react.useCallback)(() => setPanic(null), []),
		toggleShopping: (0, import_react.useCallback)((id) => {
			setShopping((prev) => prev.map((s) => s.id === id ? {
				...s,
				checked: !s.checked
			} : s));
		}, []),
		addShopping: (0, import_react.useCallback)((items) => {
			setShopping((prev) => {
				const next = [...prev];
				items.forEach((it) => {
					if (!next.some((s) => s.name.toLowerCase() === it.name.toLowerCase())) next.push({
						...it,
						id: crypto.randomUUID(),
						checked: false
					});
				});
				return next;
			});
		}, []),
		triggerDevice: (0, import_react.useCallback)((id) => {
			setDevices((prev) => {
				const dev = prev.find((d) => d.id === id);
				if (!dev) return prev;
				const nowTriggered = !dev.triggered;
				if (nowTriggered && dev.linkedTaskId) setTasks((tprev) => tprev.map((t) => t.id === dev.linkedTaskId ? {
					...t,
					lastCompleted: (/* @__PURE__ */ new Date()).toISOString()
				} : t));
				if (nowTriggered && dev.generatesTask) setTasks((tprev) => {
					if (tprev.some((t) => t.name === dev.generatesTask)) return tprev;
					return [{
						id: crypto.randomUUID(),
						name: dev.generatesTask,
						room: "hallway",
						category: "general",
						estimatedMinutes: 5,
						assignedTo: users[0]?.id ?? "",
						recurrence: "once",
						source: "user",
						lastCompleted: (/* @__PURE__ */ new Date(Date.now() - 1e3 * 60 * 60 * 24 * 10)).toISOString(),
						tMin: 0,
						tSuggested: 0,
						tMax: 0,
						isGuestPriority: false,
						isExpressBlitz: false
					}, ...tprev];
				});
				return prev.map((d) => d.id === id ? {
					...d,
					triggered: nowTriggered
				} : d);
			});
		}, [users]),
		addUser: (0, import_react.useCallback)((name) => {
			const trimmed = name.trim();
			if (!trimmed) return;
			setUsers((prev) => [...prev, {
				id: crypto.randomUUID(),
				name: trimmed,
				avatar: trimmed.charAt(0).toUpperCase(),
				color: USER_COLORS[prev.length % USER_COLORS.length],
				active: true,
				heavyDay: false
			}]);
		}, []),
		addTask: (0, import_react.useCallback)((input) => {
			const trimmed = input.name.trim();
			if (!trimmed || input.estimatedMinutes < 1) return;
			setTasks((prev) => [...prev, {
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
				lastCompleted: (/* @__PURE__ */ new Date(Date.now() - 1e3 * 60 * 60 * 24 * 14)).toISOString(),
				tMin: 3,
				tSuggested: 5,
				tMax: 7,
				isGuestPriority: GUEST_PRIORITY_ROOMS.includes(input.room),
				isExpressBlitz: false
			}]);
		}, [])
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppContext.Provider, {
		value,
		children
	});
}
function useApp() {
	const ctx = (0, import_react.useContext)(AppContext);
	if (!ctx) throw new Error("useApp must be used within AppProvider");
	return ctx;
}
//#endregion
export { useApp as n, AppProvider as t };
