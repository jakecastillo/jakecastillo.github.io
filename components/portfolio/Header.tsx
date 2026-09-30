export function Header() {
  return (
    <header className="cinema-header">
      <a
        className="brand"
        href="#surface"
        data-jump="0"
        aria-label="Jake Castillo, introduction"
      >
        <img
          className="brand-mark"
          src="/brand-jc.svg"
          alt=""
          width="40"
          height="40"
        />
        <span>
          <b>Jake Castillo</b>
          <small>Software &amp; systems</small>
        </span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#experience">Overview</a>
        <a href="#work">Work</a>
        <a href="#history">Work history</a>
        <a href="#skills">Skills</a>
        <a href="#contact">Contact ↗</a>
      </nav>
    </header>
  );
}
