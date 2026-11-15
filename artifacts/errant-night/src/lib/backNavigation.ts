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
  private historyPushedCount = 0;
  private isHandlingPopstate = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", this.onPopState);
      document.addEventListener("backbutton", this.onNativeBackButton);
      window.addEventListener("keydown", this.onKeyDown, true);
    }
  }

  /**
   * Register a back handler. Automatically pushes a synthetic history entry
   * so browser / Android hardware back button triggers popstate.
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

    // Push a synthetic history state so Android hardware Back triggers popstate instead of leaving
    try {
      window.history.pushState({ enggModalId: id }, "");
      this.historyPushedCount++;
    } catch {
      // Ignore if pushState fails in restricted environments
    }

    return () => {
      this.unregister(id);
    };
  }

  public unregister(id: string): void {
    const idx = this.handlers.findIndex((h) => h.id === id);
    if (idx !== -1) {
      this.handlers.splice(idx, 1);
      // Clean up the synthetic history entry if this wasn't triggered by popstate
      if (!this.isHandlingPopstate && this.historyPushedCount > 0) {
        this.historyPushedCount--;
        try {
          window.history.back();
        } catch {
          // ignore
        }
      }
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

  private onPopState = (e: PopStateEvent) => {
    if (this.handlers.length > 0) {
      // Modal is active! Consume the popstate by closing the topmost modal
      this.isHandlingPopstate = true;
      if (this.historyPushedCount > 0) {
        this.historyPushedCount--;
      }
      this.handleBack();
      this.isHandlingPopstate = false;
    }
  };

  private onNativeBackButton = (e: Event) => {
    if (this.handlers.length > 0) {
      e.preventDefault();
      e.stopImmediatePropagation?.();
      // Emulate history pop
      if (this.historyPushedCount > 0) {
        try {
          window.history.back();
        } catch {
          this.handleBack();
        }
      } else {
        this.handleBack();
      }
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
