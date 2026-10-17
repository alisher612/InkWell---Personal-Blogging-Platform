
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiFeather } from "react-icons/fi";
import api from "../api/axios";

function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBlogs() {
      try {
        const response = await api.get("/blogs?limit=3");
        if (active) setBlogs(response.data.blogs || []);
      } catch {
        if (active) {
          setError("We couldn't load the latest articles. Please try again later.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBlogs();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="container">
          <div className="row align-items-center gy-5">
            <div className="col-lg-7">
              <span className="eyebrow">
                <FiFeather /> IDEAS WORTH SHARING
              </span>

              <h1 className="hero-title">
                A space for
                <br />
                <span>stories that matter.</span>
              </h1>

              <p className="hero-description">
                Discover thoughtful articles, explore new perspectives, and
                find something worth reading every day.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link to="/blogs" className="btn btn-ink btn-lg rounded-pill px-4">
                  Explore Articles <FiArrowRight className="ms-2" />
                </Link>
                <Link to="/register" className="btn btn-outline-dark btn-lg rounded-pill px-4">
                  Join the Community
                </Link>
              </div>

              <div className="hero-note">
                <span className="hero-note-dot" />
                Fresh ideas. Meaningful stories. One community.
              </div>
            </div>

            <div className="col-lg-5">
              <div className="hero-art">
                <div className="art-orbit orbit-one" />
                <div className="art-orbit orbit-two" />
                <div className="art-card">
                  <span className="art-label">THE READING ROOM</span>
                  <div className="art-rule" />
                  <h2>Every story opens a new door.</h2>
                  <p>
                    Ideas, experiences, and knowledge shared by people who
                    have something to say.
                  </p>
                  <FiBookOpenFallback />
                </div>
                <div className="art-stamp">READ<br />GROW<br />REPEAT</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">HANDPICKED FOR YOU</span>
              <h2>Latest stories</h2>
              <p>Ideas and perspectives from our reading community.</p>
            </div>
            <Link to="/blogs" className="text-link">
              View all articles <FiArrowRight />
            </Link>
          </div>

          {loading && <p className="status-message">Loading the latest stories...</p>}

          {!loading && error && (
            <div className="alert alert-light border">{error}</div>
          )}

          {!loading && !error && blogs.length === 0 && (
            <div className="empty-state">
              <FiBookOpenFallback />
              <h3>The first story is waiting to be told.</h3>
              <p>Published articles will appear here when the administrator adds them.</p>
            </div>
          )}

          {!loading && blogs.length > 0 && (
            <div className="row g-4">
              {blogs.map((blog) => (
                <div className="col-md-6 col-lg-4" key={blog._id}>
                  <article className="blog-card h-100">
                    {blog.coverImage ? (
                      <img
                        className="blog-cover"
                        src={blog.coverImage}
                        alt={blog.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="blog-cover blog-cover-placeholder">
                        <FiBookOpenFallback />
                      </div>
                    )}

                    <div className="blog-card-body">
                      <span className="category-label">{blog.category}</span>
                      <h3>{blog.title}</h3>
                      <p>{blog.excerpt}</p>

                      <div className="blog-card-meta">
                        <span className="d-inline-flex align-items-center gap-2">
                          <span className="badge text-uppercase bg-secondary-subtle text-secondary-emphasis rounded-1 px-2 py-1 fw-bold fs-7">
                            Author
                          </span>
                          <strong className="text-dark fw-bold fs-6 tracking-wide">
                            {blog.authorName || blog.author?.name || "InkWell Editorial"}
                          </strong>
                        </span>
                        <span><FiClock /> {blog.readTime || 1} min read</span>
                      </div>

                      <Link to={`/blogs/${blog.slug}`} className="text-link mt-3">
                        Read article <FiArrowRight />
                      </Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function FiBookOpenFallback() {
  return <FiBookOpenIcon />;
}

import { FiBookOpen as FiBookOpenIcon } from "react-icons/fi";

export default Home;
