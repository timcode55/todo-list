"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UndoEntry {
  id: number;
  message: string;
  undo: () => void;
}

const UNDO_WINDOW_MS = 8000;

/**
 * Lightweight undo queue. Every action gets its own entry with its own timer,
 * so consecutive deletions each stay undoable until their own window expires.
 */
export function useUndo() {
  const [entries, setEntries] = useState<UndoEntry[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const push = useCallback(
    (message: string, undo: () => void) => {
      const id = nextId.current++;
      setEntries((prev) => [...prev, { id, message, undo }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), UNDO_WINDOW_MS)
      );
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach(clearTimeout);
      active.clear();
    };
  }, []);

  return { entries, push, dismiss };
}
