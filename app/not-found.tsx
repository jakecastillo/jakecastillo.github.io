import Link from "next/link";
export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 / Page not found</p>
      <h1>
        Let’s get you
        <br />
        <em>back on track.</em>
      </h1>
      <p>
        This page may have moved. You can find my work, background, and contact
        details on the homepage.
      </p>
      <Link className="scene-link" href="/">
        Back to the beginning ↗
      </Link>
    </main>
  );
}
