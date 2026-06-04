"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Github, Building2, ChevronLeft } from "lucide-react";
import { projects, type Project, type Outcome } from "@/data/projects";
import { useMediaQuery, DESKTOP_MEDIA_QUERY } from "@/hooks/useMediaQuery";

const STATUS_LABEL: Record<Project["status"], string> = {
    shipped: "SHIPPED",
    wip: "IN PROGRESS",
};

/**
 * Parse a metric value into a leading-number prefix + suffix so we can count up
 * just the numeric part (e.g. "~40%" -> { prefix: "~", target: 40, suffix: "%" }).
 * Values with no leading number ("Legacy→modern", "Statewide") return target:null
 * and are rendered verbatim with no animation.
 */
function parseMetric(value: string): {
    prefix: string;
    target: number | null;
    suffix: string;
} {
    const match = value.match(/^(\D*)(\d+)(.*)$/);
    if (!match) return { prefix: value, target: null, suffix: "" };
    return { prefix: match[1], target: Number(match[2]), suffix: match[3] };
}

/**
 * Hero-slot integrity guard (R14a). The text-5xl hero figure is reserved for a
 * REAL measured metric — a numeric value that carries weight on its own. An
 * outcome qualifies only when:
 *   1. it has a leading number (parseMetric target !== null), AND
 *   2. it isn't a bare standalone integer — i.e. it either reads as more than
 *      one (target > 1, e.g. "5", "40%") OR carries a unit/symbol that gives a
 *      small number meaning (prefix/suffix present, e.g. "$0 static", "~100%").
 * This is what keeps a non-number like "Statewide"/"Legacy→modern"/"End-to-end"
 * AND a weightless bare "1" out of the giant hero slot. Projects with no
 * qualifying metric fall back to rendering their leading outcome as context.
 */
function isHeroMetric(o: Outcome): boolean {
    const { prefix, target, suffix } = parseMetric(o.value);
    if (target === null) return false;
    const hasUnit = prefix.trim().length > 0 || suffix.trim().length > 0;
    return target > 1 || hasUnit;
}

/**
 * Choose which outcome (if any) earns the hero slot, and return the remaining
 * outcomes for the supporting grid in their authored order. The hero is the
 * FIRST outcome that passes isHeroMetric; if none qualifies, hero is null and
 * every outcome flows into the supporting tiles / context line instead.
 */
function selectHero(outcomes: Outcome[]): {
    hero: Outcome | null;
    rest: Outcome[];
} {
    const heroIndex = outcomes.findIndex(isHeroMetric);
    if (heroIndex === -1) return { hero: null, rest: outcomes };
    const hero = outcomes[heroIndex];
    const rest = outcomes.filter((_, i) => i !== heroIndex);
    return { hero, rest };
}

/**
 * Fraction of the target the count-up starts from. Beginning near the target
 * (not 0) keeps the hero number always reading as the canonical figure: even
 * if captured mid-flight, the lowest intermediate is ~60% of target — visually
 * "the right number, settling" rather than a wrong-looking low value.
 */
const COUNT_START_FRACTION = 0.6;

/**
 * MetricValue — renders a metric string, counting the leading number up to its
 * target on first reveal. The count starts near the target (see
 * COUNT_START_FRACTION) over a short duration so the hero figure never misreads
 * as a low number mid-animation, then settles promptly on the canonical value.
 * Reduced-motion (or no leading number) shows the final value immediately with
 * no animation. The `active` key remounts this per project so each newly
 * selected project re-runs its own count-up.
 */
