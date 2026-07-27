/**
 * Regenera el sitemap.xml.body prerenderizado en prod con blogs + URLs estáticas.
 * Uso en servidor: node scripts/regen-sitemap-prod.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://universonomada.cl";
const prisma = new PrismaClient();
const bodyPath = path.resolve(".next/standalone/.next/server/app/sitemap.xml.body");

const HUBS = [
  "chile",
  "rapa-nui",
  "atacama",
  "patagonia",
  "cusco-machu-picchu",
  "mendoza",
  "florianopolis",
  "rio-de-janeiro",
  "buenos-aires",
  "valle-del-elqui",
];
const SEASONAL = ["tapati-2027", "ballenas-elqui", "atacama-grupal"];
const TOURS = [
  "rapa-nui",
  "san-pedro-uyuni",
  "cusco-machupicchu",
  "terapias-ancestrales",
  "ballenas-elqui",
  "santiago-vinedos",
  "bolivia-amazonica",
  "region-atacama",
  "valle-aconcagua",
  "catedrales-marmol",
  "rio-janeiro",
  "florianopolis",
  "buenos-aires",
  "mendoza",
  "group-atacama",
  "group-uyuni",
  "group-rapa-nui",
];
const LEGAL = [
  "/politicas-cancelacion",
  "/terminos-vuelos",
  "/politica-seguridad",
  "/politica-privacidad",
  "/terminos-condiciones",
  "/accesibilidad",
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `<url>
<loc>${esc(loc)}</loc>
<lastmod>${esc(lastmod)}</lastmod>
<changefreq>${changefreq}</changefreq>
<priority>${priority}</priority>
</url>`;
}

const posts = await prisma.blogArticle.findMany({
  where: { active: true },
  orderBy: [{ sortOrder: "desc" }, { date: "desc" }],
  select: { slug: true, date: true, updatedAt: true },
});

const now = new Date().toISOString();
const entries = [];
const seen = new Set();

function push(loc, lastmod, changefreq, priority) {
  if (seen.has(loc)) return;
  seen.add(loc);
  entries.push(urlEntry(loc, lastmod, changefreq, priority));
}

push(SITE, now, "daily", "1");
push(`${SITE}/viajes`, now, "weekly", "0.95");
push(`${SITE}/blog`, now, "weekly", "0.85");

for (const slug of HUBS) {
  push(`${SITE}/viajes/${slug}`, now, "weekly", slug === "chile" ? "0.95" : "0.9");
}
for (const slug of SEASONAL) {
  push(`${SITE}/viajes/${slug}`, now, "weekly", "0.88");
}
for (const id of TOURS) {
  push(`${SITE}/detalle-paquete/${id}`, now, "weekly", "0.9");
}
for (const p of posts) {
  const lm = p.updatedAt
    ? new Date(p.updatedAt).toISOString()
    : p.date
      ? new Date(p.date).toISOString()
      : now;
  push(`${SITE}/blog/${p.slug}`, lm, "monthly", "0.75");
}
for (const pathName of LEGAL) {
  push(`${SITE}${pathName}`, now, "yearly", "0.35");
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

fs.writeFileSync(bodyPath, xml);
console.log(
  JSON.stringify({
    activeBlogs: posts.length,
    sitemapUrls: entries.length,
    blogUrls: posts.length,
    wrote: bodyPath,
  }),
);
await prisma.$disconnect();
