"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { useTiltStore } from "@/hooks/useTiltStore";

type DOEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// "Make the background react to tilt" affordance. Shown only on coarse-pointer,
// non-reduced-motion devices that expose DeviceOrientationEvent, and only until
// the user enables it. iOS requires DeviceOrientationEvent.requestPermission()
// to be called from inside the tap handler — Android and other platforms have
// no such gate, so we enable directly there. Self-hides on desktop /
// reduced-motion / once enabled, so it is inert outside touch devices.
//
// Self-explanatory chrome (jc-wpd): the compass icon alone read as maps/
// location, so the control carries a visible "Tilt" micro-label; on permission
// denial it shows a brief "tilt off" note instead of silently vanishing as if
// broken.
export default function TiltEnable() {
  const enabled = useTiltStore((s) => s.enabled);
  const enable = useTiltStore((s) => s.enable);
  const [show, setShow] = useState(false);
  const [denied, setDenied] = useState(false);

  // Reveal in an effect (never at render time) so server and first client paint
  // agree; the matchMedia/feature probe runs client-side only. The reveal is
  // deferred to the next frame so the state update isn't synchronous within the
  // effect (matching BackgroundScene's idle/timeout-gated mount pattern).
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasDO = typeof window.DeviceOrientationEvent !== "undefined";
    if (!(coarse && !reduced && hasDO)) return;
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Deny feedback lingers just long enough to read, then the control retires.
  useEffect(() => {
    if (!denied) return;
    const id = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(id);
  }, [denied]);

  if (!show || enabled) return null;

  if (denied) {
    return (
      <span
        role="status"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface-overlay/70 px-4 font-mono text-[0.6875rem] uppercase tracking-widest text-muted-foreground backdrop-blur-xl"
      >
        <Compass size={18} strokeWidth={1.75} aria-hidden="true" />
        tilt off
      </span>
    );
  }

  const onEnable = async () => {
    const DO = window.DeviceOrientationEvent as DOEventCtor | undefined;
    try {
      if (DO && typeof DO.requestPermission === "function") {
        const res = await DO.requestPermission();
        if (res !== "granted") {
          setDenied(true);
          return;
        }
      }
      enable();
      setShow(false);
    } catch {
      setDenied(true);
    }
  };

  return (
    <button
      type="button"
      onClick={onEnable}
      // Accessible name starts with the visible label (WCAG 2.5.3).
      aria-label="Tilt — make the background react to device tilt"
      className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface-overlay/70 px-4 font-mono text-[0.6875rem] uppercase tracking-widest text-muted-foreground backdrop-blur-xl transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary-hover)] active:scale-[0.95]"
    >
      <Compass size={18} strokeWidth={1.75} aria-hidden="true" />
      Tilt
    </button>
  );
}
