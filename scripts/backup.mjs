#!/usr/bin/env node
/**
 * Backup SQLite database and optional env snapshot.
 * Usage: node --env-file=.env scripts/backup.mjs
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = dbUrl.replace(/^file:/, "");
const absDb = dbPath.startsWith("/") ? dbPath : join(root, "prisma", dbPath.replace(/^\.\//, ""));

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const backupDir = join(root, "backups", stamp);

if (!existsSync(absDb)) {
  console.error("No se encontró la base de datos:", absDb);
  process.exit(1);
}

mkdirSync(backupDir, { recursive: true });
copyFileSync(absDb, join(backupDir, "dev.db"));
console.log("Backup creado en:", backupDir);
