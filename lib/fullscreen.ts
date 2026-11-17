/**
 * Browser fullscreen with a "settled" callback.
 *
 * The browser hides its tabs and toolbars instantly when it enters
 * fullscreen and nothing on the page can animate that. Focus views stay
 * dark while it happens and only play their entrance once the switch is
 * done, so the jump is never seen.
 *
 * Returns a cancel function. `onSettled` always runs once: after the
 * switch, or right away when fullscreen is unavailable, denied or
 * already on (with a safety timeout).
 */
export function requestFullscreenSettled(onSettled: () => void): () => void {
  const root = document.documentElement;
  let done = false;
  let timer = 0;
  const onChange = () => {
    if (document.fullscreenElement) window.setTimeout(finish, 60);
  };
  function finish() {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    document.removeEventListener("fullscreenchange", onChange);
    // Two frames so the resized layout has been painted.
    requestAnimationFrame(() => requestAnimationFrame(onSettled));
  }

  if (document.fullscreenElement || typeof root.requestFullscreen !== "function") {
    finish();
    return () => {};
  }
  document.addEventListener("fullscreenchange", onChange);
  timer = window.setTimeout(finish, 700);
  try {
    root.requestFullscreen({ navigationUI: "hide" }).catch(finish);
  } catch {
    finish();
  }
  return () => {
    done = true;
    window.clearTimeout(timer);
    document.removeEventListener("fullscreenchange", onChange);
  };
}

/** Leave fullscreen if we are in it (errors ignored). */
export function exitFullscreenQuietly() {
  if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
    document.exitFullscreen().catch(() => {});
  }
}

/** How long a Focus view takes to dissolve before leaving fullscreen. */
export const FOCUS_OUT_MS = 340;
