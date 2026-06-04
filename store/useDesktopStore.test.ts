import { describe, it, expect, beforeEach } from "vitest";
import { useDesktopStore } from "@/store/useDesktopStore";

describe("hydrate", () => {
  beforeEach(() => useDesktopStore.getState().reset());

  it("opens listed apps with minimized flags + focus, ascending z", () => {
    useDesktopStore.getState().hydrate({ open: ["terminal", "about"], minimized: ["about"], focus: "terminal" });
    const s = useDesktopStore.getState();
    expect(Object.keys(s.windows).sort()).toEqual(["about", "terminal"]);
    expect(s.windows.about?.minimized).toBe(true);
    expect(s.windows.terminal?.minimized).toBe(false);
    expect(s.focusedId).toBe("terminal");
    expect(s.windows.about!.z).toBeGreaterThan(s.windows.terminal!.z);
  });

  it("empty open clears windows", () => {
    useDesktopStore.getState().hydrate({ open: ["terminal"], minimized: [], focus: "terminal" });
    useDesktopStore.getState().hydrate({ open: [], minimized: [], focus: null });
    const s = useDesktopStore.getState();
    expect(Object.keys(s.windows)).toEqual([]);
    expect(s.focusedId).toBeNull();
  });

  it("hydrates the readme app as the default-focused landing", () => {
    useDesktopStore.getState().hydrate({ open: ["readme"], minimized: [], focus: "readme" });
    const s = useDesktopStore.getState();
    expect(Object.keys(s.windows)).toEqual(["readme"]);
    expect(s.windows.readme?.minimized).toBe(false);
    expect(s.focusedId).toBe("readme");
  });
});

describe("pulseSecure (recurring seal)", () => {
  beforeEach(() => useDesktopStore.getState().reset());

  it("starts null and stamps a fresh ms timestamp on pulse", () => {
    expect(useDesktopStore.getState().secureActionAt).toBeNull();
    const before = Date.now();
    useDesktopStore.getState().pulseSecure();
    const at = useDesktopStore.getState().secureActionAt;
    expect(at).not.toBeNull();
    expect(at).toBeGreaterThanOrEqual(before);
    expect(at).toBeLessThanOrEqual(Date.now());
  });

  it("produces a changed value subscribers can diff on repeated pulses", async () => {
    useDesktopStore.getState().pulseSecure();
    const first = useDesktopStore.getState().secureActionAt;
    // Advance the wall clock at least 1ms so the second stamp differs.
    await new Promise((r) => setTimeout(r, 2));
    useDesktopStore.getState().pulseSecure();
    const second = useDesktopStore.getState().secureActionAt;
    expect(second).toBeGreaterThan(first!);
  });

  it("opening Contact re-fires the seal", () => {
    expect(useDesktopStore.getState().secureActionAt).toBeNull();
    useDesktopStore.getState().open("contact");
    expect(useDesktopStore.getState().secureActionAt).not.toBeNull();
  });

  it("re-opening an already-open Contact still pulses", async () => {
    useDesktopStore.getState().open("contact");
    const first = useDesktopStore.getState().secureActionAt;
    await new Promise((r) => setTimeout(r, 2));
    useDesktopStore.getState().open("contact");
    expect(useDesktopStore.getState().secureActionAt).toBeGreaterThan(first!);
  });

  it("opening a non-secure app does NOT pulse the seal", () => {
    useDesktopStore.getState().open("readme");
    expect(useDesktopStore.getState().secureActionAt).toBeNull();
    useDesktopStore.getState().open("terminal");
    expect(useDesktopStore.getState().secureActionAt).toBeNull();
  });

  it("reset clears secureActionAt back to null", () => {
    useDesktopStore.getState().pulseSecure();
    expect(useDesktopStore.getState().secureActionAt).not.toBeNull();
    useDesktopStore.getState().reset();
    expect(useDesktopStore.getState().secureActionAt).toBeNull();
  });
});
