#!/usr/bin/env bash
# Configura IndexNow (si falta) y envía todos los blogs activos a indexación.
# Uso en servidor: bash scripts/index-all-blogs-prod.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://universonomada.cl}"
ENV_FILE=".env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
# shellcheck disable=SC1091
source "$ENV_FILE"
set +a

KEY="${INDEXNOW_KEY:-}"
if [[ -z "$KEY" ]]; then
  KEY="$(openssl rand -hex 16)"
  if grep -q '^INDEXNOW_KEY=' "$ENV_FILE"; then
    sed -i "s|^INDEXNOW_KEY=.*|INDEXNOW_KEY=${KEY}|" "$ENV_FILE"
  else
    printf '\nINDEXNOW_KEY=%s\n' "$KEY" >> "$ENV_FILE"
  fi
  # Mantener .env del standalone alineado
  if [[ -f .next/standalone/.env ]]; then
    if grep -q '^INDEXNOW_KEY=' .next/standalone/.env; then
      sed -i "s|^INDEXNOW_KEY=.*|INDEXNOW_KEY=${KEY}|" .next/standalone/.env
    else
      printf '\nINDEXNOW_KEY=%s\n' "$KEY" >> .next/standalone/.env
    fi
  fi
  echo "INDEXNOW_KEY generada"
else
  echo "INDEXNOW_KEY ya existía"
fi

# Archivo de verificación IndexNow
mkdir -p public
printf '%s' "$KEY" > "public/${KEY}.txt"
mkdir -p .next/standalone/public
cp -f "public/${KEY}.txt" ".next/standalone/public/${KEY}.txt"
chmod a+r "public/${KEY}.txt" ".next/standalone/public/${KEY}.txt"

export INDEXNOW_KEY="$KEY"
export NEXT_PUBLIC_SITE_URL="$SITE_URL"

node --input-type=module <<'NODE'
import { PrismaClient } from "@prisma/client";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://universonomada.cl";
const key = process.env.INDEXNOW_KEY;
const prisma = new PrismaClient();

const posts = await prisma.blogArticle.findMany({
  where: { active: true },
  select: { slug: true },
  orderBy: { id: "asc" },
});

const urls = [
  `${SITE}/blog`,
  `${SITE}/sitemap.xml`,
  ...posts.map((p) => `${SITE}/blog/${p.slug}`),
];

const host = new URL(SITE).host;
const body = {
  host,
  key,
  keyLocation: `${SITE}/${key}.txt`,
  urlList: urls.slice(0, 100),
};

const indexRes = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

let moreStatus = null;
if (urls.length > 100) {
  const res2 = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ ...body, urlList: urls.slice(100) }),
  });
  moreStatus = res2.status;
}

const sitemap = `${SITE}/sitemap.xml`;
const google = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`, {
  redirect: "manual",
}).then((r) => r.status).catch(() => 0);
const bing = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}`, {
  redirect: "manual",
}).then((r) => r.status).catch(() => 0);

const keyCheck = await fetch(`${SITE}/${key}.txt`).then(async (r) => ({
  status: r.status,
  body: (await r.text()).trim() === key,
})).catch(() => ({ status: 0, body: false }));

console.log(JSON.stringify({
  blogs: posts.length,
  urls: urls.length,
  indexNow: indexRes.status,
  indexNowMore: moreStatus,
  sitemapPing: { google, bing },
  keyFilePublic: keyCheck,
}, null, 2));

await prisma.$disconnect();
if (![200, 202].includes(indexRes.status)) process.exit(1);
NODE
