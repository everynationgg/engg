import { useSyncExternalStore } from "react";
import {
  getConnectionState,
  subscribeConnectionState,
  type ConnectionState,
} from "@/lib/socket";

const LABELS: Record<ConnectionState, string> = {
  connected: "Connected",
  reconnecting: "Reconnecting…",
  disconnected: "Disconnected",
};

/**
 * Tiny connection-state indicator: a colored dot + label.
 * Uses CSS classes ix-connection-dot--{state} from index.css.
 */
export default function ConnectionIndicator() {
  const state = useSyncExternalStore(subscribeConnectionState, getConnectionState);

  return (
    <span className="inline-flex items-center gap-1.5 select-none" aria-label={`Connection: ${LABELS[state]}`}>
      <span className={`ix-connection-dot ix-connection-dot--${state}`} />
      <span
        className="font-orbitron tracking-wide uppercase"
        style={{ fontSize: "0.58em", color: "hsl(210 30% 55%)" }}
      >
        {LABELS[state]}
      </span>
    </span>
  );
}
