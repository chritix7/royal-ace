/**
 * Closing animations for every panel, dialog and menu, without touching
 * each component: when React removes one from the page, a frozen copy is
 * put back in its place for a moment and dissolves into a blur (the
 * reverse of the blur-in entrance), then the copy is removed.
 *
 * What counts as "closable": dialogs and menus (role), overlays with an
 * entrance class, or anything marked data-exit. Content that just swaps
 * inside a panel is not affected.
 */

const ENTRANCE = [
  "blur-in",
  "blur-in-fast",
  "backdrop-in",
  "animate-vegas-fade",
  "animate-vegas-pop",
  "animate-insurance-slide-in",
  "focus-zoom-in",
];

const ROOT_SELECTOR =
  '[data-exit], [role="dialog"], [role="menu"], .backdrop-in, .animate-vegas-fade, .blur-in-fast';
const PANEL_SELECTOR =
  '.blur-in, .animate-vegas-pop, .animate-insurance-slide-in, [class*="drawerIn"]';

const EXIT_MS = 320;
let installed = false;

function eligible(el: Element) {
  if (el.closest("[data-exit-ghost]")) return false;
  // Focus views animate (or not, on phones) by themselves.
  if (el.hasAttribute("data-no-exit")) return false;
  if (el.matches(ROOT_SELECTOR)) return true;
  // Overlay wrapper (fixed, full screen) holding a dialog.
  const cls = typeof el.className === "string" ? el.className : "";
  return /\bfixed\b/.test(cls) && !!el.querySelector('[role="dialog"]');
}

function ghost(el: HTMLElement, parent: Node, next: Node | null) {
  if (!(parent instanceof Element) || !parent.isConnected) return;
  const clone = el.cloneNode(true) as HTMLElement;
  const panel = (clone.matches(PANEL_SELECTOR) ? clone : clone.querySelector(PANEL_SELECTOR)) as HTMLElement | null;
  const drawer = !!panel && /drawerIn/.test(panel.className);

  // Freeze: no entrance animations, no ids, no interaction.
  const all = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
  for (const n of all) {
    n.removeAttribute("id");
    n.style.animation = "none";
    ENTRANCE.forEach((c) => n.classList?.remove(c));
  }
  clone.setAttribute("data-exit-ghost", "");
  clone.setAttribute("aria-hidden", "true");
  clone.style.pointerEvents = "none";

  const full = /\binset-0\b/.test(clone.className);
  const ease = "cubic-bezier(0.4, 0, 1, 1)";
  if (panel && panel !== clone) {
    clone.style.animation = `exit-fade ${EXIT_MS}ms ${ease} forwards`;
    panel.style.animation = `${drawer ? "exit-drawer" : "exit-panel"} ${EXIT_MS}ms ${ease} forwards`;
  } else {
    clone.style.animation = `${full ? "exit-fade" : drawer ? "exit-drawer" : "exit-panel"} ${EXIT_MS}ms ${ease} forwards`;
  }

  const ref = next && next.parentNode === parent ? next : null;
  try {
    parent.insertBefore(clone, ref);
  } catch {
    return;
  }
  window.setTimeout(() => clone.remove(), EXIT_MS + 40);
}

export function installExitAnimations() {
  if (installed || typeof window === "undefined" || typeof MutationObserver === "undefined") return;
  installed = true;
  const reduced = () =>
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mo = new MutationObserver((records) => {
    if (reduced()) return;
    for (const r of records) {
      r.removedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement) || node.hasAttribute("data-exit-ghost")) return;
        if (eligible(node)) ghost(node, r.target, r.nextSibling);
      });
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
