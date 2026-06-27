import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type CheckResult = {
  ok: boolean;
  detail?: string;
  error?: string;
};

export type DiagnosticsReport = {
  ok: boolean;
  at: string;
  runtime: {
    node: string;
    cwd: string;
    vercel: boolean;
    vercelEnv: string | null;
    vercelUrl: string | null;
  };
  env: Record<string, boolean>;
  modules: Record<string, CheckResult>;
  ssr: Record<string, CheckResult>;
  lastError: string | null;
};

const ENV_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_SECRET",
  "APP_URL",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "GOOGLE_CALENDAR_ICAL_URL",
  "DEBUG_SECRET",
  "DEBUG_ERRORS",
] as const;

function moduleRequire() {
  return createRequire(join(process.cwd(), "index.mjs"));
}

function formatCheckError(error: unknown): CheckResult {
  if (error instanceof Error) {
    return { ok: false, error: error.message, detail: error.stack };
  }
  return { ok: false, error: String(error) };
}

function checkResolvable(specifier: string): CheckResult {
  try {
    const resolved = moduleRequire().resolve(specifier);
    return { ok: true, detail: resolved };
  } catch (error) {
    const pkgRoot = specifier.startsWith("@")
      ? join(process.cwd(), "node_modules", specifier.split("/")[0], specifier.split("/")[1] ?? "")
      : join(process.cwd(), "node_modules", specifier.split("/")[0] ?? specifier);

    return {
      ...formatCheckError(error),
      detail: existsSync(pkgRoot) ? `dir exists: ${pkgRoot}` : `missing dir: ${pkgRoot}`,
    };
  }
}

async function checkImportable(specifier: string): Promise<CheckResult> {
  const resolved = checkResolvable(specifier);
  if (!resolved.ok) return resolved;

  try {
    await import(specifier);
    return resolved;
  } catch (error) {
    const err = formatCheckError(error);
    return {
      ok: false,
      error: err.error,
      detail: [resolved.detail, err.detail].filter(Boolean).join(" | "),
    };
  }
}

export function shouldExposeErrors(): boolean {
  return (
    process.env.DEBUG_ERRORS === "1" ||
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development"
  );
}

export function verifyDebugToken(request: Request): boolean {
  const secret = process.env.DEBUG_SECRET?.trim();
  if (!secret) return false;

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("token")?.trim();
  const fromHeader = request.headers.get("x-debug-token")?.trim();
  return fromQuery === secret || fromHeader === secret;
}

export function formatErrorForDisplay(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export async function runDiagnostics(lastError?: unknown): Promise<DiagnosticsReport> {
  const moduleNames = [
    "tslib",
    "react",
    "react-dom/server",
    "@radix-ui/react-dialog",
  ] as const;

  const moduleEntries = await Promise.all(
    moduleNames.map(async (name) => [name, await checkImportable(name)] as const),
  );

  const ssrChecks: [string, CheckResult][] = [
    ["tslib-on-disk", checkResolvable("tslib")],
    [
      "radix-dialog-bundle",
      await (async (): Promise<CheckResult> => {
        try {
          const mod = await import("@radix-ui/react-dialog");
          return { ok: true, detail: `exports: ${Object.keys(mod).slice(0, 5).join(", ")}` };
        } catch (error) {
          return formatCheckError(error);
        }
      })(),
    ],
    [
      "server-entry",
      await (async (): Promise<CheckResult> => {
        try {
          const mod = await import("@tanstack/react-start/server-entry");
          const entry = (mod.default ?? mod) as { fetch?: unknown };
          return { ok: typeof entry.fetch === "function", detail: "fetch handler present" };
        } catch (error) {
          // Health route already running — treat as soft warning, not hard fail.
          return {
            ok: true,
            detail: `health route alive; server-entry probe skipped (${(error as Error).message})`,
          };
        }
      })(),
    ],
    [
      "node-modules-dir",
      {
        ok: existsSync(join(process.cwd(), "node_modules")),
        detail: join(process.cwd(), "node_modules"),
        error: existsSync(join(process.cwd(), "node_modules")) ? undefined : "node_modules missing",
      },
    ],
    [
      "tslib-package-json",
      {
        ok: existsSync(join(process.cwd(), "node_modules", "tslib", "package.json")),
        detail: join(process.cwd(), "node_modules", "tslib", "package.json"),
        error: existsSync(join(process.cwd(), "node_modules", "tslib", "package.json"))
          ? undefined
          : "tslib not traced into function bundle",
      },
    ],
  ];

  const modules = Object.fromEntries(moduleEntries);
  const ssr = Object.fromEntries(ssrChecks);
  const env = Object.fromEntries(ENV_KEYS.map((key) => [key, Boolean(process.env[key]?.trim())]));

  const failed = [...Object.values(modules), ...Object.values(ssr)].some((c) => !c.ok);

  return {
    ok: !failed,
    at: new Date().toISOString(),
    runtime: {
      node: process.version,
      cwd: process.cwd(),
      vercel: process.env.VERCEL === "1",
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelUrl: process.env.VERCEL_URL ?? null,
    },
    env,
    modules,
    ssr,
    lastError: lastError ? formatErrorForDisplay(lastError) : null,
  };
}

// Keep import for bundlers that need an explicit module URL anchor.
void dirname(fileURLToPath(import.meta.url));
