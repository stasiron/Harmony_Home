import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Home,
  RefreshCw,
  Smartphone,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useHousehold } from "@/context/HouseholdContext";
import type { HouseholdMember, HouseholdRole } from "@/types";

const NO_PROFILE = "__none__";

function fail(message: string) {
  return (err: unknown) => {
    console.error(message, err);
    toast.error(message);
  };
}

/** Ustawienia → Mieszkanie: nazwa, zaproszenia, konta i role */
export function HouseholdSettingsCard() {
  const { users } = useApp();
  const { linkMember } = useAuth();
  const {
    household,
    members,
    me,
    isAdmin,
    renameHousehold,
    regenerateInvite,
    linkProfile,
    setMemberRole,
    setMemberProfile,
    removeMember,
    leaveHousehold,
  } = useHousehold();
  const [name, setName] = useState(household?.name ?? "");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(household?.name ?? "");
  }, [household?.name]);

  if (!household || !me) return null;

  const adminCount = members.filter((m) => m.role === "admin").length;
  const legacyCalendar = Boolean(household.features?.legacyCalendar);

  const newInvite = async () => {
    setBusy(true);
    try {
      await regenerateInvite();
    } catch (err) {
      fail("Nie udało się utworzyć kodu.")(err);
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!household.inviteCode) return;
    try {
      await navigator.clipboard.writeText(household.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nie udało się skopiować kodu.");
    }
  };

  const changeProfile = (member: HouseholdMember, value: string) => {
    const profileId = value === NO_PROFILE ? null : value;
    const own = member.uid === me.uid;
    const save = own
      ? linkProfile(profileId)
      : setMemberProfile(member.uid, profileId);
    void save.catch(fail("Nie udało się przypisać domownika."));
    // Kalendarze pierwszego mieszkania są przypięte do id domownika
    if (own && legacyCalendar && profileId) void linkMember(profileId);
  };

  const profileName = (profileId: string | null) =>
    users.find((u) => u.id === profileId)?.name;

  return (
    <section className="space-y-5 rounded-3xl border border-border bg-gradient-to-br from-surface-elevated via-surface to-card p-5 shadow-elevated">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Home className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Mieszkanie</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Jesteś administratorem — zmieniasz nazwę, strefy, plan, domowników i zaproszenia."
              : "Nazwę, strefy, plan i domowników zmienia administrator."}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="household-rename">Nazwa</Label>
        {isAdmin ? (
          <div className="flex gap-2">
            <Input
              id="household-rename"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={!name.trim() || name.trim() === household.name}
              onClick={() =>
                void renameHousehold(name).catch(
                  fail("Nie udało się zmienić nazwy."),
                )
              }
            >
              Zapisz
            </Button>
          </div>
        ) : (
          <p className="font-medium">{household.name}</p>
        )}
      </div>

      {isAdmin && (
        <div className="space-y-2">
          <Label>Kod zaproszenia</Label>
          <p className="text-xs text-muted-foreground">
            Kto wpisze kod, dołącza jako domownik (także tablet bez konta). Nowy
            kod unieważnia poprzedni.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {household.inviteCode && (
              <code className="rounded-xl border border-border bg-muted/40 px-3 py-2 font-mono text-lg tracking-widest">
                {household.inviteCode}
              </code>
            )}
            {household.inviteCode && (
              <Button variant="outline" onClick={() => void copyInvite()}>
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Skopiowano" : "Kopiuj"}
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void newInvite()}
            >
              <RefreshCw className="size-4" />
              {household.inviteCode ? "Nowy kod" : "Utwórz kod"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Konta i urządzenia</Label>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {members.map((member) => {
            const own = member.uid === me.uid;
            const canChangeProfile = own || isAdmin;
            const lastAdmin = member.role === "admin" && adminCount <= 1;
            return (
              <li
                key={member.uid}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium">
                    {member.anonymous && (
                      <Smartphone className="size-3.5 shrink-0" />
                    )}
                    {member.anonymous
                      ? "Urządzenie bez konta"
                      : (member.displayName ?? member.email ?? "Konto")}
                    {own && <span className="text-xs text-primary">(Ty)</span>}
                  </p>
                  {member.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canChangeProfile ? (
                    <Select
                      value={member.profileId ?? NO_PROFILE}
                      onValueChange={(value) => changeProfile(member, value)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Domownik" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PROFILE}>— nikt —</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {profileName(member.profileId) ?? "—"}
                    </span>
                  )}
                  {isAdmin && !member.anonymous ? (
                    <Select
                      value={member.role}
                      disabled={lastAdmin}
                      onValueChange={(role) =>
                        void setMemberRole(
                          member.uid,
                          role as HouseholdRole,
                        ).catch(fail("Nie udało się zmienić roli."))
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="member">Domownik</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {member.role === "admin" ? "Administrator" : "Domownik"}
                    </span>
                  )}
                  {isAdmin && !own && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Usuń z mieszkania"
                      onClick={() =>
                        void removeMember(member.uid).catch(
                          fail("Nie udało się usunąć."),
                        )
                      }
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {!(isAdmin && adminCount <= 1) && (
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() =>
            void leaveHousehold().catch(fail("Nie udało się opuścić."))
          }
        >
          Opuść mieszkanie
        </Button>
      )}
    </section>
  );
}
