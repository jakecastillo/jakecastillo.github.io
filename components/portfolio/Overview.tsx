export function Overview() {
  return (
    <section
      className="experience-record"
      id="experience"
      tabIndex={-1}
      aria-labelledby="experience-heading"
    >
      <span id="about" className="legacy-anchor" aria-hidden="true" />
      <div className="record-intro">
        <span className="eyebrow">01 / The engineer behind the system</span>
        <h2 id="experience-heading">
          From implementation
          <br />
          <em>to architecture.</em>
        </h2>
        <p>
          My background connects the physical side of computing with the design
          of software. Here&rsquo;s how that perspective took shape.
        </p>
      </div>
      <div className="overview-grid">
        <article id="people-record" className="perspective">
          <h3>A computer engineer, working across software.</h3>
          <p>
            I started through DataHouse&rsquo;s Community Innovation &amp;
            Mentorship Program while studying computer engineering at UH Mānoa.
            My first role brought front-end development and hardware deployment
            into the same engineering problem.
          </p>
          <p>
            I moved toward architecture because I wanted to own why a system is
            shaped the way it is, alongside the code that makes it work. That
            curiosity still connects the different kinds of engineering I take
            on.
          </p>
          <a className="text-link" href="#work">
            Explore the work ↓
          </a>
        </article>
        <article id="trust-record" className="now-card">
          <svg
            className="ui-icon now-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <use href="#icon-branch" />
          </svg>
          <span className="eyebrow">What I&rsquo;m exploring now</span>
          <h3>
            AI as part of
            <br /> the application.
          </h3>
          <p className="focus-description">
            LLM integration and multi-agent development are part of my current
            technical focus. I&rsquo;m interested in where they can help people
            do useful work—and how to evaluate the result, connect it to
            existing workflows, and operate it securely.
          </p>
          <a className="text-link" href="#applied-ai">
            My application development experience ↓
          </a>
        </article>
      </div>
    </section>
  );
}
