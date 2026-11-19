import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EMOJI_GROUPS, searchEmoji, TAG_COLORS } from "@/config/foodEmoji";
import { cn } from "@/lib/utils";

/**
 * Wybór emotki (biblioteka z wyszukiwaniem) i — opcjonalnie — koloru.
 * Przycisk pokazuje obecny wybór; puste = podpowiedź z nazwy produktu.
 */
export function EmojiColorPicker({
  emoji,
  color,
  onEmoji,
  onColor,
  fallback = "🍽️",
  className,
}: {
  emoji: string | null | undefined;
  color?: string | null;
  onEmoji: (emoji: string | null) => void;
  /** Bez tego — tylko emotka */
  onColor?: (color: string | null) => void;
  fallback?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchEmoji(query), [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-background/40 text-xl transition-colors hover:border-primary/40",
            className,
          )}
          style={color ? { borderColor: `var(--${color})` } : undefined}
          aria-label="Wybierz emotkę i kolor"
        >
          <span className={cn(!emoji && "opacity-50 grayscale")}>
            {emoji || fallback}
          </span>
          {color && (
            <span
              className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-surface"
              style={{ background: `var(--${color})` }}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj: ser, papier, kawa…"
            className="h-9 pl-8"
            autoFocus
          />
        </div>
        <div className="hh-scroll max-h-56 space-y-2 overflow-y-auto pr-1">
          {(query.trim()
            ? [{ id: "search", label: "Wyniki", items: results }]
            : EMOJI_GROUPS
          ).map((group) => (
            <div key={group.id}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    title={item.words.slice(0, 3).join(", ")}
                    onClick={() => {
                      onEmoji(item.emoji);
                      if (!onColor) setOpen(false);
                    }}
                    className={cn(
                      "grid size-8 place-items-center rounded-lg text-lg hover:bg-muted",
                      emoji === item.emoji &&
                        "bg-primary/20 ring-1 ring-primary",
                    )}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {query.trim() && results.length === 0 && (
            <p className="text-xs text-muted-foreground">Nic nie pasuje.</p>
          )}
        </div>
        {onColor && (
          <div className="space-y-1.5 border-t border-border pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kolor
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColor(color === c ? null : c)}
                  className={cn(
                    "size-7 rounded-full transition-transform hover:scale-110",
                    color === c &&
                      "ring-2 ring-foreground ring-offset-2 ring-offset-surface",
                  )}
                  style={{ background: `var(--${c})` }}
                  aria-label={`Kolor ${c}`}
                />
              ))}
              {color && (
                <button
                  type="button"
                  onClick={() => onColor(null)}
                  className="grid size-7 place-items-center rounded-full border border-border text-muted-foreground"
                  aria-label="Bez koloru"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
        {emoji && (
          <button
            type="button"
            onClick={() => onEmoji(null)}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Bez emotki (podpowiedź z nazwy)
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
