import { useState } from "react";
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

/** Link z maila otwarty na innym urządzeniu — dla bezpieczeństwa pytamy o adres */
export function EmailLinkCompletion() {
  const { emailLinkPending, completeEmailLink } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await completeEmailLink(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={emailLinkPending}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Jeszcze tylko adres</DialogTitle>
          <DialogDescription>
            Link otworzył się na innym urządzeniu niż to, z którego go wysłano.
            Wpisz ten sam e-mail, żeby dokończyć logowanie.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="twoj@adres.pl"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          onClick={() => void finish()}
          disabled={busy || !email.includes("@")}
        >
          {busy ? "Logowanie…" : "Zaloguj"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
