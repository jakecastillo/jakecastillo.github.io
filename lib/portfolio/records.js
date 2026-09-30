import { createLifecycle } from "./lifecycle.js";
// Progressive enhancement for the reading sections. Content is never hidden.
export function enhanceRecords() {
  const lifecycle = createLifecycle();
  const { on, nextFrame, signal } = lifecycle;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const groups = [...document.querySelectorAll(".work-group")];
  const links = [...document.querySelectorAll(".work-index a")];
  const workIndex = document.querySelector(".work-index");
  const footer = document.getElementById("contact");
  const orbit = document.querySelector(".contact-orbit");
  const timeline = document.querySelector(".career-timeline");
  const roles = [...timeline.children];
  const careerTrack = timeline.parentElement;
  const animations = new Set();
  const trackAnimation = (animation) => {
    animations.add(animation);
    animation.finished
      .catch(() => {})
      .finally(() => animations.delete(animation));
  };
  const still = () =>
    reduced.matches || document.body.classList.contains("is-reading");
  let frame = 0;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  function measureIndex() {
    document.documentElement.style.setProperty(
      "--work-nav-height",
      `${Math.ceil(workIndex.getBoundingClientRect().height)}px`,
    );
  }
  const indexObserver =
    "ResizeObserver" in window ? new ResizeObserver(measureIndex) : null;
  indexObserver?.observe(workIndex);
  measureIndex();
  function update() {
    frame = 0;
    if (document.hidden) return;
    let active = -1;
    const readingLine = Math.max(
      innerHeight * 0.4,
      workIndex.getBoundingClientRect().bottom + 48,
    );
    groups.forEach((group, i) => {
      const bounds = group.getBoundingClientRect();
      if (bounds.top < readingLine && bounds.bottom > readingLine) active = i;
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const p = clamp(
        (innerHeight * 0.65 - bounds.top) / Math.max(1, bounds.height * 0.7),
      );
      group.style.setProperty("--area-progress", still() ? "1" : p.toFixed(3));
      group.style.setProperty(
        "--illustration-y",
        still() ? "0px" : `${(p - 0.5) * 12}px`,
      );
    });
    links.forEach((link, i) => {
      if (i === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    // Read the full timeline before writing styles. No idle animation loop.
    const timelineBounds = timeline.getBoundingClientRect();
    const roleBounds = roles.map((role) => role.getBoundingClientRect());
    const dots = roleBounds.map((bounds) => bounds.top + 38.5);
    const firstDot = dots[0];
    const lastDot = dots.at(-1);
    const careerLine = Math.max(innerHeight * 0.45, 160);
    const progress = clamp(
      (careerLine - firstDot) / Math.max(1, lastDot - firstDot),
    );
    const withinCareer =
      careerLine >= firstDot && careerLine <= roleBounds.at(-1).bottom;
    const currentRole = withinCareer
      ? dots.findLastIndex((dot) => dot <= careerLine)
      : -1;
    timeline.style.setProperty(
      "--career-line-top",
      `${firstDot - timelineBounds.top}px`,
    );
    timeline.style.setProperty(
      "--career-line-height",
      `${lastDot - firstDot}px`,
    );
    timeline.style.setProperty(
      "--career-progress",
      still() ? "1" : progress.toFixed(3),
    );
    careerTrack.style.setProperty(
      "--career-cursor-y",
      `${firstDot - timelineBounds.top + progress * (lastDot - firstDot)}px`,
    );
    careerTrack.classList.toggle(
      "has-reading-cursor",
      !still() && withinCareer,
    );
    roles.forEach((role, i) => {
      role.classList.toggle("is-current-role", !still() && i === currentRole);
      role.classList.toggle("is-read-role", !still() && dots[i] < careerLine);
    });
    const bounds = footer.getBoundingClientRect();
    if (bounds.top < innerHeight && bounds.bottom > 0)
      orbit.style.setProperty(
        "--contact-turn",
        still()
          ? "0deg"
          : `${clamp((innerHeight - bounds.top) / (innerHeight + bounds.height)) * 24 - 12}deg`,
      );
  }
  function schedule() {
    if (!signal.aborted && !frame) frame = nextFrame(update);
  }
  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              observer.unobserve(entry.target);
              if (still() || document.hidden || !entry.target.animate) continue;
              const animation = entry.target.animate(
                [
                  { transform: "translateY(8px)", opacity: 0.9 },
                  { transform: "none", opacity: 1 },
                ],
                { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" },
              );
              trackAnimation(animation);
            }
          },
          { threshold: 0.12 },
        )
      : null;
  document
    .querySelectorAll(
      ".record-intro,.overview-grid,.toolkit-card,.credential-grid>div,.approach-copy",
    )
    .forEach((element) => observer?.observe(element));
  // Each diagram traces once. Its full outline remains present without JS.
  const diagramObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting || document.hidden) continue;
              diagramObserver.unobserve(entry.target);
              if (still()) continue;
              const paths = [
                ...entry.target.querySelectorAll(".drawing-signal"),
              ];
              const step = 180;
              paths.forEach((path, index) => {
                if (!path.animate) return;
                trackAnimation(
                  path.animate(
                    [
                      { strokeDasharray: "1", strokeDashoffset: "1" },
                      { strokeDasharray: "1", strokeDashoffset: "0" },
                    ],
                    {
                      duration: 680,
                      delay: 100 + index * step,
                      fill: "backwards",
                      easing: "cubic-bezier(.22,1,.36,1)",
                    },
                  ),
                );
              });
              // A single quiet emphasis closes the sequence; nothing pulses on a loop.
              entry.target
                .querySelectorAll(
                  ".drawing-front > rect,.drawing-front > circle",
                )
                .forEach((node) => {
                  if (!node.animate) return;
                  trackAnimation(
                    node.animate(
                      [
                        { stroke: "#b7d98b", fill: "#b6d88608" },
                        { stroke: "#dbf5a0", fill: "#b6d88620", offset: 0.45 },
                        { stroke: "#b7d98b", fill: "#b6d88608" },
                      ],
                      {
                        duration: 650,
                        delay: 100 + (paths.length - 1) * step + 400,
                      },
                    ),
                  );
                });
            }
          },
          { threshold: 0.5 },
        )
      : null;
  document
    .querySelectorAll(".work-illustration")
    .forEach((element) => diagramObserver?.observe(element));
  // Disclosure interpolation changes layout over several frames; keep reading
  // indicators in sync with those changes, including fonts and viewport reflow.
  const layoutObserver =
    "ResizeObserver" in window ? new ResizeObserver(schedule) : null;
  groups.forEach((group) => layoutObserver?.observe(group));
  layoutObserver?.observe(timeline);
  function modeChanged() {
    if (still()) animations.forEach((animation) => animation.cancel());
    schedule();
  }
  // The main scene owns the OS reduced-motion state; this module follows it.
  const modeObserver = new MutationObserver(modeChanged);
  modeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  on(reduced, "change", modeChanged);
  on(window, "scroll", schedule, { passive: true });
  on(window, "resize", () => {
    measureIndex();
    schedule();
  });
  on(document, "visibilitychange", () => {
    if (document.hidden) animations.forEach((animation) => animation.cancel());
    schedule();
  });
  groups.forEach((group) => {
    group
      .querySelectorAll("details")
      .forEach((detail) => on(detail, "toggle", schedule));
    const illustration = group.querySelector(".work-illustration");
    on(illustration, "pointermove", (event) => {
      if (still() || event.pointerType !== "mouse") return;
      const bounds = illustration.getBoundingClientRect();
      illustration.style.setProperty(
        "--illustration-tilt",
        `${((event.clientX - bounds.left) / bounds.width - 0.5) * 4}deg`,
      );
    });
    on(illustration, "pointerleave", () =>
      illustration.style.setProperty("--illustration-tilt", "0deg"),
    );
  });
  const copy = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");
  copy.hidden = false;
  on(copy, "click", async () => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText("jakecast@hawaii.edu");
      if (!signal.aborted) status.textContent = "Email copied.";
    } catch {
      if (!signal.aborted)
        status.textContent = "Copy unavailable. Use the email link below.";
    }
  });
  schedule();
  return () => {
    lifecycle.dispose();
    observer?.disconnect();
    diagramObserver?.disconnect();
    layoutObserver?.disconnect();
    modeObserver.disconnect();
    indexObserver?.disconnect();
    animations.forEach((animation) => animation.cancel());
    roles.forEach((role) =>
      role.classList.remove("is-current-role", "is-read-role"),
    );
    careerTrack.classList.remove("has-reading-cursor");
    copy.hidden = true;
  };
}
