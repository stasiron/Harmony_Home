import { ROLE_INFO, ROLE_ORDER } from "@/config/roles";
import { useEffect, useState } from "react";
import { HouseholdCoverField } from "@/components/household/HouseholdCoverField";
import { InviteQr } from "@/components/household/InviteQr";
import { SharedCalendarField } from "@/components/household/SharedCalendarField";
import { WeatherLocationPicker } from "@/components/weather/WeatherLocationPicker";
import { householdWeatherLocation } from "@/lib/weather";
import {
  Check,
  Copy,
  Ban,
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
  const {
    household,
    members,
    me,
    isAdmin,
    isSuperAdmin,
    renameHousehold,
    setWeatherLocation,
    regenerateInvite,
    deactivateInvite,
    linkProfile,
    setMemberRole,
    setMemberProfile,
    removeMember,
    leaveHousehold,
    inviteCode,
    isOwner: amOwner,
    transferOwnership,
    deleteHousehold,
  } = useHousehold();
  const [name, setName] = useState(household?.name ?? "");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(household?.name ?? "");
  }, [household?.name]);

  if (!household || !me) return null;

  // Role nadaje tylko twórca mieszkania albo administrator ogólny;
  // twórcy nikt poza administratorem ogólnym nie odbierze uprawnień
  const isOwner = (member: HouseholdMember) => member.uid === household.ownerId;
  const canManageRoles = isSuperAdmin || me.uid === household.ownerId;

  const adminCount = members.filter((m) => m.role === "admin").length;
  // Komu twórca może oddać mieszkanie — innym administratorom z kontem
  const otherAdmins = members.filter(
    (m) => m.role === "admin" && m.uid !== me.uid && !m.anonymous,
  );
  // Profile zajęte przez inne konta — swojego nie wybierzesz cudzego
  const takenProfiles = new Set(
    members
      .filter((m) => m.uid !== me.uid && m.profileId)
      .map((m) => m.profileId as string),
  );

  const memberLabel = (member: HouseholdMember) =>
    member.anonymous
      ? "Urządzenie bez konta"
      : (member.displayName ?? member.email ?? "Konto");

  const confirmRemove = (member: HouseholdMember) => {
    if (
      !window.confirm(
        `Usunąć „${memberLabel(member)}” z mieszkania? Straci dostęp do wszystkich danych. Kod zaproszenia zmieni się, żeby nie dołączył nim ponownie.`,
      )
    ) {
      return;
    }
    void removeMember(member.uid).catch(fail("Nie udało się usunąć."));
  };

  const confirmLeave = () => {
    if (
      !window.confirm(
        "Opuścić mieszkanie? Stracisz dostęp do jego danych. Wrócić możesz tylko z nowym kodem zaproszenia.",
      )
    ) {
      return;
    }
    void leaveHousehold().catch(fail("Nie udało się opuścić."));
  };

  const handOver = (uid: string) => {
    const next = members.find((m) => m.uid === uid);
    if (!next) return;
    if (
      !window.confirm(
        `Przekazać mieszkanie „${memberLabel(next)}”? Ta osoba zostanie twórcą: będzie nadawać role i może usunąć mieszkanie. Ty zostajesz administratorem i możesz potem wyjść.`,
      )
    ) {
      return;
    }
    void transferOwnership(uid)
      .then(() => toast.success("Mieszkanie przekazane"))
      .catch(fail("Nie udało się przekazać mieszkania."));
  };

  const removeHousehold = async () => {
    const typed = window.prompt(
      `Usunięcie mieszkania jest nieodwracalne: znikną obowiązki, rachunki, zakupy, kuchnia i historia, a wszyscy domownicy stracą dostęp.\n\nWpisz nazwę mieszkania („${household.name}”), żeby potwierdzić.`,
    );
    if (typed === null) return;
    if (typed.trim() !== household.name.trim()) {
      toast.error("Nazwa się nie zgadza — mieszkanie nie zostało usunięte.");
      return;
    }
    setBusy(true);
    try {
      await deleteHousehold();
      toast.success("Mieszkanie usunięte");
    } catch (err) {
      fail("Nie udało się usunąć mieszkania.")(err);
    } finally {
      setBusy(false);
    }
  };
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

  const turnOffInvite = async () => {
    if (
      !window.confirm(
        "Dezaktywować kod? Nikt nowy nim nie dołączy. Obecni domownicy zostają, a nowy kod utworzysz w każdej chwili.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deactivateInvite();
      toast.success("Kod dezaktywowany");
    } catch (err) {
      fail("Nie udało się dezaktywować kodu.")(err);
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
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

      <HouseholdCoverField />

      <div className="space-y-1.5">
        <Label htmlFor="household-weather">Miejscowość — dla pogody</Label>
        {isAdmin ? (
          <WeatherLocationPicker
            value={householdWeatherLocation(household)}
            onChange={(location) =>
              void setWeatherLocation(location).catch(
                fail("Nie udało się zapisać miejscowości."),
              )
            }
            inputId="household-weather"
          />
        ) : (
          <p className="font-medium">
            {householdWeatherLocation(household)?.name ?? "Nie ustawiono"}
          </p>
        )}
      </div>

      <SharedCalendarField />

      {isAdmin && (
        <div className="space-y-2">
          <Label>Kod zaproszenia</Label>
          <p className="text-xs text-muted-foreground">
            Kto wpisze albo zeskanuje kod, dołącza jako domownik (także tablet
            bez konta; konto z e-mailem musi mieć potwierdzony adres). Nowy kod
            unieważnia poprzedni, a „Dezaktywuj” wyłącza zaproszenia całkiem.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {inviteCode && (
              <code className="rounded-xl border border-border bg-muted/40 px-3 py-2 font-mono text-lg tracking-widest">
                {inviteCode}
              </code>
            )}
            {inviteCode && (
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
              {inviteCode ? "Nowy kod" : "Utwórz kod"}
            </Button>
            {inviteCode && (
              <Button
                variant="ghost"
                className="text-alert hover:text-alert"
                disabled={busy}
                onClick={() => void turnOffInvite()}
              >
                <Ban className="size-4" />
                Dezaktywuj
              </Button>
            )}
          </div>
          {!inviteCode && (
            <p className="text-xs text-muted-foreground">
              Zaproszenia są wyłączone — nikt nowy nie dołączy, dopóki nie
              utworzysz kodu.
            </p>
          )}
          {inviteCode && <InviteQr code={inviteCode} />}
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
                    {memberLabel(member)}
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
                          <SelectItem
                            key={user.id}
                            value={user.id}
                            // Swój profil sam zmieniasz tylko z „nikt”
                            // (reguły) — przejęcie cudzego robi administrator
                            disabled={
                              own &&
                              !isAdmin &&
                              ((Boolean(member.profileId) &&
                                member.profileId !== user.id) ||
                                takenProfiles.has(user.id))
                            }
                          >
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
                  {canManageRoles && !isOwner(member) ? (
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
                      <SelectTrigger className="w-[150px]">
                        <SelectValue>
                          {ROLE_INFO[member.role]?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-xs">
                        {ROLE_ORDER.filter(
                          // Administrator musi mieć konto
                          (r) => r !== "admin" || !member.anonymous,
                        ).map((r) => (
                          <SelectItem key={r} value={r}>
                            <span className="block">{ROLE_INFO[r].label}</span>
                            <span className="block text-xs text-muted-foreground">
                              {ROLE_INFO[r].description}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {isOwner(member)
                        ? "Twórca · administrator"
                        : (ROLE_INFO[member.role]?.label ?? "Domownik")}
                    </span>
                  )}
                  {isAdmin && !own && (!isOwner(member) || isSuperAdmin) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Usuń z mieszkania"
                      onClick={() => confirmRemove(member)}
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

      {amOwner && (
        <div className="space-y-2">
          <Label>Przekaż mieszkanie</Label>
          <p className="text-xs text-muted-foreground">
            Jako twórca nie możesz wyjść, dopóki nie przekażesz mieszkania
            innemu administratorowi (najpierw nadaj komuś rolę administratora).
          </p>
          {otherAdmins.length > 0 ? (
            <Select value="" onValueChange={handOver}>
              <SelectTrigger className="w-full sm:w-[260px]">
                <SelectValue placeholder="Wybierz administratora" />
              </SelectTrigger>
              <SelectContent>
                {otherAdmins.map((m) => (
                  <SelectItem key={m.uid} value={m.uid}>
                    {memberLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">
              Brak innych administratorów z kontem.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!amOwner && !(isAdmin && adminCount <= 1) && (
          <Button
            variant="outline"
            className="text-destructive"
            onClick={confirmLeave}
          >
            Opuść mieszkanie
          </Button>
        )}
        {(amOwner || isSuperAdmin) && (
          <Button
            variant="outline"
            className="text-destructive"
            disabled={busy}
            onClick={() => void removeHousehold()}
          >
            Usuń mieszkanie
          </Button>
        )}
      </div>
    </section>
  );
}
