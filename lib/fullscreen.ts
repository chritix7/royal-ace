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
    if (document.fullscreenElement) finish();
  };
  function finish() {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    document.removeEventListener("fullscreenchange", onChange);
    // Phones resize the viewport progressively (the address bar slides
    // away): wait until the size is stable before starting the entrance.
    whenViewportStable(onSettled);
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

/**
 * Calls `cb` once the viewport size has not changed for a few frames
 * (max ~600 ms), so animations never start in the middle of a resize.
 */
export function whenViewportStable(cb: () => void) {
  let last = `${window.innerWidth}x${window.innerHeight}`;
  let still = 0;
  const started = performance.now();
  const tick = () => {
    const now = `${window.innerWidth}x${window.innerHeight}`;
    still = now === last ? still + 1 : 0;
    last = now;
    if (still >= 4 || performance.now() - started > 600) cb();
    else requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Leave fullscreen, then call `cb` once the page has settled. */
export function exitFullscreenSettled(cb: () => void) {
  if (!document.fullscreenElement || typeof document.exitFullscreen !== "function") {
    cb();
    return;
  }
  let called = false;
  const go = () => {
    if (called) return;
    called = true;
    whenViewportStable(cb);
  };
  document.exitFullscreen().then(go, go);
  window.setTimeout(go, 700);
}

/** Leave fullscreen if we are in it (errors ignored). */
export function exitFullscreenQuietly() {
  if (document.fullscreenElement && typeof document.exitFullscreen === "function") {
    document.exitFullscreen().catch(() => {});
  }
}

/** How long a Focus view takes to dissolve before leaving fullscreen. */
export const FOCUS_OUT_MS = 260;

/** Phones and small tablets: Focus opens and closes with no animation. */
export function isNarrowScreen() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 1023px)").matches;
}
