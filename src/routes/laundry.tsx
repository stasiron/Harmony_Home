import { createFileRoute, redirect } from "@tanstack/react-router";

/** Stary adres — prania są teraz w Poradniku */
export const Route = createFileRoute("/laundry")({
  beforeLoad: () => {
    throw redirect({ to: "/guides", search: { tab: "laundry" } });
  },
});
