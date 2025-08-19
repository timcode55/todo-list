"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Edit3, Trash2, Save, X } from "lucide-react";
import { useTodoStore } from "@/store/todos";
import type { Todo } from "@/types/todo";
import { formatDate, cn } from "@/lib/utils";

interface Props {
  todo: Todo;
}

export function TodoItem({ todo }: Props) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const removeTodo = useTodoStore((s) => s.removeTodo);
  const updateTodo = useTodoStore((s) => s.updateTodo);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);

  function onSave() {
    updateTodo(todo.id, {
      title: title.trim(),
      description: description.trim(),
    });
    setIsEditing(false);
  }

  function onCancel() {
    setTitle(todo.title);
    setDescription(todo.description);
    setIsEditing(false);
  }

  return (
    <div
      className={cn(
        "group grid gap-2 rounded-2xl soft-border glass card-shadow p-4 transition-colors",
        todo.completed && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          aria-label={
            todo.completed ? "Mark as incomplete" : "Mark as complete"
          }
          onClick={() => toggleTodo(todo.id)}
          className="mt-0.5 text-blue-600 hover:text-blue-700"
        >
          {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent outline-none text-base font-medium border-b border-transparent focus:border-blue-500"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none text-sm text-black/70 dark:text-white/70 border-b border-transparent focus:border-blue-500"
              />
            </>
          ) : (
            <>
              <p
                className={cn(
                  "text-base font-medium",
                  todo.completed && "line-through"
                )}
              >
                {todo.title}
              </p>
              {todo.description && (
                <p
                  className={cn(
                    "text-sm text-black/70 dark:text-white/70",
                    todo.completed && "line-through"
                  )}
                >
                  {todo.description}
                </p>
              )}
            </>
          )}
          <p className="mt-1 text-[12px] text-black/50 dark:text-white/50">
            Updated {formatDate(new Date(todo.updatedAt))}
          </p>
        </div>
        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white h-9 w-9"
                aria-label="Save"
              >
                <Save size={16} />
              </button>
              <button
                onClick={onCancel}
                className="btn-neutral h-9 w-9"
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-neutral h-9 w-9"
                aria-label="Edit"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => removeTodo(todo.id)}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white h-9 w-9"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
