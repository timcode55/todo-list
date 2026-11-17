import { z } from "zod";
import { todoFormSchema } from "@/lib/todo-schema";
import type { Todo } from "@/types/todo";

export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date")
  .transform((v) => new Date(v).toISOString());

const backupTodoSchema = z.object({
  id: z.string().min(1),
  title: todoFormSchema.shape.title,
  description: todoFormSchema.shape.description,
  completed: z.boolean(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const backupSchema = z.object({
  version: z.number().int(),
  exportedAt: z.string().optional(),
  todos: z.array(z.unknown()),
});

export function buildBackup(todos: Todo[]) {
  return {
    app: "todo-app",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    todos,
  };
}

export type ParseResult =
  | { ok: true; todos: Todo[]; duplicatesInFile: number }
  | { ok: false; error: string };

/** Validates a backup file's text. All-or-nothing: any invalid todo rejects the whole file. */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't valid JSON." };
  }

  const envelope = backupSchema.safeParse(json);
  if (!envelope.success) {
    return { ok: false, error: "This doesn't look like a todo backup file." };
  }
  if (envelope.data.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `This backup is from a newer version (v${envelope.data.version}) and can't be imported.`,
    };
  }
  if (envelope.data.version < 1) {
    return { ok: false, error: "Unsupported backup version." };
  }

  const seen = new Set<string>();
  const todos: Todo[] = [];
  let duplicatesInFile = 0;
  for (const [i, raw] of envelope.data.todos.entries()) {
    const parsed = backupTodoSchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path.join(".") || "todo";
      return {
        ok: false,
        error: `Todo #${i + 1} is invalid (${field}: ${issue?.message ?? "invalid"}). Nothing was imported.`,
      };
    }
    if (seen.has(parsed.data.id)) {
      duplicatesInFile++;
      continue;
    }
    seen.add(parsed.data.id);
    todos.push(parsed.data);
  }
  return { ok: true, todos, duplicatesInFile };
}
