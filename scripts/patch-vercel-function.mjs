import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const funcDir = join(root, ".vercel/output/functions/__server.func");

if (!existsSync(funcDir)) {
  process.exit(0);
}

const require = createRequire(join(root, "package.json"));
const tslibRoot = dirname(require.resolve("tslib/package.json"));
const targetDir = join(funcDir, "node_modules/tslib");

mkdirSync(join(funcDir, "node_modules"), { recursive: true });
cpSync(tslibRoot, targetDir, { recursive: true });

const pkgPath = join(funcDir, "package.json");
const tslibVersion =
  JSON.parse(readFileSync(join(tslibRoot, "package.json"), "utf8")).version ?? "2.8.1";

writeFileSync(
  pkgPath,
  JSON.stringify(
    {
      name: "traced-node-modules",
      version: "1.0.0",
      type: "module",
      private: true,
      dependencies: { tslib: tslibVersion },
    },
    null,
    2,
  ) + "\n",
);

console.log(`[patch-vercel-function] copied tslib@${tslibVersion} -> ${targetDir}`);
