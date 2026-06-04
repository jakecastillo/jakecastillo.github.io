"use client";

/**
 * windowPhysics — a tiny client-only singleton that gives the jakeOS windows
 * real weight: fling them and they glide, bump each other, and settle.
 *
 * Design: matter-js owns motion; the DOM windows are positioned imperatively
 * via `transform` each frame (no React re-render in the hot loop). A window
 * registers its element on mount and unregisters on unmount. Dragging is
 * bridged from the titlebar pointer events into the body so collisions and
 * fling-momentum come for free. Honors prefers-reduced-motion by staying off
 * entirely (windows then position themselves with plain left/top).
 */

import type { Engine, World, Body } from "matter-js";

type Vec = { x: number; y: number };
type MatterMod = typeof import("matter-js");

interface WinReg {
  id: string;
  el: HTMLElement;
  w: number;
  h: number;
  cx: number;
  cy: number;
  body: Body | null;
  // Last center we persisted to the store, used to fire onSettle exactly once
  // per rest (no churn while a window sleeps undisturbed).
  settled: boolean;
  // Tracks the sleep edge so a window woken by a collision re-persists once it
  // settles again at its new spot.
  wasSleeping: boolean;
}

interface TidyTween {
  target: Vec;
  from: Vec | null;
  delay: number; // frames to wait (lets the toss read first)
  progress: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const MENUBAR_H = 36;
const DOCK_H = 96;
// How much of a window must stay reachable on each edge (macOS-style): the
// titlebar can never slide fully off-screen, so it's always grabbable again.
const EDGE_KEEP_X = 80; // px of width that must remain past either side edge
const TITLEBAR_KEEP = 30; // titlebar height that must remain above the dock
const GRID_GAP = 24; // breathing room between tidied windows / screen edges

class WindowPhysics {
  private M: MatterMod | null = null;
  private engine: Engine | null = null;
  private world: World | null = null;
  private walls: Body[] = [];
  private regs = new Map<string, WinReg>();
  private tidy = new Map<string, TidyTween>();
  private raf = 0;
  private running = false;
  private initStarted = false;
  reduced = false;

  private dragId: string | null = null;
  private dragPointer: Vec = { x: 0, y: 0 };
  private grabOffset: Vec = { x: 0, y: 0 };
  private dragVel: Vec = { x: 0, y: 0 };
  private focusedId: string | null = null;

  // Persist a window's resting top-left back to the store so maximize/restore
  // and minimize/restore return it to where the user left it (not its spawn).
  private onSettle: ((id: string, pos: Vec) => void) | null = null;

  get enabled() {
    return this.running && !this.reduced && !!this.M;
  }

  /** Wire a callback that receives a window's top-left when it stops moving. */
  setOnSettle(fn: (id: string, pos: Vec) => void) {
    this.onSettle = fn;
  }

  /**
   * Constrain a window's *center* so its titlebar always stays reachable:
   * never under the menubar, never fully past a side edge, never below the dock.
   */
  private clampCenter(cx: number, cy: number, w: number, h: number): Vec {
    if (typeof window === "undefined") return { x: cx, y: cy };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Top edge stays below the menubar; titlebar stays above the dock.
    const minY = MENUBAR_H + h / 2;
    const maxY = vh - DOCK_H - h / 2 + (h - TITLEBAR_KEEP);
    // Keep at least EDGE_KEEP_X of the window on-screen on each side.
    const minX = -w / 2 + EDGE_KEEP_X;
    const maxX = vw + w / 2 - EDGE_KEEP_X;
    return {
      x: clamp(cx, Math.min(minX, maxX), Math.max(minX, maxX)),
      y: clamp(cy, minY, Math.max(minY, maxY)),
    };
  }

