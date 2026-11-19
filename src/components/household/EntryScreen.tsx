import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Home,
  LogIn,
  MailCheck,
  Plus,
  QrCode,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { AuthUserBadge } from "@/components/AuthUserBadge";
import { LoginDialog } from "@/components/auth/LoginDialog";
import {
  CreateHouseholdCard,
  MigrateLegacyCard,
} from "@/components/household/HouseholdStart";
import { QrScanDialog } from "@/components/household/QrScanDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { EmailNotVerifiedError } from "@/lib/householdSetup";
import {
  fetchHouseholdCard,
  type HouseholdCardData,
} from "@/lib/householdCover";
import { cn } from "@/lib/utils";
import type { Membership } from "@/types";

/** Kafelek mieszkania i okienko z kodem mają ten sam rozmiar */
const CARD = "w-72 h-80 rounded-[28px]";

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div
        className={cn(
          "grid place-items-center rounded-2xl bg-primary/15 text-primary",
          small ? "size-10" : "size-14",
        )}
      >
        <Home className={small ? "size-5" : "size-7"} strokeWidth={1.75} />
      </div>
      <h1
        className={cn(
          "font-semibold tracking-tight",
          small ? "text-2xl" : "text-4xl md:text-5xl",
        )}
      >
        HomeHarmony
      </h1>
    </div>
  );
}

function SmallLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function errorText(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Wpisz kod albo zeskanuj QR — w okienku i w pop-upie „Dołącz” */
function JoinForm({
  initialCode,
  onJoined,
}: {
  initialCode?: string | null;
  onJoined?: () => void;
}) {
  const { joinHousehold } = useHousehold();
  const [code, setCode] = useState(initialCode ?? "");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const join = async (value = code) => {
    if (!value.trim()) return;
    setBusy(true);
    try {
      await joinHousehold(value);
      onJoined?.();
    } catch (err) {
      setBusy(false);
      if (err instanceof EmailNotVerifiedError) {
        setNeedsVerify(true);
        return;
      }
      console.error("Join failed:", err);
      toast.error(errorText(err, "Nie udało się dołączyć."));
    }
  };

  if (needsVerify) {
    return (
      <VerifyEmailPanel
        code={code}
        onVerified={() => {
          setNeedsVerify(false);
          void join();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void join()}
        placeholder="KOD MIESZKANIA"
        aria-label="Kod mieszkania"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="h-11 rounded-xl text-center font-mono text-base uppercase tracking-[0.3em] placeholder:tracking-[0.2em]"
      />
      <Button
        className="h-11 rounded-xl"
        disabled={busy || !code.trim()}
        onClick={() => void join()}
      >
        {busy ? "Dołączanie…" : "Dołącz"}
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        albo
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        variant="outline"
        className="h-11 rounded-xl"
        disabled={busy}
        onClick={() => setScanning(true)}
      >
        <QrCode className="size-4" />
        Zeskanuj kod QR
      </Button>
      <QrScanDialog
        open={scanning}
        onOpenChange={setScanning}
        onCode={(scanned) => {
          setScanning(false);
          setCode(scanned);
          void join(scanned);
        }}
      />
    </div>
  );
}

/**
 * Konto z e-mailem dołącza po potwierdzeniu adresu — link z maila, potem
 * „Już potwierdziłem”. Kod zostaje w linku, więc po kliknięciu w mailu
 * wraca się prosto do dołączania.
 */
function VerifyEmailPanel({
  code,
  onVerified,
}: {
  code: string;
  onVerified: () => void;
}) {
  const { user, sendVerification, refreshVerification } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setBusy(true);
    try {
      await sendVerification(`/?join=${encodeURIComponent(code)}`);
      setSent(true);
      toast.success("Wysłane — sprawdź skrzynkę (także spam)");
    } catch (err) {
      toast.error(errorText(err, "Nie udało się wysłać maila."));
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    setBusy(true);
    try {
      if (await refreshVerification()) onVerified();
      else toast.error("Adres jeszcze niepotwierdzony — kliknij link w mailu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 text-center">
      <MailCheck className="mx-auto size-8 text-primary" />
      <p className="text-sm font-semibold">Potwierdź swój e-mail</p>
      <p className="text-xs text-muted-foreground">
        Żeby dołączyć do mieszkania, kliknij link, który wysłaliśmy na{" "}
        <strong className="text-foreground">{user?.email}</strong>.
      </p>
      <Button
        className="h-11 rounded-xl"
        disabled={busy}
        onClick={() => void check()}
      >
        Już potwierdziłem — dołącz
      </Button>
      <Button
        variant="outline"
        className="h-11 rounded-xl"
        disabled={busy}
        onClick={() => void resend()}
      >
        {sent ? "Wyślij jeszcze raz" : "Wyślij link ponownie"}
      </Button>
    </div>
  );
}

function JoinCard({
  initialCode,
  onJoined,
  asDevice = false,
}: {
  initialCode?: string | null;
  onJoined?: () => void;
  /** Bez konta — dołączenie jako wspólne urządzenie (np. tablet) */
  asDevice?: boolean;
}) {
  return (
    <section
      className={cn(
        CARD,
        "flex flex-col justify-center gap-5 border border-border bg-surface p-6 shadow-elevated",
      )}
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold">Dołącz do mieszkania</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {asDevice
            ? "Bez konta dołączasz jako wspólne urządzenie: odhaczasz obowiązki i kuchnię, ale nie masz prywatnych list ani rachunków na siebie."
            : "Kod dostaniesz od administratora."}
        </p>
      </div>
      <JoinForm initialCode={initialCode} onJoined={onJoined} />
    </section>
  );
}

function CoverFallback({ name }: { name: string }) {
  return (
    <div className="relative grid size-full place-items-center overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-surface-elevated">
      <span className="absolute -bottom-6 -right-2 select-none text-[9rem] font-semibold leading-none text-primary/10">
        {name.trim().charAt(0).toUpperCase() || "H"}
      </span>
      <Home className="size-10 text-primary/70" strokeWidth={1.5} />
    </div>
  );
}

function HouseholdTile({
  membership,
  onEnter,
}: {
  membership: Membership;
  onEnter: () => void;
}) {
  const [card, setCard] = useState<HouseholdCardData | null>(null);

  useEffect(() => {
    let alive = true;
    fetchHouseholdCard(membership.householdId)
      .then((data) => alive && setCard(data))
      .catch((err) => console.error("Household card load failed:", err));
    return () => {
      alive = false;
    };
  }, [membership.householdId]);

  const name = card?.name ?? membership.name;
  const subtitle =
    card?.subtitle ??
    (membership.superAdmin
      ? "Administrator ogólny"
      : membership.role === "admin"
        ? "Administrator"
        : "Domownik");

  return (
    <button
      type="button"
      onClick={onEnter}
      className={cn(
        CARD,
        "group flex flex-col overflow-hidden border border-border bg-surface text-left shadow-elevated transition duration-300 hover:-translate-y-1 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
    >
      <div className="h-48 w-full shrink-0 overflow-hidden">
        {card?.coverSrc ? (
          <img
            src={card.coverSrc}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <CoverFallback name={name} />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between px-5 py-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold leading-tight">{name}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
          Kliknij, żeby wejść
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

function Screen({
  corner,
  children,
}: {
  corner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-4 py-16">
      {corner && (
        <div className="absolute right-4 top-4 md:right-8">{corner}</div>
      )}
      {children}
    </div>
  );
}

/**
 * Ekran wejścia (decyzja: minimum treści):
 * - bez konta i bez mieszkania → nazwa + „Zaloguj się”
 * - z kontem (albo „bez konta” / link z QR), bez mieszkania → okienko z kodem
 * - z mieszkaniami → kafelki; na dole mały „Dołącz do nowego mieszkania”
 */
export function EntryScreen({
  inviteCode,
  onInviteDone,
}: {
  /** Kod z linku QR (/?join=KOD) — wpisany od razu */
  inviteCode: string | null;
  onInviteDone: () => void;
}) {
  const { memberships, hasAccount, enterHousehold, canMigrateLegacy } =
    useHousehold();
  const [withoutAccount, setWithoutAccount] = useState(false);
  const [joinOpen, setJoinOpen] = useState(Boolean(inviteCode));
  const [createOpen, setCreateOpen] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);

  const corner = hasAccount ? <AuthUserBadge /> : undefined;
  const loginLink = (
    <LoginDialog
      joinCode={inviteCode}
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <LogIn className="size-3.5" />
          Zaloguj się lub załóż konto
        </button>
      }
    />
  );

  const extraLinks = (
    <>
      {hasAccount && (
        <SmallLink onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          Załóż własne mieszkanie
        </SmallLink>
      )}
      {canMigrateLegacy && (
        <SmallLink onClick={() => setMigrateOpen(true)}>
          Przenieś obecne mieszkanie
        </SmallLink>
      )}
      {!hasAccount && loginLink}
    </>
  );

  const dialogs = (
    <>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Nowe mieszkanie</DialogTitle>
          <CreateHouseholdCard onCreated={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={migrateOpen} onOpenChange={setMigrateOpen}>
        <DialogContent className="max-w-lg border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">Przenieś mieszkanie</DialogTitle>
          <MigrateLegacyCard />
        </DialogContent>
      </Dialog>
    </>
  );

  // Bez mieszkania
  if (memberships.length === 0) {
    if (!hasAccount && !withoutAccount && !inviteCode) {
      return (
        <Screen>
          <div className="flex flex-col items-center gap-10 duration-500 animate-in fade-in slide-in-from-bottom-2">
            <Wordmark />
            <LoginDialog
              onStayWithoutAccount={() => setWithoutAccount(true)}
              trigger={
                <Button size="lg" className="h-12 rounded-full px-10 text-base">
                  Zaloguj się
                </Button>
              }
            />
          </div>
        </Screen>
      );
    }

    // Link z zaproszeniem, a jeszcze bez konta: najpierw konto — inaczej
    // „Dołącz” zrobiłby z osoby wspólne urządzenie (ograniczone prawa)
    if (!hasAccount && !withoutAccount) {
      return (
        <Screen>
          <div className="flex flex-col items-center gap-8 duration-500 animate-in fade-in slide-in-from-bottom-2">
            <Wordmark small />
            <section
              className={cn(
                CARD,
                "flex flex-col justify-center gap-5 border border-border bg-surface p-6 text-center shadow-elevated",
              )}
            >
              <div>
                <h2 className="text-lg font-semibold">Masz zaproszenie</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Załóż konto albo zaloguj się — dołączysz jako domownik, a kod
                  zaproszenia wpiszemy za Ciebie.
                </p>
              </div>
              <LoginDialog
                joinCode={inviteCode}
                onStayWithoutAccount={() => setWithoutAccount(true)}
                trigger={
                  <Button size="lg" className="h-12 rounded-full">
                    Załóż konto lub zaloguj się
                  </Button>
                }
              />
            </section>
            <SmallLink onClick={() => setWithoutAccount(true)}>
              <Smartphone className="size-3.5" />
              To wspólny tablet — dołącz bez konta
            </SmallLink>
          </div>
        </Screen>
      );
    }

    return (
      <Screen corner={corner}>
        <div className="flex flex-col items-center gap-8 duration-500 animate-in fade-in slide-in-from-bottom-2">
          <Wordmark small />
          <JoinCard
            initialCode={inviteCode}
            onJoined={onInviteDone}
            asDevice={!hasAccount}
          />
          <div className="flex flex-wrap justify-center gap-1">
            {extraLinks}
          </div>
        </div>
        {dialogs}
      </Screen>
    );
  }

  // Wybór mieszkania
  return (
    <Screen corner={corner}>
      <div className="flex w-full flex-col items-center gap-10 duration-500 animate-in fade-in slide-in-from-bottom-2">
        <Wordmark small />
        <div className="flex max-w-5xl flex-wrap justify-center gap-6">
          {memberships.map((membership) => (
            <HouseholdTile
              key={membership.householdId}
              membership={membership}
              onEnter={() => enterHousehold(membership.householdId)}
            />
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          <SmallLink onClick={() => setJoinOpen(true)}>
            <Plus className="size-3.5" />
            Dołącz do nowego mieszkania
          </SmallLink>
          {extraLinks}
        </div>
      </div>

      <Dialog
        open={joinOpen}
        onOpenChange={(open) => {
          setJoinOpen(open);
          if (!open) onInviteDone();
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dołącz do nowego mieszkania</DialogTitle>
            <DialogDescription>
              Wpisz kod od administratora albo zeskanuj kod QR.
            </DialogDescription>
          </DialogHeader>
          <JoinForm
            initialCode={inviteCode}
            onJoined={() => {
              setJoinOpen(false);
              onInviteDone();
            }}
          />
        </DialogContent>
      </Dialog>
      {dialogs}
    </Screen>
  );
}
