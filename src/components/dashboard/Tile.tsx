import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface Props {
  to: "/chores" | "/kitchen" | "/smart" | "/stats";
  title: string;
  subtitle: string;
  icon: LucideIcon;
  meta?: string;
  tone?: "default" | "alert" | "accent";
}

export function Tile({
  to,
  title,
  subtitle,
  icon: Icon,
  meta,
  tone = "default",
}: Props) {
  const toneClass =
    tone === "alert"
      ? "from-alert/20 via-surface to-card border-alert/30"
      : tone === "accent"
        ? "from-accent/20 via-surface to-card border-accent/30"
        : "from-surface-elevated via-surface to-card border-border";

  return (
    <Link
      to={to}
      className={`group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-6 shadow-elevated transition-transform hover:-translate-y-0.5 ${toneClass}`}
    >
      <div className="flex items-start justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-background/40">
          <Icon className="size-6 text-primary" strokeWidth={1.6} />
        </div>
        <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:rotate-45" />
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        {meta && (
          <div className="mt-3 text-xs font-medium uppercase tracking-wider text-primary">
            {meta}
          </div>
        )}
      </div>
    </Link>
  );
}
