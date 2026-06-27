import { formatErrorForDisplay, shouldExposeErrors } from "@/lib/diagnostics";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderErrorPage(error?: unknown): string {
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
      ${
        showDetails && details
          ? `<pre>${escapeHtml(details)}</pre>`
          : `<p class="hint">Sprawdź <a href="/api/health">/api/health</a> — pokaże który moduł pada. Pełny raport: ustaw <code>DEBUG_SECRET</code> na Vercel i otwórz <code>/api/debug?token=...</code></p>`
      }
      <div class="actions">
        <button class="primary" onclick="location.reload()">Odśwież</button>
        <a class="secondary" href="/">Strona główna</a>
        <a class="secondary" href="/api/health">Health check</a>
      </div>
    </div>
  </body>
</html>`;
}
