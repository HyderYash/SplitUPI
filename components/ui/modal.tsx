"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const el = ref.current;
    const outsideElements: Array<{ element: HTMLElement; inert: boolean }> = [];
    // Isolate every sibling outside the dialog's ancestry, including the
    // header and footer, while preserving any pre-existing inert state.
    let branch: HTMLElement | null = el?.parentElement ?? null;
    while (branch && branch !== document.body) {
      for (const sibling of Array.from(branch.parentElement?.children ?? [])) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          outsideElements.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
    }
    el?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    function focusableElements() {
      return Array.from(
        el?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((item) => item.getClientRects().length > 0 && !item.closest("[inert]"));
    }
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && el) {
        const focusable = focusableElements();
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (!first) {
          e.preventDefault();
          el.focus();
          return;
        }
        if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    function containFocus(event: FocusEvent) {
      if (el && !el.contains(event.target as Node)) {
        (focusableElements()[0] ?? el).focus({ preventScroll: true });
      }
    }
    document.addEventListener("keydown", handle);
    document.addEventListener("focusin", containFocus);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handle);
      document.removeEventListener("focusin", containFocus);
      outsideElements.forEach(({ element, inert }) => { element.inert = inert; });
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
