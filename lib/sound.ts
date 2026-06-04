/**
 * lib/sound.ts — a tiny, default-OFF, synthesized Web Audio layer (R9).
 *
 * A real OS has sounds; the cloneable desktop-metaphor templates skip them. This
 * adds exactly TWO oscillator-only tones — no asset fetch, no binary on the
 * critical path:
 *   - a soft "lock" tick (the perimeter SEAL re-fire)
 *   - a faint "focus" tick (a window gaining focus / opening)
 *
 * Design constraints (honored exactly):
 *   - STATIC EXPORT / SSR-safe: every browser API is `typeof`-guarded; nothing
 *     touches `window`/`AudioContext` at module-eval time. Safe to import from
 *     server-rendered code paths.
 *   - DEFAULT OFF: gated on a localStorage opt-in flag (`jakeos:sound-on`),
 *     persisted via the shared firstRun getFlag/setFlag helpers. Absent key →
 *     `false` → silence, so the overwhelming majority of visitors never hear it.
 *   - REDUCED MOTION: no sound when `prefers-reduced-motion: reduce` — sound is
 *     part of the motion/feedback layer, so it follows the same a11y posture.
 *   - LAZY UNLOCK: the AudioContext is created/resumed on the FIRST user gesture
 *     (autoplay-policy compliant); before that, play calls are silent no-ops.
 *   - LOW LEVEL: peak gain stays tiny (~-18 LUFS-ish perceptual target) and every
 *     tone is a short enveloped blip, never a sustained tone.
 *
 * Wiring (set up once, lazily, by the store module — see initSoundWiring):
 *   (a) focus/open tick — fires when `focusedId` changes
 *   (b) lock SEAL tick  — fires when `secureActionAt` changes (the re-snap beat)
 * There is intentionally NO per-keystroke clack (cut as most plumbing / least
 * payoff).
 */

import { getFlag, setFlag } from "./firstRun";

/**
 * Canonical opt-in flag key. Absent (the default) means OFF, so getFlag()
 * returning false on a fresh visit yields silence with zero extra logic.
 */
export const SOUND_ON = "jakeos:sound-on";

// Lazily-created context + a shared master gain so a single value caps overall
// level. Both are null until the first gesture unlocks audio.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

// Guards so we attach the gesture-unlock + store wiring exactly once.
let unlockArmed = false;
let wired = false;

// Master ceiling. Individual blips set their own (smaller) envelope peak; this
// is a hard cap so the layer can never get loud regardless of overlap. Kept low
// to land around the -18 LUFS perceptual target for short sine blips.
const MASTER_GAIN = 0.14;

/** True only in a browser that exposes the Web Audio API. */
function audioSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        ("AudioContext" in window || "webkitAudioContext" in window)
    );
}

/** SSR-safe reduced-motion check (sound follows the motion a11y posture). */
function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !("matchMedia" in window)) return false;
    try {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
}

/** Whether a tone is allowed to play right now: opted-in AND motion-allowed. */
function soundActive(): boolean {
    return getFlag(SOUND_ON) && !prefersReducedMotion();
}

/** Public read of the opt-in flag (for the Menubar toggle's initial state). */
export function isSoundOn(): boolean {
    return getFlag(SOUND_ON);
}

/**
 * Persist the opt-in flag. When turning ON we also attempt to unlock the context
 * synchronously — this call runs inside the toggle's click handler, which is a
 * user gesture, so resuming here satisfies the autoplay policy immediately
 * (rather than waiting for the next unrelated gesture).
 */
export function setSoundOn(on: boolean): void {
    setFlag(SOUND_ON, on);
    if (on) unlock();
}

/**
 * Lazily create (or resume) the AudioContext + master gain. Must be called from
 * within a user gesture the first time to satisfy browser autoplay policy. Safe
 * to call repeatedly; a no-op once a running context exists.
 */
