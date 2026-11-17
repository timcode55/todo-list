"use client";

import { useState } from "react";
import { useTodoStore } from "@/store/todos";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  className?: string;
}

export function TodoForm({ className }: Props) {
  const addTodo = useTodoStore((s) => s.addTodo);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = addTodo({ title, description });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    setDescription("");
    setError(null);
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full grid grid-cols-1 gap-3", className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label htmlFor="todo-title" className="sr-only">
          Title
        </label>
        <input
          id="todo-title"
          aria-invalid={error ? true : undefined}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          className="input"
        />
        <label htmlFor="todo-description" className="sr-only">
          Description (optional)
        </label>
        <input
          id="todo-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="input sm:col-span-2"
        />
      </div>
      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="btn-primary">
        <Plus size={18} /> Add Todo
      </button>
    </form>
  );
}
