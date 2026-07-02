import fs from "node:fs";
import path from "node:path";

const dir =
  "C:/Users/stasi/.cursor/projects/c-Users-stasi-Desktop-HomeHarmony/agent-transcripts";
const root = "C:/Users/stasi/Desktop/HomeHarmony";
const found = new Map();

function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith(".jsonl")) {
      for (const line of fs.readFileSync(p, "utf8").split(/\n/)) {
        if (!line.includes("chores") || !line.includes("Write")) continue;
        try {
          const j = JSON.parse(line);
          for (const c of j.message?.content || []) {
            if (c.type !== "tool_use" || c.name !== "Write" || !c.input?.path)
              continue;
            const fp = String(c.input.path);
            if (!fp.includes("chores")) continue;
            const m = fp.match(/chores[\\/]([^\\/"]+\.tsx)/i);
            if (!m) continue;
            found.set(m[1], c.input.contents);
          }
        } catch {
          /* skip bad lines */
        }
      }
    }
  }
}

walk(dir);
fs.mkdirSync(path.join(root, "src/components/chores"), { recursive: true });
for (const [name, contents] of [...found.entries()].sort()) {
  fs.writeFileSync(path.join(root, "src/components/chores", name), contents);
  console.log("wrote", name);
}
console.log("total", found.size, [...found.keys()]);
