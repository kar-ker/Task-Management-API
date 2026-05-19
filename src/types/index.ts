export interface JwtResponse {
  token: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
}

export interface Message {
  messages: string[];
}

export interface Login {
  email?: string | null;
  password?: string | null;
}

export interface Register {
  email?: string | null;
  password?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface RefreshTokenModel {
  jwt?: string | null;
  refreshToken?: string | null;
}

export interface TodoCategory {
  id: string;
  categoryName: string | null;
  categorySort: number;
  syncDt: string;
  tag: string | null;
}

export interface TodoCategoryCreate {
  categoryName?: string | null;
  categorySort?: number;
  tag?: string | null;
}

export interface TodoPriority {
  id: string;
  priorityName: string | null;
  prioritySort: number;
  syncDt: string;
}

export interface TodoPriorityCreate {
  priorityName?: string | null;
  prioritySort?: number;
  syncDt?: string | null;
}

export interface TodoTask {
  id: string;
  taskName: string | null;
  taskSort: number;
  createdDt: string;
  dueDt: string | null;
  isCompleted: boolean;
  isArchived: boolean;
  todoCategoryId: string;
  todoPriorityId: string;
  syncDt: string;
}

export interface TodoTaskCreate {
  taskName?: string | null;
  taskSort?: number;
  createdDt?: string | null;
  dueDt?: string | null;
  isCompleted?: boolean;
  isArchived?: boolean;
  todoCategoryId?: string | null;
  todoPriorityId?: string | null;
}

export interface ListItem {
  id: string;
  description: string | null;
  completed: boolean;
}

export interface ListItemCreate {
  id?: string | null;
  description?: string | null;
  completed?: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthUser {
  userId: string;
  email: string;
}