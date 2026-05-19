import { v4 as uuidv4 } from "uuid";
import { getDb } from "./database.js";
import type { TodoPriority, TodoPriorityCreate } from "../types/index.js";

interface TodoPriorityRow {
  id: string;
  user_id: string;
  priority_name: string | null;
  priority_sort: number;
  sync_dt: string;
}

function mapRow(row: TodoPriorityRow): TodoPriority {
  return {
    id: row.id,
    priorityName: row.priority_name,
    prioritySort: row.priority_sort,
    syncDt: row.sync_dt,
  };
}

export const todoPriorityRepository = {
  findAll(userId: string): TodoPriority[] {
    return getDb()
      .prepare("SELECT * FROM todo_priorities WHERE user_id = ? ORDER BY priority_sort ASC, sync_dt DESC")
      .all(userId)
      .map((row) => mapRow(row as TodoPriorityRow));
  },

  findById(id: string, userId: string): TodoPriority | null {
    const row = getDb()
      .prepare("SELECT * FROM todo_priorities WHERE id = ? AND user_id = ?")
      .get(id, userId) as TodoPriorityRow | undefined;
    return row ? mapRow(row) : null;
  },

  create(input: TodoPriorityCreate, userId: string): TodoPriority {
    const id = uuidv4();
    const syncDt = input.syncDt ?? new Date().toISOString();

    getDb()
      .prepare(
        `
          INSERT INTO todo_priorities (id, user_id, priority_name, priority_sort, sync_dt)
          VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(id, userId, input.priorityName ?? null, input.prioritySort ?? 0, syncDt);

    return this.findById(id, userId) as TodoPriority;
  },

  update(id: string, input: TodoPriority, userId: string): TodoPriority | null {
    const existing = this.findById(id, userId);
    if (!existing) {
      return null;
    }

    getDb()
      .prepare(
        `
          UPDATE todo_priorities
          SET priority_name = ?, priority_sort = ?, sync_dt = ?
          WHERE id = ? AND user_id = ?
        `
      )
      .run(input.priorityName, input.prioritySort, input.syncDt, id, userId);

    return this.findById(id, userId);
  },

  delete(id: string, userId: string): boolean {
    const result = getDb().prepare("DELETE FROM todo_priorities WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  },
};