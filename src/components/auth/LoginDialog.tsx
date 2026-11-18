import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, KeyRound, Mail, MailCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useGlobalConfig } from "@/context/GlobalConfigContext";

type Step =
  | "choose"
  | "google-notice"
  | "password"
  | "reset-sent"
  | "email"
  | "email-sent";

type PasswordMode = "login" | "signup";

/** Safari / pęk kluczy iCloud generuje hasło spełniające te zasady */
const PASSWORD_RULES = "minlength: 8; required: lower; required: digit;";
const MIN_PASSWORD = 8;

function GoogleMark() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-base font-bold text-[#4285F4] shadow-sm">
      G
    </span>
  );
}

function Option({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
    >
      {icon}
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

/**
 * „Zaloguj” → wybór sposobu: Google, link na e-mail albo dalej bez konta.
 * Przed Google — jeśli administrator ogólny włączył — miła informacja o tym,
 * co pokaże Google i jak zalogować się bez tego.
 */
export function LoginDialog({
  trigger,
  onStayWithoutAccount,
  joinCode,
}: {
  trigger: ReactNode;
  /** „Zostań bez konta” — np. ekran wejścia pokazuje wtedy okienko z kodem */
  onStayWithoutAccount?: () => void;
  /** Kod zaproszenia z linku — wraca w linku z maila */
  joinCode?: string | null;
}) {
  const {
    signInWithGoogle,
    sendEmailLink,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
  } = useAuth();
  const { googleLoginNotice } = useGlobalConfig();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<PasswordMode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep("choose");
      setError(null);
      setBusy(false);
      setPassword("");
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        await signUpWithPassword(email, password, displayName);
      } else {
        await signInWithPassword(email, password);
      }
      changeOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się.");
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!email.includes("@")) {
      setError("Wpisz najpierw swój e-mail.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setStep("reset-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: PasswordMode) => {
    setMode(next);
    setError(null);
  };

  const passwordReady =
    email.includes("@") &&
    (mode === "login" ? password.length > 0 : password.length >= MIN_PASSWORD);

  const google = () => {
    changeOpen(false);
    void signInWithGoogle();
  };

  const sendLink = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendEmailLink(email, joinCode);
      setStep("email-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wysłać.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Jak chcesz się zalogować?</DialogTitle>
              <DialogDescription>
                Konto przyda się do prywatnych notatek i blokowania swoich
                rzeczy. Wszystko inne działa też bez niego.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Option
                icon={<GoogleMark />}
                title="Konto Google"
                description="Najszybciej — i tylko tak połączysz swój kalendarz Google."
                onClick={() =>
                  googleLoginNotice ? setStep("google-notice") : google()
                }
              />
              <Option
                icon={
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <KeyRound className="size-4" />
                  </span>
                }
                title="E-mail i hasło"
                description="Własne konto w HomeHarmony. Hasło zapamięta iPhone lub przeglądarka."
                onClick={() => setStep("password")}
              />
              <Option
                icon={
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Mail className="size-4" />
                  </span>
                }
                title="Link na e-mail"
                description="Bez hasła. Klikasz link z maila i zostajesz zalogowany na stałe."
                onClick={() => setStep("email")}
              />
              <Option
                icon={
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Smartphone className="size-4" />
                  </span>
                }
                title="Zostań bez konta"
                description="Np. wspólny tablet — do mieszkania dołączysz kodem zaproszenia."
                onClick={() => {
                  changeOpen(false);
                  onStayWithoutAccount?.();
                }}
              />
            </div>
          </>
        )}

        {step === "google-notice" && (
          <>
            <DialogHeader>
              <DialogTitle>Zanim przejdziesz do Google 🙂</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    HomeHarmony to domowa aplikacja, robiona dla nas — nie
                    przechodziła płatnej weryfikacji Google. Dlatego Google może
                    pokazać ekran „Ta aplikacja nie została zweryfikowana”
                    (najczęściej przy łączeniu kalendarza).
                  </p>
                  <p>
                    Nic złego się nie dzieje: wystarczy kliknąć{" "}
                    <strong className="text-foreground">Zaawansowane</strong> →{" "}
                    <strong className="text-foreground">Przejdź do…</strong>.
                    Aplikacja widzi tylko Twój e-mail i imię, a kalendarz —
                    jeśli go połączysz — tylko do odczytu i tylko dla Ciebie.
                  </p>
                  <p>
                    Wolisz bez tych ekranów? Zaloguj się{" "}
                    <strong className="text-foreground">
                      linkiem na e-mail
                    </strong>{" "}
                    — wszystko działa tak samo, tylko bez kalendarza Google.
                    Zawsze możesz to zmienić później.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button onClick={google}>Rozumiem, dalej do Google</Button>
              <Button variant="outline" onClick={() => setStep("email")}>
                <Mail className="size-4" />
                Wolę link na e-mail
              </Button>
            </div>
          </>
        )}

        {step === "password" && (
          <>
            <DialogHeader>
              <DialogTitle>
                {mode === "login" ? "Zaloguj się" : "Załóż konto"}
              </DialogTitle>
              <DialogDescription>
                {mode === "login"
                  ? "Mieszkania są przypisane do konta — na każdym urządzeniu wystarczy się zalogować."
                  : "Konto w HomeHarmony, bez Google. Mieszkania, do których dołączysz, zostaną przy nim na stałe."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm">
              {(["login", "signup"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  className={
                    mode === value
                      ? "rounded-lg bg-background px-3 py-1.5 font-medium shadow-sm"
                      : "rounded-lg px-3 py-1.5 text-muted-foreground"
                  }
                >
                  {value === "login" ? "Mam konto" : "Nowe konto"}
                </button>
              ))}
            </div>
            {/* Prawdziwy formularz z name/autocomplete — po nim pęk kluczy
                iCloud i menedżery haseł rozpoznają logowanie i proponują zapis */}
            <form
              className="space-y-3"
              method="post"
              action="#"
              onSubmit={(e) => void submitPassword(e)}
            >
              {mode === "signup" && (
                <Input
                  id="login-name"
                  name="nickname"
                  autoComplete="nickname"
                  placeholder="Imię (widzą je domownicy)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              )}
              <Input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="twoj@adres.pl"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                key={mode}
                id={mode === "login" ? "current-password" : "new-password"}
                name="password"
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                {...(mode === "signup"
                  ? { passwordrules: PASSWORD_RULES, minLength: MIN_PASSWORD }
                  : {})}
                placeholder={
                  mode === "login" ? "Hasło" : "Hasło (min. 8 znaków)"
                }
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("choose")}
                >
                  <ArrowLeft className="size-4" />
                  Wróć
                </Button>
                <Button type="submit" disabled={busy || !passwordReady}>
                  {busy
                    ? "Chwila…"
                    : mode === "login"
                      ? "Zaloguj"
                      : "Załóż konto"}
                </Button>
              </div>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => void resetPassword()}
                  disabled={busy}
                  className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  Nie pamiętam hasła
                </button>
              )}
            </form>
          </>
        )}

        {step === "reset-sent" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MailCheck className="size-5 text-primary" />
                Sprawdź skrzynkę
              </DialogTitle>
              <DialogDescription>
                Link do ustawienia nowego hasła poleciał na{" "}
                <strong>{email}</strong>. Potem wróć tu i zaloguj się.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={() => setStep("password")}>
              Wróć do logowania
            </Button>
          </>
        )}

        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle>Logowanie linkiem</DialogTitle>
              <DialogDescription>
                Wyślemy Ci maila z linkiem. Otwórz go na tym urządzeniu —
                zalogujesz się bez hasła.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                type="email"
                autoComplete="email"
                placeholder="twoj@adres.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && email.includes("@") && void sendLink()
                }
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep("choose")}>
                  <ArrowLeft className="size-4" />
                  Wróć
                </Button>
                <Button
                  onClick={() => void sendLink()}
                  disabled={busy || !email.includes("@")}
                >
                  {busy ? "Wysyłanie…" : "Wyślij link"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "email-sent" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MailCheck className="size-5 text-primary" />
                Sprawdź skrzynkę
              </DialogTitle>
              <DialogDescription>
                Link poleciał na <strong>{email}</strong>. Kliknij go na tym
                urządzeniu. Nie widzisz maila? Zajrzyj do spamu. Używasz
                HomeHarmony z ikony na ekranie głównym iPhone’a? Link otworzy
                się w Safari i tam będziesz zalogowany — w ikonie wybierz raczej
                „E-mail i hasło”.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={() => changeOpen(false)}>
              Zamknij
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
