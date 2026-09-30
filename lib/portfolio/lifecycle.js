// One abortable subscription scope per enhancement mount, including React Strict Mode.
export function createLifecycle() {
  const controller = new AbortController();
  const frames = new Set();
  const on = (target, type, listener, options = {}) => {
    target.addEventListener(type, listener, {
      ...options,
      signal: controller.signal,
    });
  };
  const nextFrame = (callback) => {
    const id = requestAnimationFrame(() => {
      frames.delete(id);
      if (!controller.signal.aborted) callback();
    });
    frames.add(id);
    return id;
  };
  return {
    on,
    nextFrame,
    signal: controller.signal,
    dispose() {
      controller.abort();
      frames.forEach(cancelAnimationFrame);
      frames.clear();
    },
  };
}
