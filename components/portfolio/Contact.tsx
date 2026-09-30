import Link from "next/link";
export function Contact() {
  return (
    <footer className="cinema-footer" id="contact">
      <div className="contact-orbit" aria-hidden="true">
        <svg viewBox="0 0 640 640" fill="none">
          <circle cx="320" cy="320" r="286" />
          <circle cx="320" cy="320" r="235" />
          <ellipse
            cx="320"
            cy="320"
            rx="286"
            ry="110"
            transform="rotate(-32 320 320)"
          />
          <path d="M320 15v35m0 540v35M15 320h35m540 0h35" />
          <circle className="contact-nucleus" cx="320" cy="320" r="58" />
          <circle cx="564" cy="173" r="6" className="contact-node" />
        </svg>
      </div>
      <span className="eyebrow">
        Jake Castillo / Software Engineer / Honolulu, HI
      </span>
      <a className="contact-heading" href="mailto:jakecast@hawaii.edu">
        Let&rsquo;s <em>talk.</em>{" "}
        <svg
          className="ui-icon contact-arrow"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <use href="#icon-arrow" />
        </svg>
      </a>
      <p className="contact-context">
        Tell me what you&rsquo;re trying to build, what&rsquo;s getting in the
        way, and where another engineering perspective could help.
      </p>
      <div className="contact-actions">
        <button id="copy-email" type="button" hidden>
          <svg
            className="ui-icon "
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <use href="#icon-copy" />
          </svg>
          <span>Copy email</span>
        </button>
        <span id="copy-status" role="status"></span>
      </div>
      <div className="footer-bottom">
        <a href="mailto:jakecast@hawaii.edu">
          <svg
            className="ui-icon "
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <use href="#icon-mail" />
          </svg>
          jakecast@hawaii.edu
        </a>
        <div>
          <a href="https://github.com/jakecastillo">
            <svg
              className="ui-icon "
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <use href="#icon-branch" />
            </svg>
            GitHub ↗
          </a>
          <a href="https://www.linkedin.com/in/jake-castillo-00567819b/">
            LinkedIn ↗
          </a>
          <Link href="/" data-jump="0" prefetch={false}>
            Back to the beginning ↑
          </Link>
        </div>
      </div>
    </footer>
  );
}
