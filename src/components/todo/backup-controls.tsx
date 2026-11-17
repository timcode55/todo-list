"use client";

import { useRef, useState } from "react";
import { useTodoStore } from "@/store/todos";
import { buildBackup, parseBackup, MAX_BACKUP_BYTES } from "@/lib/backup";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";

type Status = { kind: "success" | "error"; text: string } | null;
interface Pending {
  todos: Todo[];
  duplicatesInFile: number;
}

const linkClass =
  "underline underline-offset-2 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed";

function plural(n: number, noun: string) {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

export function BackupControls() {
  const todos = useTodoStore((s) => s.todos);
  const importTodos = useTodoStore((s) => s.importTodos);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  function reset() {
    setPending(null);
    setConfirmReplace(false);
  }

  function onExport() {
    const blob = new Blob([JSON.stringify(buildBackup(todos), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const a = document.createElement("a");
    a.href = url;
    a.download = `todos-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: "success", text: `Exported ${plural(todos.length, "task")}.` });
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    reset();
    if (file.size > MAX_BACKUP_BYTES) {
      setStatus({ kind: "error", text: "That file is too large to be a todo backup." });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ kind: "error", text: "Couldn't read that file." });
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setStatus({ kind: "error", text: result.error });
      return;
    }
    setStatus(null);
    setPending({ todos: result.todos, duplicatesInFile: result.duplicatesInFile });
  }

  function apply(mode: "merge" | "replace") {
    if (!pending) return;
    const { added, skipped } = importTodos(pending.todos, mode);
    const dupes = skipped + pending.duplicatesInFile;
    const text =
      mode === "replace"
        ? `Replaced your list with ${plural(added, "task")}.`
        : `Imported ${plural(added, "task")}${dupes ? `, skipped ${plural(dupes, "duplicate")}` : ""}.`;
    setStatus({ kind: "success", text });
    reset();
  }

  const existingIds = new Set(todos.map((t) => t.id));
  const newCount = pending ? pending.todos.filter((t) => !existingIds.has(t.id)).length : 0;

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-black/10 dark:border-white/10 pt-3 text-sm text-black/60 dark:text-white/60">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>Backup:</span>
        <button type="button" onClick={onExport} disabled={todos.length === 0} className={linkClass}>
          Export
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className={linkClass}>
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFileChosen}
          className="hidden"
          aria-label="Choose a backup file to import"
          tabIndex={-1}
        />
      </div>

      {pending && !confirmReplace && (
        <div className="grid grid-cols-1 gap-2 rounded-xl bg-black/5 dark:bg-white/10 p-3">
          <p>
            Found {plural(pending.todos.length, "task")} ({newCount} new
            {pending.todos.length - newCount > 0 &&
              `, ${pending.todos.length - newCount} already in your list`}
            ). How should they be imported?
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-neutral h-9" onClick={() => apply("merge")}>
              Merge
            </button>
            <button type="button" className="btn-neutral h-9" onClick={() => setConfirmReplace(true)}>
              Replace…
            </button>
            <button type="button" className="btn-neutral h-9" onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {pending && confirmReplace && (
        <div role="alertdialog" aria-label="Confirm replace" className="grid grid-cols-1 gap-2 rounded-xl bg-red-500/10 p-3">
          <p>
            Replace your current {plural(todos.length, "task")} with {plural(pending.todos.length, "task")}{" "}
            from the file? This can&apos;t be undone.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-xl bg-red-600 px-3 text-white hover:bg-red-700"
              onClick={() => apply("replace")}
            >
              Replace my list
            </button>
            <button type="button" className="btn-neutral h-9" onClick={() => setConfirmReplace(false)}>
              Back
            </button>
          </div>
        </div>
      )}

      {status && (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={cn(status.kind === "error" ? "text-red-600" : "text-emerald-600 dark:text-emerald-400")}
        >
          {status.text}
        </p>
      )}
    </div>
  );
}
