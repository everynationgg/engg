import { useEffect, useRef } from "react";

/**
 * Focus trap hook for modals/dialogs.
 * Returns a ref to attach to the modal root.
 * Traps focus within the modal and restores focus to the previously focused element on close.
 */
export function useFocusTrap(isOpen: boolean) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    lastActiveElement.current = document.activeElement as HTMLElement;
    const node = modalRef.current;
    if (!node) return;

    // Focus the first focusable element in the modal
    const focusable = node.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.hasAttribute('disabled'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    node.addEventListener("keydown", handleKeyDown);
    return () => {
      node.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the previously focused element
      lastActiveElement.current?.focus();
    };
  }, [isOpen]);

  return modalRef;
}
