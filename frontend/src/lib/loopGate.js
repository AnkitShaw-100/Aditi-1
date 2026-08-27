/**
 * Starts and stops an animation loop so it only runs while its section is on
 * screen and the tab is visible.
 *
 * The canvas and WebGL loops on this site each drove requestAnimationFrame
 * unconditionally, so a shader in the Mission section and a dot grid in the
 * FAQ kept a core and the GPU busy the whole time a reader was somewhere
 * else on the page, and kept running in background tabs.
 *
 * `start` and `stop` own the actual frame scheduling, so a loop that already
 * re-schedules itself needs no restructuring to use this.
 */
export function createLoopGate(element, { start, stop, rootMargin = "200px" }) {
  let onScreen = false;
  let running = false;

  function sync() {
    const shouldRun = onScreen && !document.hidden;

    if (shouldRun === running) {
      return;
    }

    running = shouldRun;

    if (shouldRun) {
      start();
    } else {
      stop();
    }
  }

  const observer =
    typeof IntersectionObserver === "undefined" || !element
      ? null
      : new IntersectionObserver(
          (entries) => {
            onScreen = entries.some((entry) => entry.isIntersecting);
            sync();
          },
          { rootMargin }
        );

  if (observer) {
    observer.observe(element);
  } else {
    // No observer support, or nothing to observe: behave as it did before.
    onScreen = true;
  }

  document.addEventListener("visibilitychange", sync);
  sync();

  return function release() {
    observer?.disconnect();
    document.removeEventListener("visibilitychange", sync);

    if (running) {
      running = false;
      stop();
    }
  };
}
