export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** ISO 8601 timestamp */
  updatedAt: string;
}

export interface TodoFormData {
  title: string;
  description: string;
}

export type TodoResult = { ok: true } | { ok: false; error: string };
