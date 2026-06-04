/**
 * lib/sound.ts — a tiny, default-OFF, synthesized Web Audio layer (R9).
 *
 * A real OS has sounds; the cloneable desktop-metaphor templates skip them. This
 * adds exactly ONE oscillator-only tone — no asset fetch, no binary on the
 * critical path:
 *   - the SEAL: a soft latch "click" on the deliberate secure action (the audible
 *     twin of the orb's cyan lock-ring snap). No per-window-open whisper — sound
 *     is the rationed signature, mirroring cyan in the visual system.
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
 *   the SEAL fires when `secureActionAt` changes (the deliberate secure beat).
 * That is the ONLY trigger — no focus/open whisper, no per-keystroke clack.
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
    // Also require a RUNNING context: ctx.resume() is async, so right after the
    // first-gesture unlock the context can still be "suspended" — scheduling onto
    // it drops the tone silently. We'd rather skip that one tone than replay it
    // late (a delayed seal click is worse than a missed one).
    if (!soundActive() || !ctx || !master || ctx.state !== "running") return;
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
 * The perimeter SEAL — the ONE interaction tone. A short upper note glides down
 * and latches onto a lower fundamental, reading as a "seal/latch click". It is
 * the audible twin of the orb's cyan lock-ring snap, reserved for the deliberate
 * secure action so it stays rare and meaningful. There is intentionally no
 * per-window-open "focus" whisper — sound is the rationed signature, mirroring
 * how cyan is rationed in the visual system.
 */
export function playSeal(): void {
    // A brief upper note that glides down and seals — the "snap closed" feel.
    blip(660, 0.5, 0.16, 420);
}

/**
 * Wire the single sound — the SEAL — to shared desktop state, once, on the client.
 *
 * Subscribes to useDesktopStore and watches ONLY `secureActionAt` (the same
 * signal the orb's visual lock-ring snap watches), firing playSeal() when it
 * changes. This is gesture-accurate WITHOUT inferring intent from a pile of
 * unrelated state diffs:
 *   - A logical secure action that writes the store more than once still fires
 *     EXACTLY ONE tone — e.g. open('contact') stamps secureActionAt via
 *     pulseSecure(), THEN writes windows/focus in a separate set(); only the
 *     first write changes secureActionAt, so only one seal plays (this is the
 *     fix for the old "double-blip" where a focusedId-watching subscription
 *     fired twice on the two writes).
 *   - Focus / open / close / minimize / hydrate make NO sound — sound is
 *     reserved for the deliberate secure beat, never per-window-open noise.
 *   - Because audio and the orb's visual snap both react to the SAME value, the
 *     tick and the cyan bloom land together instead of drifting apart.
 *
 * armGestureUnlock() is kept so a returning visitor with sound-on persisted still
 * unlocks the AudioContext on their first gesture. The store calls this from a
 * `typeof window` guard, and the store import is lazy here to keep the
 * store<->sound module cycle clean.
 */
export async function initSoundWiring(): Promise<void> {
    if (wired || typeof window === "undefined") return;
    wired = true;

    armGestureUnlock();

    const { useDesktopStore } = await import("@/store/useDesktopStore");

    let lastSecureAt = useDesktopStore.getState().secureActionAt;
    useDesktopStore.subscribe((state) => {
        if (state.secureActionAt === lastSecureAt) return;
        lastSecureAt = state.secureActionAt;
        if (state.secureActionAt != null) playSeal();
    });
}
