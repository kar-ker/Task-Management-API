import { v4 as uuidv4 } from "uuid";
import { getDb } from "./database.js";
import type { ListItem, ListItemCreate } from "../types/index.js";

interface ListItemRow {
  id: string;
  api_key: string;
  description: string | null;
  completed: number;
}

function mapRow(row: ListItemRow): ListItem {
  return {
    id: row.id,
    description: row.description,
    completed: row.completed === 1,
  };
}

export const listItemRepository = {
  findAll(apiKey: string, completed?: boolean): ListItem[] {
    let sql = "SELECT * FROM list_items WHERE api_key = ?";
    const params: unknown[] = [apiKey];

    if (completed !== undefined) {
      sql += " AND completed = ?";
      params.push(completed ? 1 : 0);
    }

    sql += " ORDER BY id ASC";
    return getDb().prepare(sql).all(...params).map((row) => mapRow(row as ListItemRow));
  },

  findById(id: string, apiKey: string): ListItem | null {
    const row = getDb()
      .prepare("SELECT * FROM list_items WHERE id = ? AND api_key = ?")
      .get(id, apiKey) as ListItemRow | undefined;
    return row ? mapRow(row) : null;
  },

  create(apiKey: string, input: ListItemCreate): ListItem {
    const id = input.id && input.id.trim() ? input.id : uuidv4();

    getDb()
      .prepare(
        `
          INSERT INTO list_items (id, api_key, description, completed)
          VALUES (?, ?, ?, ?)
        `
      )
      .run(id, apiKey, input.description ?? null, input.completed ? 1 : 0);

    return this.findById(id, apiKey) as ListItem;
  },

  update(id: string, apiKey: string, input: ListItemCreate): ListItem | null {
    const existing = this.findById(id, apiKey);
    if (!existing) {
      return null;
    }

    getDb()
      .prepare(
        `
          UPDATE list_items
          SET description = ?, completed = ?
          WHERE id = ? AND api_key = ?
        `
      )
      .run(input.description ?? null, input.completed ? 1 : 0, id, apiKey);

    return this.findById(id, apiKey);
  },

  delete(id: string, apiKey: string): boolean {
    const result = getDb().prepare("DELETE FROM list_items WHERE id = ? AND api_key = ?").run(id, apiKey);
    return result.changes > 0;
  },
};