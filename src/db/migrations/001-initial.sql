CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todo_categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_name TEXT,
  category_sort INTEGER NOT NULL,
  sync_dt TEXT NOT NULL,
  tag TEXT
);

CREATE TABLE IF NOT EXISTS todo_priorities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority_name TEXT,
  priority_sort INTEGER NOT NULL,
  sync_dt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todo_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_name TEXT,
  task_sort INTEGER NOT NULL,
  created_dt TEXT NOT NULL,
  due_dt TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  todo_category_id TEXT NOT NULL REFERENCES todo_categories(id) ON DELETE CASCADE,
  todo_priority_id TEXT NOT NULL REFERENCES todo_priorities(id) ON DELETE CASCADE,
  sync_dt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS list_items (
  id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  description TEXT,
  completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_todo_categories_user_id ON todo_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_priorities_user_id ON todo_priorities(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_api_key ON list_items(api_key);