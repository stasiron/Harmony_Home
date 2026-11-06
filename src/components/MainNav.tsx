import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  Home,
  ListTodo,
  Settings,
  Shirt,
  ShoppingBasket,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  { to: "/laundry", label: "Prania", icon: Shirt },
  { to: "/kitchen", label: "Kuchnia", icon: ShoppingBasket },
  { to: "/stats", label: "Statystyki", icon: BarChart3 },
  { to: "/settings", label: "Ustawienia", icon: Settings },
  { to: "/members", label: "Domownicy", icon: Users, wide: true },
];

// Telefon: 3 × 3 mniejsze kafelki — całe menu mieści się na ekranie
const navGridClass = "grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4";

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function MainNav({ compact = false }: { compact?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className={cn("grid", navGridClass)}>
      {navItems.map(({ to, label, icon: Icon, wide }) => (
        <NavButton
          key={to}
          to={to}
          label={label}
          icon={Icon}
          active={isActive(pathname, to)}
          compact={compact}
          wide={wide}
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
  wide,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  compact: boolean;
  wide?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated transition-transform hover:-translate-y-0.5 sm:gap-3 sm:rounded-3xl",
        compact
          ? "min-h-[88px] p-4"
          : "min-h-[104px] p-3 sm:min-h-[140px] sm:p-6 md:min-h-[160px]",
        wide && "md:col-span-2",
        active
          ? "border-primary/40 text-primary ring-2 ring-primary/20"
          : "border-border text-foreground hover:border-primary/20",
      )}
    >
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
    </Link>
  );
}