  async init() {
    if (this.initStarted || typeof window === "undefined") return;
    this.initStarted = true;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pointer drag works in both modes (engine-driven or static fallback).
    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
    document.addEventListener("pointercancel", this.onPointerUp);

    if (this.reduced) {
      // No engine — windows place themselves statically.
      this.running = true;
      window.addEventListener("resize", this.onResizeStatic);
      this.regs.forEach((r) => this.placeStatic(r));
      return;
    }

    const mod = await import("matter-js");
    const M = (((mod as unknown as { default?: MatterMod }).default ?? mod) as MatterMod);
    this.M = M;
    this.engine = M.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
      enableSleeping: true, // settled windows truly rest (no jitter/drift)
      positionIterations: 8,
      velocityIterations: 8,
    });
    this.world = this.engine.world;
    this.buildWalls();

    window.addEventListener("resize", this.onResize);

    this.running = true;
    // Adopt any windows registered before the engine finished loading.
    this.regs.forEach((r) => this.ensureBody(r));
    this.loop();
  }

  private buildWalls() {
    if (!this.M || !this.world) return;
    const { Bodies, Composite } = this.M;
    if (this.walls.length) Composite.remove(this.world, this.walls);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const t = 600;
    const opt = { isStatic: true, restitution: 0.2, friction: 0 };
    const top = MENUBAR_H;
    const bottom = h - DOCK_H;
    this.walls = [
      Bodies.rectangle(w / 2, top - t / 2, w + 2 * t, t, opt), // ceiling (under menubar)
      Bodies.rectangle(w / 2, bottom + t / 2, w + 2 * t, t, opt), // floor (above dock)
      Bodies.rectangle(-t / 2, h / 2, t, h + 2 * t, opt), // left
      Bodies.rectangle(w + t / 2, h / 2, t, h + 2 * t, opt), // right
    ];
    Composite.add(this.world, this.walls);
  }

  private ensureBody(r: WinReg) {
    if (!this.M || !this.world || r.body) return;
    const { Bodies, Composite } = this.M;
    const body = Bodies.rectangle(r.cx, r.cy, r.w, r.h, {
      inertia: Infinity, // axis-aligned, never rotates (keeps text readable)
      frictionAir: 0.18,
      friction: 0,
      frictionStatic: 0,
      restitution: 0.05, // soft bumps, not bouncy
      density: 0.0018,
      slop: 6, // tolerate overlap instead of explosively separating
    });
    r.body = body;
    Composite.add(this.world, body);
  }

  /** Register a window element. `pos` is the top-left in viewport px. */
  register(id: string, el: HTMLElement, w: number, h: number, pos: Vec) {
    const reg: WinReg = {
      id,
      el,
      w,
      h,
      cx: pos.x + w / 2,
      cy: pos.y + h / 2,
      body: null,
      settled: true, // spawns at its persisted pos; nothing new to persist yet
      wasSleeping: true,
    };
    this.regs.set(id, reg);
    if (this.reduced) {
      this.placeStatic(reg);
    } else if (this.enabled) {
      this.ensureBody(reg);
    }
  }

  unregister(id: string) {
    const r = this.regs.get(id);
    if (r?.body && this.world && this.M) this.M.Composite.remove(this.world, r.body);
    this.regs.delete(id);
    this.tidy.delete(id);
    if (this.dragId === id) this.dragId = null;
  }

  private placeStatic(r: WinReg) {
    r.el.style.transform = `translate3d(${r.cx - r.w / 2}px, ${r.cy - r.h / 2}px, 0)`;
  }

  /** Begin dragging a window from its titlebar. */
  grab(id: string, clientX: number, clientY: number) {
    const r = this.regs.get(id);
    if (!r) return;
    this.tidy.delete(id);
    if (!this.enabled || !r.body) {
      // reduced-motion / no engine: fall back to simple pointer drag
      this.dragId = id;
      this.grabOffset = { x: clientX - r.cx, y: clientY - r.cy };
      this.dragPointer = { x: clientX, y: clientY };
      return;
    }
    this.dragId = id;
    r.settled = false;
    this.M!.Sleeping.set(r.body, false);
    this.grabOffset = { x: clientX - r.body.position.x, y: clientY - r.body.position.y };
    this.dragPointer = { x: clientX, y: clientY };
    this.dragVel = { x: 0, y: 0 };
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragId) return;
    this.dragPointer = { x: e.clientX, y: e.clientY };
    if (this.reduced || !this.M) {
      const r = this.regs.get(this.dragId);
      if (r) {
        const p = this.clampCenter(
          this.dragPointer.x - this.grabOffset.x,
          this.dragPointer.y - this.grabOffset.y,
          r.w,
          r.h,
        );
        r.cx = p.x;
        r.cy = p.y;
        this.placeStatic(r);
      }
    }
  };

  private onPointerUp = () => {
    if (!this.dragId) return;
    const r = this.regs.get(this.dragId);
    if (r) {
      if (r.body && this.M) {
        this.M.Body.setVelocity(r.body, {
          x: clamp(this.dragVel.x, -38, 38),
          y: clamp(this.dragVel.y, -38, 38),
        });
      } else {
        // reduced-motion / no engine: there is no settle loop, persist now.
        const p = this.clampCenter(r.cx, r.cy, r.w, r.h);
        r.cx = p.x;
        r.cy = p.y;
        this.placeStatic(r);
        this.onSettle?.(r.id, { x: r.cx - r.w / 2, y: r.cy - r.h / 2 });
      }
    }
    this.dragId = null;
  };

  private onResize = () => {
    if (!this.enabled) return;
    this.buildWalls();
    // Walls alone can't push back bodies already beyond them, so pull every
    // window back inside the new viewport and persist its corrected position.
    this.regs.forEach((r) => {
      if (!r.body || !this.M) return;
      const p = this.clampCenter(r.body.position.x, r.body.position.y, r.w, r.h);
      if (p.x !== r.body.position.x || p.y !== r.body.position.y) {
        this.M.Sleeping.set(r.body, false);
        this.M.Body.setPosition(r.body, p);
        this.M.Body.setVelocity(r.body, { x: 0, y: 0 });
        r.settled = false;
      }
    });
  };

  /**
   * Keyboard move: shift a focused window by (dx, dy) px, clamped on-screen,
   * and persist it. Works in both engine and reduced-motion modes.
   */
  nudge(id: string, dx: number, dy: number) {
    const r = this.regs.get(id);
    if (!r) return;
    const p = this.clampCenter(r.cx + dx, r.cy + dy, r.w, r.h);
    r.cx = p.x;
    r.cy = p.y;
    if (r.body && this.M) {
      this.M.Sleeping.set(r.body, false);
      this.M.Body.setPosition(r.body, p);
      this.M.Body.setVelocity(r.body, { x: 0, y: 0 });
      r.settled = false; // settle loop will persist once it comes to rest
    } else {
      this.placeStatic(r);
      this.onSettle?.(r.id, { x: r.cx - r.w / 2, y: r.cy - r.h / 2 });
    }
  }

  private onResizeStatic = () => {
    // Reduced-motion: no engine, just re-clamp each statically-placed window.
    this.regs.forEach((r) => {
      const p = this.clampCenter(r.cx, r.cy, r.w, r.h);
      if (p.x !== r.cx || p.y !== r.cy) {
        r.cx = p.x;
        r.cy = p.y;
        this.placeStatic(r);
        this.onSettle?.(r.id, { x: r.cx - r.w / 2, y: r.cy - r.h / 2 });
      }
    });
  };

  setFocused(id: string | null) {
    this.focusedId = id;
    if (!this.M) return;
    // A focused window gets heavier so it barely budges while you read it.
    this.regs.forEach((r) => {
      if (!r.body) return;
      this.M!.Body.setDensity(r.body, r.id === id ? 0.006 : 0.0018);
    });
  }

  /** Toss every window up, then rain them into a neat, on-screen grid. */
  runTidy() {
    const open = [...this.regs.values()].filter((r) => r.body);
    if (!open.length || !this.M) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Pick a column count that lets the widest window actually fit in a cell;
    // never request more columns than the viewport can hold side-by-side.
    const widest = Math.max(...open.map((r) => r.w));
    const fitCols = Math.max(1, Math.floor(w / (widest + GRID_GAP)));
    const cols = Math.max(1, Math.min(fitCols, Math.ceil(Math.sqrt(open.length))));
    const rows = Math.ceil(open.length / cols);
    const cellW = w / cols;
    const top = MENUBAR_H + GRID_GAP;
    const cellH = (h - DOCK_H - top) / rows;
    open.forEach((r, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Center the window in its cell, then clamp so it stays fully reachable
      // (titlebar below the menubar, body above the dock, no edge overflow).
      const target = this.clampCenter(
        cellW * col + cellW / 2,
        top + cellH * row + cellH / 2,
        r.w,
        r.h,
      );
      r.settled = false;
      this.M!.Sleeping.set(r.body!, false);
      this.M!.Body.setVelocity(r.body!, {
        x: (Math.random() - 0.5) * 8,
        y: -16 - Math.random() * 8,
      });
      this.tidy.set(r.id, { target, from: null, delay: 22, progress: 0 });
    });
  }

  private updateTidy() {
    if (!this.M) return;
    this.tidy.forEach((tw, id) => {
      const r = this.regs.get(id);
      if (!r?.body) {
        this.tidy.delete(id);
        return;
      }
      if (tw.delay > 0) {
        tw.delay -= 1;
        return;
      }
      if (!tw.from) tw.from = { x: r.body.position.x, y: r.body.position.y };
      tw.progress = Math.min(1, tw.progress + 1 / 30);
      const p = easeOutCubic(tw.progress);
      this.M!.Body.setPosition(r.body, {
        x: lerp(tw.from.x, tw.target.x, p),
        y: lerp(tw.from.y, tw.target.y, p),
      });
      this.M!.Body.setVelocity(r.body, { x: 0, y: 0 });
      if (tw.progress >= 1) this.tidy.delete(id);
    });
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.M || !this.engine) return;
    if (document.hidden) return;

    if (this.dragId) {
      const r = this.regs.get(this.dragId);
      if (r?.body) {
        // Clamp the drag target so the titlebar can't tunnel past the walls
        // (under the menubar, below the dock, or off a side edge).
        const t = this.clampCenter(
          this.dragPointer.x - this.grabOffset.x,
          this.dragPointer.y - this.grabOffset.y,
          r.w,
          r.h,
        );
        const prevX = r.body.position.x;
        const prevY = r.body.position.y;
        this.M.Body.setPosition(r.body, { x: t.x, y: t.y });
        this.M.Sleeping.set(r.body, false);
        // velocity = how fast the pointer is dragging it (for the fling)
        this.dragVel = { x: t.x - prevX, y: t.y - prevY };
        this.M.Body.setVelocity(r.body, this.dragVel);
      }
    }

    this.updateTidy();
    this.M.Engine.update(this.engine, 1000 / 60);

    this.regs.forEach((r) => {
      if (!r.body) return;
      r.cx = r.body.position.x;
      r.cy = r.body.position.y;
      r.el.style.transform = `translate3d(${r.cx - r.w / 2}px, ${r.cy - r.h / 2}px, 0)`;
      // A window woken by a collision should re-persist its new resting spot.
      if (r.wasSleeping && !r.body.isSleeping) r.settled = false;
      r.wasSleeping = r.body.isSleeping;
      // Once a window comes to rest, persist its top-left so maximize/restore
      // and minimize/restore return it here instead of its spawn point.
      if (!r.settled && r.body.isSleeping && this.dragId !== r.id) {
        r.settled = true;
        this.onSettle?.(r.id, { x: r.cx - r.w / 2, y: r.cy - r.h / 2 });
      }
    });
  };
}

export const windowPhysics = new WindowPhysics();
