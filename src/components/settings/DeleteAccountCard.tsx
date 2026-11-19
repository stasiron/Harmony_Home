import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { deleteAccount } from "@/lib/accountDeletion";

/** Ustawienia → Konto: usunięcie konta i danych osoby (RODO) */
export function DeleteAccountCard() {
  const { syncUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!syncUser || syncUser.isAnonymous) return null;

  const run = async () => {
    setBusy(true);
    try {
      await deleteAccount(syncUser);
      toast.success("Konto i Twoje dane zostały usunięte");
      setOpen(false);
    } catch (err) {
      console.error("Account deletion failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Nie udało się usunąć konta.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-destructive/30 bg-surface p-5">
      <h2 className="text-lg font-semibold">Usuń konto</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Usuwa Twoje konto, prywatne listy i przepisy, powiadomienia i połączony
        kalendarz. Mieszkania, które założyłeś(-aś) i w których jesteś sam(a),
        znikają w całości. Wspólne wpisy (obowiązki, rachunki, zakupy) zostają
        dla pozostałych domowników.
      </p>
      <Button
        variant="outline"
        className="mt-4 text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        Usuń konto
      </Button>

      <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć konto na zawsze?</AlertDialogTitle>
            <AlertDialogDescription>
              Tego nie da się cofnąć. Jeśli założyłeś(-aś) mieszkanie, w którym
              mieszkają inni, najpierw przekaż je w Ustawieniach → Mieszkanie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void run();
              }}
            >
              {busy ? "Usuwam…" : "Usuń konto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
