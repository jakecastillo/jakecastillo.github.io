export function Approach() {
  return (
    <section
      className="approach-record"
      id="approach"
      aria-labelledby="approach-heading"
    >
      <div>
        <span className="eyebrow">05 / The person behind the work</span>
        <h2 id="approach-heading">
          Build something
          <br />
          <em>worth handing over.</em>
        </h2>
        <figure className="engineer-portrait">
          <picture>
            <source srcSet="/portrait/jake-640.avif" type="image/avif" />
            <source srcSet="/portrait/jake-640.webp" type="image/webp" />
            <img
              src="/portrait/jake-640.jpg"
              alt="Jake Castillo"
              width="640"
              height="640"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <figcaption>
            Jake Castillo <span>Engineer / Honolulu, Hawaiʻi</span>
          </figcaption>
        </figure>
      </div>
      <div className="approach-copy">
        <p>
          I care about what happens after the first release: whether a teammate
          can understand a decision, change the code with confidence, and make
          the work their own.
        </p>
        <ol className="engineering-principles">
          <li>
            <h3>Find the constraints.</h3>
            <p>
              I separate the real constraints from assumptions before committing
              to a design.
            </p>
            <a className="text-link" href="#architecture-detail">
              Architecture &amp; integration ↗
            </a>
          </li>
          <li>
            <h3>Prove the unknown.</h3>
            <p>
              I test the riskiest integration or behavior early, while
              it&rsquo;s still cheap to change direction.
            </p>
            <a className="text-link" href="#delivery-detail">
              Delivery &amp; verification ↗
            </a>
          </li>
          <li>
            <h3>Build to be changed.</h3>
            <p>
              I want the next person to understand why a choice was made, as
              well as how the code works.
            </p>
            <a className="text-link" href="#leadership-detail">
              Technical leadership ↗
            </a>
          </li>
        </ol>
        <div className="personal-note">
          <span className="mono">Away from the keyboard, lately</span>
          <ul className="interest-list">
            <li>
              <svg
                className="ui-icon "
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <use href="#icon-camera" />
              </svg>
              <div>
                <h3>Photography</h3>
                <p>
                  I&rsquo;m a hobbyist with a Fujifilm X100VI in tow, looking
                  for the little moments that make everyday life beautiful.
                </p>
              </div>
            </li>
            <li>
              <svg
                className="ui-icon "
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <use href="#icon-gamepad" />
              </svg>
              <div>
                <h3>Video games</h3>
                <p>
                  I play{" "}
                  <a href="https://www.konami.com/arcadegames/products/am_soundvoltex/">
                    Sound Voltex
                  </a>
                  , an arcade rhythm game where you tap buttons and turn knobs
                  in time with the music.
                </p>
              </div>
            </li>
            <li>
              <svg
                className="ui-icon "
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <use href="#icon-car" />
              </svg>
              <div>
                <h3>Cars</h3>
                <p>
                  I&rsquo;m a Japanese car enthusiast, currently running in the
                  &rsquo;90s in my GR86.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
