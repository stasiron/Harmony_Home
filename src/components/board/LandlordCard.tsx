import { Link } from "@tanstack/react-router";
import { Copy, Mail, Pencil, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useHousehold } from "@/context/HouseholdContext";
import type { LandlordContact } from "@/types";

const EMPTY: LandlordContact = { name: "", phone: "", email: "", notes: "" };

/**
 * Kontakt do właściciela / administracji. Na stronie Ogłoszeń administrator
 * go edytuje; w folderze Usterki — szybki telefon, mail i kopia listy usterek.
 */
export function LandlordCard({
  editable = false,
  issues,
}: {
  /** Pokaż edycję (administrator) — na stronie Ogłoszeń */
  editable?: boolean;
  /** Otwarte usterki do skopiowania jako jedna wiadomość */
  issues?: string[];
}) {
  const { household, isAdmin, setLandlord } = useHousehold();
  const contact = household?.landlord ?? null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LandlordContact>(contact ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const canEdit = editable && isAdmin;

  const save = async () => {
    setBusy(true);
    try {
      const trimmed = {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        notes: draft.notes.trim(),
      };
      const empty = Object.values(trimmed).every((v) => !v);
      await setLandlord(empty ? null : trimmed);
      setEditing(false);
      toast.success("Kontakt zapisany");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się zapisać kontaktu");
    } finally {
      setBusy(false);
    }
  };

  const copyIssues = async () => {
    if (!issues?.length) return;
    const text = [
      `Dzień dobry${contact?.name ? `, ${contact.name}` : ""},`,
      "",
      `zgłaszamy usterki w mieszkaniu${household?.name ? ` (${household.name})` : ""}:`,
      ...issues.map((issue) => `• ${issue}`),
      "",
      "Pozdrawiamy",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Skopiowane — wklej w SMS-ie albo mailu");
    } catch {
      toast.error("Nie udało się skopiować");
    }
  };

  if (editing) {
    return (
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">Kontakt do właściciela</h3>
        <Input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Imię i nazwisko / administracja"
          autoComplete="off"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            placeholder="Telefon"
            inputMode="tel"
            autoComplete="off"
          />
          <Input
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="E-mail"
            inputMode="email"
            autoComplete="off"
          />
        </div>
        <Textarea
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Np. dzwonić 9–17, numer konta do czynszu, kod do skrzynki…"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Anuluj
          </Button>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? "Zapisywanie…" : "Zapisz"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            {contact?.name || "Właściciel / administracja"}
          </h3>
          {contact?.notes ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {contact.notes}
            </p>
          ) : !contact ? (
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Dodaj kontakt, żeby każdy mógł szybko zgłosić usterkę."
                : "Administrator mieszkania jeszcze nie dodał kontaktu."}
            </p>
          ) : null}
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => {
              setDraft(contact ?? EMPTY);
              setEditing(true);
            }}
            aria-label="Edytuj kontakt do właściciela"
          >
            <Pencil className="size-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {contact?.phone && (
          <Button asChild size="sm" variant="outline">
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
              <Phone className="size-4" />
              {contact.phone}
            </a>
          </Button>
        )}
        {contact?.email && (
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${contact.email}`}>
              <Mail className="size-4" />
              {contact.email}
            </a>
          </Button>
        )}
        {issues && issues.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => void copyIssues()}>
            <Copy className="size-4" />
            Skopiuj usterki ({issues.length})
          </Button>
        )}
        {!editable && isAdmin && !contact && (
          <Button asChild size="sm" variant="outline">
            <Link to="/board">Dodaj kontakt</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
