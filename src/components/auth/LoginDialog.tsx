import { useState, type ReactNode } from "react";
import { ArrowLeft, Mail, MailCheck, Smartphone } from "lucide-react";
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

type Step = "choose" | "google-notice" | "email" | "email-sent";

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
}: {
  trigger: ReactNode;
  /** „Zostań bez konta” — np. ekran wejścia pokazuje wtedy okienko z kodem */
  onStayWithoutAccount?: () => void;
}) {
  const { signInWithGoogle, sendEmailLink } = useAuth();
  const { googleLoginNotice } = useGlobalConfig();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep("choose");
      setError(null);
      setBusy(false);
    }
  };

  const google = () => {
    changeOpen(false);
    void signInWithGoogle();
  };

  const sendLink = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendEmailLink(email);
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
                    <Mail className="size-4" />
                  </span>
                }
                title="Link na e-mail"
                description="Bez hasła i bez ekranów Google. Klikasz link z maila i gotowe."
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
                urządzeniu. Nie widzisz maila? Zajrzyj do spamu.
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
