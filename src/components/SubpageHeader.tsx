import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Zegar podstron — na tablecie i komputerze; na telefonie zajmowałby ekran */
export function SubpageClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = now.toLocaleDateString("pl-PL", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={cn("min-w-0", className)}>
      <div className="tabular-clock text-5xl font-extralight leading-none lg:text-6xl">
        {time}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{date}</div>
    </div>
  );
}

/** Powrót na pulpit: duży na tablecie (ekran ścienny), ikonka na telefonie */
export function StartButton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="size-10 shrink-0 rounded-xl"
        asChild
      >
        <Link to="/" aria-label="Start">
          <Home className="size-5" />
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      className="h-12 shrink-0 gap-2.5 rounded-2xl px-6 text-base font-semibold [&_svg]:size-5"
      asChild
    >
      <Link to="/">
        <Home />
        Start
      </Link>
    </Button>
  );
}
