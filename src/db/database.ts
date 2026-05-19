import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH || "express1.db";
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initializeDatabase(): void {
  const database = getDb();
  const migrationsDir = fileURLToPath(new URL("./migrations", import.meta.url));

  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const applied = database
    .prepare("SELECT name FROM migrations")
    .all()
    .map((row) => (row as { name: string }).name);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.includes(file)) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    database.exec(sql);
    database.prepare("INSERT INTO migrations (name) VALUES (?)").run(file);
  }
}