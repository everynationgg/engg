/**
 * backNavigation.ts — Unified Back Navigation & Modal Stack Manager
 *
 * Implements Android hardware Back, browser popstate, and Escape key handling
 * with a strictly prioritized LIFO stack:
 *
 * Priority levels:
 * 100: Topmost dialog / confirmation (ConfirmModal)
 *  80: Role details preview modal (RolePreview in RoleConfigPage)
 *  60: Sub-modals (ShopModal, SettingsModal, ProfileModal, HowToPlayModal, ChatModal)
 *  40: Navigation drawer / sidebar (LandingSidebar, HamburgerMenu)
 *  20: Game menu / overlay
 *
 * When any overlay opens, it registers a close handler. Pressing Android Back
 * or browser Back closes the topmost overlay without navigating away from the game.
 */

export interface BackHandlerEntry {
  id: string;
  priority: number;
  handler: () => boolean; // return true if handled (consumed)
}

class BackNavigationManager {
  private handlers: BackHandlerEntry[] = [];
  private hasHistorySentinel = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", this.onPopState);
      document.addEventListener("backbutton", this.onNativeBackButton);
      window.addEventListener("keydown", this.onKeyDown, true);
    }
  }

  private ensureHistorySentinel(): void {
    if (this.hasHistorySentinel || typeof window === "undefined") return;
    try {
      window.history.pushState({ enggModalGuard: true }, "");
      this.hasHistorySentinel = true;
    } catch {
      // Ignore if pushState fails in restricted environments
    }
  }

  /**
   * Register a back handler. Ensures a single synthetic history sentinel is active
   * while one or more modals are open so Android hardware Back triggers popstate
   * without ever calling history.back() during React effect cleanups.
   */
  public register(handler: () => boolean, priority = 50): () => void {
    const id = Math.random().toString(36).slice(2, 9);
    const entry: BackHandlerEntry = { id, priority, handler };

    // Insert sorted by priority ascending (highest priority at the end of the array)
    const index = this.handlers.findIndex((h) => h.priority > priority);
    if (index === -1) {
      this.handlers.push(entry);
    } else {
      this.handlers.splice(index, 0, entry);
    }

    this.ensureHistorySentinel();

    return () => {
      this.unregister(id);
    };
  }

  public unregister(id: string): void {
    const idx = this.handlers.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.handlers.splice(idx, 1);
      // IMPORTANT: Never call window.history.back() inside unregister()!
      // Calling history.back() during React useEffect cleanup fires an asynchronous
      // popstate event on the next tick that races with re-renders and closes open modals.
    }
  }

  /**
   * Handle the topmost registered back action.
   * Returns true if a modal/overlay was closed, false if none was active.
   */
  public handleBack(): boolean {
    if (this.handlers.length === 0) return false;

    // Pop the highest priority handler (at the end of the array)
    const top = this.handlers.pop();
    if (!top) return false;

    try {
      const consumed = top.handler();
      return consumed !== false;
    } catch (err) {
      console.error("[BackNavigationManager] Error running back handler:", err);
      return true;
    }
  }

  private onPopState = () => {
    this.hasHistorySentinel = false;
    if (this.handlers.length > 0) {
      this.handleBack();
      if (this.handlers.length > 0) {
        this.ensureHistorySentinel();
      }
    }
  };

  private onNativeBackButton = (e: Event) => {
    if (this.handlers.length > 0) {
      e.preventDefault();
      e.stopImmediatePropagation?.();
      this.handleBack();
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.handlers.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      this.handleBack();
    }
  };
}

export const backNavigation = new BackNavigationManager();
