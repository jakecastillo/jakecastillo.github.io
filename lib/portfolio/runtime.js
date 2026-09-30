import { createLifecycle } from "./lifecycle.js";
import { enhanceRecords } from "./records.js";
import { formatCareerDate } from "./dates.mjs";

export function enhancePortfolio() {
  const lifecycle = createLifecycle();
  const { on, nextFrame, signal } = lifecycle;
  let recordsCleanup = () => {};
  let sceneLoading = false;
  // Month-precision source dates stay useful on a static host without a rebuild.
  // Closed roles may supply data-tenure-end="YYYY-MM" instead of using today.
  function refreshCareerDates() {
    document
      .querySelectorAll("[data-career-start], [data-tenure-start]")
      .forEach((element) => {
        const career = element.hasAttribute("data-career-start");
        const label = formatCareerDate(
          element.dataset.careerStart || element.dataset.tenureStart,
          { career, end: element.dataset.tenureEnd },
        );
        if (label) element.textContent = label;
      });
  }
  refreshCareerDates();
  on(document, "visibilitychange", () => {
    if (!document.hidden) refreshCareerDates();
  });
  on(window, "pageshow", refreshCareerDates);
  const body = document.body;
  const track = document.getElementById("descent");
  const stage = document.querySelector(".cinema-stage");
  const copies = [...document.querySelectorAll(".scene-copy")];
  const planes = [...document.querySelectorAll(".cinema-plane")];
  const camera = document.querySelector(".system-camera");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const compactMedia = matchMedia(
    "(max-width: 560px) and (max-height: 819px), (min-width: 561px) and (max-width: 900px) and (max-height: 759px), (min-width: 901px) and (max-height: 719px)",
  );
  const legacy = { home: "surface", about: "people-record", exp: "history" };
  const readingIds = [
    "surface",
    "people-record",
    "work",
    "trust-record",
    "approach",
  ];
  let manualChapter = 0;
  let initialized = false;
  const stops = [0, 0.25, 0.5, 0.75, 1];
  const ids = ["surface", "people", "architecture", "trust", "handoff"];
  let start = 0,
    distance = 1,
    scheduled = 0,
    active = -1;
  const mainLinks = [...document.querySelectorAll(".cinema-header nav a")];
  const navSections = mainLinks.map((link) =>
    document.querySelector(link.hash),
  );
  let renderer = null;
  const pointer = { x: 0, y: 0 };
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
  const smooth = (n) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  const range = (a, b, n) => smooth((n - a) / (b - a));
  const still = () => reduced.matches;
  function interpolate(values, p) {
    const segment = Math.min(3, Math.floor(p * 4));
    const t = smooth(p * 4 - segment);
    return values[segment] + (values[segment + 1] - values[segment]) * t;
  }
  // Sparse, deterministic atmosphere: no random layout drift or perpetual JS loop.
  const dust = document.querySelector(".dust");
  for (let i = 0; i < 65; i++) {
    const dot = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    dot.setAttribute("cx", String((i * 293 + 117) % 1440));
    dot.setAttribute("cy", String((i * 197 + 41) % 1000));
    dot.setAttribute("r", i % 5 ? ".7" : "1.2");
    dot.setAttribute("fill", "#d1ecaa");
    dot.setAttribute("opacity", String(0.13 + (i % 4) * 0.08));
    dust.append(dot);
  }
  function measure() {
    start = track.getBoundingClientRect().top + scrollY;
    distance = Math.max(1, track.offsetHeight - stage.offsetHeight);
    schedule();
  }
  function render() {
    scheduled = 0;
    const reading = still();
    const p = reading
      ? 0
      : compactMedia.matches
        ? stops[manualChapter]
        : clamp((scrollY - start) / distance);
    const sceneProgress = interpolate([0, 0.205, 0.385, 0.58, 1], p);
    const visible =
      scrollY < start + track.offsetHeight && scrollY + innerHeight > start;
    stage.classList.toggle("is-outside", !visible || document.hidden);
    body.classList.toggle(
      "in-records",
      scrollY >= start + track.offsetHeight - 90,
    );
    let currentSection = -1;
    navSections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= 155) currentSection = i;
    });
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 2)
      currentSection = mainLinks.length - 1;
    mainLinks.forEach((link, i) => {
      if (i === currentSection) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const index = reading ? 0 : Math.min(4, Math.floor(p * 4 + 0.5));
    if (index !== active) {
      active = index;
      copies.forEach((copy, i) => {
        const current = i === index;
        copy.classList.toggle("current", current);
        copy.setAttribute("aria-hidden", String(!current));
        copy.inert = !current;
      });
      document
        .querySelectorAll(".chapter-navigation [data-jump]")
        .forEach((link) => {
          if (Number(link.dataset.jump) === index)
            link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        });
      stage.dataset.chapter = ids[index];
    }
    // Captions remain fully readable at every scroll position, including rest.
    copies[index].style.opacity = "1";
    copies[index].style.transform = "none";
    stage.style.setProperty("--film-progress", String(p));
    const coreReveal = range(0.47, 0.72, p) * (1 - range(0.87, 1, p));
    stage.style.setProperty("--core-reveal", String(coreReveal));
    const words = ["ENGINEER", "ROOTS", "BUILD", "TRUST", "DELIVER"];
    document.getElementById("world-word").textContent = words[index];
    document.getElementById("scene-counter").textContent = "0" + (index + 1);
    stage.style.setProperty("--word-shift", `${(p - stops[index]) * -250}px`);
    stage.style.setProperty("--rail-progress", `${p * 100}%`);
    stage.style.setProperty("--grid-travel", `${p * 240}px`);
    stage.style.setProperty(
      "--light-travel",
      `${interpolate([0, 90, -60, 60, 0], p)}px`,
    );
    stage.style.setProperty("--haze-travel", `${p * -120}px`);
    stage.style.setProperty("--dust-travel", `${p * -65}px`);
    stage.style.setProperty(
      "--haze-opacity",
      String(interpolate([0.65, 0.55, 0.8, 1, 0.6], p)),
    );
    stage.style.setProperty("--signal-offset", String(-p * 700));
    stage.style.setProperty(
      "--core-opacity",
      String(interpolate([0.25, 0.45, 0.6, 0.9, 0.5], p)),
    );
    document.getElementById("depth-value").textContent = String(
      Math.round(p * 100),
    ).padStart(3, "0");
    document.getElementById("scroll-instruction").textContent = reading
      ? "Scroll to read the experience"
      : compactMedia.matches
        ? "Choose a chapter to explore"
        : p > 0.96
          ? "Continue to the experience"
          : "Scroll to go deeper";
    // CSS/SVG fallbacks use the same scroll clock as the WebGL scene.
    const rx = interpolate([57, 48, 40, 27, 58], p);
    const rz = interpolate([-31, -22, -12, 8, -31], p);
    const zoom = interpolate([0.9, 0.98, 1.07, 1.12, 0.88], p);
    camera.style.transform = `rotateX(${rx}deg) rotateZ(${rz}deg) scale(${zoom})`;
    planes.forEach((plane, i) => {
      const separation = interpolate([72, 125, 160, 100, 48], p);
      const passed =
        i < 3
          ? range(0.08 + i * 0.235, 0.23 + i * 0.235, p) *
            (1 - range(0.84, 1, p))
          : 0;
      plane.style.transform = `translateZ(${(1.5 - i) * separation + passed * 200}px) translateY(${-passed * 310}px)`;
      plane.style.opacity = String(1 - passed * 0.97);
    });
    if (renderer && visible && !document.hidden)
      renderer.render(sceneProgress, reading, pointer);
  }
  function schedule() {
    if (!signal.aborted && !scheduled) scheduled = nextFrame(render);
  }
  function focusTarget(target) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }
  function semanticReadingIndex() {
    const workBounds = document.getElementById("work").getBoundingClientRect();
    if (workBounds.top <= 155 && workBounds.bottom > 155) return 2;
    const preferred = readingIds.indexOf(location.hash.slice(1));
    if (
      preferred > 0 &&
      Math.abs(
        document.getElementById(readingIds[preferred]).getBoundingClientRect()
          .top - 120,
      ) <
        innerHeight / 2
    )
      return preferred;
    let nearest = 0,
      gap = Infinity;
    readingIds.slice(1).forEach((id, i) => {
      const d = Math.abs(
        document.getElementById(id).getBoundingClientRect().top - 120,
      );
      if (d < gap) {
        gap = d;
        nearest = i + 1;
      }
    });
    return nearest;
  }
  function setMode() {
    const wasReading = body.classList.contains("is-reading");
    const inStory = scrollY < start + track.offsetHeight;
    const chapter =
      wasReading && !inStory ? semanticReadingIndex() : Math.max(0, active);
    const reading = still();
    body.classList.toggle("is-reading", reading);
    body.classList.toggle("cinematic", !reading);
    body.classList.toggle("compact", compactMedia.matches);
    pointer.x = pointer.y = 0;
    renderer?.resize();
    measure();
    if (initialized && wasReading !== reading) {
      if (reading && inStory) {
        const target = document.getElementById(readingIds[chapter]);
        target.scrollIntoView({ behavior: "instant", block: "start" });
        history.replaceState(
          null,
          "",
          "#" + (chapter ? readingIds[chapter] : "surface"),
        );
        focusTarget(target);
      } else if (!reading) {
        jump(chapter, false, false);
        history.replaceState(null, "", "#" + ids[chapter]);
      }
    }
    initialized = true;
    if (!reading) loadScene();
  }
  on(reduced, "change", setMode);
  function jump(index, updateHash = true, focus = true) {
    manualChapter = index;
    let target;
    if (still()) {
      target = document.getElementById(readingIds[index]);
      target.scrollIntoView({ behavior: "instant", block: "start" });
    } else if (compactMedia.matches) {
      scrollTo({ top: start, behavior: "instant" });
      render();
      target = copies[index];
    } else {
      // An explicit chapter choice is immediate; native scrolling drives the film.
      scrollTo({ top: start + stops[index] * distance, behavior: "instant" });
      render();
      target = copies[index];
    }
    if (updateHash)
      history.pushState(
        null,
        "",
        "#" + (still() ? readingIds[index] : ids[index]),
      );
    if (focus && target) focusTarget(target);
    schedule();
  }
  document.querySelectorAll("[data-jump]").forEach((link) =>
    on(link, "click", (event) => {
      event.preventDefault();
      jump(Number(link.dataset.jump));
    }),
  );
  on(window, "hashchange", () => {
    const legacyTarget = legacy[location.hash.slice(1)];
    if (legacyTarget) {
      history.replaceState(null, "", "#" + legacyTarget);
      document
        .getElementById(legacyTarget)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    }
    const index = ids.indexOf(location.hash.slice(1));
    if (index >= 0) jump(index, false);
    revealLinkedWork();
  });
  function revealLinkedWork() {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.matches(".work-entry")) target.open = true;
  }
  revealLinkedWork();
  document.querySelectorAll('a[href^="#"]:not([data-jump])').forEach((link) =>
    on(link, "click", () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target?.matches(".work-entry")) target.open = true;
      if (target) nextFrame(() => focusTarget(target));
    }),
  );
  on(window, "scroll", schedule, { passive: true });
  on(window, "resize", () => {
    renderer?.resize();
    measure();
  });
  on(compactMedia, "change", () => {
    manualChapter = Math.max(0, active);
    body.classList.toggle("compact", compactMedia.matches);
    renderer?.resize();
    measure();
  });
  on(document, "visibilitychange", schedule);
  on(stage, "pointermove", (event) => {
    if (still() || event.pointerType !== "mouse" || innerWidth < 901) return;
    pointer.x = (event.clientX / innerWidth - 0.5) * 0.6;
    pointer.y = (event.clientY / innerHeight - 0.5) * 0.35;
    schedule();
  });
  on(stage, "pointerleave", () => {
    pointer.x = pointer.y = 0;
    schedule();
  });
  setMode();
  recordsCleanup = enhanceRecords();
  // Load WebGL only when motion is allowed. Text and native navigation never wait.
  function loadScene() {
    if (sceneLoading || renderer || signal.aborted || still()) return;
    sceneLoading = true;
    import("./scene.js")
      .then(({ createSystemScene }) => {
        if (signal.aborted || still()) {
          sceneLoading = false;
          return;
        }
        renderer = createSystemScene(
          document.querySelector(".system-theater"),
          () => {
            body.classList.remove("webgl-ready");
            renderer = null;
          },
        );
        if (renderer) {
          body.classList.add("webgl-ready");
          renderer.resize();
          schedule();
        }
      })
      .catch(() => {
        if (!signal.aborted) body.classList.add("css-fallback");
      });
  }

  const legacyTarget = legacy[location.hash.slice(1)];
  if (legacyTarget) {
    history.replaceState(null, "", "#" + legacyTarget);
    document.getElementById(legacyTarget)?.scrollIntoView();
  }
  const initial = ids.indexOf(location.hash.slice(1));
  const initialHash = location.hash;
  let userNavigated = false;
  for (const type of ["wheel", "touchstart", "keydown", "pointerdown"])
    on(
      window,
      type,
      () => {
        userNavigated = true;
      },
      { passive: true },
    );
  const restoreInitialAnchor = () => {
    if (signal.aborted || userNavigated || location.hash !== initialHash)
      return;
    measure();
    if (initial > 0) jump(initial, false, false);
    else if (initialHash && initialHash !== "#surface")
      document
        .getElementById(initialHash.slice(1))
        ?.scrollIntoView({ behavior: "instant", block: "start" });
  };
  nextFrame(restoreInitialAnchor);
  document.fonts.ready.then(() => {
    if (!signal.aborted) {
      measure();
      nextFrame(restoreInitialAnchor);
    }
  });
  const cleanup = () => {
    lifecycle.dispose();
    recordsCleanup();
    renderer?.dispose();
    renderer = null;
    dust.replaceChildren();
    body.classList.remove(
      "cinematic",
      "compact",
      "is-reading",
      "webgl-ready",
      "css-fallback",
      "in-records",
    );
    copies.forEach((copy, i) => {
      copy.classList.toggle("current", i === 0);
      copy.inert = i !== 0;
      copy.setAttribute("aria-hidden", String(i !== 0));
    });
  };
  on(window, "pagehide", (event) => {
    if (!event.persisted) cleanup();
  });
  return cleanup;
}
