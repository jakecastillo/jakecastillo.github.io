// Warm the browser's graphics backend away from the UI thread. The real scene
// still renders on its original canvas; this temporary 1px context is released
// as soon as that canvas exists. No scene geometry or frames cross threads.
try {
  const surface = new OffscreenCanvas(1, 1);
  const context = surface.getContext("webgl2", {
    antialias: false,
    alpha: true,
    powerPreference: "low-power",
  });
  self.postMessage(Boolean(context));
} catch {
  self.postMessage(false);
}