function MetricValue({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    const { prefix, target, suffix } = parseMetric(value);

    // Resolve prefers-reduced-motion once, lazily, matching IdentityLockup.
    const [reduced] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    // Seed the display so animated metrics begin near the target (never 0) and
    // static/reduced-motion metrics begin already settled on the final value.
    const [display, setDisplay] = useState<number>(() => {
        if (target === null) return 0;
        if (reduced) return target;
        return Math.round(target * COUNT_START_FRACTION);
    });
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // No leading number or reduced-motion: nothing to animate. `display` is
        // already seeded to the final value by the lazy initializer above.
        if (target === null || reduced) return;

        // Restrained count-up: short, eased, capped duration. Begins at
        // COUNT_START_FRACTION of the target and closes the remaining gap so the
        // hero number reads correctly from the very first frame.
        const duration = 450;
        const from = Math.round(target * COUNT_START_FRACTION);
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // easeOutCubic — quick, settles gently, never overshoots.
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(from + eased * (target - from)));
            if (t < 1) {
                rafRef.current = requestAnimationFrame(tick);
            } else {
                // Snap to the exact target so the settled value renders promptly.
                setDisplay(target);
            }
        };
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [target, reduced]);

    if (target === null) {
        return <span className={className}>{prefix}</span>;
    }

    return (
        <span className={className}>
            {prefix}
            {display}
            {suffix}
        </span>
    );
}

/**
 * ProjectListItem — one selectable entry in the project list. Shared verbatim
 * between the desktop aside and the mobile single-column list so the two never
 * drift. `active:scale-[0.98]` (R8) gives the press a physical touch response.
 */
function ProjectListItem({
    project,
    selected,
    onSelect,
}: {
    project: Project;
    selected: boolean;
    onSelect: () => void;
}) {
    // Surface the project's best hero-eligible metric in the list row (not just
    // outcomes[0]) so the teaser matches what the detail pane promotes.
    const { hero } = selectHero(project.outcomes);
    const teaser = hero ?? project.outcomes[0];
    return (
        <button
            onClick={onSelect}
            aria-current={selected ? "page" : undefined}
            className={`w-full text-left rounded-md border px-3 py-2 transition-[colors,transform] active:scale-[0.98] ${
                selected
                    ? "border-accent/60 bg-accent/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border/50 hover:text-foreground"
            }`}
        >
            <div className="font-display text-xs font-bold leading-snug">
                {project.title}
            </div>
            {teaser && (
                <div className="mt-1 flex items-baseline gap-1.5 leading-snug">
                    <span className="text-[11px] font-bold text-primary">
                        {teaser.value}
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 truncate">
                        {teaser.label}
                    </span>
                </div>
            )}
        </button>
    );
}

/**
 * ProjectDetail — the full detail view for one project. Shared between the
 * desktop right pane and the mobile detail screen. `onBack` is supplied only on
 * mobile (renders a 44px-target back affordance); desktop omits it.
 */
