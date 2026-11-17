"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { todoFormSchema } from "@/lib/todo-schema";
import type { Todo, TodoFormData, TodoResult } from "@/types/todo";

/** A removed todo plus the position it occupied, so undo can put it back where it was. */
export interface RemovedTodo {
  todo: Todo;
  index: number;
}

interface TodoState {
  todos: Todo[];
  addTodo: (data: TodoFormData) => TodoResult;
  updateTodo: (id: string, data: Partial<TodoFormData>) => TodoResult;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => RemovedTodo[];
  clearCompleted: () => RemovedTodo[];
  restoreTodos: (items: RemovedTodo[]) => void;
  importTodos: (incoming: Todo[], mode: "merge" | "replace") => { added: number; skipped: number };
  clearTodos: () => void;
}

function toIso(value: unknown, fallback: string): string {
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return fallback;
}

/** Normalizes persisted todos (legacy Date-as-string shape or already ISO) without dropping data. */
function migrateTodos(persisted: unknown): { todos: Todo[] } {
  const raw = (persisted as { todos?: unknown } | null)?.todos;
  if (!Array.isArray(raw)) return { todos: [] };
  const now = new Date().toISOString();
  const todos = raw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) => {
      const createdAt = toIso(t.createdAt, now);
      return {
        id: typeof t.id === "string" && t.id ? t.id : crypto.randomUUID(),
        title: typeof t.title === "string" ? t.title : "",
        description: typeof t.description === "string" ? t.description : "",
        completed: t.completed === true,
        createdAt,
        updatedAt: toIso(t.updatedAt, createdAt),
      };
    });
  return { todos };
}

function collectRemoved(todos: Todo[], match: (t: Todo) => boolean): RemovedTodo[] {
  return todos.flatMap((todo, index) => (match(todo) ? [{ todo, index }] : []));
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      addTodo: (data) => {
        const parsed = todoFormSchema.safeParse(data);
        if (!parsed.success) {
          return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
        }
        const now = new Date().toISOString();
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          title: parsed.data.title,
          description: parsed.data.description,
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
        set({ todos: [newTodo, ...get().todos] });
        return { ok: true };
      },
      updateTodo: (id, data) => {
        const existing = get().todos.find((t) => t.id === id);
        if (!existing) return { ok: false, error: "Todo not found" };
        const parsed = todoFormSchema.safeParse({
          title: data.title ?? existing.title,
          description: data.description ?? existing.description,
        });
        if (!parsed.success) {
          return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
        }
        const updatedAt = new Date().toISOString();
        set({
          todos: get().todos.map((t) =>
            t.id === id ? { ...t, ...parsed.data, updatedAt } : t
          ),
        });
        return { ok: true };
      },
      toggleTodo: (id) => {
        const updatedAt = new Date().toISOString();
        set({
          todos: get().todos.map((t) =>
            t.id === id ? { ...t, completed: !t.completed, updatedAt } : t
          ),
        });
      },
      removeTodo: (id) => {
        const removed = collectRemoved(get().todos, (t) => t.id === id);
        if (removed.length > 0) {
          set({ todos: get().todos.filter((t) => t.id !== id) });
        }
        return removed;
      },
      clearCompleted: () => {
        const removed = collectRemoved(get().todos, (t) => t.completed);
        if (removed.length > 0) {
          set({ todos: get().todos.filter((t) => !t.completed) });
        }
        return removed;
      },
      restoreTodos: (items) => {
        const next = [...get().todos];
        const present = new Set(next.map((t) => t.id));
        // Ascending index order so each insert lands at its original position.
        [...items]
          .sort((a, b) => a.index - b.index)
          .forEach(({ todo, index }) => {
            if (present.has(todo.id)) return;
            next.splice(Math.min(index, next.length), 0, todo);
            present.add(todo.id);
          });
        set({ todos: next });
      },
      importTodos: (incoming, mode) => {
        if (mode === "replace") {
          set({ todos: incoming });
          return { added: incoming.length, skipped: 0 };
        }
        const existing = get().todos;
        const ids = new Set(existing.map((t) => t.id));
        const fresh = incoming.filter((t) => !ids.has(t.id));
        set({ todos: [...existing, ...fresh] });
        return { added: fresh.length, skipped: incoming.length - fresh.length };
      },
      clearTodos: () => set({ todos: [] }),
    }),
    {
      name: "todo-app-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ todos: state.todos }),
      migrate: (persisted) => migrateTodos(persisted),
      // Hydrate after mount (see TodoList) so SSR and first client render match.
      skipHydration: true,
    }
  )
);
