#!/usr/bin/env bash
# Utilidades compartidas para standalone de producción.
# shellcheck disable=SC2034

standalone_root() {
  echo "${STANDALONE_ROOT:-.next/standalone}"
}

standalone_bak() {
  echo "${STANDALONE_BAK:-.next/standalone.bak}"
}

# Standalone usable para servir páginas (no solo server.js / health).
standalone_is_valid() {
  local root="${1:-$(standalone_root)}"
  [[ -f "$root/server.js" ]] || return 1
  [[ -f "$root/.next/server/app/page_client-reference-manifest.js" ]] || return 1
  # _not-found suele disparar el InvariantError si falta el manifest
  if [[ -d "$root/.next/server/app/_not-found" ]] \
    && [[ ! -f "$root/.next/server/app/_not-found/page_client-reference-manifest.js" ]] \
    && [[ ! -f "$root/.next/server/app/_not-found_client-reference-manifest.js" ]]; then
    # En Next 16 el manifest puede vivir junto a page.js con nombre largo; exigir al menos 1 manifest en app/
    local count
    count=$(find "$root/.next/server/app" -name '*client-reference-manifest*' 2>/dev/null | wc -l | tr -d ' ')
    [[ "$count" -ge 1 ]] || return 1
  fi
  local manifests
  manifests=$(find "$root/.next" -name '*client-reference-manifest*' 2>/dev/null | wc -l | tr -d ' ')
  [[ "$manifests" -ge 10 ]] || return 1
  [[ -d "$root/.next/server/chunks/ssr" ]] || return 1
  local ssr
  ssr=$(ls "$root/.next/server/chunks/ssr" 2>/dev/null | wc -l | tr -d ' ')
  [[ "$ssr" -ge 50 ]] || return 1
  return 0
}

ensure_uploads_symlink() {
  local root="${1:-$(standalone_root)}"
  local base="${2:-$(pwd)}"
  mkdir -p "$base/public/uploads"
  rm -rf "$root/public/uploads"
  ln -sfn "$base/public/uploads" "$root/public/uploads"
}

# Copia atómica a .bak solo si la fuente es válida. Nunca borra el bak viejo hasta terminar.
backup_standalone_atomic() {
  local src="${1:-$(standalone_root)}"
  local bak
  bak="$(standalone_bak)"
  if ! standalone_is_valid "$src"; then
    echo "    skip bak: standalone actual inválido"
    return 1
  fi
  local tmp="${bak}.tmp.$$"
  rm -rf "$tmp"
  cp -a "$src" "$tmp"
  if ! standalone_is_valid "$tmp"; then
    echo "    skip bak: copia temporal inválida"
    rm -rf "$tmp"
    return 1
  fi
  rm -rf "${bak}.old"
  if [[ -d "$bak" ]]; then
    mv "$bak" "${bak}.old"
  fi
  mv "$tmp" "$bak"
  rm -rf "${bak}.old"
  echo "    backup OK → $bak"
  return 0
}

restore_standalone_from_bak() {
  local bak
  bak="$(standalone_bak)"
  local dest
  dest="$(standalone_root)"
  if ! standalone_is_valid "$bak"; then
    echo "    restore falló: bak inválido o ausente"
    return 1
  fi
  local tmp="${dest}.restore.$$"
  rm -rf "$tmp"
  cp -a "$bak" "$tmp"
  rm -rf "$dest"
  mv "$tmp" "$dest"
  ensure_uploads_symlink "$dest" "$(pwd)"
  echo "    restore OK desde $bak"
  return 0
}