function ProjectDetail({
    project,
    onBack,
}: {
    project: Project;
    onBack?: () => void;
}) {
    // Hero-slot integrity (R14a): the giant text-5xl figure takes ONLY a real
    // measured metric. `rest` keeps every other outcome (including the leading
    // non-number, when no metric qualifies) for the supporting tiles.
    const { hero, rest } = selectHero(project.outcomes);

    // How-context behind the hero number: the 2-3 lines that make the
    // quantified outcome read as a credible, defensible story on a skim.
    // Prefer the flagship `narrative` (POV-framed) and fall back to the
    // `approach` so EVERY headline metric is backed — a hero number never
    // stands alone without the "how" that earned it. Existing fields only.
    const howContext = project.narrative ?? project.approach;

    return (
        <section className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
            {/* Mobile-only back affordance — 44px target, returns to the list. */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1 min-h-[44px] -ml-1 pr-3 text-[11px] tracking-[0.2em] text-muted-foreground transition-[colors,transform] active:scale-[0.98] hover:text-accent"
                >
                    <ChevronLeft size={16} className="shrink-0" />
                    {`// ALL_EVIDENCE`}
                </button>
            )}
            <header className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`text-[10px] tracking-[0.25em] px-2 py-0.5 rounded-full border ${
                            project.status === "shipped"
                                ? "border-accent/40 text-accent"
                                : "border-primary/40 text-primary"
                        }`}
                    >
                        {STATUS_LABEL[project.status]}
                    </span>
                    <span className="text-[10px] tracking-[0.25em] text-muted-foreground/70">
                        {project.period}
                    </span>
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground leading-tight">
                    {project.title}
                </h2>
                <p className="text-xs text-primary">{project.role}</p>
                {/* Employer — corroborating artifact */}
                <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Building2 size={13} className="text-accent shrink-0" />
                    <span className="tracking-wide">{project.employer}</span>
                </div>
            </header>

            {/* OUTCOMES — prominent metric tiles */}
            <div>
                <h3 className="font-display text-[10px] font-bold tracking-[0.3em] text-accent mb-3 border-l-2 border-primary pl-2">
                    OUTCOMES
                </h3>
                {/* Headline metric — THE single hero number. Dramatically
                    larger + brighter; accent (cyan) is reserved for this one
                    figure alone so the eye lands here first. Never clipped.
                    Renders ONLY when a real measured metric qualifies (R14a) —
                    a non-number or weightless bare "1" never reaches this slot. */}
                {hero && (
                    <div className="rounded-lg border border-accent/40 bg-primary-muted shadow-[var(--shadow-glow)] p-5 mb-2">
                        <MetricValue
                            key={`${project.slug}-headline`}
                            value={hero.value}
                            className="block font-display text-5xl font-bold text-accent leading-none break-words tabular-nums drop-shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                        />
                        <div className="mt-3 text-xs tracking-wide text-foreground/90 leading-snug">
                            {hero.label}
                        </div>
                    </div>
                )}
                {/* Supporting metrics — clearly secondary: smaller, muted,
                    no accent. They support the hero figure, never compete.
                    When no metric earned the hero slot, this grid carries the
                    full evidence (the leading context line included). */}
                {rest.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                        {rest.map((o) => (
                            <div
                                key={o.label}
                                className="rounded-md border border-border/50 bg-background/40 p-3"
                            >
                                <MetricValue
                                    key={`${project.slug}-${o.label}`}
                                    value={o.value}
                                    className="block font-display text-sm font-semibold text-muted-foreground leading-tight break-words tabular-nums"
                                />
                                <div className="mt-1 text-[10px] tracking-wide text-muted-foreground/60 leading-snug">
                                    {o.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* How-context behind the hero number — the 2-3 lines that
                    turn the metric into a credible story: what earned the
                    figure, framed through the 'secure path is the fast path'
                    POV. Always rendered (narrative, else approach) so the
                    headline metric is never an unbacked claim. Renders in
                    full — no clamp/truncation — capped only to a readable
                    measure so the story stays scannable. */}
                {howContext && (
                    <figure className="mt-3 border-l-2 border-accent/60 pl-3 max-w-[62ch]">
                        <figcaption className="font-display text-[10px] font-bold tracking-[0.3em] text-accent/80 mb-1">
                            {`// THE_HOW`}
                        </figcaption>
                        <p className="text-xs italic leading-relaxed text-accent/90">
                            {howContext}
                        </p>
                    </figure>
                )}
            </div>

            {/* Problem / approach */}
            <div className="space-y-4">
                <div>
                    <h3 className="font-display text-[10px] font-bold tracking-[0.3em] text-accent mb-2 border-l-2 border-primary pl-2">
                        PROBLEM
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[60ch]">
                        {project.problem}
                    </p>
                </div>
                {/* APPROACH — the full "how" of the project. When this
                    project has no flagship narrative, `approach` is already
                    surfaced verbatim as THE HOW behind the hero number, so
                    skip it here to avoid showing the same lines twice. */}
                {!project.narrative ? null : (
                    <div>
                        <h3 className="font-display text-[10px] font-bold tracking-[0.3em] text-accent mb-2 border-l-2 border-primary pl-2">
                            APPROACH
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[60ch]">
                            {project.approach}
                        </p>
                    </div>
                )}
            </div>

            {/* Stack chips — StackApp pill style */}
            <div>
                <h3 className="font-display text-[10px] font-bold tracking-[0.3em] text-accent mb-2 border-l-2 border-primary pl-2">
                    STACK
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {project.stack.map((s) => (
                        <span
                            key={s}
                            className="px-2 py-0.5 text-[11px] border border-border/50 rounded-full text-muted-foreground transition-[colors,transform] active:scale-[0.98] hover:text-foreground hover:border-foreground/30"
                        >
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Repo / live links — corroborating artifacts */}
            {(project.repoUrl || project.liveUrl) && (
                <div>
                    <h3 className="font-display text-[10px] font-bold tracking-[0.3em] text-accent mb-2 border-l-2 border-primary pl-2">
                        ARTIFACTS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {project.repoUrl && (
                            <a
                                href={project.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md border border-border/50 text-muted-foreground transition-[colors,transform] active:scale-[0.98] hover:text-accent hover:border-accent/40"
                            >
                                <Github size={13} />
                                Repository
                            </a>
                        )}
                        {project.liveUrl && (
                            <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded-md border border-accent/40 text-accent transition-[colors,transform] active:scale-[0.98] hover:border-accent"
                            >
                                <ArrowUpRight size={13} />
                                Live
                            </a>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export default function ProjectsApp() {
    const [activeSlug, setActiveSlug] = useState<string>(projects[0]?.slug ?? "");
    const active = projects.find((p) => p.slug === activeSlug) ?? projects[0];

    const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);

    // Mobile list→detail push (R16). On mobile the two-pane cramps at 390px, so
    // we show a single column: the project list, then (on tap) a detail screen
    // with a back affordance. `viewingDetail` is the push state; it reuses the
    // shared `activeSlug` so deep state stays in one place. On desktop the flag
    // is irrelevant — the two-pane always shows the detail beside the list.
    const [viewingDetail, setViewingDetail] = useState(false);

    // MOBILE: single-column list ⇄ detail push.
    if (!isDesktop) {
        if (viewingDetail) {
            return (
                <div className="flex h-full font-mono text-sm overflow-hidden">
                    <ProjectDetail
                        project={active}
                        onBack={() => setViewingDetail(false)}
                    />
                </div>
            );
        }
        return (
            <div className="h-full font-mono text-sm overflow-y-auto">
                <div className="px-3 pt-4 pb-2">
                    <div className="text-[10px] tracking-[0.3em] text-accent">{`// CONTROL_EVIDENCE`}</div>
                </div>
                <ul className="px-2 pb-4 space-y-1">
                    {projects.map((p) => (
                        <li key={p.slug}>
                            <ProjectListItem
                                project={p}
                                selected={p.slug === active.slug}
                                onSelect={() => {
                                    setActiveSlug(p.slug);
                                    setViewingDetail(true);
                                }}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // DESKTOP: unchanged two-pane (list aside + detail pane).
    return (
        <div className="flex h-full font-mono text-sm">
            {/* LEFT: selectable project list */}
            <aside className="w-[38%] min-w-[180px] max-w-[260px] shrink-0 border-r border-border/40 overflow-y-auto">
                <div className="px-3 pt-4 pb-2">
                    <div className="text-[10px] tracking-[0.3em] text-accent">{`// CONTROL_EVIDENCE`}</div>
                </div>
                <ul className="px-2 pb-4 space-y-1">
                    {projects.map((p) => (
                        <li key={p.slug}>
                            <ProjectListItem
                                project={p}
                                selected={p.slug === active.slug}
                                onSelect={() => setActiveSlug(p.slug)}
                            />
                        </li>
                    ))}
                </ul>
            </aside>

            {/* RIGHT: detail pane */}
            <ProjectDetail project={active} />
        </div>
    );
}
