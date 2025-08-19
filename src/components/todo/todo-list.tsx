"use client";

import { useTodoStore } from "@/store/todos";
import { TodoItem } from "./todo-item";
import { Inbox } from "lucide-react";

export function TodoList() {
  const todos = useTodoStore((s) => s.todos);

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-10 text-center backdrop-blur">
        <Inbox className="text-black/40 dark:text-white/40" size={28} />
        <p className="mt-3 text-sm text-black/70 dark:text-white/70">
          Your list is empty. Add your first todo!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {todos.map((t) => (
        <TodoItem key={t.id} todo={t} />
      ))}
    </div>
  );
}
