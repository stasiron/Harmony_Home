import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Home, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHousehold } from "@/context/HouseholdContext";

/** Aktywne mieszkanie + przełączanie (decyzja 2: kilka mieszkań na osobę) */
export function HouseholdSwitcher() {
  const { household, memberships, householdId, switchHousehold } =
    useHousehold();
  if (!household) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Home className="size-3.5" />
          <span className="max-w-[6.5rem] truncate sm:max-w-[9rem]">
            {household.name}
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mieszkania</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.householdId}
            onClick={() => switchHousehold(membership.householdId)}
          >
            <Check
              className={
                membership.householdId === householdId
                  ? "size-3.5"
                  : "size-3.5 opacity-0"
              }
            />
            <span className="truncate">
              {membership.householdId === householdId
                ? household.name
                : membership.name}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/households">
            <Plus className="size-3.5" />
            Nowe / dołącz
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
