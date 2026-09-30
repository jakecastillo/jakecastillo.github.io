import { MobileScene } from "./MobileScene";
import { Compass, Sprout, Blocks, ScanEye, UsersRound } from "lucide-react";

export function Hero() {
  return (
    <div className="scroll-track" id="descent">
      <span id="home" className="legacy-anchor" aria-hidden="true" />
      <section
        className="cinema-stage"
        aria-label="A journey through how I build systems"
      >
        <div className="scene-environment" aria-hidden="true">
          <div className="horizon-grid"></div>
          <div className="light-column"></div>
          <div className="haze"></div>
          <svg
            className="dust"
            viewBox="0 0 1440 1000"
            preserveAspectRatio="xMidYMid slice"
          ></svg>
          <div className="ember-haze"></div>
          <div className="vignette"></div>
          <div className="world-word" id="world-word">
            ENGINEER
          </div>
        </div>
        <div className="scene-meta mono">
          <span>Honolulu, Hawaiʻi / Software &amp; systems</span>
          <span className="depth-display">
            DESCENT <span id="depth-value">000</span>
            <small> / 100</small>
          </span>
        </div>
        <div className="cinema-copy">
          <article className="scene-copy current" data-scene="0" id="surface">
            <p className="eyebrow">Jake Castillo / Software Engineer</p>
            <h1 className="positioning-heading">
              Complex systems.
              <br />
              <em>Clear solutions.</em>
            </h1>
            <p className="scene-description">
              I turn complex requirements into working solutions—connecting
              cloud platforms, applications, and applied AI from architecture
              through implementation.
            </p>
            <div className="hero-actions">
              <a className="scene-link" href="#work">
                Explore my work <span>↗</span>
              </a>
              <a className="reading-link" href="#people-record" data-jump="1">
                My background ↓
              </a>
              <a className="reading-link" href="mailto:jakecast@hawaii.edu">
                Email me ↗
              </a>
            </div>
            <span className="scene-footnote mono">
              <span data-career-start="2020-01">
                Engineering since January 2020
              </span>
              <span className="hero-domains">
                Government · Education · Healthcare
              </span>
            </span>
          </article>
          <article className="scene-copy" data-scene="1" id="people">
            <p className="eyebrow">01 / Software in the real world</p>
            <h2>
              Beyond
              <br /> <em>the screen.</em>
            </h2>
            <p className="scene-description">
              Software has to make sense in the place it&rsquo;s used. I look
              beyond the interface to the people, devices, and day-to-day
              conditions that shape whether a solution works.
            </p>
            <div className="chapter-proof">
              <span className="mono">Start with context</span>
              <p>
                Who uses it? What surrounds it?
                <br /> What needs to happen next?
              </p>
            </div>
            <a className="scene-link" href="#people-record">
              Where I started <span>↗</span>
            </a>
          </article>
          <article className="scene-copy" data-scene="2" id="architecture">
            <p className="eyebrow">02 / Modernization &amp; integration</p>
            <h2>
              Build on
              <br /> <em>what exists.</em>
            </h2>
            <p className="scene-description">
              A new solution rarely starts from a blank page. I&rsquo;m
              interested in what needs to change, what must keep working, and
              where the two meet.
            </p>
            <div className="chapter-proof">
              <span className="mono">Design questions</span>
              <p>
                What can we reuse?
                <br /> Where does the complexity belong?
              </p>
            </div>
            <a className="scene-link" href="#work">
              Explore my engineering work <span>↗</span>
            </a>
          </article>
          <article className="scene-copy" data-scene="3" id="trust">
            <p className="eyebrow">03 / Where I focus now</p>
            <h2>
              Security,
              <br /> <em>by design.</em>
            </h2>
            <p className="scene-description">
              I want the secure path to be practical for the people building on
              it. That means bringing feedback into everyday development, when
              there&rsquo;s still time to act on it.
            </p>
            <div className="chapter-proof">
              <span className="mono">A delivery principle</span>
              <p>
                Make issues visible early.
                <br /> Make the next step clear.
              </p>
            </div>
            <a className="scene-link" href="#trust-record">
              My current focus <span>↗</span>
            </a>
          </article>
          <article className="scene-copy" data-scene="4" id="handoff">
            <p className="eyebrow">04 / Technical leadership</p>
            <h2>
              Code.
              <br /> <em>Lead. Ship.</em>
            </h2>
            <p className="scene-description">
              Technical leadership means helping people move forward: making
              decisions understandable, clearing up ambiguity, and staying
              available when implementation gets complicated.
            </p>
            <a className="scene-link" href="#approach">
              The person behind the work <span>↗</span>
            </a>
            <span className="scene-footnote mono">
              Shared understanding / Clear ownership
            </span>
          </article>
        </div>
        <div className="system-theater" aria-hidden="true">
          <MobileScene />
          <div className="system-camera">
            <div className="system-orbit orbit-a"></div>
            <div className="system-orbit orbit-b"></div>
            <div className="cinema-plane plane-interface" data-plane="0">
              <div className="plane-label mono">
                <span>00 / The visible surface</span>
                <span>↗</span>
              </div>
              <div className="interface-drawing">
                <span></span>
                <span></span>
                <span></span>
                <i></i>
                <i></i>
                <i></i>
              </div>
              <div className="plane-caption mono">
                Everything begins with an interface.
              </div>
            </div>
            <div className="cinema-plane plane-people" data-plane="1">
              <div className="plane-label mono">
                <span>01 / Human context</span>
                <span>◎</span>
              </div>
              <svg viewBox="0 0 580 390">
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="290" cy="195" r="98" />
                  <circle cx="290" cy="195" r="145" strokeDasharray="2 10" />
                  <path d="m140 100 300 190m-300 0 300-190M80 195h420" />
                  <circle cx="140" cy="100" r="20" />
                  <circle cx="440" cy="100" r="20" />
                  <circle cx="140" cy="290" r="20" />
                  <circle cx="440" cy="290" r="20" />
                </g>
                <circle cx="290" cy="195" r="42" fill="currentColor" />
                <path
                  d="M266 195h48m-24-24v48"
                  stroke="#112619"
                  strokeWidth="2"
                />
              </svg>
              <div className="plane-caption mono">
                People / Services / Responsibility
              </div>
            </div>
            <div className="cinema-plane plane-architecture" data-plane="2">
              <div className="plane-label mono">
                <span>02 / System architecture</span>
                <span>⊞</span>
              </div>
              <svg viewBox="0 0 580 390">
                <g fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path
                    className="signal-path"
                    d="M100 120h140v150h240M100 270h140V120h240M290 195h190"
                  />
                  <rect x="55" y="85" width="90" height="70" rx="8" />
                  <rect x="55" y="235" width="90" height="70" rx="8" />
                  <rect x="245" y="160" width="90" height="70" rx="8" />
                  <rect x="435" y="85" width="90" height="70" rx="8" />
                  <rect x="435" y="235" width="90" height="70" rx="8" />
                </g>
                <g fill="currentColor">
                  <circle cx="100" cy="120" r="7" />
                  <circle cx="100" cy="270" r="7" />
                  <circle cx="290" cy="195" r="9" />
                  <circle cx="480" cy="120" r="7" />
                  <circle cx="480" cy="270" r="7" />
                </g>
              </svg>
              <div className="plane-caption mono">
                Architecture / Cloud / Integration
              </div>
            </div>
            <div className="cinema-plane plane-trust" data-plane="3">
              <div className="plane-label mono">
                <span>03 / Delivery &amp; trust</span>
                <span>◇</span>
              </div>
              <svg viewBox="0 0 580 390">
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m290 60 108 46v90c0 72-108 118-108 118s-108-46-108-118v-90z" />
                  <path d="m290 85 83 36v75c0 47-83 90-83 90s-83-43-83-90v-75z" />
                  <path d="m250 181 27 28 58-66" strokeWidth="7" />
                  <path d="M60 195h95m270 0h95" strokeDasharray="3 9" />
                </g>
                <circle cx="60" cy="195" r="5" fill="currentColor" />
                <circle cx="520" cy="195" r="5" fill="currentColor" />
              </svg>
              <div className="plane-caption mono">
                Security / Reliability / Handoff
              </div>
            </div>
            <div className="core-light"></div>
          </div>
        </div>
        <div className="scene-counter" aria-hidden="true">
          <span id="scene-counter">01</span>
          <small>/ 05</small>
        </div>
        <div className="depth-rail" aria-hidden="true">
          <span>SURFACE</span>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <span>FOUNDATION</span>
          <b id="rail-marker"></b>
        </div>
        <div className="cinema-bottom">
          <div className="scroll-prompt">
            <span className="scroll-line" aria-hidden="true"></span>
            <span className="mono" id="scroll-instruction">
              Scroll to go deeper
            </span>
          </div>
          <nav className="chapter-navigation" aria-label="Jump to a chapter">
            <a href="#surface" data-jump="0" aria-current="step">
              <Compass
                className="chapter-icon"
                aria-hidden="true"
                focusable="false"
              />
              <span className="chapter-number" aria-hidden="true">
                00
              </span>
              <b>Intro</b>
            </a>
            <a href="#people-record" data-jump="1">
              <Sprout
                className="chapter-icon"
                aria-hidden="true"
                focusable="false"
              />
              <span className="chapter-number" aria-hidden="true">
                01
              </span>
              <b>Roots</b>
            </a>
            <a href="#work" data-jump="2">
              <Blocks
                className="chapter-icon"
                aria-hidden="true"
                focusable="false"
              />
              <span className="chapter-number" aria-hidden="true">
                02
              </span>
              <b>Build</b>
            </a>
            <a href="#trust-record" data-jump="3">
              <ScanEye
                className="chapter-icon"
                aria-hidden="true"
                focusable="false"
              />
              <span className="chapter-number" aria-hidden="true">
                03
              </span>
              <b>Now</b>
            </a>
            <a href="#approach" data-jump="4">
              <UsersRound
                className="chapter-icon"
                aria-hidden="true"
                focusable="false"
              />
              <span className="chapter-number" aria-hidden="true">
                04
              </span>
              <b>Lead</b>
            </a>
          </nav>
          <span className="frame-caption mono">
            Software / Systems
            <br /> Cloud / Delivery
          </span>
        </div>
        <div className="film-progress" aria-hidden="true">
          <span></span>
        </div>
      </section>
    </div>
  );
}