function unlock(): void {
    if (!audioSupported()) return;
    try {
        if (!ctx) {
            const Ctor =
                window.AudioContext ??
                (window as unknown as { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext;
            ctx = new Ctor();
            master = ctx.createGain();
            master.gain.value = MASTER_GAIN;
            master.connect(ctx.destination);
        }
        // Some browsers start the context "suspended"; resume() inside a gesture
        // flips it to "running".
        if (ctx.state === "suspended") {
            void ctx.resume();
        }
    } catch {
        // Web Audio can throw under strict policies / blocked autoplay — fail
        // silent. Sound is non-essential polish.
        ctx = null;
        master = null;
    }
}

/**
 * Arm a one-time, passive set of first-gesture listeners that unlock the context
 * the first time the user interacts. Removes itself after the first fire. Called
 * by initSoundWiring; harmless if audio is unsupported.
 */
function armGestureUnlock(): void {
    if (unlockArmed || typeof window === "undefined" || !audioSupported()) return;
    unlockArmed = true;
    const events: Array<keyof WindowEventMap> = [
        "pointerdown",
        "keydown",
        "touchstart",
    ];
    const onFirstGesture = () => {
        unlock();
        for (const e of events) window.removeEventListener(e, onFirstGesture);
    };
    for (const e of events) {
        window.addEventListener(e, onFirstGesture, { passive: true });
    }
}

/**
 * Synthesize a single short, enveloped sine "blip". Internal primitive shared by
 * both public tones. Silent if the layer is inactive (opted-out / reduced-motion)
 * or the context hasn't unlocked yet.
 *
 * @param freq      base frequency in Hz
 * @param peak      envelope peak gain (kept small; multiplied by master ceiling)
 * @param duration  total length in seconds (short — these are ticks, not tones)
 * @param glideTo   optional target frequency to glide toward (adds a soft "tick"
 *                  character without an extra oscillator)
 */
function blip(
    freq: number,
    peak: number,
    duration: number,
    glideTo?: number,
): void {
    if (!soundActive() || !ctx || !master) return;
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        if (glideTo !== undefined) {
            osc.frequency.exponentialRampToValueAtTime(
                glideTo,
                now + duration * 0.9,
            );
        }

        // Fast attack, exponential-ish decay to (near) silence so each tone is a
        // soft click, never a hum. exponentialRampToValueAtTime can't target 0,
        // so we ramp to a tiny floor then hard-stop.
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + duration + 0.02);

        // Release nodes once the tone has rung out so they don't accumulate.
        osc.onended = () => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch {
                // already disconnected — ignore
            }
        };
    } catch {
        // Never let a polish tone surface an error.
    }
}

/**
 * Soft "lock" tick — the perimeter SEAL. A two-note close (a short high glide
 * settling onto a lower fundamental) reads as a latch/seal "click". Reserved for
 * the deliberate secure-action re-snap, so it stays rare and meaningful.
 */
export function playLockTick(): void {
    // A brief upper note that glides down and seals — the "snap closed" feel.
    blip(660, 0.5, 0.16, 420);
}

/**
 * Faint "focus" tick — a window gaining focus / opening. Quieter and shorter than
 * the lock tick so frequent focus changes stay a whisper, never a melody.
 */
export function playFocusTick(): void {
    blip(880, 0.22, 0.06);
}

/**
 * Wire the two call sites to shared desktop state, exactly once, on the client.
 *
 * Subscribes to useDesktopStore and fires:
 *   (a) playFocusTick() when `focusedId` changes (covers open + focus)
 *   (b) playLockTick()  when `secureActionAt` changes (the SEAL re-snap)
 *
 * The store calls this from a `typeof window` guard at the bottom of its module,
 * so the subscription owner is the store (single source of truth) and works on
 * BOTH the desktop and mobile shells (the orb's own subscription doesn't, since
 * the Canvas is unmounted on low-power / mobile-scrim paths).
 *
 * The store import is done lazily INSIDE this function to keep module-eval order
 * clean across the store <-> sound import cycle (the reference resolves only when
 * the store calls us, by which point its module has finished initializing).
 */
export async function initSoundWiring(): Promise<void> {
    if (wired || typeof window === "undefined") return;
    wired = true;

    armGestureUnlock();

    // Lazy import breaks the static cycle: the store imports this module to call
    // initSoundWiring(); we import the store back only here, after it's ready.
    const { useDesktopStore } = await import("@/store/useDesktopStore");

    const initial = useDesktopStore.getState();
    let lastFocus = initial.focusedId;
    let lastSecureAt = initial.secureActionAt;

    useDesktopStore.subscribe((state) => {
        const focusChanged = state.focusedId !== lastFocus;
        const sealChanged = state.secureActionAt !== lastSecureAt;

        // Opening Contact stamps secureActionAt AND moves focus in the same store
        // write, so both flags trip at once. The SEAL is the meaningful beat —
        // play only the lock tick then and SUPPRESS the focus whisper so the
        // contact-open never stutters as a muddy double-blip.
        if (focusChanged) lastFocus = state.focusedId;
        if (sealChanged) lastSecureAt = state.secureActionAt;

        if (sealChanged && state.secureActionAt != null) {
            // (b) Lock SEAL tick — the perimeter re-snap.
            playLockTick();
        } else if (focusChanged && state.focusedId) {
            // (a) Focus/open tick — a window gained focus (no concurrent seal).
            playFocusTick();
        }
    });
}
