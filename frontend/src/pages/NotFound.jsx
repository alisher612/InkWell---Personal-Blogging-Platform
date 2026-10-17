import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="container section-spacing">
      <div className="empty-state">
        <span className="eyebrow">404 — PAGE NOT FOUND</span>
        <h1>This page took a wrong turn.</h1>
        <p>The page you're looking for doesn't exist or may have moved.</p>
        <Link to="/" className="btn btn-ink rounded-pill px-4">
          Return home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;