"use client";

import { TodoForm } from "./todo-form";
import { TodoList } from "./todo-list";

export function TodoApp() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full max-w-2xl mx-auto grid gap-6">
      <div className="grid gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Todo List
        </h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          {currentDate}
        </p>
      </div>

      <TodoForm />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-black/10 dark:border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/70 dark:bg-white/5 px-3 text-black/50 dark:text-white/50">
            Your Tasks
          </span>
        </div>
      </div>

      <TodoList />
    </div>
  );
}
