"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Circle, Edit3, Trash2, Save, X } from "lucide-react";
import { useTodoStore } from "@/store/todos";
import type { Todo } from "@/types/todo";
import { formatDate, formatRelativeDate, cn } from "@/lib/utils";

interface Props {
  todo: Todo;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onDelete }: Props) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const updateTodo = useTodoStore((s) => s.updateTodo);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  // Focus the title when editing starts; hand focus back to Edit when it ends.
  useEffect(() => {
    if (isEditing) titleRef.current?.focus();
    else if (wasEditing.current) editBtnRef.current?.focus();
    wasEditing.current = isEditing;
  }, [isEditing]);

  function onEditKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  function onSave() {
    const result = updateTodo(todo.id, { title, description });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setIsEditing(false);
  }

  function onCancel() {
    setTitle(todo.title);
    setDescription(todo.description);
    setError(null);
    setIsEditing(false);
  }

  return (
    <div
      className={cn(
        "group grid grid-cols-1 gap-2 rounded-2xl soft-border glass card-shadow p-3 sm:p-4 transition-colors",
        todo.completed && "opacity-80"
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <button
          aria-label={`Mark "${todo.title}" as completed`}
          aria-pressed={todo.completed}
          onClick={() => toggleTodo(todo.id)}
          className="mt-0.5 text-blue-600 hover:text-blue-700"
        >
          {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <>
              <input
                ref={titleRef}
                aria-label="Task title"
                aria-invalid={error ? true : undefined}
                onKeyDown={onEditKeyDown}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent outline-none text-base font-medium border-b border-transparent focus:border-blue-500"
              />
              <input
                aria-label="Task description"
                onKeyDown={onEditKeyDown}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full bg-transparent outline-none text-base sm:text-sm text-black/70 dark:text-white/70 border-b border-transparent focus:border-blue-500"
              />
            </>
          ) : (
            <>
              <p
                className={cn(
                  "text-base font-medium break-words",
                  todo.completed && "line-through"
                )}
              >
                {todo.title}
              </p>
              {todo.description && (
                <p
                  className={cn(
                    "text-sm text-black/70 dark:text-white/70 break-words",
                    todo.completed && "line-through"
                  )}
                >
                  {todo.description}
                </p>
              )}
            </>
          )}
          {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            aria-controls={detailsId}
            aria-label={`${showDetails ? "Hide" : "Show"} dates for "${todo.title}"`}
            className="mt-1 inline-flex items-center gap-1 py-1 text-[12px] text-black/50 dark:text-white/50 hover:text-black/70 dark:hover:text-white/70"
          >
            {formatRelativeDate(todo.updatedAt)}
            <ChevronDown
              size={12}
              className={cn("transition-transform", showDetails && "rotate-180")}
            />
          </button>
        </div>
        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
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
                ref={editBtnRef}
                onClick={() => setIsEditing(true)}
                className="btn-neutral h-9 w-9"
                aria-label={`Edit "${todo.title}"`}
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white h-9 w-9"
                aria-label={`Delete "${todo.title}"`}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      {showDetails && (
        <dl
          id={detailsId}
          className="text-[12px] text-black/50 dark:text-white/50 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2"
        >
          <dt>Created</dt>
          <dd>{formatDate(todo.createdAt)}</dd>
          <dt>Last updated</dt>
          <dd>{formatDate(todo.updatedAt)}</dd>
        </dl>
      )}
    </div>
  );
}
