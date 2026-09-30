import Link from "next/link";
export function Header() {
  return (
    <header className="cinema-header">
      <Link
        className="brand"
        href="/"
        data-jump="0"
        aria-label="Jake Castillo, introduction"
        prefetch={false}
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
      </Link>
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
