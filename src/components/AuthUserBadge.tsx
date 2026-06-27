import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { memberNameById } from "@/lib/memberLink";

export function AuthUserBadge() {
  const { user, memberId, loading } = useAuth();

  if (loading && !user) {
    return <p className="text-xs text-muted-foreground">Ładowanie konta…</p>;
  }

  if (!user) {
    return (
      <Button variant="outline" size="sm" className="rounded-xl" asChild>
        <Link to="/settings">Zaloguj</Link>
      </Button>
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
