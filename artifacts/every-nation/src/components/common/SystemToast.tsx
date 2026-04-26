import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/*  Lightweight system-feedback toast overlay                         */
/* ------------------------------------------------------------------ */

export type SystemToastVariant = "info" | "success" | "warning" | "error";

interface ToastEntry {
  id: number;
  message: string;
  variant: SystemToastVariant;
  exiting: boolean;
  group?: string;
}

const PRIORITY: Record<SystemToastVariant, number> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
};

const TOAST_EXIT_MS = 160;
const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_TOAST_DURATION = 3000;
const DEDUP_WINDOW_MS = 2000;

let nextId = 0;
let toasts: ToastEntry[] = [];
const listeners = new Set<() => void>();

const recentMessages = new Map<string, number>();
const activeGroups = new Map<string, number>();
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

  const dedupKey = `${variant}::${message}`;
  const lastSeen = recentMessages.get(dedupKey);
  if (lastSeen !== undefined && now - lastSeen < DEDUP_WINDOW_MS) return -1;
  recentMessages.set(dedupKey, now);

  if (group) {
    const existingId = activeGroups.get(group);
    if (existingId !== undefined) {
      const timer = dismissTimers.get(existingId);
      if (timer) { clearTimeout(timer); dismissTimers.delete(existingId); }
      toasts = toasts.map((t) =>
        t.id === existingId ? { ...t, message, variant, exiting: false } : t,
      );
      const newTimer = setTimeout(() => dismissToast(existingId), duration);
      dismissTimers.set(existingId, newTimer);
      activeGroups.set(group, existingId);
      emit();
      return existingId;
    }
  }

  const visible = toasts.filter((t) => !t.exiting);
  if (visible.length >= MAX_VISIBLE_TOASTS) {
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

  const timer = setTimeout(() => dismissToast(id), duration ?? DEFAULT_TOAST_DURATION);
  dismissTimers.set(id, timer);

  return id;
}

function dismissToast(id: number) {
  const entry = toasts.find((t) => t.id === id);
  if (!entry || entry.exiting) return;

  if (entry.group) {
    const gid = activeGroups.get(entry.group);
    if (gid === id) activeGroups.delete(entry.group);
  }
  const timer = dismissTimers.get(id);
  if (timer) { clearTimeout(timer); dismissTimers.delete(id); }

  toasts = toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t));
  emit();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, TOAST_EXIT_MS);
}

export function systemToast(
  message: string,
  variant?: SystemToastVariant,
  duration?: number,
  group?: string,
) {
  return addToast(message, variant, duration ?? DEFAULT_TOAST_DURATION, group);
}

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
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none" role="status" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded border bg-[#0c1016]/95 backdrop-blur-md font-mono text-[10px] tracking-widest uppercase transition-all duration-300 ${
            t.exiting ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"
          }`}
          style={{
            borderColor: t.variant === "error" ? "#ff4e4e40" : t.variant === "warning" ? "#ffaa0040" : t.variant === "success" ? "#10b98140" : "#00f3ff40",
            color: t.variant === "error" ? "#ff4e4e" : t.variant === "warning" ? "#ffaa00" : t.variant === "success" ? "#10b981" : "#00f3ff",
            boxShadow: `0 0 20px ${t.variant === "error" ? "#ff4e4e15" : t.variant === "warning" ? "#ffaa0015" : t.variant === "success" ? "#10b98115" : "#00f3ff15"}`
          }}
        >
          <div className="flex items-center gap-3">
             <div className={`w-1 h-3 ${
               t.variant === "error" ? "bg-red-500" : t.variant === "warning" ? "bg-amber-500" : t.variant === "success" ? "bg-emerald-500" : "bg-cyan-500"
             }`} />
             {t.message}
          </div>
        </div>
      ))}
    </div>
  );
}
