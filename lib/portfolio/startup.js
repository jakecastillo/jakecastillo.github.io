// Give input, layout and paint a turn between optional graphics startup steps.
export async function yieldToBrowser(signal, delay = 0) {
  signal?.throwIfAborted();
  if (!delay && globalThis.scheduler?.yield) await globalThis.scheduler.yield();
  else await new Promise((resolve) => setTimeout(resolve, delay));
  signal?.throwIfAborted();
}

export function warmGraphics(signal) {
  let worker;
  let timer;
  let finish;
  const ready = new Promise((resolve) => {
    finish = resolve;
  });
  const dispose = () => {
    clearTimeout(timer);
    signal?.removeEventListener("abort", dispose);
    worker?.terminate();
    finish();
  };
  if (signal?.aborted || typeof OffscreenCanvas === "undefined") {
    finish();
    return { ready, dispose };
  }
  try {
    worker = new Worker("/graphics-worker.js", {
      type: "module",
    });
    worker.onmessage = () => {
      clearTimeout(timer);
      finish();
    };
    worker.onerror = (event) => {
      event.preventDefault();
      dispose();
    };
    // A blocked or unsupported worker must never prevent normal WebGL startup.
    timer = setTimeout(dispose, 1500);
    signal?.addEventListener("abort", dispose, { once: true });
  } catch {
    dispose();
  }
  return { ready, dispose };
}
