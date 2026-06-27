import type { Task } from "@/types";

export type ChoreExportFile = {
  version: 1;
  exportedAt: string;
  tasks: Task[];
};

export function buildChoreExport(tasks: Task[]): ChoreExportFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
  };
}

export function downloadChoreExport(tasks: Task[]) {
  const payload = buildChoreExport(tasks);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `homeharmony-chores-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
