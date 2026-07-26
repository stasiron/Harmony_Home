import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, Settings, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { memberNameById } from "@/lib/memberLink";

export function AuthUserBadge() {
  const { user, memberId, seeAsMemberId, loading, setSeeAsMember, clearSeeAs } =
    useAuth();
  const { users } = useApp();
  const navigate = useNavigate();

  if (loading && !user) {
    return <p className="text-xs text-muted-foreground">Ładowanie konta…</p>;
  }

  if (!user) {
    const seeAsLabel = seeAsMemberId
      ? (memberNameById(seeAsMemberId) ??
        users.find((u) => u.id === seeAsMemberId)?.name)
      : null;

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={seeAsMemberId ? "secondary" : "outline"}
              size="sm"
              className="rounded-xl gap-1.5"
            >
              <Eye className="size-3.5" />
              {seeAsLabel ? (
                <span className="max-w-[7rem] truncate">{seeAsLabel}</span>
              ) : (
                "See as"
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Podgląd jako…</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {users.length === 0 ? (
              <DropdownMenuItem disabled>Brak domowników</DropdownMenuItem>
            ) : (
              users.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => {
                    setSeeAsMember(member.id);
                    void navigate({ to: "/" });
                  }}
                >
                  <span
                    className="mr-2 grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold"
                    style={{ color: `var(--${member.color})` }}
                  >
                    {member.avatar}
                  </span>
                  {member.name}
                </DropdownMenuItem>
              ))
            )}
            {seeAsMemberId ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => clearSeeAs()}>
                  <X className="size-3.5" />
                  Wyjdź z podglądu
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link to="/settings">Zaloguj</Link>
        </Button>
      </div>
    );
  }

  const memberLabel = memberId ? memberNameById(memberId) : null;

  return (
    <Button
      variant="outline"
      className="h-auto gap-2 rounded-2xl px-3 py-2"
      asChild
    >
      <Link to="/settings">
        <Avatar className="size-8">
          {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
          <AvatarFallback className="text-xs">
            {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col items-start text-left sm:flex">
          <span className="truncate text-sm font-medium leading-tight">
            {memberLabel ?? user.displayName ?? "Konto"}
          </span>
          <span className="truncate text-xs text-muted-foreground leading-tight">
            {user.email}
          </span>
        </span>
        <Settings className="size-4 shrink-0 sm:hidden" />
      </Link>
    </Button>
  );
}
