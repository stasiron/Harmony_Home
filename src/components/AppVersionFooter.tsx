import { APP_COMMIT, APP_VERSION } from "@/version";

/** Wersja na dole każdej strony — widać od razu, czy deploy dotarł. */
export function AppVersionFooter() {
  return (
    <footer className="px-4 pb-6 pt-2 text-center text-xs text-muted-foreground/70">
      <span title={APP_COMMIT ? `commit ${APP_COMMIT}` : undefined}>
        HomeHarmony {APP_VERSION}
      </span>
    </footer>
  );
}
