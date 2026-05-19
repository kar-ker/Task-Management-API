import { v4 as uuidv4 } from "uuid";
import { getDb } from "./database.js";
import type { TodoCategory, TodoCategoryCreate } from "../types/index.js";

interface TodoCategoryRow {
  id: string;
  user_id: string;
  category_name: string | null;
  category_sort: number;
  sync_dt: string;
  tag: string | null;
}

function mapRow(row: TodoCategoryRow): TodoCategory {
  return {
    id: row.id,
    categoryName: row.category_name,
    categorySort: row.category_sort,
    syncDt: row.sync_dt,
    tag: row.tag,
  };
}

export const todoCategoryRepository = {
  findAll(userId: string): TodoCategory[] {
    return getDb()
      .prepare("SELECT * FROM todo_categories WHERE user_id = ? ORDER BY category_sort ASC, sync_dt DESC")
      .all(userId)
      .map((row) => mapRow(row as TodoCategoryRow));
  },

  findById(id: string, userId: string): TodoCategory | null {
    const row = getDb()
      .prepare("SELECT * FROM todo_categories WHERE id = ? AND user_id = ?")
      .get(id, userId) as TodoCategoryRow | undefined;
    return row ? mapRow(row) : null;
  },

  create(input: TodoCategoryCreate, userId: string): TodoCategory {
    const id = uuidv4();
    const syncDt = new Date().toISOString();

    getDb()
      .prepare(
        `
          INSERT INTO todo_categories (id, user_id, category_name, category_sort, sync_dt, tag)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(id, userId, input.categoryName ?? null, input.categorySort ?? 0, syncDt, input.tag ?? null);

    return this.findById(id, userId) as TodoCategory;
  },

  update(id: string, input: TodoCategory, userId: string): TodoCategory | null {
    const existing = this.findById(id, userId);
    if (!existing) {
      return null;
    }

    getDb()
      .prepare(
        `
          UPDATE todo_categories
          SET category_name = ?, category_sort = ?, sync_dt = ?, tag = ?
          WHERE id = ? AND user_id = ?
        `
      )
      .run(input.categoryName, input.categorySort, input.syncDt, input.tag, id, userId);

    return this.findById(id, userId);
  },

  delete(id: string, userId: string): boolean {
    const result = getDb().prepare("DELETE FROM todo_categories WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  },
};