import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  Cpu,
  Home,
  Settings,
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
  { to: "/", label: "Home", icon: Home },
  { to: "/calendar", label: "Kalendarz", icon: Calendar },
  { to: "/chores", label: "Chores", icon: CalendarCheck },
  { to: "/kitchen", label: "Kitchen", icon: ShoppingBasket },
  { to: "/smart", label: "Smart", icon: Cpu },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Ustawienia", icon: Settings },
  { to: "/members", label: "Members", icon: Users, wide: true },
];

const navGridClass = "grid-cols-2 sm:grid-cols-2 md:grid-cols-4";

function isActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function MainNav({ compact = false }: { compact?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className={cn("grid gap-3", navGridClass)}>
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
        "group flex flex-col items-center justify-center gap-3 rounded-3xl border bg-gradient-to-br from-surface-elevated via-surface to-card shadow-elevated transition-transform hover:-translate-y-0.5",
        compact ? "min-h-[88px] p-4" : "min-h-[140px] p-6 sm:min-h-[160px]",
        wide && "col-span-2",
        active
          ? "border-primary/40 text-primary ring-2 ring-primary/20"
          : "border-border text-foreground hover:border-primary/20",
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-background/40",
          compact ? "size-10" : "size-14",
        )}
      >
        <Icon className={cn(compact ? "size-5" : "size-7")} strokeWidth={1.6} />
      </div>
      <span
        className={cn(
          "font-semibold tracking-tight",
          compact ? "text-sm" : "text-lg md:text-xl",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
