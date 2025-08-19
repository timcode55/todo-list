"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import type { Todo, TodoFormData } from "@/types/todo";

const todoSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional().default(""),
});

interface TodoState {
  todos: Todo[];
  addTodo: (data: TodoFormData) => void;
  updateTodo: (id: string, data: Partial<TodoFormData>) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  clearTodos: () => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],
      addTodo: (data) => {
        const parsed = todoSchema.safeParse(data);
        if (!parsed.success) {
          throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
        }
        const now = new Date();
        const newTodo: Todo = {
          id: generateId(),
          title: parsed.data.title.trim(),
          description: (parsed.data.description ?? "").trim(),
          completed: false,
          createdAt: now,
          updatedAt: now,
        };
        set({ todos: [newTodo, ...get().todos] });
      },
      updateTodo: (id, data) => {
        set({
          todos: get().todos.map((t) =>
            t.id === id ? { ...t, ...data, updatedAt: new Date() } : t
          ),
        });
      },
      toggleTodo: (id) => {
        set({
          todos: get().todos.map((t) =>
            t.id === id
              ? { ...t, completed: !t.completed, updatedAt: new Date() }
              : t
          ),
        });
      },
      removeTodo: (id) => {
        set({ todos: get().todos.filter((t) => t.id !== id) });
      },
      clearTodos: () => set({ todos: [] }),
    }),
    {
      name: "todo-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ todos: state.todos }),
    }
  )
);
