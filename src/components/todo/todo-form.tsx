"use client";

import { useState } from "react";
import { z } from "zod";
import { useTodoStore } from "@/store/todos";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
});

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
    const parsed = schema.safeParse({ title, description });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    addTodo({
      title: parsed.data.title,
      description: parsed.data.description ?? "",
    });
    setTitle("");
    setDescription("");
    setError(null);
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full grid gap-3", className)}>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          className="input"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="input sm:col-span-2"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" className="btn-primary">
        <Plus size={18} /> Add Todo
      </button>
    </form>
  );
}
