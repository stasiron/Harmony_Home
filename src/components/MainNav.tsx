import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarCheck,
  ChefHat,
  Home,
  ListTodo,
  Lock,
  Megaphone,
  Receipt,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RestrictedMark } from "@/components/FeatureGate";
import { fillGrid, pageFeatureKey, type FeatureView } from "@/config/features";
import { useFeatures } from "@/hooks/useFeature";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  wide?: boolean;
};

export const navItems: NavItem[] = [
  { to: "/", label: "Start", icon: Home },
  { to: "/calendar", label: "Kalendarz", icon: Calendar },
  { to: "/chores", label: "Obowiązki", icon: CalendarCheck },
  { to: "/todo", label: "TODO", icon: ListTodo },
  { to: "/guides", label: "Poradnik", icon: BookOpen },
  { to: "/kitchen", label: "Kuchnia", icon: ChefHat },
  { to: "/bills", label: "Rachunki", icon: Receipt },
  { to: "/board", label: "Ogłoszenia", icon: Megaphone },
  { to: "/stats", label: "Statystyki", icon: BarChart3 },
  { to: "/settings", label: "Ustawienia", icon: Settings },
  { to: "/members", label: "Domownicy", icon: Users, wide: true },
];

// 10 kafelków + szerokie „Domownicy” = 12 pól: telefon 4 × 3, tablet 3 × 4.
// Po ukryciu kafelków `fillGrid` rozciąga sąsiadów, żeby nie było dziur.
const navGridClass = "grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4";
const PHONE_SPAN = ["", "col-span-1", "col-span-2", "col-span-3"];
const TABLET_SPAN = [
  "",
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-3",
  "md:col-span-4",
];

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function MainNav({
  compact = false,
  badges = {},
}: {
  compact?: boolean;
  /** Licznik na kafelku, np. { "/bills": 2 } — prośby o zwrot */
  badges?: Record<string, number>;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const feature = useFeatures();
  const items = navItems.flatMap((item) => {
    const key = pageFeatureKey(item.to);
    const view: FeatureView = key
      ? feature(key)
      : { state: "on", forOthers: "on" };
    return view.state === "hidden" ? [] : [{ ...item, view }];
  });
  const spans = items.map((i) => (i.wide ? 2 : 1));
  const phone = fillGrid(spans, 3);
  const tablet = fillGrid(spans, 4);

  return (
    <nav className={cn("grid", navGridClass)}>
      {items.map(({ to, label, icon: Icon, view }, i) => (
        <NavButton
          key={to}
          to={to}
          label={label}
          icon={Icon}
          active={isActive(pathname, to)}
          compact={compact}
          spanClass={cn(PHONE_SPAN[phone[i]!], TABLET_SPAN[tablet[i]!])}
          view={view}
          badge={badges[to] ?? 0}
        />
      ))}
    </nav>
  );
}

function NavButton({
  to,
  label,
  icon: Icon,
  active,
  compact,
  spanClass,
  view,
  badge,
}: {
  badge: number;
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  compact: boolean;
  spanClass: string;
  view: FeatureView;
}) {
  const locked = view.state === "locked";
  const Tile = locked ? "div" : Link;
  return (
    <Tile
      to={to}
      aria-disabled={locked || undefined}
      title={locked ? `${label} — wkrótce` : undefined}
      className={cn(
        "group relative flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated transition-transform hover:-translate-y-0.5 sm:gap-3 sm:rounded-3xl",
        compact
          ? "min-h-[88px] p-4"
          : "min-h-[104px] p-3 sm:min-h-[140px] sm:p-6 md:min-h-[160px]",
        spanClass,
        locked && "cursor-not-allowed opacity-45 grayscale hover:translate-y-0",
        active
          ? "border-primary/40 text-primary ring-2 ring-primary/20"
          : "border-border text-foreground hover:border-primary/20",
      )}
    >
      {locked ? (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:right-3 sm:top-3">
          <Lock className="size-3" />
          wkrótce
        </span>
      ) : (
        <RestrictedMark
          view={view}
          className="absolute left-2 top-2 sm:left-3 sm:top-3"
        />
      )}
      {!locked && badge > 0 && (
        <span
          className="absolute right-2 top-2 grid min-w-5 place-items-center rounded-full bg-warn px-1.5 text-[11px] font-bold leading-5 text-background sm:right-3 sm:top-3"
          aria-label={`${badge} do sprawdzenia`}
        >
          {badge}
        </span>
      )}
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-background/40",
          compact ? "size-10" : "size-11 sm:size-14",
        )}
      >
        <Icon
          className={cn(compact ? "size-5" : "size-6 sm:size-7")}
          strokeWidth={1.6}
        />
      </div>
      <span
        className={cn(
          "max-w-full truncate font-semibold tracking-tight",
          compact ? "text-sm" : "text-sm sm:text-lg md:text-xl",
        )}
      >
        {label}
      </span>
    </Tile>
  );
}
