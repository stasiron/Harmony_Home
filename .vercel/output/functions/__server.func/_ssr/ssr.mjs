import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
var TTL_MS = 5e3;
function record(error) {
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => record(event.error ?? event));
	globalThis.addEventListener("unhandledrejection", (event) => record(event.reason));
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function peekLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	return lastCapturedError.error;
}
var ENV_KEYS = [
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"AUTH_SECRET",
	"APP_URL",
	"KV_REST_API_URL",
	"KV_REST_API_TOKEN",
	"GOOGLE_CALENDAR_ICAL_URL",
	"DEBUG_SECRET",
	"DEBUG_ERRORS"
];
function moduleRequire() {
	return createRequire(join(process.cwd(), "index.mjs"));
}
function formatCheckError(error) {
	if (error instanceof Error) return {
		ok: false,
		error: error.message,
		detail: error.stack
	};
	return {
		ok: false,
		error: String(error)
	};
}
function checkResolvable(specifier) {
	try {
		return {
			ok: true,
			detail: moduleRequire().resolve(specifier)
		};
	} catch (error) {
		const pkgRoot = specifier.startsWith("@") ? join(process.cwd(), "node_modules", specifier.split("/")[0], specifier.split("/")[1] ?? "") : join(process.cwd(), "node_modules", specifier.split("/")[0] ?? specifier);
		return {
			...formatCheckError(error),
			detail: existsSync(pkgRoot) ? `dir exists: ${pkgRoot}` : `missing dir: ${pkgRoot}`
		};
	}
}
async function checkImportable(specifier) {
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
			detail: [resolved.detail, err.detail].filter(Boolean).join(" | ")
		};
	}
}
function shouldExposeErrors() {
	return process.env.DEBUG_ERRORS === "1" || process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development";
}
function verifyDebugToken(request) {
	const secret = process.env.DEBUG_SECRET?.trim();
	if (!secret) return false;
	const fromQuery = new URL(request.url).searchParams.get("token")?.trim();
	const fromHeader = request.headers.get("x-debug-token")?.trim();
	return fromQuery === secret || fromHeader === secret;
}
function formatErrorForDisplay(error) {
	if (error instanceof Error) return error.stack ?? error.message;
	try {
		return JSON.stringify(error, null, 2);
	} catch {
		return String(error);
	}
}
async function runDiagnostics(lastError) {
	const moduleEntries = await Promise.all([
		"tslib",
		"react",
		"react-dom/server",
		"@radix-ui/react-dialog"
	].map(async (name) => [name, await checkImportable(name)]));
	const ssrChecks = [
		["tslib-on-disk", checkResolvable("tslib")],
		["radix-dialog-bundle", await (async () => {
			try {
				const mod = await import("../_libs/@radix-ui/react-dialog+[...].mjs").then((n) => n.l);
				return {
					ok: true,
					detail: `exports: ${Object.keys(mod).slice(0, 5).join(", ")}`
				};
			} catch (error) {
				return formatCheckError(error);
			}
		})()],
		["server-entry", await (async () => {
			try {
				const mod = await import("./server-C_78S_En.mjs");
				return {
					ok: typeof (mod.default ?? mod).fetch === "function",
					detail: "fetch handler present"
				};
			} catch (error) {
				return {
					ok: true,
					detail: `health route alive; server-entry probe skipped (${error.message})`
				};
			}
		})()],
		["node-modules-dir", {
			ok: existsSync(join(process.cwd(), "node_modules")),
			detail: join(process.cwd(), "node_modules"),
			error: existsSync(join(process.cwd(), "node_modules")) ? void 0 : "node_modules missing"
		}],
		["tslib-package-json", {
			ok: existsSync(join(process.cwd(), "node_modules", "tslib", "package.json")),
			detail: join(process.cwd(), "node_modules", "tslib", "package.json"),
			error: existsSync(join(process.cwd(), "node_modules", "tslib", "package.json")) ? void 0 : "tslib not traced into function bundle"
		}]
	];
	const modules = Object.fromEntries(moduleEntries);
	const ssr = Object.fromEntries(ssrChecks);
	const env = Object.fromEntries(ENV_KEYS.map((key) => [key, Boolean(process.env[key]?.trim())]));
	return {
		ok: ![...Object.values(modules), ...Object.values(ssr)].some((c) => !c.ok),
		at: (/* @__PURE__ */ new Date()).toISOString(),
		runtime: {
			node: process.version,
			cwd: process.cwd(),
			vercel: process.env.VERCEL === "1",
			vercelEnv: process.env.VERCEL_ENV ?? null,
			vercelUrl: process.env.VERCEL_URL ?? null
		},
		env,
		modules,
		ssr,
		lastError: lastError ? formatErrorForDisplay(lastError) : null
	};
}
dirname(fileURLToPath(import.meta.url));
function escapeHtml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function renderErrorPage(error) {
	const showDetails = shouldExposeErrors();
	const details = error ? formatErrorForDisplay(error) : null;
	return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <title>Strona się nie załadowała</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 40rem; width: 100%; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1rem; }
      pre { background: #111; color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 12px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
      .hint { font-size: 13px; color: #6b7280; margin-top: 1rem; }
      .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 1.5rem; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Strona się nie załadowała</h1>
      <p>Coś poszło nie tak po stronie serwera.</p>
      ${showDetails && details ? `<pre>${escapeHtml(details)}</pre>` : `<p class="hint">Sprawdź <a href="/api/health">/api/health</a> — pokaże który moduł pada. Pełny raport: ustaw <code>DEBUG_SECRET</code> na Vercel i otwórz <code>/api/debug?token=...</code></p>`}
      <div class="actions">
        <button class="primary" onclick="location.reload()">Odśwież</button>
        <a class="secondary" href="/">Strona główna</a>
        <a class="secondary" href="/api/health">Health check</a>
      </div>
    </div>
  </body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-C_78S_En.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!body.includes("\"unhandled\":true") || !body.includes("\"message\":\"HTTPError\"")) return response;
	const swallowed = consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`);
	console.error(swallowed);
	return new Response(renderErrorPage(shouldExposeErrors() ? swallowed : void 0), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
var server_default = { async fetch(request, env, ctx) {
	try {
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(shouldExposeErrors() ? error : void 0), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, peekLastCapturedError as i, runDiagnostics as n, verifyDebugToken as r, renderErrorPage as t };
