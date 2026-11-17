"use client";

import { useEffect, useState } from "react";
import { useTodoStore, type RemovedTodo } from "@/store/todos";
import { cn } from "@/lib/utils";
import { TodoItem } from "./todo-item";
import { useUndo } from "./use-undo";
import { BackupControls } from "./backup-controls";
import { Inbox } from "lucide-react";

type Filter = "active" | "all" | "completed";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: "Your list is empty. Add your first todo!",
  active: "Nothing left to do. Nice work!",
  completed: "No completed tasks yet.",
};

function plural(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

export function TodoList() {
  const todos = useTodoStore((s) => s.todos);
  const removeTodo = useTodoStore((s) => s.removeTodo);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);
  const restoreTodos = useTodoStore((s) => s.restoreTodos);
  const [hydrated, setHydrated] = useState(false);
  const [filter, setFilter] = useState<Filter>("active");
  const { entries, push, dismiss } = useUndo();

  useEffect(() => {
    const unsub = useTodoStore.persist.onFinishHydration(() => setHydrated(true));
    useTodoStore.persist.rehydrate();
    return unsub;
  }, []);

  // Avoid flashing the empty state (and a server/client mismatch) before localStorage is read.
  if (!hydrated) return <div className="min-h-[120px]" aria-hidden />;

  const remaining = todos.filter((t) => !t.completed).length;
  const completedCount = todos.length - remaining;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed
  );

  function undoable(removed: RemovedTodo[], message: string) {
    if (removed.length === 0) return;
    push(message, () => restoreTodos(removed));
  }

  function onDelete(id: string) {
    undoable(removeTodo(id), "Task deleted");
  }

  function onClearCompleted() {
    const removed = clearCompleted();
    undoable(removed, `${plural(removed.length, "completed task")} cleared`);
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {todos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div
            role="group"
            aria-label="Filter tasks"
            className="inline-flex rounded-xl bg-black/5 dark:bg-white/10 p-1"
          >
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  "h-8 rounded-lg px-3 text-sm transition-colors",
                  filter === value
                    ? "bg-white dark:bg-white/20 shadow-sm font-medium"
                    : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-black/60 dark:text-white/60">
            <span aria-live="polite">{plural(remaining, "task")} remaining</span>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="underline underline-offset-2 hover:text-black dark:hover:text-white"
              >
                Clear completed
              </button>
            )}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 p-10 text-center backdrop-blur">
          <Inbox className="text-black/40 dark:text-white/40" size={28} />
          <p className="mt-3 text-sm text-black/70 dark:text-white/70">
            {todos.length === 0 ? EMPTY_MESSAGES.all : EMPTY_MESSAGES[filter]}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map((t) => (
            <TodoItem key={t.id} todo={t} onDelete={onDelete} />
          ))}
        </div>
      )}

      <BackupControls />

      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-50 mx-auto grid grid-cols-1 max-w-sm gap-2 empty:hidden"
      >
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="glass soft-border card-shadow flex items-center justify-between gap-3 rounded-xl bg-white/90 dark:bg-neutral-900/90 px-4 py-2.5 text-sm"
          >
            <span>{entry.message}</span>
            <button
              type="button"
              onClick={() => {
                entry.undo();
                dismiss(entry.id);
              }}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
