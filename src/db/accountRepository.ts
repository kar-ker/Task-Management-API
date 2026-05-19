import { v4 as uuidv4 } from "uuid";
import { getDb } from "./database.js";
import type { RefreshTokenRecord, UserRecord } from "../types/index.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
  };
}

function mapRefreshToken(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export const accountRepository = {
  findUserByEmail(email: string): UserRecord | null {
    const row = getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
    return row ? mapUser(row) : null;
  },

  findUserById(id: string): UserRecord | null {
    const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
    return row ? mapUser(row) : null;
  },

  createUser(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): UserRecord {
    const id = uuidv4();
    const db = getDb();

    db.prepare(
      `
        INSERT INTO users (id, email, password_hash, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
      `
    ).run(id, input.email, input.passwordHash, input.firstName, input.lastName);

    return this.findUserById(id) as UserRecord;
  },

  storeRefreshToken(userId: string, token: string, expiresAt: string): RefreshTokenRecord {
    const id = uuidv4();
    const db = getDb();

    db.prepare(
      `
        INSERT INTO refresh_tokens (id, user_id, token, expires_at)
        VALUES (?, ?, ?, ?)
      `
    ).run(id, userId, token, expiresAt);

    const row = db.prepare("SELECT * FROM refresh_tokens WHERE id = ?").get(id) as RefreshTokenRow;
    return mapRefreshToken(row);
  },

  findRefreshToken(token: string): RefreshTokenRecord | null {
    const row = getDb().prepare("SELECT * FROM refresh_tokens WHERE token = ?").get(token) as
      | RefreshTokenRow
      | undefined;
    return row ? mapRefreshToken(row) : null;
  },

  deleteRefreshToken(token: string): boolean {
    const result = getDb().prepare("DELETE FROM refresh_tokens WHERE token = ?").run(token);
    return result.changes > 0;
  },
};