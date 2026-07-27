#!/usr/bin/env bash
# Auto commit + push a GitHub al terminar una sesión del agente.
# NO hace push a main ni deploy/* (evita deploy accidental a prod).
set -euo pipefail
cat >/dev/null || true

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
GIT="${GIT_BIN:-/usr/bin/git}"

"$GIT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

"$GIT" add -A
"$GIT" reset -q HEAD -- .env .env.local .env.production .env.development 2>/dev/null || true
"$GIT" reset -q HEAD -- '*.pem' '*.key' '*credentials*.json' '**/service-account*.json' 2>/dev/null || true
"$GIT" ls-files -z --others --exclude-standard -- 'public/uploads/*' 2>/dev/null | xargs -0 "$GIT" reset -q HEAD -- 2>/dev/null || true
"$GIT" reset -q HEAD -- 'public/uploads/*' 2>/dev/null || true

if "$GIT" diff --cached --quiet; then
  exit 0
fi

# Bloquear si se coló .env u otros secretos
if "$GIT" diff --cached --name-only | grep -E '(^|/)\.env$|\.pem$|credentials|service-account' >/dev/null; then
  "$GIT" reset -q HEAD -- .env .env.local .env.production 2>/dev/null || true
  "$GIT" diff --cached --name-only | grep -E '\.pem$|credentials|service-account' | while read -r f; do
    "$GIT" reset -q HEAD -- "$f" 2>/dev/null || true
  done
fi
if "$GIT" diff --cached --quiet; then
  exit 0
fi

branch="$("$GIT" rev-parse --abbrev-ref HEAD)"
msg="auto: sync $(date -u +%Y-%m-%dT%H:%MZ) ($branch)"
"$GIT" commit -m "$msg" >/dev/null 2>&1 || exit 0

# Ramas protegidas: solo commit local (deploy manual / PR)
if [[ "$branch" == "main" || "$branch" == "master" || "$branch" == deploy/* ]]; then
  printf '%s\n' "{\"user_message\":\"Commit local en $branch (sin push automático — rama protegida). Usa deploy manual o PR.\"}"
  exit 0
fi

if "$GIT" push -u origin HEAD >/dev/null 2>&1; then
  printf '%s\n' '{"user_message":"Cambios guardados en GitHub (commit + push)."}'
else
  printf '%s\n' '{"user_message":"Commit local listo, pero el push a GitHub falló. Revisa red/SSH."}'
fi
exit 0
