import { Download } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { downloadChoreExport } from "@/lib/choreExport";

export function ExportChoresButton() {
  const { tasks } = useApp();

  return (
    <Button
      type="button"
      variant="outline"
      className="shrink-0"
      onClick={() => downloadChoreExport(tasks)}
      disabled={tasks.length === 0}
    >
      <Download className="size-4" />
      Eksportuj JSON
    </Button>
  );
}
