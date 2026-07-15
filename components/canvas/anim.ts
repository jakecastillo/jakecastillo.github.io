// components/canvas/anim.ts
// Frame-rate-independent exponential smoothing (a.k.a. damp / "smooth-follow").
// Equivalent to maath's easing.damp, hand-rolled to avoid a new dependency.
// `lambda` is the decay rate (higher = faster convergence). At a fixed lambda
// the result is identical whether called at 30fps or 60fps, because it folds
// the real elapsed `delta` (seconds) into the exponent.
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}
