export function History() {
  return (
    <section
      id="history"
      className="career-history"
      aria-labelledby="history-heading"
    >
      <span id="exp" className="legacy-anchor" aria-hidden="true" />
      <div className="section-heading">
        <span className="eyebrow">03 / Work history</span>
        <h2 id="history-heading">
          My work history.
          <br />
          <em>From the beginning.</em>
        </h2>
        <p>
          Each role broadened the scope of what I took responsibility for—from a
          first deployment to leading implementation and improving how teams
          deliver.
        </p>
      </div>
      <div className="career-track">
        <span className="career-cursor" aria-hidden="true"></span>
        <ol className="career-timeline">
          <li>
            <p className="career-date">
              <time dateTime="2025-10">Oct 2025</time> — Present
              <span className="role-tenure" data-tenure-start="2025-10">
                In this role since October 2025
              </span>
            </p>
            <div>
              <h3>DevSecOps Software Engineer</h3>
              <p className="career-company">Pacific Impact Zone Solutions</p>
              <p>
                A dedicated DevSecOps role, bringing security and reliability
                into the everyday delivery process.
              </p>
            </div>
          </li>
          <li>
            <p className="career-date">
              <time dateTime="2021-01">Jan 2021</time> —{" "}
              <time dateTime="2025-10">Oct 2025</time>
            </p>
            <div>
              <h3>Software Engineer</h3>
              <p className="career-company">DataHouse</p>
              <p>
                I joined as a software engineer and grew into technical
                architecture and tech-lead responsibilities across
                public-sector, healthcare, and education work.
              </p>
            </div>
          </li>
          <li>
            <p className="career-date">
              <time dateTime="2020-07">Jul 2020</time> —{" "}
              <time dateTime="2020-08">Aug 2020</time>
            </p>
            <div>
              <h3>Summer Intern</h3>
              <p className="career-company">DataHouse</p>
              <p>
                I returned between school terms to support field deployments,
                hardware tuning, and regression testing across web and mobile
                applications.
              </p>
            </div>
          </li>
          <li>
            <p className="career-date">
              <time dateTime="2020-01">Jan 2020</time> —{" "}
              <time dateTime="2020-05">May 2020</time>
            </p>
            <div>
              <h3>CIMP Intern</h3>
              <p className="career-company">DataHouse</p>
              <p>
                My first engineering role and first shipped system: leading
                front-end development with mentors and interns, then helping put
                the application&rsquo;s hardware in place.
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
