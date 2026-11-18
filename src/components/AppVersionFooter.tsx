import { BugReportButton } from "@/components/BugReportButton";
import { APP_COMMIT, APP_VERSION } from "@/version";

/** Wersja na dole każdej strony — widać od razu, czy deploy dotarł. */
export function AppVersionFooter() {
  return (
    <footer
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 pt-2 text-center text-xs text-muted-foreground/70"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      <span title={APP_COMMIT ? `commit ${APP_COMMIT}` : undefined}>
        HomeHarmony {APP_VERSION}
      </span>
      <BugReportButton />
    </footer>
  );
}
