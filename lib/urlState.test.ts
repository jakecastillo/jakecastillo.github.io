import { describe, it, expect } from "vitest";
import { decode, encode, type UrlState } from "@/lib/urlState";

describe("decode", () => {
  it("parses open/min/focus", () => {
    expect(decode("?open=terminal,about&min=about&focus=terminal")).toEqual({
      open: ["terminal", "about"], minimized: ["about"], focus: "terminal",
    });
  });
  it("lowercases, trims, drops unknown ids, dedups (order preserved)", () => {
    expect(decode("?open=Terminal, about , bogus,about")).toEqual({
      open: ["terminal", "about"], minimized: [], focus: null,
    });
  });
  it("constrains min ⊆ open and focus ∈ open", () => {
    expect(decode("?open=terminal&min=about&focus=about")).toEqual({
      open: ["terminal"], minimized: [], focus: null,
    });
  });
  it("empty search → empty state", () => {
    expect(decode("")).toEqual({ open: [], minimized: [], focus: null });
  });
  it("accepts the readme app id (default landing)", () => {
    expect(decode("?open=readme&focus=readme")).toEqual({
      open: ["readme"], minimized: [], focus: "readme",
    });
  });
});

describe("encode", () => {
  it("empty open → empty string", () => {
    expect(encode({ open: [], minimized: [], focus: null })).toBe("");
  });
  it("clean commas, omits null focus + empty min", () => {
    expect(encode({ open: ["terminal", "about"], minimized: [], focus: "terminal" }))
      .toBe("open=terminal,about&focus=terminal");
  });
  it("includes min when present", () => {
    expect(encode({ open: ["terminal", "about"], minimized: ["about"], focus: "terminal" }))
      .toBe("open=terminal,about&min=about&focus=terminal");
  });
});

describe("round-trip", () => {
  it("decode('?'+encode(s)) === s for valid states", () => {
    const s: UrlState = { open: ["projects", "terminal", "about"], minimized: ["about"], focus: "projects" };
    expect(decode("?" + encode(s))).toEqual(s);
  });
  it("round-trips a readme-led default landing", () => {
    const s: UrlState = { open: ["readme", "about"], minimized: [], focus: "readme" };
    expect(decode("?" + encode(s))).toEqual(s);
  });
});
