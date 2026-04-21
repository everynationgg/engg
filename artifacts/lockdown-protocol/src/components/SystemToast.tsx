import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Lightweight system‑feedback toast overlay                         */
/*  • Pure CSS animations (ix-system-toast classes in index.css)      */
/*  • Deduplication: identical messages suppressed within 2 s         */
/*  • Collapse: rapid state updates replace instead of stacking       */
/*  • Max 3 visible toasts                                            */
/*  • Priority: error > warning > success > info                      */
/*  • Auto‑dismiss after 2–3 seconds                                  */
/*  • Callable from anywhere via `systemToast()`                      */
/* ------------------------------------------------------------------ */

export type SystemToastVariant = "info" | "success" | "warning" | "error";

interface ToastEntry {
  id: number;
  message: string;
  variant: SystemToastVariant;
  exiting: boolean;
  group?: string;
}

/* ---- Priority (higher = more important) ---- */

const PRIORITY: Record<SystemToastVariant, number> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
};

/* ---- Store (module‑level, framework‑agnostic) ---- */

/** Must match .ix-system-toast--exiting animation duration in index.css */
import { UI } from "@/lib/constants";
const TOAST_EXIT_MS = 160;
export const MAX_VISIBLE_TOASTS = UI.toastLimit ?? 3;
const DEFAULT_TOAST_DURATION = UI.toastDuration ?? 3000;
const DEDUP_WINDOW_MS = 2000;

let nextId = 0;
let toasts: ToastEntry[] = [];
const listeners = new Set<() => void>();

/** Tracks the last time each message was shown (deduplication). */
const recentMessages = new Map<string, number>();
/** Maps group keys to their active toast IDs (collapse rapid updates). */
const activeGroups = new Map<string, number>();
/** Maps toast IDs to their auto‑dismiss timers. */
const dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((fn) => fn());
}

function addToast(
  message: string,
  variant: SystemToastVariant = "info",
  duration = 3000,
  group?: string,
) {
  const now = Date.now();

  /* --- Deduplication: suppress identical messages within 2 s --- */
  const dedupKey = `${variant}::${message}`;
  const lastSeen = recentMessages.get(dedupKey);
  if (lastSeen !== undefined && now - lastSeen < DEDUP_WINDOW_MS) return -1;
  recentMessages.set(dedupKey, now);

  /* --- Collapse: if a group toast already exists, replace it --- */
  if (group) {
    const existingId = activeGroups.get(group);
    if (existingId !== undefined) {
      // Cancel the old timer
      const timer = dismissTimers.get(existingId);
      if (timer) { clearTimeout(timer); dismissTimers.delete(existingId); }
      // Replace message + variant in‑place
      toasts = toasts.map((t) =>
        t.id === existingId ? { ...t, message, variant, exiting: false } : t,
      );
      // Reset auto‑dismiss
      const newTimer = setTimeout(() => dismissToast(existingId), duration);
      dismissTimers.set(existingId, newTimer);
      activeGroups.set(group, existingId);
      emit();
      return existingId;
    }
  }

  /* --- Evict oldest when we already have MAX_VISIBLE toasts --- */
  const visible = toasts.filter((t) => !t.exiting);
  if (visible.length >= MAX_VISIBLE_TOASTS) {
    // Evict the lowest‑priority (then oldest) non‑exiting toast
    const sorted = [...visible].sort(
      (a, b) => PRIORITY[a.variant] - PRIORITY[b.variant] || a.id - b.id,
    );
    const evict = sorted[0];
    if (evict && PRIORITY[variant] >= PRIORITY[evict.variant]) {
      dismissToast(evict.id);
    }
  }

  const id = ++nextId;
  toasts = [...toasts, { id, message, variant, exiting: false, group }];
  if (group) activeGroups.set(group, id);
  emit();

  // Auto‑dismiss
  const timer = setTimeout(() => dismissToast(id), duration ?? DEFAULT_TOAST_DURATION);
  dismissTimers.set(id, timer);

  return id;
}

function dismissToast(id: number) {
  const entry = toasts.find((t) => t.id === id);
  if (!entry || entry.exiting) return;

  // Clean up group tracking
  if (entry.group) {
    const gid = activeGroups.get(entry.group);
    if (gid === id) activeGroups.delete(entry.group);
  }
  // Clean up timer
  const timer = dismissTimers.get(id);
  if (timer) { clearTimeout(timer); dismissTimers.delete(id); }

  // Mark as exiting (plays exit animation)
  toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t));
  emit();

  // Remove from DOM after exit animation completes
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, TOAST_EXIT_MS);
}

/**
 * Public API — call from anywhere (no hook required).
 *
 * @param message  Display text.
 * @param variant  info | success | warning | error (default "info").
 * @param duration Auto‑dismiss delay in ms (default 3000).
 * @param group    Optional grouping key — rapid updates within the same group
 *                 replace the previous toast instead of stacking.
 */
export function systemToast(
  message: string,
  variant?: SystemToastVariant,
  duration?: number,
  group?: string,
) {
  return addToast(message, variant, duration ?? DEFAULT_TOAST_DURATION, group);
}

/* ---- React component ---- */

function useToastStore() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
  );
}

export default function SystemToastContainer() {
  const items = useToastStore();

  if (items.length === 0) return null;

  return (
    <div className="ix-system-toast-container" role="status" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`ix-system-toast ix-system-toast--${t.variant}${t.exiting ? " ix-system-toast--exiting" : ""}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
