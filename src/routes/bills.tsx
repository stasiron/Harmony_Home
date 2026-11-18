import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarRange,
  Receipt,
  Scale,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BalancePanel } from "@/components/bills/BalancePanel";
import { MonthPanel } from "@/components/bills/MonthPanel";
import { PurchasesPanel } from "@/components/bills/PurchasesPanel";
import { Shell } from "@/components/Shell";
import { useBills } from "@/hooks/useBills";
import { usePeople } from "@/hooks/usePeople";
import { monthKey } from "@/lib/bills";
import { formatPLN, netFor, openShare } from "@/lib/money";
import { cn } from "@/lib/utils";

type Tab = "month" | "purchases" | "balance";
const TABS: Tab[] = ["month", "purchases", "balance"];

export const Route = createFileRoute("/bills")({
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } =>
    TABS.includes(search.tab as Tab) ? { tab: search.tab as Tab } : {},
  head: () => ({
    meta: [
      { title: "Rachunki · Homebase" },
      {
        name: "description",
        content: "Rachunki mieszkania, wspólne zakupy i kto komu ile.",
      },
    ],
  }),
  component: () => (
    <Shell>
      <BillsPage />
    </Shell>
  ),
});

function BillsPage() {
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<Tab>(initialTab ?? "month");
  const data = useBills();
  const { actorId } = usePeople();
  const { bills, purchases } = data;

  const stats = useMemo(() => {
    const month = monthKey();
    const thisMonth = bills
      .filter((b) => b.month === month)
      .reduce((s, b) => s + b.amount, 0);
    const refunds = actorId
      ? purchases.filter(
          (p) => p.refundRequestedAt && openShare(p, actorId) > 0,
        ).length
      : 0;
    const net = actorId ? netFor([...bills, ...purchases], actorId) : 0;
    return { thisMonth, refunds, net };
  }, [bills, purchases, actorId]);

  const tiles: {
    id: Tab;
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    tone?: "warn";
  }[] = [
    {
      id: "month",
      label: "Miesiąc",
      value: formatPLN(stats.thisMonth),
      hint: "rachunki w tym miesiącu",
      icon: CalendarRange,
    },
    {
      id: "purchases",
      label: "Zakupy",
      value: String(purchases.length),
      hint:
        stats.refunds > 0
          ? `${stats.refunds} prośb${stats.refunds === 1 ? "a" : "y"} o zwrot`
          : "wspólnych wydatków",
      icon: ShoppingBag,
      tone: stats.refunds > 0 ? "warn" : undefined,
    },
    {
      id: "balance",
      label: "Saldo",
      // Bez połączonego profilu nie wiemy, kto jest „Ty”
      value: actorId
        ? `${stats.net > 0 ? "+" : ""}${formatPLN(stats.net)}`
        : "kto komu",
      hint: !actorId
        ? "wszyscy domownicy"
        : stats.net < 0
          ? "do oddania"
          : stats.net > 0
            ? "należy Ci się"
            : "na czysto",
      icon: Scale,
      tone: stats.net < 0 ? "warn" : undefined,
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl">
          <Receipt className="size-8 text-primary" strokeWidth={1.6} />
          Rachunki
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Czynsz, media i wspólne zakupy — kto ile płaci i kto komu oddaje.
        </p>
      </header>

      <div role="tablist" className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map(({ id, label, value, hint, icon: Icon, tone }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-3 text-left transition-all sm:flex-row sm:items-center sm:gap-4 sm:rounded-3xl sm:p-5",
              tab === id
                ? "border-primary/50 bg-primary/10 ring-2 ring-primary/15"
                : "border-border bg-surface hover:border-primary/30",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl sm:size-12 sm:rounded-2xl",
                tone === "warn"
                  ? "bg-warn/20 text-warn"
                  : tab === id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background/50 text-primary",
              )}
            >
              <Icon className="size-4 sm:size-6" strokeWidth={1.7} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold sm:text-lg">
                {label}
              </span>
              <span className="block truncate text-sm font-light tabular-nums sm:text-xl">
                {value}
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {hint}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "month" && <MonthPanel data={data} />}
        {tab === "purchases" && <PurchasesPanel data={data} />}
        {tab === "balance" && <BalancePanel data={data} />}
      </div>
    </div>
  );
}
