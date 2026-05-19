import { v4 as uuidv4 } from "uuid";
import { getDb } from "./database.js";
import type { TodoTask, TodoTaskCreate } from "../types/index.js";

interface TodoTaskRow {
  id: string;
  user_id: string;
  task_name: string | null;
  task_sort: number;
  created_dt: string;
  due_dt: string | null;
  is_completed: number;
  is_archived: number;
  todo_category_id: string;
  todo_priority_id: string;
  sync_dt: string;
}

function mapRow(row: TodoTaskRow): TodoTask {
  return {
    id: row.id,
    taskName: row.task_name,
    taskSort: row.task_sort,
    createdDt: row.created_dt,
    dueDt: row.due_dt,
    isCompleted: row.is_completed === 1,
    isArchived: row.is_archived === 1,
    todoCategoryId: row.todo_category_id,
    todoPriorityId: row.todo_priority_id,
    syncDt: row.sync_dt,
  };
}

export const todoTaskRepository = {
  findAll(userId: string): TodoTask[] {
    return getDb()
      .prepare("SELECT * FROM todo_tasks WHERE user_id = ? ORDER BY task_sort ASC, sync_dt DESC")
      .all(userId)
      .map((row) => mapRow(row as TodoTaskRow));
  },

  findById(id: string, userId: string): TodoTask | null {
    const row = getDb()
      .prepare("SELECT * FROM todo_tasks WHERE id = ? AND user_id = ?")
      .get(id, userId) as TodoTaskRow | undefined;
    return row ? mapRow(row) : null;
  },

  create(input: TodoTaskCreate, userId: string): TodoTask {
    const id = uuidv4();
    const now = new Date().toISOString();

    getDb()
      .prepare(
        `
          INSERT INTO todo_tasks (
            id, user_id, task_name, task_sort, created_dt, due_dt,
            is_completed, is_archived, todo_category_id, todo_priority_id, sync_dt
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        userId,
        input.taskName ?? null,
        input.taskSort ?? 0,
        input.createdDt ?? now,
        input.dueDt ?? null,
        input.isCompleted ? 1 : 0,
        input.isArchived ? 1 : 0,
        input.todoCategoryId ?? "",
        input.todoPriorityId ?? "",
        now
      );

    return this.findById(id, userId) as TodoTask;
  },

  update(id: string, input: TodoTask, userId: string): TodoTask | null {
    const existing = this.findById(id, userId);
    if (!existing) {
      return null;
    }

    getDb()
      .prepare(
        `
          UPDATE todo_tasks
          SET task_name = ?, task_sort = ?, created_dt = ?, due_dt = ?, is_completed = ?,
              is_archived = ?, todo_category_id = ?, todo_priority_id = ?, sync_dt = ?
          WHERE id = ? AND user_id = ?
        `
      )
      .run(
        input.taskName,
        input.taskSort,
        input.createdDt,
        input.dueDt,
        input.isCompleted ? 1 : 0,
        input.isArchived ? 1 : 0,
        input.todoCategoryId,
        input.todoPriorityId,
        input.syncDt,
        id,
        userId
      );

    return this.findById(id, userId);
  },

  delete(id: string, userId: string): boolean {
    const result = getDb().prepare("DELETE FROM todo_tasks WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  },
};