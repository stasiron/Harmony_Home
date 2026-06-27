import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function SubpageHeader() {
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
    <header className="flex items-end justify-between gap-4">
      <div>
        <div className="tabular-clock text-5xl font-extralight leading-none md:text-6xl">
          {time}
        </div>
        <div className="mt-1 text-sm text-muted-foreground md:text-base">
          {date}
        </div>
      </div>
      <Button
        variant="outline"
        className="h-14 shrink-0 gap-3 rounded-2xl px-8 text-lg font-semibold [&_svg]:size-6"
        asChild
      >
        <Link to="/">
          <Home />
          Home
        </Link>
      </Button>
    </header>
  );
}
