/**
 * Comprime imágenes en public/images (y opcionalmente public/uploads).
 * Uso: node scripts/optimize-images.mjs
 *      node scripts/optimize-images.mjs --uploads
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const doUploads = process.argv.includes("--uploads");

const DIRS = [path.join(ROOT, "public/images")];
if (doUploads) DIRS.push(path.join(ROOT, "public/uploads"));

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

async function optimizeFile(file) {
  const before = (await fs.stat(file)).size;
  if (before < 40_000) return { file, before, after: before, skipped: true };

  const ext = path.extname(file).toLowerCase();
  const buf = await fs.readFile(file);
  const img = sharp(buf).rotate().resize({
    width: 1920,
    height: 1920,
    fit: "inside",
    withoutEnlargement: true,
  });

  let out;
  if (ext === ".png") {
    const meta = await sharp(buf).metadata();
    if (meta.hasAlpha) {
      out = await img.png({ compressionLevel: 9, palette: true }).toBuffer();
    } else {
      out = await img.png({ compressionLevel: 9, quality: 80 }).toBuffer();
    }
  } else if (ext === ".webp") {
    out = await img.webp({ quality: 74, effort: 5 }).toBuffer();
  } else {
    out = await img.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
  }

  if (out.length >= before * 0.95) {
    return { file, before, after: before, skipped: true };
  }
  await fs.writeFile(file, out);
  return { file, before, after: out.length, skipped: false };
}

const files = (await Promise.all(DIRS.map(walk))).flat();
let saved = 0;
let touched = 0;
for (const f of files) {
  try {
    const r = await optimizeFile(f);
    if (!r.skipped) {
      touched += 1;
      saved += r.before - r.after;
      const pct = Math.round((1 - r.after / r.before) * 100);
      console.log(
        `OK ${pct}% ${(r.before / 1024).toFixed(0)}→${(r.after / 1024).toFixed(0)} KB  ${path.relative(ROOT, f)}`,
      );
    }
  } catch (e) {
    console.warn("FAIL", f, e.message);
  }
}
console.log(JSON.stringify({ files: files.length, touched, savedKB: Math.round(saved / 1024) }, null, 2));
